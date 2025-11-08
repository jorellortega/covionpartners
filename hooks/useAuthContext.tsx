import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, name: string, phone: string, role?: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session)
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', { event: _event, session })
      
      // Clear any pending fetch timeout
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
      
      // Debounce rapid auth state changes
      fetchTimeoutRef.current = setTimeout(() => {
        if (session?.user) {
          fetchUser(session.user.id)
        } else {
          setUser(null)
          setLoading(false)
        }
      }, 100)
    })

    return () => {
      subscription.unsubscribe()
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const fetchUser = async (userId: string) => {
    // Prevent duplicate fetches for the same user
    if (user?.id === userId || isFetchingRef.current) {
      console.log('[AuthContext] Skipping fetchUser due to existing fetch or cached user', {
        requestedUserId: userId,
        currentUserId: user?.id,
        isFetching: isFetchingRef.current
      })
      return
    }

    isFetchingRef.current = true

    try {
      console.log('Fetching user data for ID:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // Only log errors that aren't "no rows" errors
        if (error.code !== 'PGRST116') {
          console.error('Error fetching user data:', error)
        }
        setUser(null)
        setLoading(false)
        isFetchingRef.current = false
        return
      }
      
      if (data) {
        console.log('User data fetched:', data)
        setUser(data)
      } else {
        // User not found in users table
        console.log('User not found in users table')
        setUser(null)
      }
    } catch (error: any) {
      // Gracefully handle errors - don't throw
      if (error.code !== 'PGRST116') {
        console.error('Error in fetchUser:', error)
      }
      setUser(null)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in with email:', email)

      // Proceed with sign in attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.log('Sign in error:', error.message)
        // Customize error message
        if (error.message === 'Invalid login credentials') {
          return {
            data: null,
            error: {
              message: 'Email or password is incorrect',
              status: 'invalid_credentials'
            }
          }
        }
        throw error
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        return {
          data: null,
          error: {
            message: "Please verify your email address before signing in. Check your inbox for the confirmation link.",
            status: 'email_not_verified'
          }
        }
      }

      console.log('Sign in successful, user ID:', data.user?.id)

      // Fetch user data from public.users table
      if (data.user) {
        console.log('Fetching user data for ID:', data.user.id)
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (userError) {
          console.log('Error fetching user data:', userError.message)
          // If we can't get the user data, set default role as viewer
          return {
            data: {
              user: {
                ...data.user,
                role: 'viewer',
                user_metadata: {
                  ...data.user.user_metadata,
                  role: 'viewer'
                }
              }
            },
            error: null
          }
        }

        console.log('User data fetched successfully, role:', userData.role)

        // Update the user state
        setUser(userData)

        // Return combined data with role from public.users
        return {
          data: {
            user: {
              ...data.user,
              role: userData.role || 'viewer',
              user_metadata: {
                ...data.user.user_metadata,
                role: userData.role || 'viewer'
              }
            }
          },
          error: null
        }
      }

      if (data.session) {
        // Set the cookie for SSR/API routes
        await fetch('/auth/callback', {
          method: 'POST',
          body: JSON.stringify({ event: 'SIGNED_IN', session: data.session }),
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return { data, error: null }
    } catch (error) {
      console.log('Sign in catch block error:', error)
      return { 
        data: null, 
        error: {
          message: 'An unexpected error occurred',
          status: 'unknown_error'
        }
      }
    }
  }

  const signUp = async (email: string, password: string, name: string, phone: string, role: string = 'viewer') => {
    try {
      console.log('Starting signup process for:', { email, name, phone })
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            phone_number: phone
          }
        }
      })
      
      if (authError) {
        console.error('Auth signup error:', authError)
        throw authError
      }

      console.log('Auth user created:', authData)

      if (!authData.user?.id) {
        throw new Error('No user ID returned from auth signup')
      }

      // Wait a short moment to ensure auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create the public user profile with minimal data
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: email,
          name: name,
          role: role,
          phone_number: phone
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
        console.error('Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        })
        
        // Even if profile creation fails, return auth data
        // The profile can be created later when the email is confirmed
        return { data: authData, error: null }
      }

      console.log('User profile created successfully')
      return { data: authData, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      // Clear all local storage and session storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear the user state
      setUser(null)
      
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
