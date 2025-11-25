"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Tag,
  Search,
  Filter,
  Download,
  Building2,
  TrendingDown,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MonthPicker } from "@/components/ui/month-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Organization {
  id: string
  name: string
  owner_id: string
}

interface Expense {
  id: string
  organization_id: string
  user_id: string
  description: string
  amount: string
  category: string
  status: string
  due_date: string | null
  created_at: string
  updated_at: string
  receipt_url: string | null
  notes: string | null
  payment_account: string | null
  is_recurring: boolean
  recurrence: string | null
  next_payment_date: string | null
  verified: boolean
}

interface Revenue {
  id: string
  organization_id: string
  user_id: string
  description: string
  amount: string
  category: string
  source: string | null
  payment_method: string | null
  received_date: string | null
  notes: string | null
  receipt_url: string | null
  verified: boolean
  created_at: string
  updated_at: string
}

interface BalanceSheetItem {
  id: string
  organization_id: string
  user_id: string
  item_type: "asset" | "liability"
  name: string
  category: string
  amount: string
  description: string | null
  date_acquired: string | null
  notes: string | null
  verified: boolean
  created_at: string
  updated_at: string
}

const EXPENSE_CATEGORIES = [
  "Office Supplies",
  "Software/Subscriptions",
  "Marketing/Advertising",
  "Travel",
  "Utilities",
  "Rent",
  "Salaries",
  "Contractors",
  "Equipment",
  "Legal/Professional Services",
  "Insurance",
  "Other",
]

const EXPENSE_STATUSES = ["Pending", "Approved", "Rejected", "Paid", "Unpaid", "Overdue"]

const REVENUE_CATEGORIES = [
  "Sales",
  "Services",
  "Consulting",
  "Investment",
  "Licensing",
  "Subscriptions",
  "Advertising",
  "Partnership",
  "Other",
]

const REVENUE_SOURCES = [
  "Client Payment",
  "Product Sales",
  "Service Revenue",
  "Investment Income",
  "Licensing Fee",
  "Subscription",
  "Advertising Revenue",
  "Partnership Revenue",
  "Other",
]

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Check",
  "Credit Card",
  "PayPal",
  "Stripe",
  "Wire Transfer",
  "Other",
]

const ASSET_CATEGORIES = [
  "Cash & Cash Equivalents",
  "Accounts Receivable",
  "Inventory",
  "Property, Plant & Equipment",
  "Intangible Assets",
  "Investments",
  "Other Assets",
]

const LIABILITY_CATEGORIES = [
  "Accounts Payable",
  "Short-term Debt",
  "Long-term Debt",
  "Accrued Expenses",
  "Taxes Payable",
  "Loans Payable",
  "Other Liabilities",
]

