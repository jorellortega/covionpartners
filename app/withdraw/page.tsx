"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { usePlaidLink } from "react-plaid-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, LinkIcon, CreditCard, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Custom PayPal icon since it's not in Lucide
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

// Define withdrawal limits by payment method
const WITHDRAWAL_LIMITS = {
  standard: { min: 1, max: 50000, fee: 0 },
  instant: { min: 1, max: 10000, fee: 0.01 } // 1% fee
};

// Define payment method interface
interface SavedPaymentMethod {
  id: string;
  type: string;
  status: string;
  is_default: boolean;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  bank_name?: string;
  last4?: string;
  account_type?: string;
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [withdrawMethod, setWithdrawMethod] = useState<"standard" | "instant" | null>(null)
  const [payoutProvider, setPayoutProvider] = useState<"stripe" | "direct" | null>(null)
  const [stripeAccountId, setStripeAccountId] = useState("")
  const [availableMethods, setAvailableMethods] = useState<{
    hasBankAccount: boolean;
    hasDebitCard: boolean;
  }>({
    hasBankAccount: false,
    hasDebitCard: false
  })
  const [savedPayments, setSavedPayments] = useState<SavedPaymentMethod[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  // Mock function to connect to Stripe
  const connectToStripe = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would redirect to Stripe OAuth
      // For demo purposes, we'll simulate a successful connection
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStripeAccountId("acct_" + Math.random().toString(36).substring(2, 15));
      setSuccess("Successfully connected to Stripe account");
    } catch (err) {
      setError("Failed to connect to Stripe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data, balance, and payment methods
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        // Fetch saved payment methods
        const response = await fetch('/api/payments/saved', {
          credentials: 'include',
        });
        const paymentMethods = await response.json();
        
        if (!response.ok) {
          throw new Error('Failed to load saved payments');
        }

        console.log('Fetched payment methods:', paymentMethods); // Debug log

        setSavedPayments(paymentMethods);

        // Set available methods based on payment methods
        const methods = {
          hasBankAccount: paymentMethods.some((pm: SavedPaymentMethod) => pm.type === 'bank_account' && pm.status === 'active'),
          hasDebitCard: paymentMethods.some((pm: SavedPaymentMethod) => pm.type === 'stripe' && pm.status === 'active')
        };

        console.log('Available methods:', methods); // Debug log

        setAvailableMethods(methods);

        // Auto-select method if only one is available
        if (methods.hasBankAccount && !methods.hasDebitCard) {
          setWithdrawMethod('standard');
        } else if (!methods.hasBankAccount && methods.hasDebitCard) {
          setWithdrawMethod('instant');
        }

        // Fetch balance
        const { data: balanceData } = await supabase
          .from('cvnpartners_user_balances')
          .select('balance')
          .eq('user_id', session.user.id)
          .single();
        
        if (balanceData) {
          setBalance(balanceData.balance);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err); // Debug log
        setError(err.message);
      }
    };

