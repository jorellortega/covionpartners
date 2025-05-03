"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, CreditCard, Wallet, DollarSign, Plus, ArrowRight, Calendar, RefreshCw, Loader2, LinkIcon, ShieldCheck, Receipt, Banknote, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js/pure"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import type { Appearance } from '@stripe/stripe-js'
import SavedPaymentsList from '../components/payments/SavedPaymentsList'
import PaymentForm from '../components/payments/PaymentForm'
import { useTransactions, Transaction } from "../hooks/useTransactions"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Mock data for payment methods and transactions
const mockPaymentMethods = [
  {
    id: 1,
    type: "Credit Card",
    last4: "4242",
    expiry: "12/24",
    brand: "Visa",
    isDefault: true,
  },
  {
    id: 2,
    type: "Bank Account",
    last4: "1234",
    bankName: "Chase",
    accountType: "Checking",
    isDefault: false,
  },
]

const mockTransactions = [
  {
    id: 1,
    date: "2024-03-15",
    description: "Project Payment - Website Redesign",
    amount: 350000.00,
    status: "completed",
    type: "incoming",
  },
  {
    id: 2,
    date: "2024-03-10",
    description: "Monthly Subscription",
    amount: -49999.99,
    status: "completed",
    type: "outgoing",
  },
  {
    id: 3,
    date: "2024-03-05",
    description: "Project Payment - Mobile App",
    amount: 325000.00,
    status: "pending",
    type: "incoming",
  },
]

// Add mock subscriptions data
const mockSubscriptions = [
  {
    id: 1,
    name: "Premium Hosting",
    amount: 9999.99,
    interval: "monthly",
    nextBilling: "2024-04-10",
    status: "active",
  },
  {
    id: 2,
    name: "Enterprise API Access",
    amount: 24999.99,
    interval: "monthly",
    nextBilling: "2024-04-15",
    status: "active",
  },
  {
    id: 3,
    name: "Cloud Storage Pro",
    amount: 14999.99,
    interval: "monthly",
    nextBilling: "2024-04-20",
    status: "cancelled",
  },
]

interface PaymentMethod {
  id: string
  type: string
  status: string
  isDefault: boolean
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  billing_details?: {
    name: string
  }
}

