"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaymentForm from "../components/payments/PaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Suspense } from "react";

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  const searchParams = useSearchParams();
  const accountType = searchParams.get("type");
  const accountTypeLabel = accountType
    ? `Signing up for: ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} Account`
    : null;
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const roleMap: Record<string, string> = {
    public: 'viewer',
    partner: 'investor',
    manager: 'partner',
    business: 'admin',
  };
  const role = accountType ? roleMap[accountType] || 'viewer' : 'viewer';
  const roleLabelMap: Record<string, string> = {
    viewer: 'Viewer',
    investor: 'Investor',
    partner: 'Partner',
    admin: 'Admin',
  };
  const roleLabel = roleLabelMap[role] || role;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const { error: signUpError } = await signUp(
        form.email,
        form.password,
        form.name,
        form.phone,
        role
      );
      if (signUpError) {
        setError(typeof signUpError === 'object' && 'message' in (signUpError as any) ? (signUpError as any).message : "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }
      setAccountCreated(true);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-full max-w-md bg-[#181828] rounded-xl shadow-lg p-8 border border-[#23233a]">
          {accountTypeLabel && (
            <div className="text-center text-purple-300 font-semibold mb-1 text-lg">{accountTypeLabel}</div>
          )}
          {accountTypeLabel && (
            <div className="text-center text-purple-200 text-sm mb-4">Role: <span className="font-semibold">{roleLabel}</span></div>
          )}
          {!accountCreated ? (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-sm text-center">{error}</div>
              )}
              <h2 className="text-3xl font-bold text-center mb-2 text-purple-400">Create Account</h2>
              <p className="text-center text-gray-400 mb-8">
                Fill out the form below to create your account
              </p>
              <div className="mb-4">
                <label className="block text-white font-semibold mb-1">Full Name</label>
                <Input
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  className="bg-[#13131f] border border-[#23233a] text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white font-semibold mb-1">Email</label>
                <Input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="bg-[#13131f] border border-[#23233a] text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white font-semibold mb-1">Phone Number</label>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={form.phone}
                  onChange={handleChange}
                  className="bg-[#13131f] border border-[#23233a] text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-white font-semibold mb-1">Password</label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="bg-[#13131f] border border-[#23233a] text-white"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-white font-semibold mb-1">Confirm Password</label>
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="bg-[#13131f] border border-[#23233a] text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white flex items-center justify-center gap-2"
                disabled={loading}
              >
                <span className="material-icons">send</span>
                {loading ? "Creating..." : "Create Account"}
              </Button>
            </form>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-center mb-4 text-purple-400">Account Created!</h2>
              <p className="text-center text-gray-400 mb-6">Add your payment method to get started.</p>
              <h3 className="text-lg font-semibold mb-2 text-white">Add Your Payment Method</h3>
              <Elements stripe={stripePromise}>
                <PaymentForm onSuccess={() => window.location.href = '/dashboard'} accountType={accountType || undefined} />
              </Elements>
            </div>
          )}
        </div>
      </div>
    </Suspense>
  );
} 