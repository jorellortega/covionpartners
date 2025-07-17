// This file has been moved to app/business-expenses/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DollarSign, Plus, Pencil, Trash2, Repeat, FileText } from "lucide-react";
import Link from 'next/link';

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-based in JS Date
  return new Date(year, month - 1, day);
}

// Helper to determine if recurring badge should be red and if verified should be auto-off
function shouldBeRedAndUnverify(expense: any) {
  if (!expense.is_recurring || !expense.due_date) return false;
  const due = parseLocalDate(expense.due_date);
  if (!due) return false;
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (expense.recurrence === 'Monthly' && diffDays <= 14 && diffDays >= 0) return true;
  if (expense.recurrence === 'Yearly' && diffDays <= 60 && diffDays >= 0) return true;
  return false;
}

export default function BusinessExpensePage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [userStaffLevel, setUserStaffLevel] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // Add back the missing expense state
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    status: "Pending",
    due_date: "",
    receipt_url: "",
    notes: "",
    recurrence: "One-time",
    is_recurring: false,
    next_payment_date: "",
    verified: false
  });
  const [editExpense, setEditExpense] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  // Add notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editNote, setEditNote] = useState<any>(null);
  const [showEditNote, setShowEditNote] = useState(false);
  // Extract unique categories from expenses
  const uniqueCategories = Array.from(new Set(expenses.map((e: any) => e.category).filter(Boolean)));
  const [useNewCategory, setUseNewCategory] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOrgs = async () => {
      try {
        // Get organization IDs from staff table only
        const { data: staffOrgs, error: staffError } = await supabase
          .from("organization_staff")
          .select("organization_id, access_level")
          .eq("user_id", user.id);
        
        if (staffError) {
          console.error('Error fetching staff organizations:', staffError);
        }
        
        // Collect all organization IDs user is staff of
        const staffOrgIds = new Set();
        let userAccessLevel = null;
        if (staffOrgs) {
          staffOrgs.forEach(item => {
            staffOrgIds.add(item.organization_id);
            // Store the access level for the selected org
            if (item.organization_id === selectedOrg) {
              userAccessLevel = item.access_level;
            }
          });
        }
        setUserStaffLevel(userAccessLevel);
        
        // Get organizations where user is owner
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from("organizations")
          .select("id, name, owner_id")
          .eq("owner_id", user.id);
          
        if (ownedError) {
          console.error('Error fetching owned organizations:', ownedError);
        }
        
        // Get organizations where user is staff member
        let staffMemberOrgs: any[] = [];
        if (staffOrgIds.size > 0) {
          const { data: memberOrgs, error: memberError } = await supabase
            .from("organizations")
            .select("id, name, owner_id")
            .in("id", Array.from(staffOrgIds));
          
          if (memberError) {
            console.error('Error fetching staff member organizations:', memberError);
          } else {
            staffMemberOrgs = memberOrgs || [];
          }
        }
        
        // Combine and deduplicate results
        const allOrgs = [...(ownedOrgs || []), ...staffMemberOrgs];
        const uniqueOrgs = allOrgs.filter((org, index, self) => 
          index === self.findIndex(o => o.id === org.id)
        );
        
        // Build a map of orgId -> access_level for staff orgs
        const staffAccessMap = new Map();
        if (staffOrgs) {
          staffOrgs.forEach(item => {
            staffAccessMap.set(item.organization_id, item.access_level);
          });
        }
        
        // Only show orgs where user is owner or has access level 5
        const visibleOrgs = uniqueOrgs.filter(org => {
          if (org.owner_id === user.id) return true;
          const staffLevel = staffAccessMap.get(org.id);
          return staffLevel === 5;
        });
        
        setOrganizations(visibleOrgs);
        if (visibleOrgs.length > 0) setSelectedOrg(visibleOrgs[0].id);
        
        // Show toast error only if both queries failed
        if (ownedError && staffError) {
          toast.error("Failed to fetch organizations");
        }
      } catch (error) {
        console.error('Error in fetchOrgs:', error);
        toast.error("Failed to fetch organizations");
      }
    };
    fetchOrgs();
  }, [user]);

  // Check access for the selected organization
  const selectedOrgObj = organizations.find(org => org.id === selectedOrg);
  const isOwner = selectedOrgObj && selectedOrgObj.owner_id === user.id;
  const hasAccess = isOwner || userStaffLevel === 5;

  useEffect(() => {
    if (!selectedOrg || !hasAccess) return;
    setLoading(true);
    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false });
      if (error) toast.error("Failed to fetch expenses");
      setExpenses(data || []);
      setLoading(false);
    };
    fetchExpenses();
  }, [selectedOrg, hasAccess]);

  // Add notes fetch effect
  useEffect(() => {
    if (!selectedOrg) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("business_notes")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch notes:", error);
        // If table doesn't exist, create it
        if (error.code === '42P01') {
          await createNotesTable();
        }
      } else {
        setNotes(data || []);
      }
    };
    fetchNotes();
  }, [selectedOrg]);

  // Update userStaffLevel when selectedOrg changes
  useEffect(() => {
    if (!selectedOrg || !user) return;
    const updateStaffLevel = async () => {
      const { data: staffData, error } = await supabase
        .from("organization_staff")
        .select("access_level")
        .eq("user_id", user.id)
        .eq("organization_id", selectedOrg)
        .single();
      
      if (!error && staffData) {
        setUserStaffLevel(staffData.access_level);
      } else {
        setUserStaffLevel(null);
      }
    };
    updateStaffLevel();
  }, [selectedOrg, user]);

  // Create notes table if it doesn't exist
  const createNotesTable = async () => {
    const { error } = await supabase.rpc('create_business_notes_table');
    if (error) {
      console.error("Failed to create notes table:", error);
    }
  };

  // Add note handlers
  const handleAddNote = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("business_notes")
        .insert([
          {
            organization_id: selectedOrg,
            user_id: user.id,
            title: newNote.title,
            content: newNote.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      setShowAddNote(false);
      setNewNote({ title: "", content: "" });
      toast.success("Note added successfully");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleEditNote = async () => {
    try {
      const { data, error } = await supabase
        .from("business_notes")
        .update({
          title: editNote.title,
          content: editNote.content,
          updated_at: new Date().toISOString()
        })
        .eq("id", editNote.id)
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => prev.map(note => note.id === editNote.id ? data : note));
      setShowEditNote(false);
      setEditNote(null);
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("business_notes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setNotes(prev => prev.filter(note => note.id !== id));
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const monthlyExpenses = expenses.filter(e => e.recurrence === 'Monthly').reduce((sum, e) => sum + (e.amount || 0), 0);
  const yearlyExpenses = expenses.filter(e => e.recurrence === 'Yearly').reduce((sum, e) => sum + (e.amount || 0), 0);

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen text-gray-400">Loading...</div>;
  }

  const handleAddExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert([
          {
            organization_id: selectedOrg,
            user_id: user.id,
            description: newExpense.description,
            amount: Number(newExpense.amount),
            category: newExpense.category,
            status: newExpense.status,
            due_date: newExpense.due_date ? newExpense.due_date : null,
            receipt_url: newExpense.receipt_url,
            notes: newExpense.notes,
            recurrence: newExpense.is_recurring ? newExpense.recurrence : "One-time",
            is_recurring: newExpense.is_recurring,
            next_payment_date: newExpense.is_recurring && newExpense.next_payment_date ? newExpense.next_payment_date : null,
            verified: newExpense.verified,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      setShowAdd(false);
      setNewExpense({ description: "", amount: "", category: "", status: "Pending", due_date: "", receipt_url: "", notes: "", recurrence: "One-time", is_recurring: false, next_payment_date: "", verified: false });
      toast.success("Expense added successfully");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const handleEditExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update({
          description: editExpense.description,
          amount: Number(editExpense.amount),
          category: editExpense.category,
          status: editExpense.status,
          due_date: editExpense.due_date,
          receipt_url: editExpense.receipt_url,
          notes: editExpense.notes,
          is_recurring: editExpense.is_recurring,
          recurrence: editExpense.is_recurring ? editExpense.recurrence : "One-time",
          next_payment_date: editExpense.is_recurring && editExpense.next_payment_date ? editExpense.next_payment_date : null,
          verified: editExpense.verified,
          updated_at: new Date().toISOString()
        })
        .eq("id", editExpense.id)
        .select()
        .single();
      if (error) throw error;
      setExpenses(prev => prev.map(exp => exp.id === editExpense.id ? data : exp));
      setShowEdit(false);
      setEditExpense(null);
      toast.success("Expense updated successfully");
    } catch (error) {
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="leonardo-card border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Organization Expenses
          </CardTitle>
          <CardDescription>Track and manage expenses for your organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="org">Select Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full max-w-md leonardo-input text-white">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {/* After fetching organizations and staffOrgs, filter organizations for dropdown
                    // Build a map of orgId -> access_level for staff orgs
                    const staffAccessMap = new Map();
                    if (Array.isArray(staffOrgs)) {
                      staffOrgs.forEach(item => {
                        staffAccessMap.set(item.organization_id, item.access_level);
                      });
                    }
                    // Only show orgs where user is owner or has access level 5
                    const visibleOrganizations = organizations.filter(org => {
                      if (org.owner_id === user?.id) return true;
                      const staffLevel = staffAccessMap.get(org.id);
                      return staffLevel === 5;
                    }); */}
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mb-4">
            <Link href="/business-expense-history">
              <Button variant="outline" className="mr-2">View Expense History</Button>
            </Link>
          </div>

          {/* Show access message if user doesnt have permission */}
          {selectedOrg && !hasAccess && (
            <div className="text-center py-8">
              <div className="leonardo-card p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-gray-400 mb-4">You need to be the organization owner or have Access Level 5 to view business expenses.</p>
                <p className="text-sm text-gray-500">Your current access level: {userStaffLevel || 'Not a staff member'}</p>
              </div>
            </div>
          )}

          {/* Only show expense data if user has access */}
          {selectedOrg && hasAccess && (
            <>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="leonardo-card p-4 flex items-center border-2 !border-green-500">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Total Expenses</p>
                    <p className="text-2xl font-bold text-green-400">${totalExpenses.toFixed(2)}</p>
                  </div>
                </div>
                <div className="leonardo-card p-4 flex items-center border-2 !border-blue-500">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Monthly Expenses</p>
                    <p className="text-2xl font-bold text-green-400">${monthlyExpenses.toFixed(2)}</p>
                  </div>
                </div>
                <div className="leonardo-card p-4 flex items-center border-2 !border-purple-500">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Yearly Expenses</p>
                    <p className="text-2xl font-bold text-green-400">${yearlyExpenses.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mb-4">
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="bg-cyan-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Organization Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                      <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                        <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                        <input
                          className="bg-transparent outline-none w-full text-white py-2 pl-0"
                          placeholder="Amount"
                          type="number"
                          value={newExpense.amount}
                          onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {/* Category dropdown/select */}
                      <Select
                        value={useNewCategory ? "__new__" : newExpense.category}
                        onValueChange={val => {
                          if (val === "__new__") {
                            setUseNewCategory(true);
                            setNewExpense({ ...newExpense, category: "" });
                          } else {
                            setUseNewCategory(false);
                            setNewExpense({ ...newExpense, category: val });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full leonardo-input text-white">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <SelectItem value="__new__">Add new category</SelectItem>
                        </SelectContent>
                      </Select>
                      {useNewCategory && (
                        <Input
                          placeholder="New Category"
                          value={newExpense.category}
                          onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                          className="leonardo-input text-white mt-2"
                        />
                      )}
                      {/* Recurring expense fields */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_recurring"
                          checked={newExpense.is_recurring}
                          onChange={e => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                        />
                        <label htmlFor="is_recurring" className="text-gray-300">Recurring Expense</label>
                      </div>
                      {newExpense.is_recurring && (
                        <div className="flex flex-col gap-2">
                          <Select
                            value={newExpense.recurrence}
                            onValueChange={val => setNewExpense({ ...newExpense, recurrence: val })}
                          >
                            <SelectTrigger className="w-full leonardo-input text-white">
                              <SelectValue placeholder="Recurrence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="One-time">One-time</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Next Payment Date"
                            type="date"
                            value={newExpense.next_payment_date || ""}
                            onChange={e => setNewExpense({ ...newExpense, next_payment_date: e.target.value })}
                            className="leonardo-input text-white"
                          />
                        </div>
                      )}
                      <Input placeholder="Due Date" type="date" value={newExpense.due_date} onChange={e => setNewExpense({ ...newExpense, due_date: e.target.value })} />
                      <Input placeholder="Receipt URL" value={newExpense.receipt_url} onChange={e => setNewExpense({ ...newExpense, receipt_url: e.target.value })} />
                      <Input placeholder="Notes" value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} />
                      <Select
                        value={newExpense.status}
                        onValueChange={val => setNewExpense({ ...newExpense, status: val })}
                      >
                        <SelectTrigger className="w-full leonardo-input text-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                          <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="add_verified"
                          checked={newExpense.verified}
                          onChange={e => setNewExpense({ ...newExpense, verified: e.target.checked })}
                        />
                        <label htmlFor="add_verified" className="text-gray-300">Verified</label>
                      </div>
                    </div>
                    <Button onClick={handleAddExpense} className="mt-4 w-full bg-cyan-700 text-white">Add Expense</Button>
                  </DialogContent>
                </Dialog>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : expenses.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No expenses found for this organization.</div>
              ) : (
                <div>
                  {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
                    <div key={category} className="leonardo-card mb-8">
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{category} Expenses</h2>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-green-500/20"
                          title={`Add expense to ${category}`}
                          onClick={() => {
                            setShowAdd(true);
                            setUseNewCategory(false);
                            setNewExpense(prev => ({ ...prev, category }));
                          }}
                        >
                          <Plus className="w-5 h-5 text-gray-300" />
                        </Button>
                      </div>
                      <div className="p-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full text-sm text-left text-gray-400">
                            <thead className="bg-gray-800 text-gray-300">
                              <tr>
                                <th className="px-2 py-2"></th>
                                <th className="px-4 py-2">Description</th>
                                <th className="px-4 py-2">Amount</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Due Date</th>
                                <th className="px-4 py-2">Notes</th>
                                <th className="px-4 py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(categoryExpenses as any[]).map((expense: any) => {
                                const needsRed = shouldBeRedAndUnverify(expense);
                                if (needsRed && expense.verified) {
                                  // Auto-unverify in UI and DB
                                  setTimeout(async () => {
                                    setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: false } : exp));
                                    await supabase
                                      .from("expenses")
                                      .update({ verified: false, updated_at: new Date().toISOString() })
                                      .eq("id", expense.id);
                                  }, 0);
                                }
                                return (
                                  <tr key={expense.id} className="border-b border-gray-800">
                                    <td className="px-2 py-2 text-center">
                                      {expense.verified ? (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 ml-2 cursor-pointer"
                                          onClick={async () => {
                                            const newVerified = false;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                          title="Click to unverify"
                                        >
                                          <span className="mr-1">✓</span>Verified
                                        </span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={async (e) => {
                                            const newVerified = true;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                        />
                                      )}
                                    </td>
                                    <td className="px-4 py-2">{expense.description}</td>
                                    <td className="px-4 py-2">${(expense.amount || 0).toFixed(2)}</td>
                                    <td className={`px-4 py-2${expense.status === 'Paid' ? ' paid-tint' : ''}`}>
                                      {expense.is_recurring && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${needsRed ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'} mr-2`}>
                                          <Repeat className="w-3 h-3 mr-1" /> Recurring
                                        </span>
                                      )}
                                      {expense.status}
                                    </td>
                                    <td className="px-4 py-2">{parseLocalDate(expense.due_date) ? parseLocalDate(expense.due_date)!.toLocaleDateString() : ''}</td>
                                    <td className="px-4 py-2">{expense.notes}</td>
                                    <td className="px-4 py-2 flex gap-2">
                                      <Button size="icon" variant="ghost" onClick={() => { setEditExpense(expense); setShowEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                                      <Button size="icon" variant="ghost" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="border-t border-gray-800 font-bold">
                                <td className="px-4 py-2 text-right" colSpan={1}>Total</td>
                                <td className="px-4 py-2">${(categoryExpenses as any[]).reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}</td>
                                <td className="px-4 py-2" colSpan={4}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-3">
                          {(categoryExpenses as any[]).map((expense: any) => {
                            const needsRed = shouldBeRedAndUnverify(expense);
                            if (needsRed && expense.verified) {
                              // Auto-unverify in UI and DB
                              setTimeout(async () => {
                                setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: false } : exp));
                                await supabase
                                  .from("expenses")
                                  .update({ verified: false, updated_at: new Date().toISOString() })
                                  .eq("id", expense.id);
                              }, 0);
                            }
                            return (
                              <div key={expense.id} className="leonardo-card p-4 border border-gray-700 bg-gray-900/50">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{expense.description || "No description"}</h3>
                                    <p className="text-lg font-semibold text-cyan-400">${(expense.amount || 0).toFixed(2)}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => { setEditExpense(expense); setShowEdit(true); }}
                                      className="p-1 h-8 w-8"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      className="p-1 h-8 w-8 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-300">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Status:</span>
                                    <div className="flex items-center gap-2">
                                      {expense.is_recurring && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${needsRed ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'}`}>
                                          <Repeat className="w-3 h-3 mr-1" /> Recurring
                                        </span>
                                      )}
                                      <span className={expense.status === 'Paid' ? 'text-green-400' : ''}>{expense.status}</span>
                                    </div>
                                  </div>
                                  
                                  {expense.due_date && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Due Date:</span>
                                      <span>{parseLocalDate(expense.due_date) ? parseLocalDate(expense.due_date)!.toLocaleDateString() : ''}</span>
                                    </div>
                                  )}
                                  
                                  {expense.notes && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Notes:</span>
                                      <span className="text-right max-w-[200px] truncate">{expense.notes}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                    <span className="text-gray-400">Verified:</span>
                                    <div>
                                      {expense.verified ? (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 cursor-pointer"
                                          onClick={async () => {
                                            const newVerified = false;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                          title="Click to unverify"
                                        >
                                          <span className="mr-1">✓</span>Verified
                                        </span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={async (e) => {
                                            const newVerified = true;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Mobile Category Total */}
                          <div className="leonardo-card p-4 border border-gray-700 bg-gray-800/50">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">Total for {category}:</span>
                              <span className="font-bold text-cyan-400 text-lg">
                                ${(categoryExpenses as any[]).reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>

      {/* Notes Section */}
      <div className="leonardo-card border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Business Notes
          </CardTitle>
          <CardDescription>Keep track of important business notes and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Business Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input 
                    placeholder="Note Title" 
                    value={newNote.title} 
                    onChange={e => setNewNote({ ...newNote, title: e.target.value })} 
                  />
                  <textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full min-h-[120px] p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleAddNote} className="mt-4 w-full bg-blue-700 text-white">
                  Add Note
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No notes found. Add your first business note!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div key={note.id} className="leonardo-card p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => { setEditNote(note); setShowEditNote(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={showEditNote} onOpenChange={setShowEditNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business Note</DialogTitle>
          </DialogHeader>
          {editNote && (
            <div className="space-y-4">
              <Input 
                placeholder="Note Title" 
                value={editNote.title} 
                onChange={e => setEditNote({ ...editNote, title: e.target.value })} 
              />
              <textarea
                placeholder="Note Content"
                value={editNote.content}
                onChange={e => setEditNote({ ...editNote, content: e.target.value })}
                className="w-full min-h-[120px] p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <Button onClick={handleEditNote} className="mt-4 w-full bg-blue-700 text-white">
            Update Note
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization Expense</DialogTitle>
          </DialogHeader>
          {editExpense && (
            <div className="space-y-4">
              <Input placeholder="Description" value={editExpense.description} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} />
              <Input placeholder="Amount" type="number" value={editExpense.amount} onChange={e => setEditExpense({ ...editExpense, amount: e.target.value })} />
              <Input placeholder="Category" value={editExpense.category} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} />
              {/* Recurring expense fields for edit */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_recurring"
                  checked={editExpense.is_recurring}
                  onChange={e => setEditExpense({ ...editExpense, is_recurring: e.target.checked })}
                />
                <label htmlFor="edit_is_recurring" className="text-gray-300">Recurring Expense</label>
              </div>
              {editExpense.is_recurring && (
                <div className="flex flex-col gap-2">
                  <Select
                    value={editExpense.recurrence}
                    onValueChange={val => setEditExpense({ ...editExpense, recurrence: val })}
                  >
                    <SelectTrigger className="w-full leonardo-input text-white">
                      <SelectValue placeholder="Recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="One-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Next Payment Date"
                    type="date"
                    value={editExpense.next_payment_date || ""}
                    onChange={e => setEditExpense({ ...editExpense, next_payment_date: e.target.value })}
                    className="leonardo-input text-white"
                  />
                </div>
              )}
              <Input placeholder="Due Date" type="date" value={editExpense.due_date} onChange={e => setEditExpense({ ...editExpense, due_date: e.target.value })} />
              <Input placeholder="Receipt URL" value={editExpense.receipt_url} onChange={e => setEditExpense({ ...editExpense, receipt_url: e.target.value })} />
              <Input placeholder="Notes" value={editExpense.notes} onChange={e => setEditExpense({ ...editExpense, notes: e.target.value })} />
              <Select value={editExpense.status} onValueChange={val => setEditExpense({ ...editExpense, status: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_verified"
                  checked={editExpense.verified}
                  onChange={e => setEditExpense({ ...editExpense, verified: e.target.checked })}
                />
                <label htmlFor="edit_verified" className="text-gray-300">Verified</label>
              </div>
            </div>
          )}
          <Button onClick={handleEditExpense} className="mt-4 w-full bg-cyan-700 text-white">Update Expense</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 