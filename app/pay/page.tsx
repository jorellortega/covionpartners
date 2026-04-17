"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

/** Stripe payment method from /api/payment-methods/list (cards + US bank accounts). */
interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  us_bank_account?: {
    bank_name: string | null;
    last4: string | null;
  };
}

function PayPageContent() {
  const [recipientId, setRecipientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  /** card = saved cards; bank = US bank ACH on Customer; balance = in-app wallet (cvnpartners_user_balances). */
  const [funding, setFunding] = useState<"card" | "bank" | "balance">("card");
  const [walletUsd, setWalletUsd] = useState<number | null>(null);
  const [connectAvailableUsd, setConnectAvailableUsd] = useState<number | null>(null);
  /** Set when /api/payment-methods/list?debug=1 returns `debug` (see server route). */
  const [paymentMethodsDebug, setPaymentMethodsDebug] = useState<Record<string, unknown> | null>(null);
  const [allActiveUsers, setAllActiveUsers] = useState<any[]>([]);

  const cardMethods = paymentMethods.filter((m) => m.type === "card");
  const bankMethods = paymentMethods.filter((m) => m.type === "us_bank_account");
  const supabase = createClientComponentClient();
  const searchParams = useSearchParams();

  // All other users (card/bank need recipient with Connect; balance-only can still pick anyone in list)
  useEffect(() => {
    const fetchUsers = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email, stripe_connect_account_id")
        .neq("id", session.user.id);
      setAllActiveUsers(users || []);
    };
    fetchUsers();
  }, [supabase]);

  // Fetch user's projects and payment methods on mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);

      // Fetch projects
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('name');

      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', session.user.id);

      let memberProjects: any[] = [];
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map((tm: any) => tm.project_id);
        const { data: joinedProjects } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('name');
        if (joinedProjects) {
          memberProjects = joinedProjects;
        }
      }

      const allProjects = [...(ownedProjects || []), ...memberProjects];
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
      );
      setProjects(uniqueProjects);

      try {
        const response = await fetch('/api/payment-methods/list?debug=1', { credentials: 'include' });
        let data: {
          paymentMethods?: PaymentMethod[];
          debug?: Record<string, unknown>;
          error?: string;
        } = {};
        try {
          data = await response.json();
        } catch {
          // ignore
        }
        console.log('[pay] GET /api/payment-methods/list?debug=1', {
          status: response.status,
          ok: response.ok,
          paymentMethodsCount: data.paymentMethods?.length ?? 0,
          debug: data.debug,
          error: data.error,
        });
        setPaymentMethods(data.paymentMethods || []);
        setPaymentMethodsDebug(data.debug ?? null);
        if (!response.ok) {
          toast.error(data.error || `Payment methods failed (${response.status})`);
        } else if (data.debug && (data.debug.fatalError || data.debug.cardListError || data.debug.bankListError)) {
          const d = data.debug;
          const hint = [
            d.fatalError,
            d.cardListError && typeof d.cardListError === 'object' && 'message' in d.cardListError
              ? `Cards: ${(d.cardListError as { message?: string }).message}`
              : null,
            d.bankListError && typeof d.bankListError === 'object' && 'message' in d.bankListError
              ? `Banks: ${(d.bankListError as { message?: string }).message}`
              : null,
          ]
            .filter(Boolean)
            .join(' — ');
          if (hint) toast.warning(hint.slice(0, 320));
        }
      } catch (err) {
        console.error('[pay] payment methods fetch', err);
        toast.error('Failed to load payment methods');
        setPaymentMethodsDebug({ clientError: String(err) });
      }
    };

    fetchData();
  }, [supabase]);

  useEffect(() => {
    fetch("/api/payments/sender-balance", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { walletUsd?: number; connectAvailableUsd?: number | null }) => {
        if (typeof d.walletUsd === "number") setWalletUsd(d.walletUsd);
        if (d.connectAvailableUsd != null && typeof d.connectAvailableUsd === "number") {
          setConnectAvailableUsd(d.connectAvailableUsd);
        }
      })
      .catch(() => {
        setWalletUsd(null);
        setConnectAvailableUsd(null);
      });
  }, []);

  // Preselect recipient from query param if possible
  useEffect(() => {
    const recipientParam = searchParams.get("recipient");
    if (recipientParam && allActiveUsers.some(m => m.id === recipientParam)) {
      setRecipientId(recipientParam);
    }
  }, [searchParams, allActiveUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      if (!currentUserId || !recipientId) {
        throw new Error('Please fill in all required fields');
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (funding === "balance") {
        if (walletUsd === null || walletUsd < transferAmount) {
          throw new Error(
            `Insufficient account balance. Available: $${(walletUsd ?? 0).toFixed(2)}.`
          );
        }
      } else {
        const rec = allActiveUsers.find((m) => m.id === recipientId);
        if (!rec?.stripe_connect_account_id) {
          throw new Error(
            "Recipient must have Covion banking active for card or bank payments."
          );
        }
        if (!selectedPaymentMethod) {
          throw new Error("Select a payment method");
        }
      }

      // Recipient must be in the directory (not scoped to project team — teamMembers only lists project members)
      const recipientUser = allActiveUsers.find((m) => m.id === recipientId);
      if (!recipientUser) {
        throw new Error("Invalid recipient");
      }

      // Make the payment
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: transferAmount,
          recipientId: recipientId,
          funding,
          ...(funding !== "balance" && { paymentMethodId: selectedPaymentMethod }),
          ...(selectedProject && { projectId: selectedProject }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payment');
      }

      setSuccess(
        `Successfully sent $${transferAmount} to ${recipientUser.name || recipientUser.email}`
      );
      // Clear form
      setAmount("");
      setNote("");
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Send Payment</CardTitle>
          <CardDescription>
          Send a payment to any user with Covion Bank status Active. Choose card, linked bank (ACH), or in-app
          account balance.
        </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="project" className="block text-sm font-medium mb-1">Project</label>
              <select
                id="project"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="recipient" className="block text-sm font-medium mb-1">Recipient</label>
              <select
                id="recipient"
                value={recipientId}
                onChange={e => setRecipientId(e.target.value)}
                className="w-full p-2 border rounded bg-white text-black"
              >
                <option value="" disabled>Select a user</option>
                {allActiveUsers
                  .filter(member => member.id !== currentUserId)
                  .map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email} ({member.email})
                    </option>
                  ))}
              </select>
              {recipientId && (() => {
                const selected = allActiveUsers.find(m => m.id === recipientId);
                if (!selected) return null;
                return (
                  <div className="mt-2 flex items-center space-x-2 text-sm">
                    <span className="font-medium">Covion Bank Status:</span>
                    {selected.stripe_connect_account_id ? (
                      <span className="px-2 py-1 bg-gray-900 rounded text-green-400">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-900 rounded text-red-400">Inactive</span>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <label htmlFor="funding" className="block text-sm font-medium mb-1">
                Funding source
              </label>
              <select
                id="funding"
                value={funding}
                onChange={(e) => {
                  const v = e.target.value as "card" | "bank" | "balance";
                  setFunding(v);
                  setSelectedPaymentMethod("");
                }}
                className="w-full p-2 border rounded bg-white text-black mb-3"
              >
                <option value="card">Card</option>
                <option value="bank">Bank account (US ACH)</option>
                <option value="balance">Account balance (in-app)</option>
              </select>

              {funding === "balance" && (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 space-y-1">
                  <p>
                    <span className="font-medium">Available to send:</span>{" "}
                    {walletUsd !== null ? `$${walletUsd.toFixed(2)}` : "…"}
                  </p>
                  {connectAvailableUsd !== null && (
                    <p className="text-gray-600">
                      Stripe Connect balance (separate): ${connectAvailableUsd.toFixed(2)} — not used for this
                      send; withdraw or receive payouts to your bank from{" "}
                      <a href="/managepayments" className="text-blue-600 underline">
                        Manage payments
                      </a>
                      .
                    </p>
                  )}
                  <p className="text-gray-600">
                    Balance sends move funds in your Covion wallet only (no card charge). Recipient receives the
                    amount minus the 2% platform fee.
                  </p>
                </div>
              )}

              {(funding === "card" || funding === "bank") && (
                <>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">
                    {funding === "card" ? "Saved card" : "Linked bank (ACH)"}
                  </label>
                  <select
                    id="paymentMethod"
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    required={funding === "card" || funding === "bank"}
                    className="w-full p-2 border rounded bg-white text-black"
                  >
                    <option value="">
                      {funding === "card" ? "Select a card" : "Select a bank account"}
                    </option>
                    {(funding === "card" ? cardMethods : bankMethods).map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.type === "us_bank_account" && method.us_bank_account
                          ? `Bank: ${method.us_bank_account.bank_name || "Account"} ••••${method.us_bank_account.last4 || "----"}`
                          : method.card
                            ? `${method.card.brand.toUpperCase()} ending in ${method.card.last4} (Expires ${method.card.exp_month}/${method.card.exp_year})`
                            : method.id}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {funding === "card" &&
                cardMethods.length === 0 &&
                paymentMethodsDebug &&
                paymentMethodsDebug.stripeCustomerIdPresent === true &&
                (paymentMethodsDebug.totalReturned === 0 || paymentMethodsDebug.totalReturned == null) &&
                !paymentMethodsDebug.fatalError && (
                  <p className="text-sm text-gray-600 mt-2">
                    You have a Stripe customer, but no saved card yet. Add one on{" "}
                    <a href="/managepayments" className="text-blue-600 underline">
                      Manage payments
                    </a>{" "}
                    → Add New Payment Method.
                  </p>
                )}

              {funding === "bank" && bankMethods.length === 0 && (
                <p className="text-sm text-amber-800 mt-2">
                  No US bank on your Stripe <strong>customer</strong> for ACH debits yet. Open{" "}
                  <a href="/managepayments#ach-for-pay" className="text-blue-600 underline">
                    Manage payments → Link bank for Pay (ACH)
                  </a>
                  . (Your Connect payout bank does not count here.)
                </p>
              )}
              {paymentMethodsDebug && (
                <details className="mt-2 rounded border border-amber-900/50 bg-amber-950/30 text-left">
                  <summary className="cursor-pointer px-2 py-1.5 text-xs font-medium text-amber-200/90">
                    Debug: payment-methods/list
                  </summary>
                  <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all border-t border-amber-900/40 p-2 text-[10px] leading-relaxed text-amber-100/90">
                    {JSON.stringify(paymentMethodsDebug, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
              {/* Subtle platform fee display */}
              {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                <div className="text-xs text-gray-400 mt-1" style={{ fontStyle: 'italic' }}>
                  Includes a small 2% platform fee (${(Number(amount) * 0.02).toFixed(2)})
                </div>
              )}
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium mb-1">Note (optional)</label>
              <Input
                id="note"
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="For lunch, project, etc."
              />
            </div>

            {success && <div className="text-green-500 text-sm">{success}</div>}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Processing..." : "Send Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PayPageContent />
    </Suspense>
  );
} 