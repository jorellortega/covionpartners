"use client"

import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowLeft } from "lucide-react"

const mockExpenses = [
  {
    id: "1",
    description: "Office Supplies",
    amount: 150,
    category: "Supplies",
    status: "Paid",
    dueDate: "2023-10-15"
  },
  {
    id: "2",
    description: "Client Dinner",
    amount: 200,
    category: "Entertainment",
    status: "Pending",
    dueDate: "2023-10-20"
  },
  {
    id: "3",
    description: "Software Subscription",
    amount: 50,
    category: "Software",
    status: "Due",
    dueDate: "2023-10-25"
  }
]

export default function ExpenseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const expense = mockExpenses.find(e => e.id === params.id)

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Expense Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/expenses')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Expenses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Card className="w-full max-w-md border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            {expense.description}
          </CardTitle>
          <CardDescription>Expense Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">Amount</span>
            <span className="text-green-400 font-semibold">${expense.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Category</span>
            <span>{expense.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              expense.status === 'Paid' ? 'bg-green-500/20 text-green-400' :
              expense.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {expense.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Due Date</span>
            <span>{expense.dueDate}</span>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => router.push('/expenses')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Expenses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 