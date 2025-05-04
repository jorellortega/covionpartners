import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PaymentForm({ onSuccess, accountType }: { onSuccess?: () => void, accountType?: string }) {
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
          accountType,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment method');
      }

      toast.success('Payment method saved successfully');
      if (onSuccess) {
        onSuccess();
      } else {
      window.location.reload();
      }
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