"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Shield, ArrowLeft } from "lucide-react"
import { z } from "zod"

// Form validation schema
const userSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Partner", "Investor", "Viewer"]),
  bio: z.string().optional(),
  active: z.boolean().default(true),
})

type UserFormData = z.infer<typeof userSchema>

export default function EditUserPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const userId = params.id

  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    role: "Investor",
    bio: "",
    active: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user data
  useEffect(() => {
    // In a real app, this would be an API call to fetch the user
    // Simulating API call with mock data
    setTimeout(() => {
      // Mock user data based on ID
      const mockUser = {
        id: userId,
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        role: "Investor",
        bio: "Experienced investor with a focus on tech startups.",
        active: true,
      }

      setFormData(mockUser)
      setIsLoading(false)
    }, 500)
  }, [userId])

  const handleChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form data
      userSchema.parse(formData)

      // In a real app, this would be an API call to update the user
      console.log("Updating user:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success message
      alert("User updated successfully!")

      // Redirect to users list
      router.push("/admin/users")
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to a more usable format
        const newErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      } else {
        console.error("Error updating user:", error)
        alert("Failed to update user. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/admin/users"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Users
            </Link>
            <h1 className="text-3xl font-bold">Edit User</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-2xl">Edit User Information</CardTitle>
            <CardDescription>
              Update user account information for {formData.firstName} {formData.lastName}.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="firstName"
                        placeholder="John"
                        className={`leonardo-input pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                        value={formData.firstName}
                        onChange={(e) => handleChange("firstName", e.target.value)}
                      />
                    </div>
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className={`leonardo-input pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                        value={formData.lastName}
                        onChange={(e) => handleChange("lastName", e.target.value)}
                      />
                    </div>
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      className={`leonardo-input pl-10 ${errors.email ? "border-red-500" : ""}`}
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
                      <SelectTrigger className={`leonardo-input pl-10 ${errors.role ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Partner">Partner</SelectItem>
                        <SelectItem value="Investor">Investor</SelectItem>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <h3 className="text-lg font-medium">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    placeholder="Brief description about the user..."
                    className="leonardo-input min-h-[100px]"
                    value={formData.bio}
                    onChange={(e) => handleChange("bio", e.target.value)}
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4 pt-4 border-t border-gray-800">
                <h3 className="text-lg font-medium">Account Status</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="active">Active Account</Label>
                    <p className="text-sm text-gray-400">Inactive accounts cannot log in to the platform</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleChange("active", checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => router.push("/admin/users")}
              >
                Cancel
              </Button>
              <Button type="submit" className="gradient-button" disabled={isSubmitting}>
                {isSubmitting ? "Saving Changes..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

