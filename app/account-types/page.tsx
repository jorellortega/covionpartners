"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Building2, Users, Briefcase, Target, DollarSign, Shield, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SubscriptionCheckout } from "@/components/subscription-checkout"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const features = [
  {
    name: "View Public Projects",
    public: true,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Support Projects",
    public: true,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Project Discovery",
    public: true,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Basic Analytics",
    public: true,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Project Funding",
    public: false,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Team Collaboration",
    public: false,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Advanced Analytics",
    public: false,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Create Projects",
    public: false,
    investor: false,
    partner: true,
    enterprise: true
  },
  {
    name: "Project Management",
    public: false,
    investor: false,
    partner: true,
    enterprise: true
  },
  {
    name: "Custom Reports",
    public: false,
    investor: false,
    partner: true,
    enterprise: true
  },
  {
    name: "Priority Support",
    public: false,
    investor: false,
    partner: true,
    enterprise: true
  },
  {
    name: "API Access",
    public: false,
    investor: false,
    partner: false,
    enterprise: true
  }
]

const tiers = [
  {
    name: "Public Account",
    description: "Perfect for exploring and supporting projects",
    price: "Free",
    icon: Users,
    features: features.filter(f => f.public),
    cta: "Sign Up Now",
    href: "/login?tab=signup&type=public",
    popular: false,
    priceId: null
  },
  {
    name: "Partner Account",
    description: "For active investors and project supporters",
    price: "Free",
    priceDetail: "2% of successful investments",
    icon: DollarSign,
    features: features.filter(f => f.investor),
    cta: "Sign Up Now",
    href: "/login?tab=signup&type=partner",
    popular: true,
    priceId: null
  },
  {
    name: "Manager Account",
    description: "Complete project creation and management",
    price: "$25/month",
    priceDetail: "7-day free trial, no credit card required",
    icon: Target,
    features: features.filter(f => f.partner),
    cta: "Start Free Trial",
    href: "#",
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PARTNER_PRICE_ID,
    trial_period_days: 7
  },
  {
    name: "Business Account",
    description: "Full platform access with advanced features",
    price: "$45/month",
    priceDetail: "7-day free trial, no credit card required",
    icon: Building2,
    features: features.filter(f => f.enterprise),
    cta: "Start Free Trial",
    href: "#",
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    trial_period_days: 7
  }
]

