import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreditCard, Trash2 } from 'lucide-react';

export default function SavedPaymentsList() {
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 mt-4 md:mt-0"
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