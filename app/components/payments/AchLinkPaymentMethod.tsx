"use client";

import { useState } from "react";
import type { Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function AchSetupForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${typeof window !== "undefined" ? window.location.origin : ""}/managepayments?ach_linked=1`,
      },
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      setErr(error.message ?? "Could not link bank");
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-gray-700 bg-gray-950/50 p-3">
        <PaymentElement />
      </div>
      {err && <p className="text-sm text-red-400">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!stripe || busy} className="gradient-button">
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            "Save bank account"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AchLinkPaymentMethod({
  stripePromise,
  onSuccess,
}: {
  stripePromise: Promise<Stripe | null>;
  onSuccess?: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchErr, setFetchErr] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setFetchErr(null);
    try {
      const res = await fetch("/api/payment-methods/create-ach-setup-intent", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Could not start bank setup");
      }
      if (!data.clientSecret || typeof data.clientSecret !== "string") {
        throw new Error("Invalid response from server");
      }
      setClientSecret(data.clientSecret);
    } catch (e) {
      setFetchErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const appearance = {
    theme: "night" as const,
    variables: {
      colorPrimary: "#3b82f6",
      colorBackground: "#0f172a",
      colorText: "#f8fafc",
      colorDanger: "#f87171",
    },
  };

  if (!clientSecret) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-400">
          Link a US bank account to your Stripe customer for ACH debits on Send Payment. This is not the same as
          your Connect payout bank.
        </p>
        {fetchErr && <p className="text-sm text-red-400">{fetchErr}</p>}
        <Button type="button" onClick={start} disabled={loading} className="gradient-button">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Starting…
            </>
          ) : (
            "Link US bank for Pay (ACH)"
          )}
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <AchSetupForm
        onSuccess={() => {
          setClientSecret(null);
          onSuccess?.();
        }}
        onCancel={() => setClientSecret(null)}
      />
    </Elements>
  );
}
