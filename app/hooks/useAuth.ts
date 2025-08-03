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
          console.error('Error fetching user data after sign in:', userError)
          throw userError
        }

        console.log('User data fetched after sign in:', userData)
        setUser(userData)
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred during sign in',
          status: 'error'
        }
      }
    }
  }

  const signUp = async (email: string, password: string, name: string, phone: string, role: string = 'viewer') => {
    try {
      console.log('Attempting sign up with email:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            role
          }
        }
      })

      if (error) {
        console.log('Sign up error:', error.message)
        throw error
      }

      console.log('Sign up successful, user ID:', data.user?.id)

      // Create user record in public.users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name,
            phone,
            role
          })

        if (insertError) {
          console.error('Error creating user record:', insertError)
          throw insertError
        }

        console.log('User record created in public.users table')
      }

      return { data, error: null }
    } catch (error: any) {
      console.error('Sign up error:', error)
      return {
        data: null,
        error: {
          message: error.message || 'An error occurred during sign up',
          status: 'error'
        }
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      console.log('Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }
} 