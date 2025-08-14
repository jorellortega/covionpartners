"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, Send, Users, DollarSign, Target, Building2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { ErrorMessage } from "@/components/ui/error-message"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const { signIn, signUp, loading: authLoading } = useAuth()
  const router = useRouter()

  // Login state
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("login")
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetEmailCooldown, setResetEmailCooldown] = useState(0)

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignupData((prev) => ({ ...prev, [name]: value }))
  }

  // Countdown timer for reset email cooldown
  React.useEffect(() => {
    if (resetEmailCooldown > 0) {
      const timer = setTimeout(() => {
        setResetEmailCooldown(resetEmailCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resetEmailCooldown])

  const handleForgotPassword = async () => {
    if (!loginData.email) {
      setError('Please enter your email address first')
      return
    }

    if (resetEmailCooldown > 0) {
      setError(`Please wait ${resetEmailCooldown} seconds before requesting another reset email`)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const { error } = await supabase.auth.resetPasswordForEmail(loginData.email, {
        redirectTo: window.location.origin + '/reset-password'
      })
      
      if (error) {
        if (error.message.includes('security purposes')) {
          // Extract the time from the error message
          const timeMatch = error.message.match(/(\d+) seconds/)
          const seconds = timeMatch ? parseInt(timeMatch[1]) : 60
          setResetEmailCooldown(seconds)
          setError(`Please wait ${seconds} seconds before requesting another reset email`)
        } else {
          throw error
        }
        return
      }

      setResetEmailSent(true)
      setResetEmailCooldown(60) // Set 60 second cooldown after successful send
      setSuccess('Password reset email sent! Please check your email.')
    } catch (error: any) {
      console.error('Error sending reset password email:', error)
      setError(error.message || 'Failed to send reset password email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      console.log('Login form submitted for:', loginData.email)
      const { data, error } = await signIn(loginData.email, loginData.password)
      
      if (error) {
        console.log('Login failed:', error.message)
        if (error.status === 'email_not_verified') {
          setError(error.message)
        } else if (error.status === 'invalid_credentials') {
          setError(error.message)
        } else {
          setError(error.message || 'An error occurred during login')
        }
        return
      }

      if (!data?.user) {
        console.log('Login failed - no user data returned')
        setError('Login failed - no user data')
        return
      }

      console.log('Login successful, complete user data:', data.user)

      // Set success message
      setSuccess('Login successful! Redirecting...')

      // Navigate based on user role
      const userRole = data.user.user_metadata?.role || data.user.role
      console.log('User role:', userRole)
      
      // For now, always redirect to dashboard
      console.log('Redirecting to dashboard')
      router.push('/dashboard')
      router.refresh() // Force a refresh to ensure the dashboard loads with the new session
    } catch (err: any) {
      console.log('Login error:', err)
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error: signUpError } = await signUp(
        signupData.email,
        signupData.password,
        signupData.name,
        signupData.phone
      )

      if (signUpError) {
        throw signUpError
      }

      setSuccess("Account created successfully! Please check your email to verify your account.")
      setActiveTab("login")
    } catch (error: any) {
      setError(error.message || "Failed to create account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4 py-8 sm:p-4">
        <div className="leonardo-card w-full max-w-md p-4 sm:p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="space-y-1 text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Login</h1>
                <p className="text-sm sm:text-base text-white/70">Enter your credentials to access your dashboard</p>
              </div>

              {error && activeTab === "login" && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
              )}

              {success && (
                <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded mb-4 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/90">
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-white/90">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={resetEmailCooldown > 0 || isLoading}
                      className="text-xs text-blue-300 hover:text-blue-200 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {resetEmailCooldown > 0 
                        ? `Wait ${resetEmailCooldown}s` 
                        : 'Forgot password?'
                      }
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="gradient-button w-full" disabled={isLoading}>
                  {isLoading ? (
                    <LoadingSpinner size={20} className="mr-2" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <div className="space-y-1 text-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Choose Account Type</h1>
                <p className="text-sm sm:text-base text-white/70">Select your account type to continue to signup</p>
              </div>

              {error && activeTab === "signup" && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
              )}

              {/* Account Type Selector */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 border-gray-800 hover:border-purple-500/50"
                  onClick={() => router.push('/signup?type=viewer')}
                >
                  <Users className="w-6 h-6 mb-2 text-purple-400" />
                  <span className="text-sm font-medium">Public</span>
                  <span className="text-xs text-gray-400">Free</span>
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-24 border-gray-800 opacity-50 pointer-events-none"
                    disabled
                  >
                    <DollarSign className="w-6 h-6 mb-2 text-purple-400" />
                    <span className="text-sm font-medium">Partner</span>
                    <span className="text-xs text-gray-400">Free + 2%</span>
                  </Button>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">Under Development</span>
                </div>
                </div>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center h-24 border-gray-800 hover:border-purple-500/50"
                  onClick={() => router.push('/signup?type=manager')}
                >
                  <Target className="w-6 h-6 mb-2 text-purple-400" />
                  <span className="text-sm font-medium">Manager</span>
                  <span className="text-xs text-gray-400">$25/mo</span>
                </Button>
                <div className="relative">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center h-24 border-gray-800 opacity-50 pointer-events-none"
                    disabled
                  >
                    <Building2 className="w-6 h-6 mb-2 text-purple-400" />
                    <span className="text-sm font-medium">Business</span>
                    <span className="text-xs text-gray-400">$45/mo</span>
                  </Button>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                    <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">Under Development</span>
                </div>
                </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

