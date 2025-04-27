"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Building2, Users, Briefcase, Target, DollarSign, Shield, FileText, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SubscriptionCheckout } from "@/components/subscription-checkout"

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
    cta: "Get Started",
    href: "/login?tab=signup",
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
    href: "/login?tab=signup",
    popular: true,
    priceId: null
  },
  {
    name: "Manager Account",
    description: "Complete project creation and management",
    price: "$25/month",
    icon: Target,
    features: features.filter(f => f.partner),
    cta: "Upgrade Now",
    href: "#",
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PARTNER_PRICE_ID
  },
  {
    name: "Business Account",
    description: "Full platform access with advanced features",
    price: "$45/month",
    icon: Building2,
    features: features.filter(f => f.enterprise),
    cta: "Contact Sales",
    href: "#",
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
  }
]

export default function AccountTypesPage() {
  const [selectedTier, setSelectedTier] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Account Type</h1>
          <p className="text-xl text-gray-400 mb-12">
            Select the perfect plan for your project funding and management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`leonardo-card border-gray-800 ${tier.popular ? 'border-purple-500/50' : ''}`}
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
                {tier.priceId ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className={`w-full ${tier.popular ? 'bg-purple-500 hover:bg-purple-600' : 'gradient-button'}`}>
                        {tier.cta}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Subscribe to {tier.name}</DialogTitle>
                        <CardDescription>
                          Complete your subscription to access all {tier.name} features.
                        </CardDescription>
                      </DialogHeader>
                      <SubscriptionCheckout 
                        priceId={tier.priceId} 
                        onSuccess={() => setSelectedTier(null)}
                      />
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Link href={tier.href} className="w-full">
                    <Button className={`w-full ${tier.popular ? 'bg-purple-500 hover:bg-purple-600' : 'gradient-button'}`}>
                      {tier.cta}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
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