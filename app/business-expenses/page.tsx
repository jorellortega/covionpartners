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
import { DollarSign, Plus, Pencil, Trash2, Calendar, FileText, Tag } from "lucide-react";
import React from "react";

function debugTableRow(children: React.ReactNode, label: string) {
  React.Children.forEach(children, (child, idx) => {
    if (typeof child === "string" || typeof child === "number") {
      // eslint-disable-next-line no-console
      console.error(`[DEBUG] ${label} child at index ${idx} is a text node:`, JSON.stringify(child));
    }
    if (child === null) {
      // eslint-disable-next-line no-console
      console.error(`[DEBUG] ${label} child at index ${idx} is null`);
    }
  });
  return children;
}

function debugTableTree(label: string, children: React.ReactNode) {
  // eslint-disable-next-line no-console
  console.log(`[DEBUG-TREE] ${label} children:`, React.Children.map(children, (child, idx) => {
    if (typeof child === "string" || typeof child === "number") {
      return { idx, type: typeof child, value: JSON.stringify(child) };
    }
    if (child === null) {
      return { idx, type: "null", value: null };
    }
    if (React.isValidElement(child)) {
      let typeName = 'unknown';
      if (typeof child.type === 'string') {
        typeName = child.type;
      } else if (typeof child.type === 'function') {
        typeName = ((child.type as any)?.displayName ?? (child.type as any)?.name) || 'Component';
      } else if (typeof child.type === 'object' && child.type !== null) {
        typeName = (child.type as any)?.displayName ?? (child.type as any)?.name ?? 'Component';
      }
      return { idx, type: typeName, props: child.props };
    }
    return { idx, type: typeof child, value: child };
  }));
  return children;
}

