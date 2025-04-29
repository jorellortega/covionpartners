"use client"

import type React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { LinkIcon, CreditCard, Banknote, Wallet, Store, FileText } from "lucide-react"

// Custom PayPal icon
function CustomPaypalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 11c.33-.47.67-.84 1-1.09C9 9 10 9 11 9h6c1 0 2 0 2.5.5s.5 1.5.5 2.5c0 2-1 3-3 3h-1c-.33 0-.67.33-1 1" />
      <path d="M7 5c.33-.47.67-.84 1-1.09C9 3 10 3 11 3h6c1 0 2 0 2.5.5S20 5 20 6c0 2-1 3-3 3h-1c-.33 0-.67.33-1 1" />
      <path d="M3 21h18" />
    </svg>
  )
}

interface PaymentMethodSelectorProps {
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  linkedBankAccount: string | null
  paypalEmail: string
  setPaypalEmail: (email: string) => void
  cardDetails: {
    name: string
    number: string
    expiry: string
    cvc: string
  }
  setCardDetails: (details: any) => void
  openPlaid: () => void
  plaidReady: boolean
}

export function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  linkedBankAccount,
  paypalEmail,
  setPaypalEmail,
  cardDetails,
  setCardDetails,
  openPlaid,
  plaidReady,
}: PaymentMethodSelectorProps) {
  const renderPaymentMethodContent = () => {
    switch (paymentMethod) {
      case "plaid":
        return (
          <div className="mb-4">
            <Label className="block text-sm font-medium text-gray-300 mb-1">Bank Account</Label>
            {linkedBankAccount ? (
              <div className="bg-gray-800 border border-gray-700 text-white p-3 rounded flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-green-400" />
                {linkedBankAccount}
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => openPlaid()}
                disabled={!plaidReady}
                className="w-full gradient-button group relative"
              >
                <LinkIcon className="w-5 h-5 mr-2" />
                Link Bank Account
              </Button>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Securely connect your bank account for ACH transfers. Typically takes 1-3 business days.
            </p>
          </div>
        )

      case "paypal":
        return (
          <div className="mb-4">
            <Label htmlFor="paypal-email" className="block text-sm font-medium text-gray-300 mb-1">
              PayPal Email
            </Label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="Enter your PayPal email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              Funds will be sent to this PayPal account. Usually processed within 24 hours.
            </p>
          </div>
        )

      case "stripe":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="card-name" className="block text-sm font-medium text-gray-300 mb-1">
                Name on Card
              </Label>
              <Input
                id="card-name"
                type="text"
                placeholder="Enter name on card"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="card-number" className="block text-sm font-medium text-gray-300 mb-1">
                Card Number
              </Label>
              <Input
                id="card-number"
                type="text"
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card-expiry" className="block text-sm font-medium text-gray-300 mb-1">
                  Expiration Date
                </Label>
                <Input
                  id="card-expiry"
                  type="text"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="card-cvc" className="block text-sm font-medium text-gray-300 mb-1">
                  CVC
                </Label>
                <Input
                  id="card-cvc"
                  type="text"
                  placeholder="CVC"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Funds will be sent to this debit card. Usually processed within 30 minutes.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const paymentMethods = [
    {
      id: 'plaid',
      name: 'Plaid',
      description: 'Direct bank transfer with 1-2 business days processing time',
      icon: <LinkIcon className="h-6 w-6" />,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Instant transfers with PayPal account',
      icon: <Wallet className="h-6 w-6" />,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Secure credit card processing with 2-3 business days processing time',
      icon: <Store className="h-6 w-6" />,
    },
    {
      id: 'wire',
      name: 'Wire Transfer',
      description: 'International wire transfers with 3-5 business days processing time',
      icon: <Banknote className="h-6 w-6" />,
    },
    {
      id: 'ach',
      name: 'ACH Transfer',
      description: 'Direct ACH transfers with 1-3 business days processing time',
      icon: <Banknote className="h-6 w-6" />,
    },
    {
      id: 'check',
      name: 'Paper Check',
      description: 'Traditional paper check with 5-7 business days processing time',
      icon: <FileText className="h-6 w-6" />,
    },
  ];

  return (
    <div className="mb-4">
      <Label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</Label>
      <Tabs defaultValue="plaid" value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="plaid" className="flex items-center justify-center">
            <LinkIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="paypal" className="flex items-center justify-center">
            <CustomPaypalIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">PayPal</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center justify-center">
            <CreditCard className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Card</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plaid">{renderPaymentMethodContent()}</TabsContent>
        <TabsContent value="paypal">{renderPaymentMethodContent()}</TabsContent>
        <TabsContent value="stripe">{renderPaymentMethodContent()}</TabsContent>
      </Tabs>
    </div>
  )
}

