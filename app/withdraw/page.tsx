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
  instant: { min: 1, max: 10000, fee: 0.01 } // 1% fee, minimum $1 to allow fee deduction
};

// Define Stripe payout fee (example: $0.25 flat fee)
const STRIPE_PAYOUT_FEE = 0.25;

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
  const [externalAccount, setExternalAccount] = useState<any>(null)
  const [stripeAvailableBalance, setStripeAvailableBalance] = useState<number | null>(null);
  const [stripeSummary, setStripeSummary] = useState<any>(null);
  
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

        // Fetch Stripe payout summary
        const summaryRes = await fetch('/api/stripe/connect/summary', { credentials: 'include' });
        const summaryData = await summaryRes.json();
        if (summaryRes.ok) {
          setStripeSummary(summaryData);
        } else {
          setStripeSummary(null);
        }

        // Fetch actual Stripe available balance for payouts
        const stripeBalanceRes = await fetch('/api/stripe/connect/available-balance', { credentials: 'include' });
        const stripeBalanceData = await stripeBalanceRes.json();
        if (stripeBalanceRes.ok && typeof stripeBalanceData.available === 'number') {
          setStripeAvailableBalance(stripeBalanceData.available);
        } else {
          setStripeAvailableBalance(null);
        }

        // Get Stripe account status
        const response = await fetch('/api/stripe/connect/account-status', {
          credentials: 'include',
        });
        const accountData = await response.json();
        
        if (!response.ok) {
          throw new Error('Failed to load Stripe account');
        }

        setExternalAccount(accountData.external_account || null);

        // Set available methods based on Stripe account
        const methods = {
          hasBankAccount: accountData.payouts_enabled && accountData.charges_enabled,
          hasDebitCard: false // We don't use cards for withdrawals
        };

        console.log('Available methods:', methods); // Debug log

        setAvailableMethods(methods);

        // Auto-select standard method if bank account is available
        if (methods.hasBankAccount) {
          setWithdrawMethod('standard');
          setPayoutProvider('stripe');
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
      const fee = withdrawMethod === 'instant' ? amount * WITHDRAWAL_LIMITS.instant.fee : 0;
      const finalAmount = amount - fee;

      if (amount < limits.min || amount > limits.max) {
        throw new Error(`Amount must be between $${limits.min} and $${limits.max}`);
      }

    if (amount > balance) {
        throw new Error('Insufficient funds');
    }

      if (payoutProvider === 'stripe') {
        // Process via Stripe
        const response = await fetch('/api/stripe/create-payout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: finalAmount,
            external_account_id: externalAccount?.id
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to process withdrawal');
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
          balance: balance - amount,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (updateError) throw new Error('Failed to update balance');

      setBalance(prev => prev - amount);
      setSuccess(`Withdrawal of $${finalAmount.toFixed(2)} initiated. ${
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
    if (!availableMethods.hasBankAccount) {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-400 p-3 rounded">
            Your Stripe Express account needs to be fully enabled for payouts. Please complete the onboarding process.
          </div>
          <Button
            type="button"
            onClick={() => router.push("/onboarding")}
            className="w-full"
          >
            Complete Onboarding
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="block text-sm font-medium text-white/90">Bank Account</Label>
          <div className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
            <div className="flex items-center space-x-3">
              <LinkIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-white">
                  {externalAccount?.bank_name || 'Bank'} •••• {externalAccount?.last4 || '----'}
                </p>
                <p className="text-sm text-gray-400">
                  Funds will be sent to your connected bank account
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-white/70 mt-2">
            Standard bank transfers typically arrive in 2-3 business days.
          </p>
        </div>
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
            {/* Stripe payout summary box */}
            {stripeSummary && (
              <div className="mb-6 p-4 rounded-lg border border-blue-700 bg-blue-900/10 text-blue-200">
                <div className="font-bold text-blue-300 mb-2">Stripe Payout Summary</div>
                <div className="flex flex-col gap-1 text-sm">
                  <div>On the way to your bank: <span className="font-bold">${stripeSummary.in_transit.toFixed(2)}</span></div>
                  <div>Upcoming payout (estimated): <span className="font-bold">${stripeSummary.upcoming_payout.toFixed(2)}</span>{stripeSummary.upcoming_payout_estimated_arrival && (
                    <span> (arrives {new Date(stripeSummary.upcoming_payout_estimated_arrival).toLocaleDateString()})</span>
                  )}</div>
                  <div>Available in your balance: <span className="font-bold">${stripeSummary.available.toFixed(2)}</span></div>
                  <div>Total balance: <span className="font-bold">${stripeSummary.total.toFixed(2)}</span></div>
                  <div>Payouts go to: <span className="font-bold">{stripeSummary.payout_destination?.bank_name || 'Bank'} •••• {stripeSummary.payout_destination?.last4 || '----'}</span> ({stripeSummary.payout_schedule})</div>
                </div>
              </div>
            )}
            <div>
              <h2 className="text-center text-3xl font-extrabold gradient-text">Withdraw Funds</h2>
              <p className="mt-2 text-center text-sm text-white/70">
                Available Balance: <span className="font-bold text-green-400">${balance.toFixed(2)}</span>
              </p>
              {stripeAvailableBalance !== null && (
                <p className="mt-1 text-center text-xs text-blue-300">
                  Stripe Available for Payout: <span className="font-bold">${stripeAvailableBalance.toFixed(2)}</span>
                </p>
              )}
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
                  step="1"
                  min={withdrawMethod ? WITHDRAWAL_LIMITS[withdrawMethod].min : 0}
                  max={withdrawMethod ? Math.min((stripeAvailableBalance ?? balance) - STRIPE_PAYOUT_FEE, WITHDRAWAL_LIMITS[withdrawMethod].max) : 0}
                  placeholder="Enter amount to withdraw"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="leonardo-input"
                  required
                />
                <p className="text-xs text-white/70 mt-1">
                  Stripe payout fee: <span className="text-red-400 font-bold">${STRIPE_PAYOUT_FEE.toFixed(2)}</span>
                </p>
                {withdrawMethod && (
                <p className="text-xs text-white/70 mt-1">
                    Min: ${WITHDRAWAL_LIMITS[withdrawMethod].min} | Max: $
                    {Math.max(0, Math.min((stripeAvailableBalance ?? balance) - STRIPE_PAYOUT_FEE, WITHDRAWAL_LIMITS[withdrawMethod].max))}
                </p>
                )}
                {withdrawMethod === 'instant' && withdrawalAmount && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-white/90">Final Amount After Fee:</p>
                    <p className="text-lg font-bold text-blue-400">
                      ${(Number(withdrawalAmount) * (1 - WITHDRAWAL_LIMITS.instant.fee)).toFixed(2)}
                    </p>
                    <p className="text-xs text-white/70 mt-1">
                      Fee: ${(Number(withdrawalAmount) * WITHDRAWAL_LIMITS.instant.fee).toFixed(2)} (1%)
                    </p>
                  </div>
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