export default function AccountTypesPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) {
        console.log('No user found')
        return
      }
      
      try {
        console.log('Fetching subscription data...')
        const response = await fetch('/api/subscriptions/get')
        const data = await response.json()
        console.log('Subscription data:', data)
        setCurrentSubscription(data.subscription)
      } catch (error) {
        console.error('Error fetching subscription:', error)
      }
    }

    fetchSubscription()
  }, [user])

  useEffect(() => {
    console.log('Current user:', user)
    console.log('Current subscription:', currentSubscription)
  }, [user, currentSubscription])

  const getCtaText = (tier: any) => {
    if (!user) return "Sign Up Now"
    
    if (!currentSubscription) return "Upgrade Now"
    
    const currentTier = tiers.find(t => t.name === currentSubscription.role)
    if (!currentTier) return "Upgrade Now"
    
    const currentIndex = tiers.findIndex(t => t.name === currentTier.name)
    const targetIndex = tiers.findIndex(t => t.name === tier.name)
    
    if (currentIndex === targetIndex) return "Current Plan"
    if (currentIndex < targetIndex) return "Upgrade Now"
    return "Downgrade Now"
  }

  const handleSubscription = async (tier: any) => {
    if (!user) {
      // If not logged in, redirect to signup with account type
      const type = tier.name.toLowerCase().replace(' account', '')
      router.push(`/login?tab=signup&type=${type}`)
      return
    }

    // For paid tiers, handle subscription with trial
    if (tier.priceId) {
      try {
        const response = await fetch(`/api/subscriptions/create-checkout?userId=${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            priceId: tier.priceId,
            trial_period_days: tier.trial_period_days
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create checkout session')
        }

        const data = await response.json()
        
        if (data.sessionUrl) {
          window.location.href = data.sessionUrl
        } else {
          throw new Error('No session URL returned')
        }
      } catch (error) {
        console.error('Error creating checkout session:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to start subscription process')
      }
    } else {
      // For free tiers, just update the role
      try {
        // Map the tier name to the correct role enum value
        const roleMap: { [key: string]: string } = {
          'public account': 'viewer',
          'partner account': 'investor',
          'manager account': 'partner',
          'business account': 'admin'
        }
        
        const role = roleMap[tier.name.toLowerCase()]
        if (!role) {
          throw new Error('Invalid account type')
        }

        const response = await fetch('/api/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            role
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update role')
        }

        toast.success(`Successfully updated to ${tier.name}`)
        router.refresh()
      } catch (error) {
        console.error('Error updating role:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to update account type')
      }
    }
  }

  const getSubscriptionStatus = (tier: any) => {
    if (!user || !currentSubscription) return null

    if (currentSubscription.role === tier.name.toLowerCase().replace(' account', '')) {
      if (currentSubscription.status === 'trialing') {
        return {
          text: 'In Trial',
          color: 'text-yellow-400'
        }
      }
      if (currentSubscription.status === 'active') {
        return {
          text: 'Active',
          color: 'text-green-400'
        }
      }
      if (currentSubscription.status === 'canceled') {
        return {
          text: 'Canceled',
          color: 'text-red-400'
        }
      }
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {user && (
          <div className="mb-12 p-6 bg-gray-800/30 rounded-lg border border-purple-500/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Your Current Plan</h2>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-purple-400">
                    {currentSubscription ? 
                      (currentSubscription.role ? 
                        currentSubscription.role.charAt(0).toUpperCase() + currentSubscription.role.slice(1) 
                        : 'Free Plan')
                      : 'Free Plan'
                    }
                  </div>
                  {currentSubscription && currentSubscription.status && (
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      currentSubscription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      currentSubscription.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 mb-1">Next Billing Date</div>
                <div className="text-white font-medium">
                  {currentSubscription?.current_period_end ? 
                    new Date(currentSubscription.current_period_end * 1000).toLocaleDateString() : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Account Type</h1>
          <p className="text-xl text-gray-400 mb-12">
            Select the perfect plan for your project funding and management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => {
            const isBusiness = tier.name === "Business Account";
            const isPartner = tier.name === "Partner Account";
            return (
            <Card 
              key={tier.name}
                className={`leonardo-card border-gray-800 ${tier.popular ? 'border-purple-500/50' : ''} ${isBusiness || isPartner ? 'opacity-50 pointer-events-none relative' : ''}`}
            >
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3">
                  <tier.icon className="w-6 h-6 text-purple-400" />
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-gray-400 mt-2">
                  {tier.description}
                </CardDescription>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-white">
                    {tier.price}
                  </div>
                  {tier.priceDetail && (
                    <div className="text-sm text-purple-400 mt-1">
                      {tier.priceDetail}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className={`text-gray-300 ${feature.name === "Create Projects" ? "text-purple-400 font-medium" : ""}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <div className="flex items-center justify-between">
                <Button 
                  onClick={() => handleSubscription(tier)}
                    className="w-full"
                    variant={tier.popular ? "default" : "outline"}
                    disabled={getCtaText(tier) === "Current Plan"}
                >
                  {getCtaText(tier)}
                </Button>
                  {tier.name === "Manager Account" && (
                    <span className="ml-2 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-semibold">
                      7-day Free Trial
                    </span>
                  )}
                  {tier.name === "Manager Account" && currentSubscription?.status === "trialing" && currentSubscription?.trial_end && (
                    <div className="text-yellow-400 text-xs mt-2">
                      Free trial ends on {new Date(currentSubscription.trial_end * 1000).toLocaleDateString()}
                    </div>
                  )}
                  {getSubscriptionStatus(tier) && (
                    <span className={`ml-2 text-sm ${getSubscriptionStatus(tier)?.color}`}>
                      {getSubscriptionStatus(tier)?.text}
                    </span>
                  )}
                </div>
              </CardFooter>
                {(isBusiness || isPartner) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">Under Development</span>
                  </div>
                )}
            </Card>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
          <p className="text-gray-400 mb-6">
            Our team is here to help you find the perfect solution for your needs
          </p>
          <Link href="/contact">
            <Button className="gradient-button">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 