    fetchData();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('Please sign in to withdraw funds');
      }

      if (!withdrawMethod) {
        throw new Error('Please select a withdrawal method');
      }

      const amount = Number.parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
    }

    // Check withdrawal limits
      const limits = WITHDRAWAL_LIMITS[withdrawMethod];
      if (amount < limits.min || amount > limits.max) {
        throw new Error(`Amount must be between $${limits.min} and $${limits.max}`);
      }

    if (amount > balance) {
        throw new Error('Insufficient funds');
    }

      // Calculate fee for instant transfers
      const fee = withdrawMethod === 'instant' ? amount * WITHDRAWAL_LIMITS.instant.fee : 0;
      const totalAmount = amount + fee;

      if (totalAmount > balance) {
        throw new Error('Insufficient funds to cover transfer fee');
    }

      if (payoutProvider === 'stripe') {
        // Process via Stripe
        const response = await fetch('/api/stripe/create-payout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            account_id: stripeAccountId,
            method: withdrawMethod,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
      } else {
        // Process via direct transfer
        const response = await fetch('/api/payouts/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            method: withdrawMethod,
            user_id: session.user.id
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
      }

      // Update balance in database
      const { error: updateError } = await supabase
        .from('cvnpartners_user_balances')
        .update({
          balance: balance - totalAmount,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (updateError) throw new Error('Failed to update balance');

      setBalance(prev => prev - totalAmount);
      setSuccess(`Withdrawal of $${amount.toFixed(2)} initiated. ${
        withdrawMethod === 'instant' 
          ? `Funds will arrive within minutes. Fee: $${fee.toFixed(2)}` 
          : 'Funds will arrive in 2-3 business days.'
      }`);
      setWithdrawalAmount("");
    } catch (error: any) {
      setError(error.message || 'Failed to process withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWithdrawForm = () => {
    if (!availableMethods.hasBankAccount && !availableMethods.hasDebitCard) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 p-3 rounded">
            No payout methods found. Please add a bank account or debit card.
          </div>
          <Button
            type="button"
            onClick={() => router.push("/savedpayments")}
            className="w-full"
          >
            Add Payment Method
          </Button>
        </div>
      );
    }

        return (
      <div className="space-y-4">
        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="card">Debit Card</TabsTrigger>
            <TabsTrigger value="bank">Bank Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="card" className="space-y-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-white/90">Select Debit Card</Label>
              <div className="space-y-2">
                {savedPayments
                  .filter(payment => payment.type === 'stripe' && payment.status === 'active')
                  .map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => {
                        setSelectedPaymentId(payment.id);
                        setWithdrawMethod('instant');
                      }}
                      className={`cursor-pointer p-4 rounded-lg border ${
                        selectedPaymentId === payment.id 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div>
                            {payment.card && (
                              <>
                                <p className="font-medium text-white">
                                  {payment.card.brand} •••• {payment.card.last4}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Expires {payment.card.exp_month}/{payment.card.exp_year}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        {payment.is_default && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            <p className="text-xs text-white/70 mt-2">
                Instant transfers to debit cards incur a 1% fee (minimum $0.50).
                Funds typically arrive within 30 minutes.
            </p>
          </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-white/90">Select Bank Account</Label>
              <div className="space-y-2">
                {savedPayments
                  .filter(payment => payment.type === 'bank_account' && payment.status === 'active')
                  .map((payment) => (
                    <div
                      key={payment.id}
                      onClick={() => {
                        setSelectedPaymentId(payment.id);
                        setWithdrawMethod('standard');
                      }}
                      className={`cursor-pointer p-4 rounded-lg border ${
                        selectedPaymentId === payment.id 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                      } transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <LinkIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-white">
                              {payment.bank_name} •••• {payment.last4}
                            </p>
                            <p className="text-sm text-gray-400">
                              {payment.account_type}
            </p>
          </div>
                        </div>
                        {payment.is_default && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                </div>
                ))}
              </div>
            <p className="text-xs text-white/70 mt-2">
                Standard bank transfers are free and typically arrive in 2-3 business days.
            </p>
          </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

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
            <h1 className="text-3xl font-bold text-white">Withdraw Funds</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full leonardo-card p-8">
            <div>
              <h2 className="text-center text-3xl font-extrabold gradient-text">Withdraw Funds</h2>
              <p className="mt-2 text-center text-sm text-white/70">
                Available Balance: <span className="font-bold text-green-400">${balance.toFixed(2)}</span>
              </p>
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-center">{error}</div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded mb-4 text-center">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="mb-4">
                <Label htmlFor="withdrawal-amount" className="block text-sm font-medium text-white/90 mb-1">
                  Withdrawal Amount
                </Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  step="0.01"
                  min={withdrawMethod ? WITHDRAWAL_LIMITS[withdrawMethod].min : 0}
                  max={withdrawMethod ? Math.min(balance, WITHDRAWAL_LIMITS[withdrawMethod].max) : 0}
                  placeholder="Enter amount to withdraw"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="leonardo-input"
                  required
                />
                {withdrawMethod && (
                <p className="text-xs text-white/70 mt-1">
                    Min: ${WITHDRAWAL_LIMITS[withdrawMethod].min} | Max: $
                    {Math.min(balance, WITHDRAWAL_LIMITS[withdrawMethod].max)}
                    {withdrawMethod === 'instant' && (
                      <> | Fee: ${(Number(withdrawalAmount || 0) * WITHDRAWAL_LIMITS.instant.fee).toFixed(2)}</>
                    )}
                </p>
                )}
              </div>

              <div className="mb-4">
                <Label className="block text-sm font-medium text-white/90 mb-1">Withdrawal Method</Label>
                {renderWithdrawForm()}
              </div>

              <Button 
                type="submit" 
                className="gradient-button w-full" 
                disabled={isLoading || !payoutProvider || !withdrawMethod}
              >
                  {isLoading ? "Processing..." : "Confirm Withdrawal"}
                </Button>
            </form>
            <div className="text-center mt-4">
              <Button
                variant="outline"
                className="text-blue-300 hover:text-blue-200 transition-colors duration-200 border border-blue-500/30 hover:border-blue-500/50 bg-transparent"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