export default function ManagePaymentsPage() {
  const [activeTab, setActiveTab] = useState("payment-methods")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stripePromise] = useState(() => loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!))
  const [showAddCard, setShowAddCard] = useState(false)
  const [setupIntent, setSetupIntent] = useState<{ clientSecret: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [pendingBalance, setPendingBalance] = useState<number | null>(null)
  const [userData, setUserData] = useState<{ 
    stripe_customer_id: string | null,
    stripe_connect_account_id: string | null 
  } | null>(null)
  const [bankForm, setBankForm] = useState({
    account_holder_name: '',
    account_holder_type: 'individual',
    routing_number: '',
    account_number: '',
    bank_account_type: 'checking'
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("transactions")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useTransactions({
    limit: 10,
    page
  })
  const [stripeStatus, setStripeStatus] = useState<null | {
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  }>(null);

  // Add Stripe Elements appearance configuration
  const appearance: Appearance = {
    theme: 'flat',
    variables: {
      colorPrimary: '#0F172A',
      colorBackground: '#ffffff',
      colorText: '#0F172A',
      colorDanger: '#df1b41',
      fontFamily: 'system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#0F172A',
        '::placeholder': {
          color: '#6B7280',
        },
      },
    },
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      if (!session) {
      router.push('/login')
      return
    }
      fetchBalance(session.user.id)
      fetchPaymentMethods()
      fetchUserData(session.user.id)
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        router.push('/login')
    } else {
        fetchBalance(session.user.id)
        fetchUserData(session.user.id)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  useEffect(() => {
    fetch("/api/stripe/connect/account-status")
      .then(res => res.json())
      .then(data => setStripeStatus(data));
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payment-methods/list')
      if (!response.ok) {
        throw new Error('Failed to fetch payment methods')
      }
      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const fetchBalance = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance, pending_balance')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        setBalance(0);
        setPendingBalance(0);
      } else {
        setBalance(data?.balance ?? 0);
        setPendingBalance(data?.pending_balance ?? 0);
      }
    } catch (err) {
      setBalance(0);
      setPendingBalance(0);
    }
  }

  const fetchUserData = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('users')
        .select('stripe_customer_id, stripe_connect_account_id')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user data:', error)
        toast.error('Failed to load user data')
        return
      }

      setUserData(data)
    } catch (err) {
      console.error('Error:', err)
      toast.error('Failed to load user data')
    }
  }

  const handleCreateCustomerId = async () => {
    if (!session?.user) return

    try {
      setProcessingAction('creating-customer')
      const response = await fetch('/api/payment-methods/create-customer', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create customer')
      }

      const data = await response.json()
      setUserData(prev => ({ 
        ...prev, 
        stripe_customer_id: data.customerId,
        stripe_connect_account_id: prev?.stripe_connect_account_id || null 
      }))
      toast.success('Stripe customer ID created successfully')
    } catch (error) {
      console.error('Error creating customer:', error)
      toast.error('Failed to create Stripe customer ID')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCreateConnectAccount = async () => {
    if (!session?.user) return

    try {
      setProcessingAction('creating-connect')
      const response = await fetch('/api/stripe/connect/create-account', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create Stripe Connect account')
      }

      const { url } = await response.json()
      window.location.href = url // Redirect to Stripe Connect onboarding
    } catch (error) {
      console.error('Error creating Stripe Connect account:', error)
      toast.error('Failed to create Stripe Connect account')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleAddPaymentMethod = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setProcessingAction('adding')
      const response = await fetch('/api/payment-methods/create-setup-intent', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to create setup intent')
      }
      
      const { clientSecret } = await response.json()
      setSetupIntent({ clientSecret })
      setShowAddCard(true)
    } catch (error) {
      console.error('Error creating setup intent:', error)
      toast.error('Failed to add payment method')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setProcessingAction(`setting-default-${paymentMethodId}`)
      const response = await fetch(`/api/payment-methods/set-default?id=${paymentMethodId}`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to set default payment method')
      }
      
      await fetchPaymentMethods()
      toast.success('Default payment method updated')
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast.error('Failed to update default payment method')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleRemove = async (paymentMethodId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setProcessingAction(`removing-${paymentMethodId}`)
      const response = await fetch(`/api/payment-methods/remove?id=${paymentMethodId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to remove payment method')
      }
      
      await fetchPaymentMethods()
      toast.success('Payment method removed')
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleBankFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBankForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/payment-methods/add-bank-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bankForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect bank account');
      }

      toast.success('Bank account connected successfully');
      await fetchPaymentMethods();
      setBankForm({
        account_holder_name: '',
        account_holder_type: 'individual',
        routing_number: '',
        account_number: '',
        bank_account_type: 'checking'
      });
    } catch (err) {
      console.error('Error connecting bank account:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect bank account');
      toast.error(err instanceof Error ? err.message : 'Failed to connect bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount))
    
    return type === 'refund' ? `-${formatted}` : `+${formatted}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500'
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500'
      case 'failed':
        return 'bg-red-500/10 text-red-500'
      case 'processing':
        return 'bg-blue-500/10 text-blue-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getTransactionIcon = (type: string) => {
    return type === 'refund' ? (
      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-red-500" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <ArrowRight className="w-5 h-5 text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Manage Payments</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Payment Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-blue-400" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {balance === null ? '—' : `$${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-sm text-gray-400 mt-1">Last updated: Today</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <ArrowRight className="w-5 h-5 mr-2 text-green-400" />
                Pending Incoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">
                {pendingBalance === null ? '—' : `$${Number(pendingBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <p className="text-sm text-gray-400 mt-1">Pending payments not yet available</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Banknote className="w-5 h-5 mr-2 text-blue-400" />
                Covion Partners Banking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-gray-900 rounded text-sm">
                        {userData?.stripe_customer_id ? 'Payment Methods Active' : 'Payment Methods Inactive'}
                      </code>
                      {userData?.stripe_customer_id && (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {!userData?.stripe_customer_id && (
                      <Button
                        onClick={handleCreateCustomerId}
                        disabled={processingAction === 'creating-customer'}
                        className="gradient-button w-full mt-2"
                        size="sm"
                      >
                        {processingAction === 'creating-customer' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Activate Payment Methods
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <code className="px-2 py-1 bg-gray-900 rounded text-sm">
                        {userData?.stripe_connect_account_id ? 'Receiving Active' : 'Receiving Inactive'}
                      </code>
                      {userData?.stripe_connect_account_id && (
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {/* Stripe Onboarding Status Logic */}
                    {userData?.stripe_connect_account_id && stripeStatus?.charges_enabled && stripeStatus?.payouts_enabled && (
                      <span className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-gray-900 rounded text-sm text-white">
                          Account Enabled
                        </code>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                      </span>
                    )}
                    {userData?.stripe_connect_account_id && (!stripeStatus?.charges_enabled || !stripeStatus?.payouts_enabled) && (
                      <Button
                        onClick={() => router.push('/covionbank')}
                        className="gradient-button w-full mt-2"
                        size="sm"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Complete Stripe Onboarding
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList className="bg-gray-900 border-gray-800">
            <TabsTrigger value="payment-methods" className="data-[state=active]:bg-gray-800">
              Payment Methods
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gray-800">
              Transactions
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="data-[state=active]:bg-gray-800">
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="payout-settings" className="data-[state=active]:bg-gray-800">
              Payout Settings
            </TabsTrigger>
          </TabsList>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods">
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

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>View your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                    </div>
                  ) : !data?.transactions?.length ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No transactions found</p>
                    </div>
                  ) : (
                    <>
                <div className="space-y-4">
                        {data.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                            className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900/70 transition-all"
                    >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {getTransactionIcon(transaction.type)}
                        <div>
                                  <h3 className="text-white font-medium">
                                    {transaction.project?.name || 'Project Payment'}
                                  </h3>
                          <p className="text-sm text-gray-400">
                                    {format(new Date(transaction.created_at), 'M/d/yyyy')}
                          </p>
                        </div>
                      </div>
                              <div className="flex items-center gap-4">
                                <span className={cn(
                                  "text-xl font-medium",
                                  transaction.type === 'refund' ? 'text-red-500' : 'text-emerald-500'
                                )}>
                                  {formatAmount(transaction.amount, transaction.type)}
                        </span>
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-xs font-medium",
                                  getStatusColor(transaction.status)
                                )}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                              </div>
                      </div>
                    </div>
                  ))}
                      </div>
                      {data.hasMore && (
                        <div className="flex justify-center mt-6">
                          <Button
                            onClick={() => setPage(prev => prev + 1)}
                            className="gradient-button"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Load More
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Active Subscriptions</CardTitle>
                  <Button className="gradient-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subscription
                  </Button>
                </div>
                <CardDescription>Manage your recurring subscriptions and billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-800 bg-gray-900"
                    >
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-400 mr-4">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{subscription.name}</p>
                          <p className="text-sm text-gray-400">
                            ${subscription.amount.toFixed(2)}/{subscription.interval}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Next billing</p>
                          <p className="text-white">
                            {new Date(subscription.nextBilling).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              subscription.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                          <Button variant="outline" className="border-gray-700">
                            {subscription.status === "active" ? "Cancel" : "Reactivate"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payout Settings Tab */}
          <TabsContent value="payout-settings">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>Manage how you receive payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Payout Methods</Label>
                    <Tabs defaultValue="card" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="card">Debit Card</TabsTrigger>
                        <TabsTrigger value="bank">Bank Account</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="card" className="space-y-4">
                        <div className="space-y-2">
                          <Label className="block text-sm font-medium text-white/90">Select Debit Card</Label>
                          <div className="space-y-2">
                            <SavedPaymentsList />
                          </div>
                          <p className="text-xs text-white/70 mt-2">
                            Instant transfers to debit cards incur a 1% fee (minimum $0.50).
                            Funds typically arrive within 30 minutes.
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="bank" className="space-y-4">
                        <div className="space-y-4">
                          <Label className="block text-sm font-medium text-white/90">Bank Account Information</Label>
                          <form onSubmit={handleBankSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="account_holder_name">Account Holder Name</Label>
                              <Input
                                id="account_holder_name"
                                name="account_holder_name"
                                value={bankForm.account_holder_name}
                                onChange={handleBankFormChange}
                                placeholder="Enter account holder name"
                                className="bg-gray-900 border-gray-800"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="account_holder_type">Account Type</Label>
                              <select
                                id="account_holder_type"
                                name="account_holder_type"
                                value={bankForm.account_holder_type}
                                onChange={handleBankFormChange}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white"
                                required
                              >
                                <option value="individual">Individual</option>
                                <option value="company">Company</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="routing_number">Routing Number</Label>
                              <Input
                                id="routing_number"
                                name="routing_number"
                                value={bankForm.routing_number}
                                onChange={handleBankFormChange}
                                placeholder="Enter 9-digit routing number"
                                className="bg-gray-900 border-gray-800"
                                maxLength={9}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="account_number">Account Number</Label>
                              <Input
                                id="account_number"
                                name="account_number"
                                type="password"
                                value={bankForm.account_number}
                                onChange={handleBankFormChange}
                                placeholder="Enter account number"
                                className="bg-gray-900 border-gray-800"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="bank_account_type">Account Type</Label>
                              <select
                                id="bank_account_type"
                                name="bank_account_type"
                                value={bankForm.bank_account_type}
                                onChange={handleBankFormChange}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-md text-white"
                                required
                              >
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
                              </select>
                            </div>

                            <div className="pt-4">
                              <Button 
                                type="submit" 
                                className="w-full gradient-button"
                                disabled={submitting}
                              >
                                {submitting ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Connecting Bank...
                                  </>
                                ) : (
                                  <>
                                    <LinkIcon className="w-4 h-4 mr-2" />
                                    Connect Bank Account
                                  </>
                                )}
                        </Button>
                      </div>

                            {error && (
                              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-400">
                                {error}
                              </div>
                            )}

                            <div className="mt-4 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
                              <div className="flex items-center space-x-2">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                <p className="text-sm text-gray-400">
                                  Your bank information is securely processed and stored by Stripe. We never see or store your full bank details.
                                </p>
                              </div>
                            </div>
                          </form>
                    </div>
                        <p className="text-xs text-white/70 mt-2">
                          Standard bank transfers are free and typically arrive in 2-3 business days.
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label>Payout Schedule</Label>
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">Automatic</p>
                          <p className="text-sm text-gray-400">Payouts processed when balance exceeds $1,000</p>
                        </div>
                        <Button variant="outline" className="border-gray-700">
                          Edit Schedule
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tax Information</Label>
                    <div className="p-4 rounded-lg border border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">W-9 Form Required</p>
                          <p className="text-sm text-gray-400">Submit your W-9 form for tax purposes</p>
                        </div>
                        <Button variant="outline" className="border-gray-700">
                          Submit Form
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 