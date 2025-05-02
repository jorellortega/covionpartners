"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTeamMembers } from "@/hooks/useTeamMembers";

export default function PayPage() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const { teamMembers, loading: loadingTeamMembers } = useTeamMembers(selectedProject);

  // Fetch user's projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);
      // Get projects where user is owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', session.user.id)
        .order('name');
      // Get projects where user is a team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', session.user.id);
      let memberProjects: any[] = [];
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map((tm: any) => tm.project_id);
        const { data: joinedProjects, error: joinedError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('name');
        if (joinedProjects) {
          memberProjects = joinedProjects;
        }
      }
      // Combine and dedupe
      const allProjects = [...(ownedProjects || []), ...memberProjects];
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex((p) => p.id === project.id)
      );
      setProjects(uniqueProjects);
      if (uniqueProjects.length > 0) {
        setSelectedProject(uniqueProjects[0].id);
      }
    };
    fetchProjects();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(null);
    setError(null);

    try {
      if (!currentUserId || !recipient) {
        throw new Error('Please select a recipient');
      }

      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Get sender's current balance
      const { data: senderBalance, error: senderError } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance')
        .eq('user_id', currentUserId)
        .single();

      if (senderError) throw new Error('Could not fetch your balance');
      if (!senderBalance) throw new Error('No balance record found');

      if (senderBalance.balance < transferAmount) {
        throw new Error(`Insufficient funds. Your balance: $${senderBalance.balance}`);
      }

      // Get recipient's user ID from the selected team member
      const recipientMember = teamMembers.find(member => member.user.email === recipient);
      if (!recipientMember?.user?.id) {
        throw new Error('Invalid recipient');
      }

      // Deduct from sender
      const { error: deductError } = await supabase
        .from('cvnpartners_user_balances')
        .update({
          balance: senderBalance.balance - transferAmount,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', currentUserId);

      if (deductError) throw new Error('Failed to deduct from your balance');

      // Add to recipient - first check if they have a balance record
      const { data: recipientBalance, error: recipientError } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance')
        .eq('user_id', recipientMember.user.id)
        .single();

      // If recipient has no balance record, create one. If they do, update it
      const { error: addError } = await supabase
        .from('cvnpartners_user_balances')
        .upsert({
          user_id: recipientMember.user.id,
          balance: recipientBalance ? recipientBalance.balance + transferAmount : transferAmount,
          currency: 'USD',
          status: 'active',
          last_updated: new Date().toISOString()
        });

      if (addError) {
        // Rollback the deduction if adding to recipient fails
        await supabase
          .from('cvnpartners_user_balances')
          .update({
            balance: senderBalance.balance,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', currentUserId);
        
        throw new Error('Failed to transfer to recipient. Your balance has been restored.');
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
          <CardTitle>Send Payment to a Team Member</CardTitle>
          <CardDescription>Select a project and a team member to pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="project" className="block text-sm font-medium mb-1">Project</label>
              <select
                id="project"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                required
                className="w-full p-2 border rounded bg-white text-black"
              >
                <option value="" disabled>Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium mb-1">Recipient</label>
              <select
                id="recipient"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                required
                className="w-full p-2 border rounded bg-white text-black"
                disabled={!selectedProject || loadingTeamMembers}
              >
                <option value="" disabled>{loadingTeamMembers ? "Loading team members..." : "Select a team member"}</option>
                {teamMembers
                  .filter(member => member.user && member.user.id !== currentUserId)
                  .map(member => (
                    <option key={member.user.id} value={member.user.email}>
                      {member.user.name || member.user.email} ({member.user.email})
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