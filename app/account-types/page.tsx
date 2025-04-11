"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Star, Zap, Building2, Users, Briefcase } from "lucide-react"
import Link from "next/link"

const features = [
  {
    name: "Project Management",
    public: true,
    investor: true,
    partner: true,
    enterprise: true
  },
  {
    name: "Investment Opportunities",
    public: true,
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
    name: "Financial Analytics",
    public: false,
    investor: true,
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
    name: "API Access",
    public: false,
    investor: false,
    partner: false,
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
    name: "Advanced Security",
    public: false,
    investor: false,
    partner: true,
    enterprise: true
  }
]

const tiers = [
  {
    name: "Public Account",
    description: "Perfect for exploring investment opportunities and supporting projects",
    icon: Users,
    features: features.filter(f => f.public),
    cta: "Get Started",
    href: "/login?tab=signup",
    popular: false
  },
  {
    name: "Investor Account",
    description: "For active investors and portfolio management",
    icon: Briefcase,
    features: features.filter(f => f.investor),
    cta: "Upgrade Now",
    href: "/contact",
    popular: false,
    comingSoon: true
  },
  {
    name: "Partner Account",
    description: "Complete project and team management",
    icon: Star,
    features: features.filter(f => f.partner),
    cta: "Upgrade Now",
    href: "/contact",
    popular: true,
    comingSoon: true
  },
  {
    name: "Enterprise Account",
    description: "Full platform access with advanced features",
    icon: Building2,
    features: features.filter(f => f.enterprise),
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    comingSoon: true
  }
]

export default function AccountTypesPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Choose Your Account Type</h1>
          <p className="text-xl text-gray-400 mb-12">
            Select the perfect plan for your investment and project management needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`leonardo-card border-gray-800 ${tier.comingSoon ? 'opacity-50' : ''}`}
            >
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3">
                  <tier.icon className="w-6 h-6 text-blue-400" />
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription className="text-gray-400 mt-2">
                  {tier.description}
                </CardDescription>
                {tier.comingSoon && (
                  <div className="mt-2 text-yellow-500 font-bold">
                    Coming Soon
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300">{feature.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-6">
                <Link href={tier.href} className="w-full">
                  <Button className="w-full gradient-button">
                    {tier.cta}
                  </Button>
                </Link>
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