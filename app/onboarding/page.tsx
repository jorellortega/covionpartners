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
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
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

  const handleFreshOnboardingLink = async () => {
    setProcessing(true);
    const res = await fetch("/api/stripe/connect/get-onboarding-link");
    const data = await res.json();
    setProcessing(false);
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleOpenExpressDashboard = async () => {
    setDashboardLoading(true);
    const res = await fetch("/api/stripe/connect/express-dashboard-link");
    const data = await res.json();
    setDashboardLoading(false);
    if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    const res = await fetch("/api/stripe/connect/express-dashboard-link");
    const data = await res.json();
    setResendingEmail(false);
    if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  const statusBadge = () => {
    if (!accountStatus || accountStatus.error) return <Badge variant="destructive">No Account</Badge>;
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) return <Badge variant="default">Enabled</Badge>;
    if (accountStatus.requirements?.currently_due?.length) return <Badge variant="secondary">Restricted</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  // Helper to check if email confirmation is required
  const emailRequired = () => {
    if (!accountStatus?.requirements) return false;
    const { currently_due = [], past_due = [], errors = [] } = accountStatus.requirements;
    const allDue = [...currently_due, ...past_due];
    if (allDue.some((item) => item.includes('email'))) return true;
    if (errors.some((err: any) => err.requirement && err.requirement.includes('email'))) return true;
    return false;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await fetch("/api/stripe/connect/account-status");
    const data = await res.json();
    setAccountStatus(data);
    setRefreshing(false);
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
          {/* Advanced status table for account/customer IDs */}
          <div className="mb-6">
            <table className="min-w-full text-sm border border-gray-200 rounded overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 font-medium">Stripe Connect Account</td>
                  <td className="px-4 py-2">
                    {accountStatus?.stripe_connect_account_id ? (
                      <Badge variant="default">Exists</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {accountStatus?.stripe_connect_account_id || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    {!accountStatus?.stripe_connect_account_id && (
                      <Button size="sm" onClick={handleCreateAccount} disabled={processing}>
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Create
                      </Button>
                    )}
                    {accountStatus?.stripe_connect_account_id && (
                      <Button size="sm" variant="outline" onClick={handleFreshOnboardingLink}>
                        Edit
                      </Button>
                    )}
                    {/* Optionally, add a delete button here if you want to support account deletion */}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-medium">Stripe Customer</td>
                  <td className="px-4 py-2">
                    {accountStatus?.stripe_customer_id ? (
                      <Badge variant="default">Exists</Badge>
                    ) : (
                      <Badge variant="destructive">Missing</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {accountStatus?.stripe_customer_id || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    {/* You can add create/edit/delete actions for customer here if needed */}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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
              {accountStatus?.requirements && (
                <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800">
                  <div className="font-medium mb-1">Stripe Requirements</div>
                  {accountStatus.requirements.disabled_reason && (
                    <div className="mb-2">
                      <span className="font-semibold">Restriction Reason: </span>
                      {accountStatus.requirements.disabled_reason.replace(/_/g, ' ')}
                    </div>
                  )}
                  {accountStatus.requirements.errors && accountStatus.requirements.errors.length > 0 && (
                    <div className="mb-2">
                      <span className="font-semibold">Errors:</span>
                      <ul className="list-disc ml-5">
                        {accountStatus.requirements.errors.map((err: any, idx: number) => (
                          <li key={idx}>
                            <span className="font-semibold">{err.code}:</span> {err.reason} ({err.requirement.replace(/_/g, ' ')})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {accountStatus.requirements.currently_due?.length > 0 && (
                    <>
                      <div className="font-semibold">Currently Due:</div>
                      <ul className="list-disc ml-5">
                        {accountStatus.requirements.currently_due.map((item: string, idx: number) => (
                          <li key={idx}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {accountStatus.requirements.eventually_due?.length > 0 && (
                    <>
                      <div className="font-semibold mt-2">Eventually Due:</div>
                      <ul className="list-disc ml-5">
                        {accountStatus.requirements.eventually_due.map((item: string, idx: number) => (
                          <li key={idx}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {accountStatus.requirements.past_due?.length > 0 && (
                    <>
                      <div className="font-semibold mt-2">Past Due:</div>
                      <ul className="list-disc ml-5">
                        {accountStatus.requirements.past_due.map((item: string, idx: number) => (
                          <li key={idx}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {accountStatus.requirements.disabled_reason || accountStatus.requirements.currently_due?.length > 0 || accountStatus.requirements.past_due?.length > 0 ? (
                    <Button
                      className="mt-3"
                      onClick={handleFreshOnboardingLink}
                      disabled={processing}
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />} Fix Now (Open Stripe Onboarding)
                    </Button>
                  ) : null}
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
              <div className="mb-6 flex items-center justify-between">
                <span></span>
                <div className="flex gap-2">
                  {accountStatus?.stripe_connect_account_id && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs"
                      onClick={handleOpenExpressDashboard}
                      disabled={dashboardLoading}
                    >
                      {dashboardLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Open Stripe Dashboard"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                    {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh Status"}
                  </Button>
                </div>
              </div>
              {emailRequired() && (
                <div className="mb-4 p-3 rounded bg-blue-100 text-blue-900 border border-blue-300 flex flex-col gap-2">
                  <b>Email confirmation required:</b> Please check your email inbox and confirm your address to complete Stripe onboarding. If you don't see the email, check your spam folder or click the onboarding button again to resend.
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleResendEmail}
                    disabled={resendingEmail}
                    className="w-fit"
                  >
                    {resendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resend Email Confirmation"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 