export default function ManageExpensesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [manualRevenue, setManualRevenue] = useState<Revenue[]>([])
  const [balanceSheetItems, setBalanceSheetItems] = useState<BalanceSheetItem[]>([])
  const [transactionRevenue, setTransactionRevenue] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [isAddRevenueDialogOpen, setIsAddRevenueDialogOpen] = useState(false)
  const [isEditRevenueDialogOpen, setIsEditRevenueDialogOpen] = useState(false)
  const [isAddBalanceSheetDialogOpen, setIsAddBalanceSheetDialogOpen] = useState(false)
  const [isEditBalanceSheetDialogOpen, setIsEditBalanceSheetDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null)
  const [editingBalanceSheetItem, setEditingBalanceSheetItem] = useState<BalanceSheetItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"expenses" | "revenue" | "balance-sheet">("expenses")
  
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    status: "Approved",
    due_date: "",
    receipt_url: "",
    notes: "",
    payment_account: "",
    is_recurring: false,
    recurrence: "One-time",
    next_payment_date: "",
    verified: false,
  })

  const [newRevenue, setNewRevenue] = useState({
    description: "",
    amount: "",
    category: "",
    source: "",
    payment_method: "",
    received_date: "",
    notes: "",
    receipt_url: "",
    verified: false,
  })

  const [newBalanceSheetItem, setNewBalanceSheetItem] = useState({
    item_type: "asset" as "asset" | "liability",
    name: "",
    category: "",
    amount: "",
    description: "",
    date_acquired: "",
    notes: "",
    verified: false,
  })

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizations()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (selectedOrg) {
      fetchExpenses()
      fetchTransactionRevenue()
      fetchManualRevenue()
      fetchBalanceSheetItems()
    }
  }, [selectedOrg, monthFilter])

  const fetchOrganizations = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("name")

      if (error) throw error
      setOrganizations(data || [])
      if (data && data.length > 0) {
        setSelectedOrg(data[0].id)
      }
    } catch (error: any) {
      console.error("Error fetching organizations:", error)
      toast.error("Failed to load organizations")
    }
  }

  const fetchExpenses = async () => {
    if (!selectedOrg) return

    try {
      setLoading(true)
      let query = supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false })

      // Apply month filter if selected
      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)
        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setExpenses(data || [])
    } catch (error: any) {
      console.error("Error fetching expenses:", error)
      toast.error("Failed to load expenses")
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactionRevenue = async () => {
    if (!selectedOrg) return

    try {
      // Get all projects for this organization
      const { data: orgProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", selectedOrg)

      const projectIds = orgProjects?.map((p) => p.id) || []

      if (projectIds.length === 0) {
        setTransactionRevenue(0)
        return
      }

      // Build date range for month filter
      let startDateStr: string | undefined
      let endDateStr: string | undefined

      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)
        startDateStr = startDate.toISOString()
        endDateStr = endDate.toISOString()
      }

      // Fetch revenue (transactions with positive amounts) for organization's projects
      let query = supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed")
        .in("project_id", projectIds)
        .gt("amount", 0)

      if (startDateStr && endDateStr) {
        query = query.gte("created_at", startDateStr).lt("created_at", endDateStr)
      }

      const { data: revenueData, error } = await query

      if (error) {
        console.error("Error fetching transaction revenue:", error)
        setTransactionRevenue(0)
        return
      }

      const totalRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      setTransactionRevenue(totalRevenue)
    } catch (error: any) {
      console.error("Error fetching transaction revenue:", error)
      setTransactionRevenue(0)
    }
  }

  const fetchManualRevenue = async () => {
    if (!selectedOrg) return

    try {
      let query = supabase
        .from("revenue")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false })

      // Apply month filter if selected
      if (monthFilter) {
        const [year, month] = monthFilter.split("-").map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)
        query = query
          .gte("created_at", startDate.toISOString())
          .lt("created_at", endDate.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      setManualRevenue(data || [])
    } catch (error: any) {
      console.error("Error fetching manual revenue:", error)
      toast.error("Failed to load revenue entries")
    }
  }

  const handleAddExpense = async () => {
    if (!selectedOrg || !user) {
      toast.error("Please select an organization")
      return
    }

    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const expenseData: any = {
        organization_id: selectedOrg,
        user_id: user.id,
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        status: newExpense.status,
        notes: newExpense.notes || null,
        receipt_url: newExpense.receipt_url || null,
        payment_account: newExpense.payment_account || null,
        is_recurring: newExpense.is_recurring,
        recurrence: newExpense.is_recurring ? newExpense.recurrence : null,
        next_payment_date: newExpense.is_recurring && newExpense.next_payment_date
          ? newExpense.next_payment_date
          : null,
        verified: newExpense.verified,
      }

      // Allow backdating by setting created_at if due_date is provided
      if (newExpense.due_date) {
        expenseData.due_date = newExpense.due_date
        // Set created_at to the due_date for historical expenses
        expenseData.created_at = newExpense.due_date
      }

      const { data, error } = await supabase
        .from("expenses")
        .insert([expenseData])
        .select()
        .single()

      if (error) throw error

      toast.success("Expense added successfully")
      setIsAddExpenseDialogOpen(false)
      resetNewExpense()
      fetchExpenses()
    } catch (error: any) {
      console.error("Error adding expense:", error)
      toast.error("Failed to add expense")
    }
  }

  const handleEditExpense = async () => {
    if (!editingExpense) return

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          description: editingExpense.description,
          amount: parseFloat(editingExpense.amount),
          category: editingExpense.category,
          status: editingExpense.status,
          notes: editingExpense.notes,
          receipt_url: editingExpense.receipt_url,
          payment_account: editingExpense.payment_account,
          is_recurring: editingExpense.is_recurring,
          recurrence: editingExpense.is_recurring ? editingExpense.recurrence : null,
          next_payment_date: editingExpense.is_recurring && editingExpense.next_payment_date
            ? editingExpense.next_payment_date
            : null,
          verified: editingExpense.verified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingExpense.id)

      if (error) throw error

      toast.success("Expense updated successfully")
      setIsEditExpenseDialogOpen(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (error: any) {
      console.error("Error updating expense:", error)
      toast.error("Failed to update expense")
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error

      toast.success("Expense deleted successfully")
      fetchExpenses()
    } catch (error: any) {
      console.error("Error deleting expense:", error)
      toast.error("Failed to delete expense")
    }
  }

  const resetNewExpense = () => {
    setNewExpense({
      description: "",
      amount: "",
      category: "",
      status: "Approved",
      due_date: "",
      receipt_url: "",
      notes: "",
      payment_account: "",
      is_recurring: false,
      recurrence: "One-time",
      next_payment_date: "",
      verified: false,
    })
  }

  const openEditExpenseDialog = (expense: Expense) => {
    setEditingExpense({ ...expense })
    setIsEditExpenseDialogOpen(true)
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Paid: "bg-green-500/20 text-green-400",
      Approved: "bg-blue-500/20 text-blue-400",
      Pending: "bg-yellow-500/20 text-yellow-400",
      Rejected: "bg-red-500/20 text-red-400",
      Unpaid: "bg-orange-500/20 text-orange-400",
      Overdue: "bg-red-500/20 text-red-400",
    }
    return colors[status] || "bg-gray-500/20 text-gray-400"
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const totalExpenses = filteredExpenses.reduce(
    (sum, exp) => sum + parseFloat(exp.amount),
    0
  )
  const paidExpenses = filteredExpenses
    .filter((exp) => exp.status === "Paid")
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

  // Calculate financial metrics
  const manualRevenueTotal = manualRevenue.reduce(
    (sum, rev) => sum + parseFloat(rev.amount),
    0
  )
  const grossRevenue = transactionRevenue + manualRevenueTotal
  const netProfit = grossRevenue - totalExpenses
  const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : null

  // Revenue management functions
  const handleAddRevenue = async () => {
    if (!selectedOrg || !user) {
      toast.error("Please select an organization")
      return
    }

    if (!newRevenue.description || !newRevenue.amount || !newRevenue.category) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const revenueData: any = {
        organization_id: selectedOrg,
        user_id: user.id,
        description: newRevenue.description,
        amount: parseFloat(newRevenue.amount),
        category: newRevenue.category,
        source: newRevenue.source || null,
        payment_method: newRevenue.payment_method || null,
        notes: newRevenue.notes || null,
        receipt_url: newRevenue.receipt_url || null,
        verified: newRevenue.verified,
      }

      // Allow backdating by setting received_date and created_at
      if (newRevenue.received_date) {
        revenueData.received_date = newRevenue.received_date
        revenueData.created_at = newRevenue.received_date
      }

      const { data, error } = await supabase
        .from("revenue")
        .insert([revenueData])
        .select()
        .single()

      if (error) throw error

      toast.success("Revenue entry added successfully")
      setIsAddRevenueDialogOpen(false)
      resetNewRevenue()
      fetchManualRevenue()
      fetchTransactionRevenue()
    } catch (error: any) {
      console.error("Error adding revenue:", error)
      toast.error("Failed to add revenue entry")
    }
  }

  const handleEditRevenue = async () => {
    if (!editingRevenue) return

    try {
      const { error } = await supabase
        .from("revenue")
        .update({
          description: editingRevenue.description,
          amount: parseFloat(editingRevenue.amount),
          category: editingRevenue.category,
          source: editingRevenue.source,
          payment_method: editingRevenue.payment_method,
          received_date: editingRevenue.received_date,
          notes: editingRevenue.notes,
          receipt_url: editingRevenue.receipt_url,
          verified: editingRevenue.verified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingRevenue.id)

      if (error) throw error

      toast.success("Revenue entry updated successfully")
      setIsEditRevenueDialogOpen(false)
      setEditingRevenue(null)
      fetchManualRevenue()
      fetchTransactionRevenue()
    } catch (error: any) {
      console.error("Error updating revenue:", error)
      toast.error("Failed to update revenue entry")
    }
  }

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this revenue entry?")) return

    try {
      const { error } = await supabase.from("revenue").delete().eq("id", id)

      if (error) throw error

      toast.success("Revenue entry deleted successfully")
      fetchManualRevenue()
      fetchTransactionRevenue()
    } catch (error: any) {
      console.error("Error deleting revenue:", error)
      toast.error("Failed to delete revenue entry")
    }
  }

  const resetNewRevenue = () => {
    setNewRevenue({
      description: "",
      amount: "",
      category: "",
      source: "",
      payment_method: "",
      received_date: "",
      notes: "",
      receipt_url: "",
      verified: false,
    })
  }

  const openEditRevenueDialog = (revenue: Revenue) => {
    setEditingRevenue({ ...revenue })
    setIsEditRevenueDialogOpen(true)
  }

  const fetchBalanceSheetItems = async () => {
    if (!selectedOrg) return

    try {
      const { data, error } = await supabase
        .from("balance_sheet_items")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBalanceSheetItems(data || [])
    } catch (error: any) {
      console.error("Error fetching balance sheet items:", error)
      toast.error("Failed to load balance sheet items")
    }
  }

  const handleAddBalanceSheetItem = async () => {
    if (!selectedOrg || !user) {
      toast.error("Please select an organization")
      return
    }

    if (!newBalanceSheetItem.name || !newBalanceSheetItem.amount || !newBalanceSheetItem.category) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const itemData: any = {
        organization_id: selectedOrg,
        user_id: user.id,
        item_type: newBalanceSheetItem.item_type,
        name: newBalanceSheetItem.name,
        category: newBalanceSheetItem.category,
        amount: parseFloat(newBalanceSheetItem.amount),
        description: newBalanceSheetItem.description || null,
        date_acquired: newBalanceSheetItem.date_acquired || null,
        notes: newBalanceSheetItem.notes || null,
        verified: newBalanceSheetItem.verified,
      }

      const { data, error } = await supabase
        .from("balance_sheet_items")
        .insert([itemData])
        .select()
        .single()

      if (error) throw error

      toast.success(`${newBalanceSheetItem.item_type === "asset" ? "Asset" : "Liability"} added successfully`)
      setIsAddBalanceSheetDialogOpen(false)
      resetNewBalanceSheetItem()
      fetchBalanceSheetItems()
    } catch (error: any) {
      console.error("Error adding balance sheet item:", error)
      toast.error("Failed to add balance sheet item")
    }
  }

  const handleEditBalanceSheetItem = async () => {
    if (!editingBalanceSheetItem) return

    try {
      const { error } = await supabase
        .from("balance_sheet_items")
        .update({
          item_type: editingBalanceSheetItem.item_type,
          name: editingBalanceSheetItem.name,
          category: editingBalanceSheetItem.category,
          amount: parseFloat(editingBalanceSheetItem.amount),
          description: editingBalanceSheetItem.description,
          date_acquired: editingBalanceSheetItem.date_acquired,
          notes: editingBalanceSheetItem.notes,
          verified: editingBalanceSheetItem.verified,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingBalanceSheetItem.id)

      if (error) throw error

      toast.success("Balance sheet item updated successfully")
      setIsEditBalanceSheetDialogOpen(false)
      setEditingBalanceSheetItem(null)
      fetchBalanceSheetItems()
    } catch (error: any) {
      console.error("Error updating balance sheet item:", error)
      toast.error("Failed to update balance sheet item")
    }
  }

  const handleDeleteBalanceSheetItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this balance sheet item?")) return

    try {
      const { error } = await supabase.from("balance_sheet_items").delete().eq("id", id)

      if (error) throw error

      toast.success("Balance sheet item deleted successfully")
      fetchBalanceSheetItems()
    } catch (error: any) {
      console.error("Error deleting balance sheet item:", error)
      toast.error("Failed to delete balance sheet item")
    }
  }

  const resetNewBalanceSheetItem = () => {
    setNewBalanceSheetItem({
      item_type: "asset",
      name: "",
      category: "",
      amount: "",
      description: "",
      date_acquired: "",
      notes: "",
      verified: false,
    })
  }

  const openEditBalanceSheetDialog = (item: BalanceSheetItem) => {
    setEditingBalanceSheetItem({ ...item })
    setIsEditBalanceSheetDialogOpen(true)
  }

  // Calculate balance sheet totals
  const assets = balanceSheetItems.filter((item) => item.item_type === "asset")
  const liabilities = balanceSheetItems.filter((item) => item.item_type === "liability")
  const totalAssets = assets.reduce((sum, item) => sum + parseFloat(item.amount), 0)
  const totalLiabilities = liabilities.reduce((sum, item) => sum + parseFloat(item.amount), 0)
  const equity = totalAssets - totalLiabilities

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl">
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Organizations</h3>
              <p className="text-gray-400">
                You don't own any organizations. Create an organization first to manage expenses.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-block mb-3">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              Manage Expenses & Revenue
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-300 mt-3">Track and manage expenses and revenue for your organization</p>
        </div>

        {/* Organization Selector */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-white font-bold flex items-center gap-3">
              <Building2 className="w-5 h-5 text-purple-400" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedOrg || ""} onValueChange={setSelectedOrg}>
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white h-12">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} className="text-white">
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedOrg && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Gross Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(grossRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(transactionRevenue)} from transactions + {formatCurrency(manualRevenueTotal)} manual
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">
                    {formatCurrency(totalExpenses)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatCurrency(netProfit)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    ROI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-400">
                    {roi !== null ? `${roi.toFixed(2)}%` : "N/A"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {roi !== null ? "Return on Investment" : "No expenses to calculate"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Expense Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Paid Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(paidExpenses)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Expenses with "Paid" status</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Pending Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(
                      filteredExpenses
                        .filter((exp) => exp.status === "Pending" || exp.status === "Approved")
                        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Not yet paid</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Expenses, Revenue, and Balance Sheet */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expenses" | "revenue" | "balance-sheet")} className="space-y-6">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
              </TabsList>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-6">
                {/* Filters and Actions */}
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex flex-wrap gap-4 flex-1">
                        <div className="flex-1 min-w-[200px]">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                              placeholder="Search expenses..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 bg-gray-900 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[150px] bg-gray-900 border-gray-700 text-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="all">All Status</SelectItem>
                            {EXPENSE_STATUSES.map((status) => (
                              <SelectItem key={status} value={status} className="text-white">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="all">All Categories</SelectItem>
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-white">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="w-[200px]">
                          <MonthPicker
                            value={monthFilter}
                            onValueChange={setMonthFilter}
                            placeholder="Filter by month"
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gradient-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Expense
                          </Button>
                        </DialogTrigger>
                    <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add New Expense</DialogTitle>
                        <DialogDescription className="text-gray-300">
                          Add a new expense. You can backdate expenses by setting the date.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label className="text-white">Description *</Label>
                          <Input
                            value={newExpense.description}
                            onChange={(e) =>
                              setNewExpense({ ...newExpense, description: e.target.value })
                            }
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="Expense description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Amount *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newExpense.amount}
                              onChange={(e) =>
                                setNewExpense({ ...newExpense, amount: e.target.value })
                              }
                              className="bg-gray-900 border-gray-700 text-white mt-2"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Category *</Label>
                            <Select
                              value={newExpense.category}
                              onValueChange={(value) =>
                                setNewExpense({ ...newExpense, category: value })
                              }
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {EXPENSE_CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat} className="text-white">
                                    {cat}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Status</Label>
                            <Select
                              value={newExpense.status}
                              onValueChange={(value) =>
                                setNewExpense({ ...newExpense, status: value })
                              }
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {EXPENSE_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status} className="text-white">
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-white">Date (for backdating)</Label>
                            <Input
                              type="date"
                              value={newExpense.due_date}
                              onChange={(e) =>
                                setNewExpense({ ...newExpense, due_date: e.target.value })
                              }
                              className="bg-gray-900 border-gray-700 text-white mt-2"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-white">Payment Account</Label>
                          <Input
                            value={newExpense.payment_account}
                            onChange={(e) =>
                              setNewExpense({ ...newExpense, payment_account: e.target.value })
                            }
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="Bank account, card, etc."
                          />
                        </div>
                        <div>
                          <Label className="text-white">Receipt URL</Label>
                          <Input
                            value={newExpense.receipt_url}
                            onChange={(e) =>
                              setNewExpense({ ...newExpense, receipt_url: e.target.value })
                            }
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label className="text-white">Notes</Label>
                          <Textarea
                            value={newExpense.notes}
                            onChange={(e) =>
                              setNewExpense({ ...newExpense, notes: e.target.value })
                            }
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="Additional notes..."
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newExpense.is_recurring}
                              onChange={(e) =>
                                setNewExpense({ ...newExpense, is_recurring: e.target.checked })
                              }
                              className="w-4 h-4"
                            />
                            <Label className="text-white">Recurring Expense</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newExpense.verified}
                              onChange={(e) =>
                                setNewExpense({ ...newExpense, verified: e.target.checked })
                              }
                              className="w-4 h-4"
                            />
                            <Label className="text-white">Verified</Label>
                          </div>
                        </div>
                        {newExpense.is_recurring && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-white">Recurrence</Label>
                              <Select
                                value={newExpense.recurrence}
                                onValueChange={(value) =>
                                  setNewExpense({ ...newExpense, recurrence: value })
                                }
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="One-time" className="text-white">
                                    One-time
                                  </SelectItem>
                                  <SelectItem value="Monthly" className="text-white">
                                    Monthly
                                  </SelectItem>
                                  <SelectItem value="Quarterly" className="text-white">
                                    Quarterly
                                  </SelectItem>
                                  <SelectItem value="Yearly" className="text-white">
                                    Yearly
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Next Payment Date</Label>
                              <Input
                                type="date"
                                value={newExpense.next_payment_date}
                                onChange={(e) =>
                                  setNewExpense({
                                    ...newExpense,
                                    next_payment_date: e.target.value,
                                  })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsAddExpenseDialogOpen(false)
                            resetNewExpense()
                          }}
                          className="border-black"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddExpense} className="gradient-button">
                          Add Expense
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Expenses Table */}
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold">Expense History</CardTitle>
                <CardDescription className="text-gray-400">
                  {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingDown className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No expenses found</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Add an expense to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-white">Date</TableHead>
                          <TableHead className="text-white">Description</TableHead>
                          <TableHead className="text-white">Category</TableHead>
                          <TableHead className="text-white">Amount</TableHead>
                          <TableHead className="text-white">Status</TableHead>
                          <TableHead className="text-white">Payment Account</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExpenses.map((expense) => (
                          <TableRow key={expense.id} className="border-gray-700">
                            <TableCell className="text-gray-300">
                              {formatDate(expense.created_at)}
                            </TableCell>
                            <TableCell className="text-white font-medium">
                              {expense.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-gray-300">
                                {expense.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-red-400 font-bold">
                              {formatCurrency(expense.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(expense.status)}>
                                {expense.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {expense.payment_account || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openEditExpenseDialog(expense)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
              </TabsContent>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                {/* Revenue Filters and Actions */}
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex flex-wrap gap-4 flex-1">
                        <div className="w-[200px]">
                          <MonthPicker
                            value={monthFilter}
                            onValueChange={setMonthFilter}
                            placeholder="Filter by month"
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      </div>
                      <Dialog open={isAddRevenueDialogOpen} onOpenChange={setIsAddRevenueDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gradient-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Revenue
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add New Revenue Entry</DialogTitle>
                            <DialogDescription className="text-gray-300">
                              Add a manual revenue entry. You can backdate by setting the received date.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label className="text-white">Description *</Label>
                              <Input
                                value={newRevenue.description}
                                onChange={(e) =>
                                  setNewRevenue({ ...newRevenue, description: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="Revenue description"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white">Amount *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={newRevenue.amount}
                                  onChange={(e) =>
                                    setNewRevenue({ ...newRevenue, amount: e.target.value })
                                  }
                                  className="bg-gray-900 border-gray-700 text-white mt-2"
                                  placeholder="0.00"
                                />
                              </div>
                              <div>
                                <Label className="text-white">Category *</Label>
                                <Select
                                  value={newRevenue.category}
                                  onValueChange={(value) =>
                                    setNewRevenue({ ...newRevenue, category: value })
                                  }
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    {REVENUE_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat} value={cat} className="text-white">
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white">Source</Label>
                                <Select
                                  value={newRevenue.source}
                                  onValueChange={(value) =>
                                    setNewRevenue({ ...newRevenue, source: value })
                                  }
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                    <SelectValue placeholder="Select source" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    {REVENUE_SOURCES.map((source) => (
                                      <SelectItem key={source} value={source} className="text-white">
                                        {source}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-white">Payment Method</Label>
                                <Select
                                  value={newRevenue.payment_method}
                                  onValueChange={(value) =>
                                    setNewRevenue({ ...newRevenue, payment_method: value })
                                  }
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                    <SelectValue placeholder="Select method" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    {PAYMENT_METHODS.map((method) => (
                                      <SelectItem key={method} value={method} className="text-white">
                                        {method}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label className="text-white">Received Date (for backdating)</Label>
                              <Input
                                type="date"
                                value={newRevenue.received_date}
                                onChange={(e) =>
                                  setNewRevenue({ ...newRevenue, received_date: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-white">Receipt URL</Label>
                              <Input
                                value={newRevenue.receipt_url}
                                onChange={(e) =>
                                  setNewRevenue({ ...newRevenue, receipt_url: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="https://..."
                              />
                            </div>
                            <div>
                              <Label className="text-white">Notes</Label>
                              <Textarea
                                value={newRevenue.notes}
                                onChange={(e) =>
                                  setNewRevenue({ ...newRevenue, notes: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="Additional notes..."
                                rows={3}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newRevenue.verified}
                                onChange={(e) =>
                                  setNewRevenue({ ...newRevenue, verified: e.target.checked })
                                }
                                className="w-4 h-4"
                              />
                              <Label className="text-white">Verified</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddRevenueDialogOpen(false)
                                resetNewRevenue()
                              }}
                              className="border-black"
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddRevenue} className="gradient-button">
                              Add Revenue
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Table */}
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white font-bold">Revenue History</CardTitle>
                    <CardDescription className="text-gray-400">
                      {manualRevenue.length} manual revenue entr{manualRevenue.length !== 1 ? "ies" : "y"} found
                      {transactionRevenue > 0 && (
                        <span className="ml-2">
                          + {formatCurrency(transactionRevenue)} from transactions
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {manualRevenue.length === 0 ? (
                      <div className="text-center py-12">
                        <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No manual revenue entries found</p>
                        <p className="text-gray-500 text-sm mt-1">
                          Add a revenue entry to get started
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-700">
                              <TableHead className="text-white">Date</TableHead>
                              <TableHead className="text-white">Description</TableHead>
                              <TableHead className="text-white">Category</TableHead>
                              <TableHead className="text-white">Source</TableHead>
                              <TableHead className="text-white">Amount</TableHead>
                              <TableHead className="text-white">Payment Method</TableHead>
                              <TableHead className="text-white">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {manualRevenue.map((rev) => (
                              <TableRow key={rev.id} className="border-gray-700">
                                <TableCell className="text-gray-300">
                                  {formatDate(rev.received_date || rev.created_at)}
                                </TableCell>
                                <TableCell className="text-white font-medium">
                                  {rev.description}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-gray-300">
                                    {rev.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-400">
                                  {rev.source || "N/A"}
                                </TableCell>
                                <TableCell className="text-green-400 font-bold">
                                  {formatCurrency(rev.amount)}
                                </TableCell>
                                <TableCell className="text-gray-400">
                                  {rev.payment_method || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => openEditRevenueDialog(rev)}
                                      className="text-blue-400 hover:text-blue-300"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteRevenue(rev.id)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Balance Sheet Tab */}
              <TabsContent value="balance-sheet" className="space-y-6">
                {/* Balance Sheet Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-[#141414] border border-black">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Total Assets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(totalAssets)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{assets.length} asset{assets.length !== 1 ? "s" : ""}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#141414] border border-black">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" />
                        Total Liabilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-400">
                        {formatCurrency(totalLiabilities)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{liabilities.length} liabilit{liabilities.length !== 1 ? "ies" : "y"}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#141414] border border-black">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Equity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${equity >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {formatCurrency(equity)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Assets - Liabilities</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Balance Sheet Actions */}
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
                  <CardContent className="pt-6">
                    <div className="flex justify-end">
                      <Dialog open={isAddBalanceSheetDialogOpen} onOpenChange={setIsAddBalanceSheetDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gradient-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white">Add Balance Sheet Item</DialogTitle>
                            <DialogDescription className="text-gray-300">
                              Add an asset or liability to your balance sheet.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label className="text-white">Type *</Label>
                              <Select
                                value={newBalanceSheetItem.item_type}
                                onValueChange={(value) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, item_type: value as "asset" | "liability" })
                                }
                              >
                                <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                  <SelectItem value="asset" className="text-white">Asset</SelectItem>
                                  <SelectItem value="liability" className="text-white">Liability</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white">Name *</Label>
                              <Input
                                value={newBalanceSheetItem.name}
                                onChange={(e) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, name: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="Item name"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white">Category *</Label>
                                <Select
                                  value={newBalanceSheetItem.category}
                                  onValueChange={(value) =>
                                    setNewBalanceSheetItem({ ...newBalanceSheetItem, category: value })
                                  }
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    {(newBalanceSheetItem.item_type === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES).map((cat) => (
                                      <SelectItem key={cat} value={cat} className="text-white">
                                        {cat}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-white">Amount *</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={newBalanceSheetItem.amount}
                                  onChange={(e) =>
                                    setNewBalanceSheetItem({ ...newBalanceSheetItem, amount: e.target.value })
                                  }
                                  className="bg-gray-900 border-gray-700 text-white mt-2"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-white">Date Acquired</Label>
                              <Input
                                type="date"
                                value={newBalanceSheetItem.date_acquired}
                                onChange={(e) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, date_acquired: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-white">Description</Label>
                              <Textarea
                                value={newBalanceSheetItem.description}
                                onChange={(e) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, description: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="Item description..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label className="text-white">Notes</Label>
                              <Textarea
                                value={newBalanceSheetItem.notes}
                                onChange={(e) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, notes: e.target.value })
                                }
                                className="bg-gray-900 border-gray-700 text-white mt-2"
                                placeholder="Additional notes..."
                                rows={2}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newBalanceSheetItem.verified}
                                onChange={(e) =>
                                  setNewBalanceSheetItem({ ...newBalanceSheetItem, verified: e.target.checked })
                                }
                                className="w-4 h-4"
                              />
                              <Label className="text-white">Verified</Label>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAddBalanceSheetDialogOpen(false)
                                resetNewBalanceSheetItem()
                              }}
                              className="border-black"
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleAddBalanceSheetItem} className="gradient-button">
                              Add Item
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Balance Sheet Display */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assets */}
                  <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-green-500/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white font-bold">Assets</CardTitle>
                      <CardDescription className="text-gray-400">
                        Total: {formatCurrency(totalAssets)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assets.length === 0 ? (
                        <div className="text-center py-8">
                          <TrendingUp className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No assets recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {assets.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-medium">{item.name}</p>
                                  <Badge variant="outline" className="text-xs text-gray-400">
                                    {item.category}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-green-400 font-bold">{formatCurrency(item.amount)}</span>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditBalanceSheetDialog(item)}
                                    className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteBalanceSheetItem(item.id)}
                                    className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Liabilities */}
                  <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-red-500/20 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl text-white font-bold">Liabilities</CardTitle>
                      <CardDescription className="text-gray-400">
                        Total: {formatCurrency(totalLiabilities)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {liabilities.length === 0 ? (
                        <div className="text-center py-8">
                          <TrendingDown className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No liabilities recorded</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {liabilities.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-medium">{item.name}</p>
                                  <Badge variant="outline" className="text-xs text-gray-400">
                                    {item.category}
                                  </Badge>
                                </div>
                                {item.description && (
                                  <p className="text-gray-500 text-xs mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-red-400 font-bold">{formatCurrency(item.amount)}</span>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditBalanceSheetDialog(item)}
                                    className="text-blue-400 hover:text-blue-300 h-7 w-7 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteBalanceSheetItem(item.id)}
                                    className="text-red-400 hover:text-red-300 h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Edit Expense Dialog */}
        <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
          <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Expense</DialogTitle>
              <DialogDescription className="text-gray-300">
                Update expense details
              </DialogDescription>
            </DialogHeader>
            {editingExpense && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Description *</Label>
                  <Input
                    value={editingExpense.description}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, description: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingExpense.amount}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, amount: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Category *</Label>
                    <Select
                      value={editingExpense.category}
                      onValueChange={(value) =>
                        setEditingExpense({ ...editingExpense, category: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Status</Label>
                  <Select
                    value={editingExpense.status}
                    onValueChange={(value) =>
                      setEditingExpense({ ...editingExpense, status: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {EXPENSE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="text-white">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Notes</Label>
                  <Textarea
                    value={editingExpense.notes || ""}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, notes: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingExpense.is_recurring}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, is_recurring: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <Label className="text-white">Recurring Expense</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingExpense.verified}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, verified: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <Label className="text-white">Verified</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditExpenseDialogOpen(false)
                  setEditingExpense(null)
                }}
                className="border-black"
              >
                Cancel
              </Button>
              <Button onClick={handleEditExpense} className="gradient-button">
                Update Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Revenue Dialog */}
        <Dialog open={isEditRevenueDialogOpen} onOpenChange={setIsEditRevenueDialogOpen}>
          <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Revenue Entry</DialogTitle>
              <DialogDescription className="text-gray-300">
                Update revenue entry details
              </DialogDescription>
            </DialogHeader>
            {editingRevenue && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Description *</Label>
                  <Input
                    value={editingRevenue.description}
                    onChange={(e) =>
                      setEditingRevenue({ ...editingRevenue, description: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingRevenue.amount}
                      onChange={(e) =>
                        setEditingRevenue({ ...editingRevenue, amount: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Category *</Label>
                    <Select
                      value={editingRevenue.category}
                      onValueChange={(value) =>
                        setEditingRevenue({ ...editingRevenue, category: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {REVENUE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Source</Label>
                    <Select
                      value={editingRevenue.source || ""}
                      onValueChange={(value) =>
                        setEditingRevenue({ ...editingRevenue, source: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {REVENUE_SOURCES.map((source) => (
                          <SelectItem key={source} value={source} className="text-white">
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Payment Method</Label>
                    <Select
                      value={editingRevenue.payment_method || ""}
                      onValueChange={(value) =>
                        setEditingRevenue({ ...editingRevenue, payment_method: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method} className="text-white">
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-white">Received Date</Label>
                  <Input
                    type="date"
                    value={editingRevenue.received_date || ""}
                    onChange={(e) =>
                      setEditingRevenue({ ...editingRevenue, received_date: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-white">Notes</Label>
                  <Textarea
                    value={editingRevenue.notes || ""}
                    onChange={(e) =>
                      setEditingRevenue({ ...editingRevenue, notes: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingRevenue.verified}
                    onChange={(e) =>
                      setEditingRevenue({ ...editingRevenue, verified: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Verified</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditRevenueDialogOpen(false)
                  setEditingRevenue(null)
                }}
                className="border-black"
              >
                Cancel
              </Button>
              <Button onClick={handleEditRevenue} className="gradient-button">
                Update Revenue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Balance Sheet Dialog */}
        <Dialog open={isEditBalanceSheetDialogOpen} onOpenChange={setIsEditBalanceSheetDialogOpen}>
          <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Balance Sheet Item</DialogTitle>
              <DialogDescription className="text-gray-300">
                Update balance sheet item details
              </DialogDescription>
            </DialogHeader>
            {editingBalanceSheetItem && (
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Type *</Label>
                  <Select
                    value={editingBalanceSheetItem.item_type}
                    onValueChange={(value) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, item_type: value as "asset" | "liability" })
                    }
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="asset" className="text-white">Asset</SelectItem>
                      <SelectItem value="liability" className="text-white">Liability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Name *</Label>
                  <Input
                    value={editingBalanceSheetItem.name}
                    onChange={(e) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, name: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Category *</Label>
                    <Select
                      value={editingBalanceSheetItem.category}
                      onValueChange={(value) =>
                        setEditingBalanceSheetItem({ ...editingBalanceSheetItem, category: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {(editingBalanceSheetItem.item_type === "asset" ? ASSET_CATEGORIES : LIABILITY_CATEGORIES).map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-white">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Amount *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingBalanceSheetItem.amount}
                      onChange={(e) =>
                        setEditingBalanceSheetItem({ ...editingBalanceSheetItem, amount: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Date Acquired</Label>
                  <Input
                    type="date"
                    value={editingBalanceSheetItem.date_acquired || ""}
                    onChange={(e) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, date_acquired: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={editingBalanceSheetItem.description || ""}
                    onChange={(e) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, description: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-white">Notes</Label>
                  <Textarea
                    value={editingBalanceSheetItem.notes || ""}
                    onChange={(e) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, notes: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingBalanceSheetItem.verified}
                    onChange={(e) =>
                      setEditingBalanceSheetItem({ ...editingBalanceSheetItem, verified: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label className="text-white">Verified</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditBalanceSheetDialogOpen(false)
                  setEditingBalanceSheetItem(null)
                }}
                className="border-black"
              >
                Cancel
              </Button>
              <Button onClick={handleEditBalanceSheetItem} className="gradient-button">
                Update Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

