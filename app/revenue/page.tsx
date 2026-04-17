"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { Building2, Edit, Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { MonthPicker } from "@/components/ui/month-picker"
import { REVENUE_CATEGORIES, REVENUE_SOURCES, PAYMENT_METHODS } from "@/lib/revenue-constants"
import { type PeriodMode, formatPeriodHint, getPeriodBounds } from "@/lib/period-bounds"

interface Organization {
  id: string
  name: string
  owner_id: string
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

function formatCurrency(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num)
}

function formatDate(dateString: string | null) {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function RevenuePage() {
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [manualRevenue, setManualRevenue] = useState<Revenue[]>([])
  const [transactionRevenue, setTransactionRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [monthFilter, setMonthFilter] = useState("")
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month")
  const [fullCalendarYear, setFullCalendarYear] = useState(() => new Date().getFullYear())
  const [isAddRevenueDialogOpen, setIsAddRevenueDialogOpen] = useState(false)
  const [isEditRevenueDialogOpen, setIsEditRevenueDialogOpen] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null)

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

  useEffect(() => {
    if (user && !authLoading) {
      void fetchOrganizations()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (selectedOrg) {
      void fetchTransactionRevenue()
      void fetchManualRevenue()
    }
  }, [selectedOrg, monthFilter, periodMode, fullCalendarYear])

  const fetchOrganizations = async () => {
    if (!user?.id) return
    setOrgsLoading(true)
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .order("name")
      if (error) throw error
      setOrganizations(data || [])
      if (data && data.length > 0) setSelectedOrg(data[0].id)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load organizations")
    } finally {
      setOrgsLoading(false)
    }
  }

  const fetchTransactionRevenue = async () => {
    if (!selectedOrg) return
    try {
      const { data: orgProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", selectedOrg)
      const projectIds = orgProjects?.map((p) => p.id) || []
      if (projectIds.length === 0) {
        setTransactionRevenue(0)
        return
      }
      const bounds = getPeriodBounds(periodMode, monthFilter, fullCalendarYear)
      let query = supabase
        .from("transactions")
        .select("amount")
        .eq("status", "completed")
        .in("project_id", projectIds)
        .gt("amount", 0)
      if (bounds) {
        query = query.gte("created_at", bounds.start).lt("created_at", bounds.end)
      }
      const { data: revenueData, error } = await query
      if (error) {
        console.error(error)
        setTransactionRevenue(0)
        return
      }
      const total = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      setTransactionRevenue(total)
    } catch (e) {
      console.error(e)
      setTransactionRevenue(0)
    }
  }

  const fetchManualRevenue = async () => {
    if (!selectedOrg) return
    try {
      setLoading(true)
      let query = supabase
        .from("revenue")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false })
      const bounds = getPeriodBounds(periodMode, monthFilter, fullCalendarYear)
      if (bounds) {
        query = query.gte("created_at", bounds.start).lt("created_at", bounds.end)
      }
      const { data, error } = await query
      if (error) throw error
      setManualRevenue((data as Revenue[]) || [])
    } catch (e) {
      console.error(e)
      toast.error("Failed to load revenue entries")
    } finally {
      setLoading(false)
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
      const revenueData: Record<string, unknown> = {
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
      if (newRevenue.received_date) {
        revenueData.received_date = newRevenue.received_date
        revenueData.created_at = newRevenue.received_date
      }
      const { error } = await supabase.from("revenue").insert([revenueData])
      if (error) throw error
      toast.success("Revenue entry added successfully")
      setIsAddRevenueDialogOpen(false)
      resetNewRevenue()
      await fetchManualRevenue()
      await fetchTransactionRevenue()
    } catch (e) {
      console.error(e)
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
      await fetchManualRevenue()
      await fetchTransactionRevenue()
    } catch (e) {
      console.error(e)
      toast.error("Failed to update revenue entry")
    }
  }

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm("Are you sure you want to delete this revenue entry?")) return
    try {
      const { error } = await supabase.from("revenue").delete().eq("id", id)
      if (error) throw error
      toast.success("Revenue entry deleted successfully")
      await fetchManualRevenue()
      await fetchTransactionRevenue()
    } catch (e) {
      console.error(e)
      toast.error("Failed to delete revenue entry")
    }
  }

  const manualRevenueTotal = manualRevenue.reduce((sum, rev) => sum + parseFloat(rev.amount), 0)
  const grossRevenue = transactionRevenue + manualRevenueTotal

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Sign in to manage revenue.
      </div>
    )
  }

  if (authLoading || (user && orgsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
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
                You don&apos;t own any organizations. Create an organization first to record revenue.
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
        <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              Revenue
            </h1>
            <p className="text-gray-300 mt-1">
              Manual entries and transaction totals for your organization
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="shrink-0 border-purple-500/40 bg-gray-900/50 text-white hover:bg-purple-950/50 hover:text-white mx-auto md:mx-0"
          >
            <Link href="/manage-expenses" className="inline-flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" />
              Expenses
            </Link>
          </Button>
        </div>

        <Card className="mb-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl text-white font-bold flex items-center gap-3">
              <Building2 className="w-5 h-5 text-purple-400" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedOrg || ""} onValueChange={setSelectedOrg}>
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white h-12 max-w-md">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Gross revenue (this view)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">{formatCurrency(grossRevenue)}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPeriodHint(periodMode, monthFilter, fullCalendarYear)}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {formatCurrency(transactionRevenue)} transactions + {formatCurrency(manualRevenueTotal)} manual
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Transaction revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(transactionRevenue)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Completed positive transactions on org projects</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border border-black">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Manual entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-400">{formatCurrency(manualRevenueTotal)}</div>
                  <p className="text-xs text-gray-500 mt-1">{manualRevenue.length} line(s)</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  {/* One row for labels + controls + primary action so helpers don’t push the button down */}
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:items-end sm:justify-between">
                    <div className="flex flex-wrap gap-4 items-end flex-1 min-w-0">
                      <div className="space-y-2 w-full sm:w-[220px]">
                        <Label className="text-gray-300">Period</Label>
                        <Select
                          value={periodMode}
                          onValueChange={(v) => setPeriodMode(v as PeriodMode)}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="month" className="text-white">
                              Single month
                            </SelectItem>
                            <SelectItem value="ytd" className="text-white">
                              Year to date
                            </SelectItem>
                            <SelectItem value="full_year" className="text-white">
                              Full calendar year
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {periodMode === "month" && (
                        <div className="space-y-2 w-full sm:w-[220px]">
                          <Label className="text-gray-300">Month</Label>
                          <MonthPicker
                            value={monthFilter}
                            onValueChange={setMonthFilter}
                            placeholder="Pick a month (optional)"
                            className="bg-gray-900 border-gray-700 text-white"
                          />
                        </div>
                      )}
                      {periodMode === "full_year" && (
                        <div className="space-y-2 w-full sm:w-[140px]">
                          <Label className="text-gray-300">Year</Label>
                          <Select
                            value={String(fullCalendarYear)}
                            onValueChange={(v) => setFullCalendarYear(parseInt(v, 10))}
                          >
                            <SelectTrigger className="bg-gray-900 border-gray-700 text-white h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                              {Array.from({ length: 16 }, (_, i) => {
                                const y = new Date().getFullYear() - 10 + i
                                return (
                                  <SelectItem key={y} value={String(y)} className="text-white">
                                    {y}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 shrink-0 w-full sm:w-auto">
                      <Label className="text-transparent select-none pointer-events-none" aria-hidden>
                        Action
                      </Label>
                      <Dialog open={isAddRevenueDialogOpen} onOpenChange={setIsAddRevenueDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-button h-11 w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        Add revenue
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Add revenue entry</DialogTitle>
                        <DialogDescription className="text-gray-300">
                          Add a manual revenue row. You can backdate using the received date.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label className="text-white">Description *</Label>
                          <Input
                            value={newRevenue.description}
                            onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="Description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Amount *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newRevenue.amount}
                              onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                              className="bg-gray-900 border-gray-700 text-white mt-2"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Category *</Label>
                            <Select
                              value={newRevenue.category}
                              onValueChange={(value) => setNewRevenue({ ...newRevenue, category: value })}
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                <SelectValue placeholder="Category" />
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
                              onValueChange={(value) => setNewRevenue({ ...newRevenue, source: value })}
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                <SelectValue placeholder="Source" />
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
                            <Label className="text-white">Payment method</Label>
                            <Select
                              value={newRevenue.payment_method}
                              onValueChange={(value) =>
                                setNewRevenue({ ...newRevenue, payment_method: value })
                              }
                            >
                              <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                                <SelectValue placeholder="Method" />
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
                          <Label className="text-white">Received date (backdating)</Label>
                          <Input
                            type="date"
                            value={newRevenue.received_date}
                            onChange={(e) => setNewRevenue({ ...newRevenue, received_date: e.target.value })}
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-white">Receipt URL</Label>
                          <Input
                            value={newRevenue.receipt_url}
                            onChange={(e) => setNewRevenue({ ...newRevenue, receipt_url: e.target.value })}
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <Label className="text-white">Notes</Label>
                          <Textarea
                            value={newRevenue.notes}
                            onChange={(e) => setNewRevenue({ ...newRevenue, notes: e.target.value })}
                            className="bg-gray-900 border-gray-700 text-white mt-2"
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newRevenue.verified}
                            onChange={(e) => setNewRevenue({ ...newRevenue, verified: e.target.checked })}
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
                        <Button onClick={() => void handleAddRevenue()} className="gradient-button">
                          Add revenue
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                    </div>
                  </div>
                  {periodMode === "month" && (
                    <p className="text-xs text-gray-500">Leave empty to include all dates</p>
                  )}
                  {periodMode === "full_year" && (
                    <p className="text-xs text-gray-500">Full calendar year: Jan 1 – Dec 31</p>
                  )}
                  {periodMode === "ytd" && (
                    <p className="text-sm text-gray-400">Jan 1 through today (current calendar year)</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold">Revenue history</CardTitle>
                <CardDescription className="text-gray-400">
                  {manualRevenue.length} manual entr{manualRevenue.length !== 1 ? "ies" : "y"}
                  {transactionRevenue > 0 && (
                    <span className="ml-2">+ {formatCurrency(transactionRevenue)} from transactions</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12 text-gray-400">
                    <LoadingSpinner />
                  </div>
                ) : manualRevenue.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No manual revenue entries for this filter</p>
                    <p className="text-gray-500 text-sm mt-1">Use Add revenue to create one</p>
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
                          <TableHead className="text-white">Payment</TableHead>
                          <TableHead className="text-white">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualRevenue.map((rev) => (
                          <TableRow key={rev.id} className="border-gray-700">
                            <TableCell className="text-gray-300">
                              {formatDate(rev.received_date || rev.created_at)}
                            </TableCell>
                            <TableCell className="text-white font-medium">{rev.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-gray-300">
                                {rev.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">{rev.source || "—"}</TableCell>
                            <TableCell className="text-green-400 font-bold">{formatCurrency(rev.amount)}</TableCell>
                            <TableCell className="text-gray-400">{rev.payment_method || "—"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRevenue({ ...rev })
                                    setIsEditRevenueDialogOpen(true)
                                  }}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void handleDeleteRevenue(rev.id)}
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

            <Dialog open={isEditRevenueDialogOpen} onOpenChange={setIsEditRevenueDialogOpen}>
              <DialogContent className="bg-[#141414] border-black max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit revenue entry</DialogTitle>
                  <DialogDescription className="text-gray-300">Update this manual revenue row</DialogDescription>
                </DialogHeader>
                {editingRevenue && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-white">Description *</Label>
                      <Input
                        value={editingRevenue.description}
                        onChange={(e) => setEditingRevenue({ ...editingRevenue, description: e.target.value })}
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
                          onChange={(e) => setEditingRevenue({ ...editingRevenue, amount: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white">Category *</Label>
                        <Select
                          value={editingRevenue.category}
                          onValueChange={(value) => setEditingRevenue({ ...editingRevenue, category: value })}
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
                          onValueChange={(value) => setEditingRevenue({ ...editingRevenue, source: value })}
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                            <SelectValue placeholder="Source" />
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
                        <Label className="text-white">Payment method</Label>
                        <Select
                          value={editingRevenue.payment_method || ""}
                          onValueChange={(value) =>
                            setEditingRevenue({ ...editingRevenue, payment_method: value })
                          }
                        >
                          <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                            <SelectValue placeholder="Method" />
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
                      <Label className="text-white">Received date</Label>
                      <Input
                        type="date"
                        value={editingRevenue.received_date || ""}
                        onChange={(e) => setEditingRevenue({ ...editingRevenue, received_date: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Notes</Label>
                      <Textarea
                        value={editingRevenue.notes || ""}
                        onChange={(e) => setEditingRevenue({ ...editingRevenue, notes: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white mt-2"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingRevenue.verified}
                        onChange={(e) => setEditingRevenue({ ...editingRevenue, verified: e.target.checked })}
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
                  <Button onClick={() => void handleEditRevenue()} className="gradient-button">
                    Update revenue
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
