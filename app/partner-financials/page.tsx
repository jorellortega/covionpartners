"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MonthPicker } from "@/components/ui/month-picker"
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Send,
  Calendar,
  Building2,
  BarChart3,
  Download,
  Mail,
  RefreshCw,
  Loader2,
  ArrowDownToLine,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Organization {
  id: string
  name: string
  owner_id: string
}

interface PartnerInvitation {
  id: string
  organization_id: string
  email?: string
  status: string
}

interface PartnerSettings {
  id: string
  partner_invitation_id: string
  can_see_roi: boolean
  can_see_balance: boolean
  can_see_revenue: boolean
  can_see_monthly_reports: boolean
  can_receive_payments: boolean
  can_send_payments: boolean
}

interface FinancialReport {
  id: string
  report_month: string
  report_type: string
  total_revenue: number
  total_expenses: number
  net_profit: number
  roi_percentage: number | null
  balance: number
  sent_at: string | null
  created_at: string
}

interface MonthlyFinancialData {
  month: string
  revenue: number
  expenses: number
  profit: number
  roi: number | null
}

export default function PartnerFinancialsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([])
  const [partnerSettings, setPartnerSettings] = useState<Record<string, PartnerSettings>>({})
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [monthlyData, setMonthlyData] = useState<MonthlyFinancialData[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null)

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizations()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (selectedOrg) {
      fetchInvitations()
    }
  }, [selectedOrg])

  useEffect(() => {
    if (selectedInvitation && selectedOrg) {
      fetchFinancialReports()
      fetchMonthlyFinancialData()
      fetchWithdrawalRequests()
    }
  }, [selectedInvitation, selectedOrg])

  const fetchOrganizations = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
      if (data && data.length > 0) {
        setSelectedOrg(data[0].id)
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    if (!selectedOrg) return
    
    try {
      const { data, error } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('organization_id', selectedOrg)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvitations(data || [])

      // Fetch settings for each invitation
      if (data && data.length > 0) {
        const settingsPromises = data.map(inv => 
          supabase
            .from('organization_partner_settings')
            .select('*')
            .eq('partner_invitation_id', inv.id)
            .single()
        )
        
        const settingsResults = await Promise.all(settingsPromises)
        const settingsMap: Record<string, PartnerSettings> = {}
        
        settingsResults.forEach((result, index) => {
          if (!result.error && result.data) {
            settingsMap[data[index].id] = result.data as PartnerSettings
          }
        })
        
        setPartnerSettings(settingsMap)
        if (data.length > 0 && !selectedInvitation) {
          setSelectedInvitation(data[0].id)
        }
      }
    } catch (error: any) {
      console.error('Error fetching invitations:', error)
      toast.error('Failed to load partner invitations')
    }
  }

  const fetchFinancialReports = async () => {
    if (!selectedInvitation || !selectedOrg) return

    try {
      setLoadingReports(true)
      const { data, error } = await supabase
        .from('partner_financial_reports')
        .select('*')
        .eq('organization_id', selectedOrg)
        .eq('partner_invitation_id', selectedInvitation)
        .order('report_month', { ascending: false })
        .limit(12)

      if (error) throw error
      setFinancialReports(data || [])
    } catch (error: any) {
      console.error('Error fetching financial reports:', error)
      toast.error('Failed to load financial reports')
    } finally {
      setLoadingReports(false)
    }
  }

  const fetchMonthlyFinancialData = async () => {
    if (!selectedOrg) return

    try {
      // Get all projects for this organization
      const { data: orgProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', selectedOrg)

      const projectIds = orgProjects?.map(p => p.id) || []

      // Get current month and last 6 months
      const months: MonthlyFinancialData[] = []
      const now = new Date()
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = date.toISOString().slice(0, 7) // YYYY-MM
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 1)
        const startDateStr = startDate.toISOString()
        const endDateStr = endDate.toISOString()
        
        // Fetch revenue from transactions (for organization's projects)
        let transactionRevenue = 0
        if (projectIds.length > 0) {
          const { data: revenueData } = await supabase
            .from('transactions')
            .select('amount')
            .eq('status', 'completed')
            .in('project_id', projectIds)
            .gte('created_at', startDateStr)
            .lt('created_at', endDateStr)
            .gt('amount', 0)

          transactionRevenue = revenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
        }

        // Fetch manual revenue entries from revenue table
        const { data: manualRevenueData } = await supabase
          .from('revenue')
          .select('amount')
          .eq('organization_id', selectedOrg)
          .gte('created_at', startDateStr)
          .lt('created_at', endDateStr)

        const manualRevenue = manualRevenueData?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0
        
        // Total revenue = transaction revenue + manual revenue
        const revenue = transactionRevenue + manualRevenue

        // Fetch expenses
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('organization_id', selectedOrg)
          .in('status', ['Approved', 'Paid'])
          .gte('created_at', startDateStr)
          .lt('created_at', endDateStr)

        const expenses = expenseData?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0
        const profit = revenue - expenses
        const roi = expenses > 0 ? ((profit / expenses) * 100) : null

        months.push({
          month: monthStr,
          revenue,
          expenses,
          profit,
          roi
        })
      }

      setMonthlyData(months.reverse())
    } catch (error: any) {
      console.error('Error fetching monthly data:', error)
    }
  }

  const generateFinancialReport = async () => {
    if (!selectedInvitation || !selectedOrg || !selectedMonth) {
      toast.error('Please select a partner and month')
      return
    }

    try {
      setGenerating(true)
      
      // Validate and parse the month string (Format: YYYY-MM)
      const monthStr = selectedMonth.trim()
      const monthMatch = monthStr.match(/^(\d{4})-(\d{2})$/)
      
      if (!monthMatch) {
        toast.error('Invalid month format. Please select a valid month.')
        setGenerating(false)
        return
      }

      const year = parseInt(monthMatch[1], 10)
      const month = parseInt(monthMatch[2], 10)
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        toast.error('Invalid month. Please select a valid month.')
        setGenerating(false)
        return
      }

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1) // First day of next month
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast.error('Invalid date. Please select a valid month.')
        setGenerating(false)
        return
      }
      
      const startDateStr = startDate.toISOString()
      const endDateStr = endDate.toISOString()
      const reportMonthDate = startDate.toISOString().split('T')[0] // YYYY-MM-DD format

      // Get all projects for this organization
      const { data: orgProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('organization_id', selectedOrg)

      const projectIds = orgProjects?.map(p => p.id) || []

      // Fetch revenue from transactions (for organization's projects)
      let transactionRevenueData: any[] = []
      if (projectIds.length > 0) {
        const { data: revenueDataResult, error: revenueError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('status', 'completed')
          .in('project_id', projectIds)
          .gte('created_at', startDateStr)
          .lt('created_at', endDateStr)
          .gt('amount', 0)

        if (revenueError) {
          console.error('Error fetching transaction revenue:', revenueError)
        } else {
          transactionRevenueData = revenueDataResult || []
        }
      }

      // Fetch manual revenue entries from revenue table
      const { data: manualRevenueData, error: manualRevenueError } = await supabase
        .from('revenue')
        .select('*')
        .eq('organization_id', selectedOrg)
        .gte('created_at', startDateStr)
        .lt('created_at', endDateStr)

      if (manualRevenueError) {
        console.error('Error fetching manual revenue:', manualRevenueError)
      }

      // Combine both revenue sources
      const revenueData = [
        ...transactionRevenueData,
        ...(manualRevenueData || [])
      ]

      // Fetch expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('organization_id', selectedOrg)
        .in('status', ['Approved', 'Paid'])
        .gte('created_at', startDateStr)
        .lt('created_at', endDateStr)

      if (expenseError) {
        console.error('Error fetching expenses:', expenseError)
      }

      // Calculate total revenue from both sources
      const transactionRevenue = transactionRevenueData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      const manualRevenue = manualRevenueData?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0
      const totalRevenue = transactionRevenue + manualRevenue
      const totalExpenses = expenseData?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0
      const netProfit = totalRevenue - totalExpenses
      const roiPercentage = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100) : null

      // Get partner investment details
      const { data: partnerInvitation } = await supabase
        .from('partner_invitations')
        .select('investment_amount, share_percentage')
        .eq('id', selectedInvitation)
        .single()

      const partnerInvestmentAmount = partnerInvitation?.investment_amount || 0
      const partnerSharePercentage = partnerInvitation?.share_percentage || 0

      // Calculate partner-specific ROI and profit share
      let partnerRoiPercentage: number | null = null
      let partnerProfitShare: number = 0

      if (partnerInvestmentAmount > 0) {
        // Partner's profit share based on their share percentage
        partnerProfitShare = (netProfit * partnerSharePercentage) / 100
        
        // Partner's ROI = (Partner's Profit Share / Partner's Investment) * 100
        partnerRoiPercentage = (partnerProfitShare / partnerInvestmentAmount) * 100
      }

      // Get balance from Stripe or transactions
      const balance = 0 // TODO: Fetch from Stripe balance API

      const reportData = {
        revenue_breakdown: revenueData || [],
        expense_breakdown: expenseData || [],
        summary: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          roi_percentage: roiPercentage,
          balance,
          partner_investment: partnerInvestmentAmount,
          partner_share: partnerSharePercentage,
          partner_profit_share: partnerProfitShare,
          partner_roi: partnerRoiPercentage
        }
      }

      // Check if report already exists for this month/partner combination
      const { data: existingReport } = await supabase
        .from('partner_financial_reports')
        .select('id')
        .eq('organization_id', selectedOrg)
        .eq('partner_invitation_id', selectedInvitation)
        .eq('report_month', reportMonthDate)
        .eq('report_type', 'monthly')
        .single()

      let data, error

      if (existingReport) {
        // Update existing report
        const { data: updateData, error: updateError } = await supabase
          .from('partner_financial_reports')
          .update({
            total_revenue: totalRevenue,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            roi_percentage: roiPercentage,
            partner_investment_amount: partnerInvestmentAmount,
            partner_share_percentage: partnerSharePercentage,
            partner_roi_percentage: partnerRoiPercentage,
            partner_profit_share: partnerProfitShare,
            balance,
            report_data: reportData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingReport.id)
          .select()
          .single()
        
        data = updateData
        error = updateError
      } else {
        // Insert new report
        const { data: insertData, error: insertError } = await supabase
          .from('partner_financial_reports')
          .insert({
            organization_id: selectedOrg,
            partner_invitation_id: selectedInvitation,
            report_month: reportMonthDate,
            report_type: 'monthly',
            total_revenue: totalRevenue,
            total_expenses: totalExpenses,
            net_profit: netProfit,
            roi_percentage: roiPercentage,
            partner_investment_amount: partnerInvestmentAmount,
            partner_share_percentage: partnerSharePercentage,
            partner_roi_percentage: partnerRoiPercentage,
            partner_profit_share: partnerProfitShare,
            balance,
            report_data: reportData,
            created_by: user!.id
          })
          .select()
          .single()
        
        data = insertData
        error = insertError
      }

      if (error) throw error

      // Show summary of what was found
      let summaryMessage = `Report generated! Revenue: ${formatCurrency(totalRevenue)}, Expenses: ${formatCurrency(totalExpenses)}, Net: ${formatCurrency(netProfit)}`
      if (partnerInvestmentAmount > 0 && partnerRoiPercentage !== null) {
        summaryMessage += ` | Partner ROI: ${partnerRoiPercentage.toFixed(2)}% | Profit Share: ${formatCurrency(partnerProfitShare)}`
      }
      toast.success(summaryMessage, {
        description: 'View the report in the "Financial Reports" tab',
        duration: 5000
      })
      setIsGenerateDialogOpen(false)
      fetchFinancialReports()
      
      // Auto-switch to reports tab after generation
      setActiveTab("reports")
    } catch (error: any) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate financial report')
    } finally {
      setGenerating(false)
    }
  }

  const sendFinancialReport = async (reportId: string) => {
    if (!selectedInvitation) return

    try {
      setSending(true)
      
      // Get partner invitation details
      const invitation = invitations.find(inv => inv.id === selectedInvitation)
      if (!invitation) {
        toast.error('Partner invitation not found')
        return
      }

      // Update report with sent_at timestamp
      const { error } = await supabase
        .from('partner_financial_reports')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', reportId)

      if (error) throw error

      // Create notification for partner
      const { data: partnerAccess } = await supabase
        .from('partner_access')
        .select('user_id')
        .eq('partner_invitation_id', selectedInvitation)
        .not('user_id', 'is', null)
        .limit(1)
        .single()

      if (partnerAccess?.user_id) {
        const { error: notifyError } = await supabase
          .from('notifications')
          .insert({
            user_id: partnerAccess.user_id,
            type: 'partner_financial_report',
            title: 'New Financial Report Available',
            content: `A monthly financial report has been sent to you for ${invitation.email || 'your partnership'}`,
            metadata: {
              report_id: reportId,
              partner_invitation_id: selectedInvitation,
              organization_id: selectedOrg
            },
            read: false
          })

        if (notifyError) {
          console.error('Error creating notification:', notifyError)
        }
      }

      toast.success('Financial report sent successfully!')
      fetchFinancialReports()
    } catch (error: any) {
      console.error('Error sending report:', error)
      toast.error('Failed to send financial report')
    } finally {
      setSending(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const fetchWithdrawalRequests = async () => {
    if (!selectedOrg || !selectedInvitation) return

    setLoadingWithdrawals(true)
    try {
      const { data, error } = await supabase
        .from('partner_withdrawal_requests')
        .select(`
          *,
          partner_invitations!inner(
            id,
            email
          ),
          partner_financial_reports(
            id,
            report_month,
            partner_profit_share
          )
        `)
        .eq('organization_id', selectedOrg)
        .eq('partner_invitation_id', selectedInvitation)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWithdrawalRequests(data || [])
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error)
      toast.error('Failed to load withdrawal requests')
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  const handleProcessWithdrawal = async (requestId: string, action: 'approve' | 'reject' | 'process', rejectionReason?: string) => {
    setProcessingWithdrawal(requestId)
    try {
      const response = await fetch('/api/partners/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalRequestId: requestId,
          action,
          rejectionReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal')
      }

      toast.success(`Withdrawal ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'processed'} successfully`)
      fetchWithdrawalRequests()
    } catch (error: any) {
      console.error('Error processing withdrawal:', error)
      toast.error(error.message || 'Failed to process withdrawal')
    } finally {
      setProcessingWithdrawal(null)
    }
  }

  const formatMonth = (monthStr: string) => {
    // Handle both DATE format (YYYY-MM-DD) and month string format (YYYY-MM)
    const dateStr = monthStr.includes('-') ? monthStr.split('T')[0] : monthStr
    const parts = dateStr.split('-')
    if (parts.length >= 2) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }
    return monthStr
  }

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
              <p className="text-gray-400">You don't own any organizations. Create an organization first to manage partner financials.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const currentSettings = selectedInvitation ? partnerSettings[selectedInvitation] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-block mb-3">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              Partner Financial Reports
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-300 mt-3">Generate and send financial reports to your partners</p>
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
            <Select value={selectedOrg || ''} onValueChange={setSelectedOrg}>
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
          <div className="space-y-6">
            {/* Partner Selector */}
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl text-white font-bold flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-purple-400" />
                  Select Partner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedInvitation || ''} onValueChange={setSelectedInvitation}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white h-12">
                    <SelectValue placeholder="Select a partner" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {invitations.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id} className="text-white">
                        {inv.email || 'Partner'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedInvitation && currentSettings && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-gray-800 border-gray-700">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="reports">Financial Reports</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
                  <TabsTrigger value="withdrawals">
                    Withdrawal Requests
                    {withdrawalRequests.filter(r => r.status === 'pending').length > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white">
                        {withdrawalRequests.filter(r => r.status === 'pending').length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-[#141414] border border-black">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400">Revenue Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {currentSettings.can_see_revenue ? (
                            <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400">Disabled</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#141414] border border-black">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400">ROI Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {currentSettings.can_see_roi ? (
                            <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400">Disabled</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#141414] border border-black">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400">Balance Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {currentSettings.can_see_balance ? (
                            <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400">Disabled</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-[#141414] border border-black">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-gray-400">Monthly Reports</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {currentSettings.can_see_monthly_reports ? (
                            <Badge className="bg-green-500/20 text-green-400">Enabled</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400">Disabled</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-[#141414] border border-black">
                    <CardHeader>
                      <CardTitle className="text-white">Payment Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
                          <span className="text-gray-300">Can Receive Payments</span>
                          <Badge className={currentSettings.can_receive_payments ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {currentSettings.can_receive_payments ? "Yes" : "No"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-black rounded-lg">
                          <span className="text-gray-300">Can Send Payments</span>
                          <Badge className={currentSettings.can_send_payments ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {currentSettings.can_send_payments ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => router.push(`/partners-settings?invitation=${selectedInvitation}`)}
                      className="gradient-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Partner Settings
                    </Button>
                    <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gradient-button">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Generate Report
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#141414] border-black">
                        <DialogHeader>
                          <DialogTitle className="text-white">Generate Financial Report</DialogTitle>
                          <DialogDescription className="text-gray-300">
                            Select a month to generate a financial report for this partner
                          </DialogDescription>
                          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <p className="text-sm text-gray-400 mb-2">
                              <strong className="text-white">Data Sources:</strong>
                            </p>
                            <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                              <li>Revenue: Automatically pulled from completed transactions in your organization's projects</li>
                              <li>Expenses: Automatically pulled from approved/paid expenses in your organization</li>
                              <li>ROI & Balance: Calculated from the above data</li>
                            </ul>
                            <p className="text-xs text-gray-500 mt-2">
                              Add expenses at <code className="text-purple-400">/business-expenses</code> and transactions will appear automatically from your projects.
                            </p>
                          </div>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label className="text-white">Month</Label>
                            <MonthPicker
                              value={selectedMonth}
                              onValueChange={setSelectedMonth}
                              placeholder="Select a month"
                              className="bg-gray-900 border-gray-700 text-white mt-2"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} className="border-black">
                            Cancel
                          </Button>
                          <Button
                            onClick={generateFinancialReport}
                            disabled={!selectedMonth || generating}
                            className="gradient-button"
                          >
                            {generating ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => router.push('/manage-expenses')}
                      variant="outline"
                      className="border-gray-700"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Expenses
                    </Button>
                  </div>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="space-y-4">
                  <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-purple-400 mt-0.5" />
                        <div>
                          <h3 className="text-white font-semibold mb-1">Generated Reports</h3>
                          <p className="text-sm text-gray-400">
                            Financial reports you've generated will appear here. Click "Send Report" to notify your partner.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {loadingReports ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : financialReports.length > 0 ? (
                    financialReports.map((report) => (
                      <Card key={report.id} className="bg-[#141414] border border-black">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-white">{formatMonth(report.report_month)}</CardTitle>
                              <CardDescription className="text-gray-400">
                                {report.sent_at ? `Sent on ${new Date(report.sent_at).toLocaleDateString()}` : 'Not sent yet'}
                              </CardDescription>
                            </div>
                            {!report.sent_at && (
                              <Button
                                size="sm"
                                onClick={() => sendFinancialReport(report.id)}
                                disabled={sending}
                                className="gradient-button"
                              >
                                {sending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Report
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="p-4 bg-black rounded-lg">
                              <div className="text-sm text-gray-400 mb-1">Revenue</div>
                              <div className="text-2xl font-bold text-green-400">
                                {formatCurrency(report.total_revenue)}
                              </div>
                            </div>
                            <div className="p-4 bg-black rounded-lg">
                              <div className="text-sm text-gray-400 mb-1">Expenses</div>
                              <div className="text-2xl font-bold text-red-400">
                                {formatCurrency(report.total_expenses)}
                              </div>
                            </div>
                            <div className="p-4 bg-black rounded-lg">
                              <div className="text-sm text-gray-400 mb-1">Net Profit</div>
                              <div className={`text-2xl font-bold ${report.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(report.net_profit)}
                              </div>
                            </div>
                            <div className="p-4 bg-black rounded-lg">
                              <div className="text-sm text-gray-400 mb-1">Overall ROI</div>
                              <div className="text-2xl font-bold text-purple-400">
                                {report.roi_percentage !== null ? `${report.roi_percentage.toFixed(2)}%` : 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Partner-Specific ROI Section */}
                          {(report.partner_investment_amount && report.partner_investment_amount > 0) && (
                            <div className="pt-4 border-t border-gray-700">
                              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                                Partner-Specific Metrics
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                  <div className="text-sm text-gray-400 mb-1">Investment Amount</div>
                                  <div className="text-xl font-bold text-purple-400">
                                    {formatCurrency(report.partner_investment_amount)}
                                  </div>
                                </div>
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                  <div className="text-sm text-gray-400 mb-1">Share Percentage</div>
                                  <div className="text-xl font-bold text-purple-400">
                                    {report.partner_share_percentage ? `${report.partner_share_percentage.toFixed(2)}%` : 'N/A'}
                                  </div>
                                </div>
                                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                                  <div className="text-sm text-gray-400 mb-1">Your Profit Share</div>
                                  <div className="text-xl font-bold text-green-400">
                                    {formatCurrency(report.partner_profit_share || 0)}
                                  </div>
                                </div>
                                <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                  <div className="text-sm text-gray-400 mb-1">Your ROI</div>
                                  <div className="text-xl font-bold text-purple-400">
                                    {report.partner_roi_percentage !== null ? `${report.partner_roi_percentage.toFixed(2)}%` : 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-[#141414] border border-black">
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No financial reports generated yet</p>
                        <p className="text-gray-500 text-sm mt-1">Generate a report to get started</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Monthly Trends Tab */}
                <TabsContent value="monthly" className="space-y-4">
                  <Card className="bg-[#141414] border border-black">
                    <CardHeader>
                      <CardTitle className="text-white">6-Month Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {monthlyData.map((data) => (
                          <div key={data.month} className="p-4 bg-black rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-white font-semibold">{formatMonth(data.month)}</h3>
                              <Badge className={data.profit >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                {data.profit >= 0 ? 'Profit' : 'Loss'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-sm text-gray-400">Revenue</div>
                                <div className="text-lg font-bold text-green-400">{formatCurrency(data.revenue)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-400">Expenses</div>
                                <div className="text-lg font-bold text-red-400">{formatCurrency(data.expenses)}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-400">Profit/Loss</div>
                                <div className={`text-lg font-bold ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatCurrency(data.profit)}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-400">ROI</div>
                                <div className="text-lg font-bold text-purple-400">
                                  {data.roi !== null ? `${data.roi.toFixed(2)}%` : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Withdrawal Requests Tab */}
                <TabsContent value="withdrawals" className="space-y-4">
                  {loadingWithdrawals ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : withdrawalRequests.length > 0 ? (
                    withdrawalRequests.map((request) => {
                      const report = request.partner_financial_reports
                      const getStatusBadge = () => {
                        switch (request.status) {
                          case 'pending':
                            return <Badge className="bg-yellow-500/20 text-yellow-400"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
                          case 'approved':
                            return <Badge className="bg-blue-500/20 text-blue-400"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
                          case 'processing':
                            return <Badge className="bg-purple-500/20 text-purple-400"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Processing</Badge>
                          case 'completed':
                            return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
                          case 'rejected':
                            return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
                          default:
                            return <Badge>{request.status}</Badge>
                        }
                      }

                      return (
                        <Card key={request.id} className="bg-[#141414] border border-black">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-white flex items-center gap-2">
                                  <ArrowDownToLine className="w-5 h-5 text-purple-400" />
                                  Withdrawal Request
                                </CardTitle>
                                <CardDescription className="text-gray-400">
                                  Requested on {new Date(request.created_at).toLocaleDateString()}
                                  {report && ` • From ${formatMonth(report.report_month)} report`}
                                </CardDescription>
                              </div>
                              {getStatusBadge()}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-black rounded-lg">
                                  <div className="text-sm text-gray-400 mb-1">Requested Amount</div>
                                  <div className="text-2xl font-bold text-green-400">
                                    {formatCurrency(request.amount)}
                                  </div>
                                </div>
                                {report && (
                                  <div className="p-4 bg-black rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Available Profit Share</div>
                                    <div className="text-2xl font-bold text-purple-400">
                                      {formatCurrency(report.partner_profit_share || 0)}
                                    </div>
                                  </div>
                                )}
                                {request.processed_at && (
                                  <div className="p-4 bg-black rounded-lg">
                                    <div className="text-sm text-gray-400 mb-1">Processed On</div>
                                    <div className="text-lg font-semibold text-white">
                                      {new Date(request.processed_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {request.notes && (
                                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                  <div className="text-sm text-gray-400 mb-1">Notes</div>
                                  <p className="text-white text-sm">{request.notes}</p>
                                </div>
                              )}

                              {request.rejection_reason && (
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                                  <div className="text-sm text-red-400 mb-1">Rejection Reason</div>
                                  <p className="text-red-300 text-sm">{request.rejection_reason}</p>
                                </div>
                              )}

                              {request.status === 'pending' && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => handleProcessWithdrawal(request.id, 'approve')}
                                    disabled={processingWithdrawal === request.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {processingWithdrawal === request.id ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      const reason = prompt('Enter rejection reason (optional):')
                                      if (reason !== null) {
                                        handleProcessWithdrawal(request.id, 'reject', reason || undefined)
                                      }
                                    }}
                                    disabled={processingWithdrawal === request.id}
                                    variant="outline"
                                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              )}

                              {request.status === 'approved' && (
                                <Button
                                  onClick={() => handleProcessWithdrawal(request.id, 'process')}
                                  disabled={processingWithdrawal === request.id}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                  {processingWithdrawal === request.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                                  )}
                                  Process Payment
                                </Button>
                              )}

                              {request.status === 'completed' && request.stripe_transfer_id && (
                                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                                  <div className="text-sm text-green-400 mb-1">Payment Processed</div>
                                  <p className="text-green-300 text-xs">Stripe Transfer ID: {request.stripe_transfer_id}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <Card className="bg-[#141414] border border-black">
                      <CardContent className="py-12 text-center">
                        <ArrowDownToLine className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No withdrawal requests yet</p>
                        <p className="text-gray-500 text-sm mt-1">Withdrawal requests from partners will appear here</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

