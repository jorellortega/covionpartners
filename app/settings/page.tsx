"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  CreditCard,
  Settings,
  Bell,
  Lock,
  User,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Upload,
  Plus,
} from 'lucide-react'
import Image from "next/image"
import { useAuth } from '@/hooks/useAuth'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SubscriptionCheckout } from '@/components/subscription-checkout'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import SavedPaymentsList from '../components/payments/SavedPaymentsList'
import PaymentForm from '../components/payments/PaymentForm'

interface UserSettings {
  notifications_email: boolean
  notifications_push: boolean
  notifications_browser: boolean
  theme: string
  language: string
  timezone: string
}

interface Profile {
  full_name: string;
  email: string;
  avatar_url: string;
  phone_number: string;
  company: string;
  position: string;
  bio: string;
  website: string;
  location: string;
  role?: string;
}

interface PaymentMethod {
  id: string
  type: string
  card: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  isDefault: boolean
}

// Tiers copied from /account-types for display name mapping
const accountTypeTiers = [
  {
    name: "Public Account",
    key: "public",
  },
  {
    name: "Partner Account",
    key: "partner",
  },
  {
    name: "Manager Account",
    key: "manager",
  },
  {
    name: "Business Account",
    key: "business",
  }
];

function getAccountTypeDisplayName(subscription: any) {
  const plan = subscription?.plan?.toLowerCase();
  const role = subscription?.role?.toLowerCase();
  if (plan === "business") return "Business Account";
  if (plan === "manager") return "Manager Account";
  if (plan === "partner") return "Partner Account";
  if (role === "business") return "Business Account";
  if (role === "manager") return "Manager Account";
  if (role === "partner") return "Partner Account";
  return "Public Account";
}

// Add mapping for user-friendly names
const planNames: Record<string, string> = {
  free_basic: "Free Basic",
  free_plus: "Free Plus",
  pro: "Pro",
  enterprise: "Enterprise",
};

// Restore the original tiers object for plan upgrades and pricing
const tiers = {
  'price_partner': {
    name: 'Partner Account',
    price: '$25/month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PARTNER_PRICE_ID,
  },
  'price_enterprise': {
    name: 'Enterprise Account',
    price: '$45/month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
  },
};

