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
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";

export default function BusinessExpensePage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    status: "Pending",
    due_date: "",
    receipt_url: "",
    notes: "",
    recurrence: "",
    is_recurring: false,
    next_payment_date: ""
  });
  const [editExpense, setEditExpense] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOrgs = async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .eq("owner_id", user.id);
      if (error) toast.error("Failed to fetch organizations");
      setOrganizations(data || []);
      if (data && data.length > 0) setSelectedOrg(data[0].id);
    };
    fetchOrgs();
  }, [user]);

  useEffect(() => {
    if (!selectedOrg) return;
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
  }, [selectedOrg]);

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
            due_date: newExpense.due_date,
            receipt_url: newExpense.receipt_url,
            notes: newExpense.notes,
            recurrence: newExpense.recurrence,
            is_recurring: newExpense.is_recurring,
            next_payment_date: newExpense.next_payment_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      setShowAdd(false);
      setNewExpense({ description: "", amount: "", category: "", status: "Pending", due_date: "", receipt_url: "", notes: "", recurrence: "", is_recurring: false, next_payment_date: "" });
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
          recurrence: editExpense.recurrence,
          is_recurring: editExpense.is_recurring,
          next_payment_date: editExpense.next_payment_date,
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

  const tableHeaders = [
    'Description',
    'Amount',
    'Category',
    'Status',
    'Recurrence',
    'Recurring',
    'Next Payment',
    'Due Date',
    'Verified',
    'Actions',
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Card className="leonardo-card border-gray-800 mb-8">
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
              <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <Input placeholder="Description" value={newExpense.description || ""} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                  <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                    <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                    <input
                      className="bg-transparent outline-none w-full text-white py-2 pl-0"
                      placeholder="Amount"
                      type="number"
                      value={newExpense.amount || ""}
                      onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <Input placeholder="Category" value={newExpense.category || ""} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} />
                  <Input placeholder="Due Date" type="date" value={newExpense.due_date || ""} onChange={e => setNewExpense({ ...newExpense, due_date: e.target.value })} />
                  <Input placeholder="Receipt URL" value={newExpense.receipt_url || ""} onChange={e => setNewExpense({ ...newExpense, receipt_url: e.target.value })} />
                  <Input placeholder="Notes" value={newExpense.notes || ""} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} />
                  <Select value={newExpense.recurrence || ''} onValueChange={val => setNewExpense({ ...newExpense, recurrence: val })}>
                    <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="One-time">One-time</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <input
                      id="add-recurring"
                      type="checkbox"
                      checked={!!newExpense.is_recurring}
                      onChange={e => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                    />
                    <Label htmlFor="add-recurring">Recurring</Label>
                  </div>
                  <Input placeholder="Next Payment Date" type="date" value={newExpense.next_payment_date || ""} onChange={e => setNewExpense({ ...newExpense, next_payment_date: e.target.value })} />
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
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    {tableHeaders.map((header, idx) => (
                      <th key={idx} className="py-2 px-4">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    return expenses.filter(Boolean).map(expense => (
                      <tr key={expense.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                        <td className="py-2 px-4 text-white">{expense.description || <span>-</span>}</td>
                        <td className="py-2 px-4 text-white">{expense.amount !== undefined && expense.amount !== null ? `$${expense.amount}` : <span>-</span>}</td>
                        <td className="py-2 px-4 text-white">{expense.category || <span>-</span>}</td>
                        <td className="py-2 px-4">
                          <span
                            className={
                              `inline-block px-4 py-1 rounded-full font-semibold text-sm border transition ` +
                              (expense.status === 'Paid'
                                ? 'bg-green-900/40 text-green-400 border-green-500/50'
                                : expense.status === 'Unpaid'
                                ? 'bg-yellow-900/40 text-yellow-400 border-yellow-500/50'
                                : expense.status === 'Overdue'
                                ? 'bg-red-900/40 text-red-400 border-red-500/50'
                                : 'bg-blue-900/40 text-blue-400 border-blue-500/50')
                            }
                            style={{ border: '2px solid lime', zIndex: 1, position: 'relative' }}
                          >
                            {expense.status || <span>-</span>}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          {expense.recurrence ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-900/40 text-blue-300 border border-blue-500/30 text-xs font-semibold">
                              {expense.recurrence}
                            </span>
                          ) : <span>-</span>}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {expense.is_recurring ? (
                            <span title="Recurring" className="text-green-400 font-bold">✓</span>
                          ) : (
                            <span title="Not Recurring" className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-2 px-4 text-white">
                          {expense.next_payment_date ? new Date(expense.next_payment_date).toLocaleDateString() : <span>-</span>}
                        </td>
                        <td className="py-2 px-4 text-white">{expense.due_date || <span>-</span>}</td>
                        <td className="py-2 px-4 text-center" style={{ border: '2px solid red', position: 'relative', zIndex: 10, background: '#222' }}>
                          {expense.verified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 ml-2 cursor-pointer">
                              <span className="mr-1">✓</span>Verified
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              style={{ zIndex: 20, position: 'relative' }}
                              checked={!!expense.verified}
                              onClick={e => e.stopPropagation()}
                              onChange={async (e) => {
                                const newVerified = e.target.checked;
                                setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                const { data, error } = await supabase
                                  .from("expenses")
                                  .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                  .eq("id", expense.id);
                                if (error) {
                                  console.error('DEBUG: Supabase update error', error);
                                }
                              }}
                            />
                          )}
                          <div style={{ fontSize: '10px', color: '#aaa' }}>Raw: {String(expense.verified)}</div>
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditExpense(expense); setShowEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Edit Expense Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization Expense</DialogTitle>
          </DialogHeader>
          {editExpense && (
            <div className="space-y-4">
              <Input placeholder="Description" value={editExpense.description || ""} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} />
              <Input placeholder="Amount" type="number" value={editExpense.amount || ""} onChange={e => setEditExpense({ ...editExpense, amount: e.target.value })} />
              <Input placeholder="Category" value={editExpense.category || ""} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} />
              <Input placeholder="Due Date" type="date" value={editExpense.due_date || ""} onChange={e => setEditExpense({ ...editExpense, due_date: e.target.value })} />
              <Input placeholder="Receipt URL" value={editExpense.receipt_url || ""} onChange={e => setEditExpense({ ...editExpense, receipt_url: e.target.value })} />
              <Input placeholder="Notes" value={editExpense.notes || ""} onChange={e => setEditExpense({ ...editExpense, notes: e.target.value })} />
              <Select value={editExpense.status} onValueChange={val => setEditExpense({ ...editExpense, status: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={editExpense.recurrence || ''} onValueChange={val => setEditExpense({ ...editExpense, recurrence: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="One-time">One-time</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  id="edit-recurring"
                  type="checkbox"
                  checked={!!editExpense.is_recurring}
                  onChange={e => setEditExpense({ ...editExpense, is_recurring: e.target.checked })}
                />
                <Label htmlFor="edit-recurring">Recurring</Label>
              </div>
              <Input placeholder="Next Payment Date" type="date" value={editExpense.next_payment_date || ""} onChange={e => setEditExpense({ ...editExpense, next_payment_date: e.target.value })} />
            </div>
          )}
          <Button onClick={handleEditExpense} className="mt-4 w-full bg-cyan-700 text-white">Update Expense</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 