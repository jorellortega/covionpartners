"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react"

export default function ExpensesPage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userPayments, setUserPayments] = useState<Record<string, { paid: boolean; amount: number }>>({
    "User 1": { paid: true, amount: 50 },
    "User 2": { paid: false, amount: 50 },
    "User 3": { paid: false, amount: 50 }
  })

  // Fetch expenses from database
  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          user:user_id (
            id,
            email
          ),
          project:project_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to fetch expenses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = []
    }
    acc[expense.category].push(expense)
    return acc
  }, {} as Record<string, any[]>)

  const handleExpenseSelect = (expenseId: string) => {
    setSelectedExpense(expenseId)
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers([...selectedUsers, userId])
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-10 px-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 flex flex-col items-center">
      {/* Expenses Overview Card */}
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Expenses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-medium">Total Expenses</h3>
              <p className="text-2xl text-green-400">${expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-medium">Pending Expenses</h3>
              <p className="text-2xl text-yellow-400">${expenses.filter(expense => expense.status === 'Pending').reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-medium">Approved Expenses</h3>
              <p className="text-2xl text-green-400">${expenses.filter(expense => expense.status === 'Approved').reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category Cards */}
      {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
        <Card key={category} className="w-full max-w-3xl mb-8">
          <CardHeader>
            <CardTitle>{category} Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-400">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Project</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Due Date</th>
                    <th className="px-4 py-2">Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {(categoryExpenses as any[]).map((expense: any) => (
                    <tr key={expense.id} className="border-b border-gray-800">
                      <td className="px-4 py-2">{expense.description}</td>
                      <td className="px-4 py-2">${(expense.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-2">{expense.category}</td>
                      <td className="px-4 py-2">{expense.project?.name || 'Unknown Project'}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant="outline"
                          className={
                            expense.status === 'Approved'
                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : expense.status === 'Pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              : expense.status === 'Rejected'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                          }
                        >
                          {expense.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {expense.due_date ? formatDate(expense.due_date) : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        {expense.user?.email || 'Unknown'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {expenses.length === 0 && (
        <Card className="w-full max-w-3xl mb-8">
          <CardContent className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400">No expenses found</h3>
            <p className="text-gray-500 mt-1">Add expenses to projects to see them here</p>
          </CardContent>
        </Card>
      )}

      {/* User Payments Card */}
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>User Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleExpenseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select Expense" />
              </SelectTrigger>
              <SelectContent>
                {expenses.map((expense) => (
                  <SelectItem key={expense.id} value={expense.id.toString()}>
                    {expense.description} - ${(expense.amount || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-400">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Amount Due</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(userPayments).map(([user, payment]) => (
                    <tr key={user} className="border-b border-gray-800">
                      <td className="px-4 py-2">{user}</td>
                      <td className="px-4 py-2">${payment.amount.toFixed(2)}</td>
                      <td className="px-4 py-2 capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${payment.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{payment.paid ? 'Paid' : 'Pending'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Expense Card */}
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Split Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleExpenseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select Expense" />
              </SelectTrigger>
              <SelectContent>
                {expenses.map((expense) => (
                  <SelectItem key={expense.id} value={expense.id.toString()}>
                    {expense.description} - ${(expense.amount || 0).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((userId) => (
                <span key={userId} className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
                  User {userId}
                </span>
              ))}
            </div>
            <Button onClick={() => handleUserSelect("1")} disabled={!selectedExpense}>Add User</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Card */}
      <Card className="w-full max-w-3xl mb-8">
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
                <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Enter expense description" />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                    <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select>
                    <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 