export default function BusinessExpensePage() {
  console.log('🚨 BUSINESS EXPENSES PAGE LOADING 🚨');
  const { user } = useAuth();
  console.log('DEBUG: Component render, user state:', user);
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
    console.log('DEBUG: useEffect triggered, user:', user);
    if (!user) {
      console.log('DEBUG: No user found, returning early');
      return;
    }
    console.log('DEBUG: User found, proceeding to fetch orgs');
    const fetchOrgs = async () => {
      console.log('DEBUG: Current user:', user);
      console.log('DEBUG: User ID:', user.id);
      
      const query = `owner_id.eq.${user.id},id.in.(select organization_id from organization_staff where user_id = ${user.id}),id.in.(select organization_id from team_members where user_id = ${user.id})`;
      console.log('DEBUG: Query:', query);
      
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .or(query);
        
      console.log('DEBUG: Organizations data:', data);
      console.log('DEBUG: Organizations error:', error);
      
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
      console.log('DEBUG: Attempting to delete expense with id', id);
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense");
      console.error('DEBUG: Delete error', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-block px-3 py-1 rounded-full font-semibold text-sm border transition";
    switch (status) {
      case 'Paid':
        return `${baseClasses} bg-green-900/40 text-green-400 border-green-500/50`;
      case 'Unpaid':
        return `${baseClasses} bg-yellow-900/40 text-yellow-400 border-yellow-500/50`;
      case 'Overdue':
        return `${baseClasses} bg-red-900/40 text-red-400 border-red-500/50`;
      default:
        return `${baseClasses} bg-blue-900/40 text-blue-400 border-blue-500/50`;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:py-10 sm:px-6">
      <Card className="leonardo-card border-gray-800 mb-6 sm:mb-8">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Organization Expenses
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Track and manage expenses for your organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org" className="text-sm font-medium">Select Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-cyan-700 text-white w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" /> Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Organization Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description"
                      placeholder="Enter description" 
                      value={newExpense.description || ""} 
                      onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                      <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                      <input
                        id="amount"
                        className="bg-transparent outline-none w-full text-white py-2 pl-0"
                        placeholder="0.00"
                        type="number"
                        value={newExpense.amount || ""}
                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input 
                      id="category"
                      placeholder="Enter category" 
                      value={newExpense.category || ""} 
                      onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input 
                      id="due_date"
                      type="date" 
                      value={newExpense.due_date || ""} 
                      onChange={e => setNewExpense({ ...newExpense, due_date: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="receipt_url">Receipt URL</Label>
                    <Input 
                      id="receipt_url"
                      placeholder="Enter receipt URL" 
                      value={newExpense.receipt_url || ""} 
                      onChange={e => setNewExpense({ ...newExpense, receipt_url: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input 
                      id="notes"
                      placeholder="Enter notes" 
                      value={newExpense.notes || ""} 
                      onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recurrence">Recurrence</Label>
                    <Select value={newExpense.recurrence || ''} onValueChange={val => setNewExpense({ ...newExpense, recurrence: val })}>
                      <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Select recurrence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="One-time">One-time</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="add-recurring"
                      type="checkbox"
                      checked={!!newExpense.is_recurring}
                      onChange={e => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                    />
                    <Label htmlFor="add-recurring">Recurring</Label>
                  </div>
                  {newExpense.is_recurring && (
                    <div className="space-y-2">
                      <Label htmlFor="next_payment_date">Next Payment Date</Label>
                      <Input 
                        id="next_payment_date"
                        type="date" 
                        value={newExpense.next_payment_date || ""} 
                        onChange={e => setNewExpense({ ...newExpense, next_payment_date: e.target.value })} 
                      />
                    </div>
                  )}
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
            <div className="space-y-4">
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {expenses.filter(Boolean).map(expense => (
                  <Card key={expense.id} className="border-gray-700 bg-gray-900/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{expense.description || "No description"}</h3>
                          <p className="text-lg font-semibold text-cyan-400">${expense.amount || "0"}</p>
                        </div>
                        <div className="flex gap-1">
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
                      
                      <div className="flex flex-wrap gap-2">
                        {expense.category && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Tag className="w-3 h-3" />
                            {expense.category}
                          </div>
                        )}
                        {expense.due_date && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(expense.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={getStatusBadge(expense.status)}>
                          {expense.status || "Pending"}
                        </span>
                        <div className="flex items-center gap-2">
                          {expense.is_recurring && (
                            <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded">
                              Recurring
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={!!expense.verified}
                            onChange={async (e) => {
                              const newVerified = e.target.checked;
                              setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                              const { error } = await supabase
                                .from("expenses")
                                .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                .eq("id", expense.id);
                              if (error) {
                                console.error('DEBUG: Supabase update error', error);
                              }
                            }}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4">Amount</th>
                      <th className="py-2 px-4">Category</th>
                      <th className="py-2 px-4">Status</th>
                      <th className="py-2 px-4">Recurrence</th>
                      <th className="py-2 px-4">Recurring</th>
                      <th className="py-2 px-4">Next Payment</th>
                      <th className="py-2 px-4">Due Date</th>
                      <th className="py-2 px-4">Verified</th>
                      <th className="py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(Boolean).map(expense => (
                      <tr key={expense.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                        <td className="py-2 px-4 text-white">{expense.description || <span>-</span>}</td>
                        <td className="py-2 px-4 text-white">{expense.amount !== undefined && expense.amount !== null ? `$${expense.amount}` : <span>-</span>}</td>
                        <td className="py-2 px-4 text-white">{expense.category || <span>-</span>}</td>
                        <td className="py-2 px-4">
                          <span className={getStatusBadge(expense.status)}>
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
                        <td className="py-2 px-4 text-center">
                          {expense.verified ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 ml-2 cursor-pointer">
                              <span className="mr-1">✓</span>Verified
                            </span>
                          ) : (
                            <input
                              type="checkbox"
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
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => { setEditExpense(expense); setShowEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => { console.log('DEBUG: Delete button clicked for', expense.id); handleDeleteExpense(expense.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Expense Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-md mx-4 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Organization Expense</DialogTitle>
          </DialogHeader>
          {editExpense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input 
                  id="edit-description"
                  placeholder="Enter description" 
                  value={editExpense.description || ""} 
                  onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input 
                  id="edit-amount"
                  placeholder="Enter amount" 
                  type="number" 
                  value={editExpense.amount || ""} 
                  onChange={e => setEditExpense({ ...editExpense, amount: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input 
                  id="edit-category"
                  placeholder="Enter category" 
                  value={editExpense.category || ""} 
                  onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editExpense.status} onValueChange={val => setEditExpense({ ...editExpense, status: val })}>
                  <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editExpense.is_recurring ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-next-payment-date">Next Payment Date</Label>
                  <Input 
                    id="edit-next-payment-date"
                    type="date" 
                    value={editExpense.next_payment_date || ""} 
                    onChange={e => setEditExpense({ ...editExpense, next_payment_date: e.target.value })} 
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-due-date">Due Date</Label>
                  <Input 
                    id="edit-due-date"
                    type="date" 
                    value={editExpense.due_date || ""} 
                    onChange={e => setEditExpense({ ...editExpense, due_date: e.target.value })} 
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-receipt-url">Receipt URL</Label>
                <Input 
                  id="edit-receipt-url"
                  placeholder="Enter receipt URL" 
                  value={editExpense.receipt_url || ""} 
                  onChange={e => setEditExpense({ ...editExpense, receipt_url: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input 
                  id="edit-notes"
                  placeholder="Enter notes" 
                  value={editExpense.notes || ""} 
                  onChange={e => setEditExpense({ ...editExpense, notes: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-recurrence">Recurrence</Label>
                <Select value={editExpense.recurrence || ''} onValueChange={val => setEditExpense({ ...editExpense, recurrence: val })}>
                  <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="One-time">One-time</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="edit-recurring"
                  type="checkbox"
                  checked={!!editExpense.is_recurring}
                  onChange={e => setEditExpense({ ...editExpense, is_recurring: e.target.checked })}
                />
                <Label htmlFor="edit-recurring">Recurring</Label>
              </div>
            </div>
          )}
          <Button onClick={handleEditExpense} className="mt-4 w-full bg-cyan-700 text-white">Update Expense</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 