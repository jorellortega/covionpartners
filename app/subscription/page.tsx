"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface UserData {
  role: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_id: string | null;
}

interface SubscriptionInfo {
  plan: string | null;
  role: string | null;
  status: string | null;
  provider: string | null;
  promo_code: string | null;
  user_id: string | null;
}

const planNames: Record<string, string> = {
  free_basic: "Free Basic",
  free_plus: "Free Plus",
  pro: "Pro",
  enterprise: "Enterprise",
  partner: "Partner",
}

const planOptions = [
  { value: "public_account", label: "Public Account" },
  { value: "partner_account", label: "Partner Account" },
  { value: "manager_account", label: "Manager Account" },
  { value: "business_account", label: "Business Account" },
];

export default function SubscriptionPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>("")
  const [promoInput, setPromoInput] = useState<string>("")
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!authUser) {
        console.log('Subscription: Auth check complete, no user found. Redirecting to login.')
        router.push('/login')
        return
      }
    }
  }, [authUser, authLoading, router])

  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) return
      
      setLoading(true)
      setError(null)
      try {
        // Fetch from users table
        const { data, error } = await supabase
          .from("users")
          .select("role, subscription_status, subscription_tier, subscription_id")
          .eq("id", authUser.id)
          .maybeSingle()
        
        console.log('DEBUG: users table fetch:', { data, error })
        
        if (error) throw error
        
        // If no data is found, initialize with null values
        setUserData(data || {
          role: null,
          subscription_status: null,
          subscription_tier: null,
          subscription_id: null
        })
      } catch (err: any) {
        setError(err.message || "Failed to load user info")
        console.log('DEBUG: error in fetchUser:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [supabase, authUser])

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!authUser) return;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, role, status, provider, promo_code, user_id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      if (!error) setSubscription(data);
    };
    fetchSubscription();
  }, [authUser, supabase]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !selectedPlan) return;
    setUpgradeLoading(true);
    setUpgradeMessage(null);
    try {
      // Upsert or insert subscription for this user
      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: authUser.id,
          plan: selectedPlan,
          status: "active",
          provider: promoInput ? "promo" : "manual",
          promo_code: promoInput || null,
          role: selectedPlan,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) throw error;
      setUpgradeMessage("Subscription updated successfully!");
      setSubscription((prev) => prev ? { ...prev, plan: selectedPlan, promo_code: promoInput || null, provider: promoInput ? "promo" : "manual", status: "active", role: selectedPlan } : null);
    } catch (err: any) {
      setUpgradeMessage("Error updating subscription: " + (err.message || err.toString()));
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Find the current plan label from planOptions
  const currentPlanLabel = planOptions.find(opt => opt.value === subscription?.plan)?.label || 'Not set';

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>
  }

  if (!userData) {
    return null
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Your Subscription</h1>
      <div className="bg-gray-900 rounded-lg p-6 shadow space-y-4">
        <div>
          <span className="text-gray-400">Account Type:</span>
          <span className="ml-2 text-xl font-semibold text-white">
            {userData.role ? (planNames[userData.role] || userData.role) : "Not set"}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Subscription Status:</span>
          <span className="ml-2 text-lg text-white">{userData.subscription_status || "Not set"}</span>
        </div>
        <div>
          <span className="text-gray-400">Subscription Tier:</span>
          <span className="ml-2 text-lg text-white">{userData.subscription_tier ? (planNames[userData.subscription_tier] || userData.subscription_tier) : "Not set"}</span>
        </div>
        <div>
          <span className="text-gray-400">Subscription ID:</span>
          <span className="ml-2 text-white">{userData.subscription_id || "Not set"}</span>
        </div>
        {/* Display all 6 columns from subscriptions table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-2">Subscription Table Info</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-gray-400">Plan:</div>
            <div className="text-white">{subscription?.plan || 'Not set'}</div>
            <div className="text-gray-400">Role:</div>
            <div className="text-white">{subscription?.role || 'Not set'}</div>
            <div className="text-gray-400">Status:</div>
            <div className="text-white">{subscription?.status || 'Not set'}</div>
            <div className="text-gray-400">Provider:</div>
            <div className="text-white">{subscription?.provider || 'Not set'}</div>
            <div className="text-gray-400">Promo Code:</div>
            <div className="text-white">{subscription?.promo_code || 'Not set'}</div>
            <div className="text-gray-400">User ID:</div>
            <div className="text-white">{subscription?.user_id || 'Not set'}</div>
          </div>
        </div>
      </div>
      <div className="mt-10 p-6 bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-4">Upgrade / Downgrade Subscription</h2>
        <div className="mb-4">
          <span className="text-gray-400">Current Account Type: </span>
          <span className="text-xl font-bold text-purple-400">{currentPlanLabel}</span>
        </div>
        <form onSubmit={handleUpgrade} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1">Select Plan</label>
            <select
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
              value={selectedPlan}
              onChange={e => setSelectedPlan(e.target.value)}
              required
            >
              <option value="" disabled>Select a plan</option>
              {planOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 mb-1">Promo Code (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
              type="text"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
              placeholder="Enter promo code if you have one"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            disabled={upgradeLoading}
          >
            {upgradeLoading ? "Updating..." : "Update Subscription"}
          </button>
          {upgradeMessage && (
            <div className={`mt-2 text-center ${upgradeMessage.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{upgradeMessage}</div>
          )}
        </form>
      </div>
    </div>
  )
} 