"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const mockExpenses = [
  {
    id: 1,
    date: "2023-10-01",
    description: "Office Supplies",
    amount: 150.00,
    category: "Supplies",
    status: "Approved",
    project: "Project A",
    organization: "Org A",
    item: "Item 1",
    split: "Equal",
    dueDate: "2023-10-15"
  },
  {
    id: 2,
    date: "2023-10-05",
    description: "Client Dinner",
    amount: 200.00,
    category: "Entertainment",
    status: "Pending",
    project: "Project B",
    organization: "Org B",
    item: "Item 2",
    split: "Proportional",
    dueDate: "2023-10-20"
  },
  {
    id: 3,
    date: "2023-10-10",
    description: "Software Subscription",
    amount: 50.00,
    category: "Software",
    status: "Approved",
    project: "Project A",
    organization: "Org A",
    item: "Item 3",
    split: "Equal",
    dueDate: "2023-10-25"
  }
]

export default function ExpensesPage() {
  const [open, setOpen] = useState(false)
  const [expenses, setExpenses] = useState(mockExpenses)
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [userPayments, setUserPayments] = useState<Record<string, { paid: boolean; amount: number }>>({
    "User 1": { paid: true, amount: 50 },
    "User 2": { paid: false, amount: 50 },
    "User 3": { paid: false, amount: 50 }
  })

  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = []
    }
    acc[expense.category].push(expense)
    return acc
  }, {} as Record<string, typeof expenses>)

  const handleExpenseSelect = (expenseId: string) => {
    setSelectedExpense(expenseId)
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers([...selectedUsers, userId])
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
              <p className="text-2xl text-green-400">${expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-medium">Pending Expenses</h3>
              <p className="text-2xl text-yellow-400">${expenses.filter(expense => expense.status === 'Pending').reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-white font-medium">Approved Expenses</h3>
              <p className="text-2xl text-green-400">${expenses.filter(expense => expense.status === 'Approved').reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}</p>
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
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Project</th>
                    <th className="px-4 py-2">Organization</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Split</th>
                    <th className="px-4 py-2">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-800">
                      <td className="px-4 py-2">{expense.item}</td>
                      <td className="px-4 py-2">{expense.description}</td>
                      <td className="px-4 py-2">${expense.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{expense.category}</td>
                      <td className="px-4 py-2">{expense.project}</td>
                      <td className="px-4 py-2">{expense.organization}</td>
                      <td className="px-4 py-2 capitalize">
                        <Select defaultValue={expense.status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Due">Due</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">{expense.split}</td>
                      <td className="px-4 py-2">{expense.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

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
                    {expense.description} - ${expense.amount.toFixed(2)}
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
                    {expense.description} - ${expense.amount.toFixed(2)}
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
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Add Expense</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                </DialogHeader>
                {/* Mock form, does not save */}
                <div className="space-y-4">
                  <Input placeholder="Date" disabled />
                  <Input placeholder="Description" disabled />
                  <Input placeholder="Amount" disabled />
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Project A">Project A</SelectItem>
                      <SelectItem value="Project B">Project B</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Org A">Org A</SelectItem>
                      <SelectItem value="Org B">Org B</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Item 1">Item 1</SelectItem>
                      <SelectItem value="Item 2">Item 2</SelectItem>
                      <SelectItem value="Item 3">Item 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Split" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equal">Equal</SelectItem>
                      <SelectItem value="Proportional">Proportional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-4" disabled>Save (Mock Only)</Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 