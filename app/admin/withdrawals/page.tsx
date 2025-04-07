"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Home, CheckCircle, XCircle } from "lucide-react"

interface WithdrawalForApproval {
  id: string
  user_id: string
  user_email: string
  amount: number
  payment_method: string
  created_at: string
  payment_details: any
}

// Update withdrawal amounts to be in millions
const MOCK_WITHDRAWALS_FOR_APPROVAL: WithdrawalForApproval[] = [
  {
    id: "w1",
    user_id: "u1",
    user_email: "john.doe@example.com",
    amount: 0,
    payment_method: "Bank Transfer (ACH)",
    created_at: "2025-03-15T12:00:00Z",
    payment_details: { bank_name: "Chase Bank" },
  },
  {
    id: "w2",
    user_id: "u2",
    user_email: "jane.smith@example.com",
    amount: 0,
    payment_method: "PayPal",
    created_at: "2025-03-16T15:30:00Z",
    payment_details: { email: "jane.smith@example.com" },
  },
  {
    id: "w3",
    user_id: "u3",
    user_email: "mike.johnson@example.com",
    amount: 0,
    payment_method: "Debit Card",
    created_at: "2025-03-17T09:15:00Z",
    payment_details: { card: "Visa ending in 4242" },
  },
]

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalForApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalForApproval | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")

  useEffect(() => {
    fetchWithdrawalsForApproval()
  }, [])

  const fetchWithdrawalsForApproval = async () => {
    try {
      // For demonstration purposes, use mock data
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setWithdrawals(MOCK_WITHDRAWALS_FOR_APPROVAL)
    } catch (error) {
      console.error("Error fetching withdrawals for approval:", error)
      setError("Failed to fetch withdrawals. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedWithdrawal) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove the approved withdrawal from the list
      setWithdrawals(withdrawals.filter((w) => w.id !== selectedWithdrawal.id))
      setApprovalDialogOpen(false)
      setSelectedWithdrawal(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error approving withdrawal:", error)
      setError("Failed to approve withdrawal. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedWithdrawal) return

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove the rejected withdrawal from the list
      setWithdrawals(withdrawals.filter((w) => w.id !== selectedWithdrawal.id))
      setRejectionDialogOpen(false)
      setSelectedWithdrawal(null)
      setAdminNotes("")
    } catch (error) {
      console.error("Error rejecting withdrawal:", error)
      setError("Failed to reject withdrawal. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/admin" className="inline-flex items-center text-white hover:text-blue-400 transition-colors">
            <Home className="w-6 h-6 mr-2" />
            Admin Dashboard
          </Link>
        </div>
      </header>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Withdrawals Pending Approval</h1>

        {loading && !selectedWithdrawal ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center p-4">No withdrawals pending approval</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>{new Date(withdrawal.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{withdrawal.user_email}</TableCell>
                  <TableCell className="font-bold">${withdrawal.amount.toFixed(2)}</TableCell>
                  <TableCell>{withdrawal.payment_method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-400">
                      PENDING APPROVAL
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal)
                          setApprovalDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedWithdrawal(withdrawal)
                          setRejectionDialogOpen(true)
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are about to approve a withdrawal of ${selectedWithdrawal?.amount.toFixed(2)} for{" "}
              {selectedWithdrawal?.user_email}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this approval"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={loading}>
              {loading ? "Processing..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="bg-gray-900 text-white">
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              You are about to reject a withdrawal of ${selectedWithdrawal?.amount.toFixed(2)} for{" "}
              {selectedWithdrawal?.user_email}. The amount will be re-credited to their account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Rejection (Required)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain why this withdrawal is being rejected"
                className="bg-gray-800 border-gray-700 text-white"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !adminNotes.trim()}>
              {loading ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