function getTierName(role: string | undefined) {
  if (!role) return "Public Account";
  switch (role.toLowerCase()) {
    case "admin":
      return "Business Account";
    case "partner":
      return "Manager Account";
    case "investor":
      return "Partner Account";
    case "viewer":
      return "Public Account";
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export default function SettingsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    full_name: "",
    email: "",
    avatar_url: "",
    phone_number: "",
    company: "",
    position: "",
    bio: "",
    website: "",
    location: "",
    role: ""
  })
  const [profileId, setProfileId] = useState<string | null>(null)
  const [settings, setSettings] = useState<UserSettings>({
    notifications_email: true,
    notifications_push: true,
    notifications_browser: true,
    theme: "dark",
    language: "en",
    timezone: "UTC"
  })
  const [subscription, setSubscription] = useState<any>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true)
  const [stripePromise, setStripePromise] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [pendingBalance, setPendingBalance] = useState<number | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  const fetchBalance = async (userId: string) => {
      try {
      console.log('Fetching balance for user:', userId);
      const { data, error } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance, pending_balance')
        .eq('user_id', userId)
        .maybeSingle();
      
      console.log('Balance query result:', { data, error });
      
      if (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
        setPendingBalance(0);
      } else {
        console.log('Setting balance to:', data?.balance);
        setBalance(data?.balance ?? 0);
        setPendingBalance(data?.pending_balance ?? 0);
      }
    } catch (err) {
      console.error('Error in fetchBalance:', err);
      setBalance(0);
      setPendingBalance(0);
    }
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        // Fetch from users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, name, phone_number, role")
          .eq("id", session.user.id)
          .single()
        // Fetch from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name: name, company, position, bio, website, location, avatar_url")
          .eq("user_id", session.user.id)
          .maybeSingle()
        setProfile({
          full_name: profileData?.full_name || userData?.name || "",
          email: userData?.email || "",
          avatar_url: profileData?.avatar_url || "",
          phone_number: userData?.phone_number || "",
          company: profileData?.company || "",
          position: profileData?.position || "",
          bio: profileData?.bio || "",
          website: profileData?.website || "",
          location: profileData?.location || "",
          role: userData?.role || ""
        })
        setProfileId(profileData?.id || null)
      } catch (err) {
        console.error("Error fetching profile info:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfileData()
  }, [supabase])

  // Add a debug effect to monitor balance changes
  useEffect(() => {
    console.log('Balance state changed:', balance);
  }, [balance]);

  // Move fetchSubscriptionDetails outside useEffect so it can be referenced elsewhere
  const fetchSubscriptionDetails = async () => {
    setSubscriptionLoading(true)
    try {
      // Use new full endpoint
      const response = await fetch('/api/subscriptions/full', { credentials: 'include' })
      const data = await response.json()
      if (data.subscription) {
      setSubscription(data.subscription)
      } else {
        setSubscription(null)
      }
    } catch (error) {
      setSubscription(null)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionDetails()
  }, [supabase])

  useEffect(() => {
    // Initialize Stripe
    setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!))
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true)
      const response = await fetch('/api/payment-methods/list', {
        method: 'GET',
      })
      const data = await response.json()
      setPaymentMethods(data.paymentMethods)
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  const handleProfileUpdate = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")
      // Update users table
      await supabase
        .from("users")
        .update({
          name: profile.full_name,
          phone_number: profile.phone_number,
          role: profile.role
        })
        .eq("id", user.id)
      // Update or insert into profiles table
      if (profileId) {
        await supabase
          .from("profiles")
          .update({
            name: profile.full_name,
          company: profile.company,
          position: profile.position,
          bio: profile.bio,
          website: profile.website,
          location: profile.location,
            avatar_url: profile.avatar_url
        })
          .eq("id", profileId)
      } else {
        await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            name: profile.full_name,
            company: profile.company,
            position: profile.position,
            bio: profile.bio,
            website: profile.website,
            location: profile.location,
            avatar_url: profile.avatar_url
          })
      }
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleSettingsUpdate = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          ...settings
        })

      if (error) throw error
      toast.success("Settings updated successfully")
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings")
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setSaving(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      toast.success("Profile picture updated successfully")
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast.error("Failed to update profile picture")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      toast.success('Subscription cancelled successfully')
      fetchSubscriptionDetails()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    }
  }

  const handlePauseSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/pause', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to pause subscription')
      }

      toast.success('Subscription paused successfully')
      fetchSubscriptionDetails()
    } catch (error) {
      console.error('Error pausing subscription:', error)
      toast.error('Failed to pause subscription')
    }
  }

  const handleResumeSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/resume', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to resume subscription')
      }

      toast.success('Subscription resumed successfully')
      fetchSubscriptionDetails()
    } catch (error) {
      console.error('Error resuming subscription:', error)
      toast.error('Failed to resume subscription')
    }
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return null

    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400">Active</Badge>
      case 'canceled':
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>
      case 'paused':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Paused</Badge>
      case 'past_due':
        return <Badge className="bg-orange-500/20 text-orange-400">Past Due</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">{subscription.status}</Badge>
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      const response = await fetch('/api/payment-methods/create-setup-intent', {
        method: 'POST',
      })
      const { clientSecret } = await response.json()
      
      const stripe = await stripePromise
      const { error } = await stripe.confirmCardSetup(clientSecret)
      
      if (error) {
        throw error
      }
      
      toast.success('Payment method added successfully')
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    }
  }

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await fetch('/api/payment-methods/set-default', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      })
      
      toast.success('Default payment method updated')
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast.error('Failed to update default payment method')
    }
  }

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    try {
      await fetch('/api/payment-methods/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      })
      
      toast.success('Payment method removed')
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-full md:container md:mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the upload icon to change your profile picture
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone_number}
                    onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                    placeholder="Your position"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="Your location"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="https://your-website.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>
              <Button onClick={handleProfileUpdate} disabled={saving} className="w-full md:w-auto">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    // Clear all local storage and session storage
                    if (typeof window !== 'undefined') {
                      window.localStorage.clear()
                      window.sessionStorage.clear()
                      document.cookie.split(";").forEach(function(c) { 
                        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                      })
                    }
                    // Sign out from Supabase
                  const { error } = await supabase.auth.signOut()
                    if (error) throw error
                    await supabase.auth.setSession({ access_token: '', refresh_token: '' })
                    window.location.href = '/login?' + new Date().getTime()
                  } catch (error) {
                    console.error('Error signing out:', error)
                    toast.error('Failed to sign out')
                  }
                }}
              >
                Sign Out
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!profile.email) {
                      toast.error('No email found for this user.')
                      return
                    }
                    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                      redirectTo: window.location.origin + '/reset-password'
                    })
                    if (error) throw error
                    toast.success('Password reset email sent!')
                  } catch (error) {
                    console.error('Error sending reset password email:', error)
                    toast.error('Failed to send reset password email')
                  }
                }}
              >
                Reset Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card className="mb-6 p-6 bg-gray-800/30 rounded-lg border border-purple-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Current Plan</h2>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-purple-400">
                    {getTierName(user?.role)}
                  </div>
                  {subscription && subscription.status && (
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      subscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      subscription.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 mb-1">Next Billing Date</div>
                <div className="text-white font-medium">
                  {subscription?.current_period_end ?
                    new Date(subscription.current_period_end * 1000).toLocaleDateString() :
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-purple-500/10 p-3">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle>Subscription Management</CardTitle>
                  <CardDescription>Manage your subscription and billing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              ) : subscription ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="text-gray-400 mb-1">Account Type</div>
                      <div className="text-xl font-medium text-white">
                        {planNames[subscription.role] || (subscription.role ? subscription.role.charAt(0).toUpperCase() + subscription.role.slice(1) : 'Unknown')}
                      </div>
                      <div className="text-gray-400 mb-1 mt-2">Subscription Plan</div>
                      <div className="text-lg text-white">
                        {planNames[subscription.plan] || (subscription.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Unknown')}
                      </div>
                      {subscription.provider && (
                        <div className="text-sm text-gray-400 mt-1">Provider: {subscription.provider}</div>
                      )}
                      {subscription.promo_code && (
                        <div className="text-sm text-gray-400 mt-1">Promo: {subscription.promo_code}</div>
                      )}
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="text-gray-400 mb-1">Status</div>
                      <div>{getSubscriptionStatus()}</div>
                    </div>
                  </div>

                  {subscription.status === 'active' && (
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1">
                              Change Plan
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Change Subscription Plan</DialogTitle>
                              <DialogDescription>
                                Choose a new plan for your subscription
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              {Object.entries(tiers).map(([key, tier]) => (
                                <Button
                                  key={key}
                                  variant="outline"
                                  className="w-full justify-between"
                                  onClick={() => {
                                    setSelectedTier(tier.priceId!)
                                    setShowUpgradeDialog(true)
                                  }}
                                >
                                  <span>{tier.name}</span>
                                  <span>{tier.price}</span>
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handlePauseSubscription}
                        >
                          Pause Subscription
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleCancelSubscription}
                      >
                        Cancel Subscription
                      </Button>
                    </div>
                  )}

                  {subscription.status === 'paused' && (
                    <Button
                      className="w-full gradient-button"
                      onClick={handleResumeSubscription}
                    >
                      Resume Subscription
                    </Button>
                  )}

                  {subscription.status === 'canceled' && (
                    <div className="space-y-4">
                      <Alert className="bg-yellow-500/10 border-yellow-500/20">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-yellow-400">
                          Your subscription has been cancelled and will end on{' '}
                          {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                        </AlertDescription>
                      </Alert>
                      <Button
                        className="w-full gradient-button"
                        onClick={() => setShowUpgradeDialog(true)}
                      >
                        Resubscribe
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-blue-500/10 border-blue-500/20">
                    <CheckCircle2 className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-400">
                      You are currently on the free plan. Upgrade to access premium features.
                    </AlertDescription>
                  </Alert>
                  <Button
                    className="w-full gradient-button"
                    onClick={() => router.push('/account-types')}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle>Saved Payment Methods</CardTitle>
              <CardDescription>View and manage your saved payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <SavedPaymentsList />
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800 mt-6">
            <CardHeader>
              <CardTitle>Add New Payment Method</CardTitle>
              <CardDescription>Securely save a new payment method for future transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise}>
                <PaymentForm />
              </Elements>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
            <DialogDescription>
              Complete your subscription upgrade
            </DialogDescription>
          </DialogHeader>
          {selectedTier && (
            <SubscriptionCheckout
              priceId={selectedTier}
              onSuccess={() => {
                setShowUpgradeDialog(false)
                fetchSubscriptionDetails()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 