"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, AlertTriangle, Plus, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/stripe/connect/account-status")
      .then(async (res) => {
        const data = await res.json();
        setAccountStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/user/me") // You may need to implement this endpoint to get user info
      .then(async (res) => {
        if (res.ok) setUserData(await res.json());
      });
  }, []);

  const handleCreateAccount = async () => {
    setProcessing(true);
    const res = await fetch("/api/stripe/connect/create-account", { method: "POST" });
    const data = await res.json();
    setProcessing(false);
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const statusBadge = () => {
    if (!accountStatus || accountStatus.error) return <Badge variant="destructive">No Account</Badge>;
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) return <Badge variant="default">Enabled</Badge>;
    if (accountStatus.requirements?.currently_due?.length) return <Badge variant="secondary">Restricted</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Stripe Connect Onboarding</CardTitle>
          <CardDescription>
            View and manage your Stripe Connect onboarding status. Complete all requirements to enable payouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center space-x-2"><Loader2 className="animate-spin" /> Loading...</div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span>Status:</span> {statusBadge()}
              </div>
              {accountStatus?.error && (
                <div className="mb-4 text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {accountStatus.error}
                </div>
              )}
              {accountStatus && accountStatus.charges_enabled && accountStatus.payouts_enabled && (
                <div className="mb-4 flex items-center gap-2 text-green-600">
                  <ShieldCheck className="w-5 h-5" /> Your account is fully enabled for payouts and charges.
                </div>
              )}
              {accountStatus && accountStatus.requirements?.currently_due?.length > 0 && (
                <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800">
                  <div className="font-medium mb-1">Action Required:</div>
                  <ul className="list-disc ml-5">
                    {accountStatus.requirements.currently_due.map((item: string) => (
                      <li key={item}>{item.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                  <Button
                    className="mt-3"
                    onClick={() => router.push("/covionbank")}
                    variant="default"
                  >
                    Continue Onboarding
                  </Button>
                </div>
              )}
              <div className="mb-4">
                <div className="font-medium">Stripe Account ID:</div>
                <div className="text-mono text-gray-700">
                  {accountStatus?.error || !accountStatus ? (
                    <span className="text-gray-400">No account found</span>
                  ) : (
                    <span>{userData?.stripe_connect_account_id || <span className="text-gray-400">(not available)</span>}</span>
                  )}
                </div>
              </div>
              {!userData?.stripe_connect_account_id && (
                <Button
                  onClick={handleCreateAccount}
                  disabled={processing}
                  className="mt-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create Stripe Account
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 