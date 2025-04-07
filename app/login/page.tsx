"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, Send } from "lucide-react"
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

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSignupData((prev) => ({ ...prev, [name]: value }))
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
        signupData.name
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
                    <Link href="#" className="text-xs text-blue-300 hover:text-blue-200 transition-colors">
                      Forgot password?
                    </Link>
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
                <h1 className="text-xl sm:text-2xl font-bold gradient-text">Create Account</h1>
                <p className="text-sm sm:text-base text-white/70">Fill out the form below to create your account</p>
              </div>

              {error && activeTab === "signup" && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-white/90">
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    name="name"
                    placeholder="John Doe"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-white/90">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-white/90">
                    Phone Number
                  </Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={signupData.phone}
                    onChange={handleSignupChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-white/90">
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className="leonardo-input"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-white/90">
                    Confirm Password
                  </Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
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
                      <Send className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

