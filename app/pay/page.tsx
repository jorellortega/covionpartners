"use client";

import { useState, useEffect, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
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
  const [allActiveUsers, setAllActiveUsers] = useState<any[]>([]);
  const supabase = createClientComponentClient();
  const { teamMembers, loading: loadingTeamMembers } = useTeamMembers(selectedProject);
  const searchParams = useSearchParams();

  // Fetch all users with Covion Bank status 'Active' on mount
  useEffect(() => {
    const fetchUsers = async () => {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, email, stripe_connect_account_id')
        .not('stripe_connect_account_id', 'is', null);
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
    };

    fetchData();
  }, [supabase]);

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
      if (!currentUserId || !recipientId || !selectedPaymentMethod) {
        throw new Error('Please fill in all required fields');
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Get recipient's user data
      const recipientMember = teamMembers.find(member => member.user.id === recipientId);
      if (!recipientMember?.user) {
        throw new Error('Invalid recipient');
      }

      // Make the payment
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: transferAmount,
          recipientId: recipientId,
          paymentMethodId: selectedPaymentMethod,
          ...(selectedProject && { projectId: selectedProject }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payment');
      }

      setSuccess(`Successfully sent $${transferAmount} to ${recipientMember.user.email}`);
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
          <CardDescription>Send a payment to any user with Covion Bank status Active.</CardDescription>
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
              <label htmlFor="paymentMethod" className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                id="paymentMethod"
                value={selectedPaymentMethod}
                onChange={e => setSelectedPaymentMethod(e.target.value)}
                required
                className="w-full p-2 border rounded bg-white text-black"
              >
                <option value="" disabled>Select a payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.card.brand.toUpperCase()} ending in {method.card.last4} (Expires {method.card.exp_month}/{method.card.exp_year})
                  </option>
                ))}
              </select>
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