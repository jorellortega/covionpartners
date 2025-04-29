'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Trash2, ShieldCheck, UserCheck } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// New component to display saved payments
function SavedPaymentsList() {
  const [savedPayments, setSavedPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPayments = async () => {
      try {
        const response = await fetch('/api/payments/saved', {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setSavedPayments(data);
        } else {
          toast.error('Failed to load saved payments');
        }
      } catch (error) {
        console.error('Error fetching saved payments:', error);
        toast.error('Failed to load saved payments');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedPayments();
  }, []);

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/payments/saved?id=${paymentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSavedPayments(prev => prev.filter(payment => payment.id !== paymentId));
        toast.success('Payment method deleted successfully');
      } else {
        toast.error('Failed to delete payment method');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment method');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (savedPayments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved payment methods found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savedPayments.map((payment) => (
        <Card key={payment.id} className="bg-white/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <div>
                  <p className="font-medium">{payment.card.brand} ending in {payment.card.last4}</p>
                  <p className="text-sm text-gray-400">Expires {payment.card.exp_month}/{payment.card.exp_year}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeletePayment(payment.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PaymentForm() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError('Stripe has not been initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: cardholderName,
        },
      });

      if (createError) {
        throw new Error(createError.message);
      }

      const response = await fetch('/api/payments/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment method');
      }

      toast.success('Payment method saved successfully');
      // Refresh the page to show the new payment method
      window.location.reload();
    } catch (err: any) {
      console.error('Error saving payment:', err);
      setError(err.message || 'Failed to save payment method');
      toast.error(err.message || 'Failed to save payment method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <label htmlFor="cardholderName" className="text-sm font-medium block">Cardholder Name</label>
        <input
          id="cardholderName"
          name="cardholderName"
          type="text"
          className="p-2 border rounded w-full bg-white text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
          placeholder="Full name as on card"
          required
        />
      </div>
      <div className="space-y-4">
        <label className="text-sm font-medium block">Card Information</label>
        <div className="p-4 border rounded-lg bg-white/50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  backgroundColor: 'transparent',
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !stripe}
        >
          {loading ? 'Saving...' : 'Save Payment Method'}
        </Button>
      </div>
    </form>
  );
}

export default function SavePaymentsPage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
          <CardDescription>
            View and manage your saved payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SavedPaymentsList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Payment Method</CardTitle>
          <CardDescription>
            Securely save a new payment method for future transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise}>
            <PaymentForm />
          </Elements>
        </CardContent>
      </Card>

      {/* Security Info Section (Bottom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Client/User Security Card */}
        <Card className="bg-gradient-to-br from-blue-900/80 to-blue-800/60 border-blue-400 text-blue-100 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <ShieldCheck className="text-blue-300 w-6 h-6" />
            <CardTitle className="text-blue-100 text-lg">Your Payment Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Your payment details are never stored on our servers. Only secure, encrypted references are kept for your convenience.</li>
              <li>All payment information is processed using industry-standard encryption and security protocols.</li>
              <li>Our team and developers cannot view your full card number, CVC, or other sensitive payment data at any time.</li>
              <li>You can remove your saved payment methods at any time, instantly revoking their use for future transactions.</li>
              <li>Only you can access and manage your payment methods. All actions require secure authentication.</li>
            </ul>
          </CardContent>
        </Card>
        {/* Developer/Technical Security Card */}
        <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border-slate-400 text-slate-100 shadow-lg">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UserCheck className="text-slate-300 w-6 h-6" />
            <CardTitle className="text-slate-100 text-lg">Developer & Technical Security</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>Only non-sensitive references and metadata are stored in the database—never full card numbers or CVCs.</li>
              <li>All API endpoints require user authentication and enforce strict access controls.</li>
              <li>Soft deletion is used for payment methods, preserving auditability and preventing accidental data loss.</li>
              <li>Role-based access and row-level security ensure users can only access and modify their own payment methods.</li>
              <li>Our system is designed to meet industry-standard security and privacy requirements.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* End Security Info Section */}
    </div>
  );
} 