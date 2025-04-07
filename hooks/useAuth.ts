import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
      if (session?.user) {
        fetchUser(session.user.id)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUser = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        throw error
      }
      console.log('User data fetched:', data)
      setUser(data)
    } catch (error) {
      console.error('Error in fetchUser:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in with email:', email)

      // First check if the user exists and their email status
      const { data: userCheck } = await supabase
        .from('auth.users')
        .select('email_confirmed_at, email')
        .eq('email', email)
        .single()

      if (userCheck && !userCheck.email_confirmed_at) {
        return {
          data: null,
          error: {
            message: "Please verify your email address before signing in. Check your inbox for the confirmation link.",
            status: 'email_not_verified'
          }
        }
      }

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
          // If we can't get the user data, still return the auth data
          return { data, error: null }
        }

        console.log('User data fetched successfully, role:', userData.role)

        // Update the user state
        setUser(userData)

        // Return combined data with role from public.users
        return {
          data: {
            user: {
              ...data.user,
              role: userData.role,
              user_metadata: {
                ...data.user.user_metadata,
                role: userData.role
              }
            }
          },
          error: null
        }
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

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting signup process for:', { email, name })
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: 'partner'
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
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          role: 'partner'
        })

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
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }
} 