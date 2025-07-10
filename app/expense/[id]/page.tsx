"use client"

import { useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, ArrowLeft, Pencil, Trash2, Loader2, Check, X, UserPlus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import { Input } from "@/components/ui/input"

export default function ExpenseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const expenseId = params.id as string
  const [expense, setExpense] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string, name: string, isCustom?: boolean }>>([])
  const [userPaidStatus, setUserPaidStatus] = useState<Record<string, boolean>>({})
  const [customName, setCustomName] = useState("")
  const [splitAmounts, setSplitAmounts] = useState<Record<string, number>>({})
  const { teamMembers, loading: teamLoading } = useTeamMembers(expense?.project_id || "")

  useEffect(() => {
    const fetchExpense = async () => {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single()
      if (error || !data) {
        setError('Expense not found')
        setExpense(null)
      } else {
        setExpense(data)
        setEditData({
          description: data.description || '',
          amount: data.amount || '',
          category: data.category || '',
          status: data.status || '',
          due_date: data.due_date || '',
        })
      }
      setLoading(false)
    }
    if (expenseId) fetchExpense()
  }, [expenseId])

  // When users are added/removed, auto-split evenly unless custom values exist
  useEffect(() => {
    if (!expense || selectedUsers.length === 0) {
      setSplitAmounts({})
      return
    }
    // Only auto-split if all amounts are zero or missing (i.e., initial add)
    const hasCustom = selectedUsers.some(u => splitAmounts[u.id + u.name] && splitAmounts[u.id + u.name] !== Number(expense.amount) / selectedUsers.length)
    if (!hasCustom) {
      const even = Number(expense.amount) / selectedUsers.length
      const newSplits: Record<string, number> = {}
      selectedUsers.forEach(u => { newSplits[u.id + u.name] = even })
      setSplitAmounts(newSplits)
    }
    // eslint-disable-next-line
  }, [selectedUsers, expense?.amount])

  const handleEditChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('expenses')
      .update({
        description: editData.description,
        amount: Number(editData.amount),
        category: editData.category,
        status: editData.status,
        due_date: editData.due_date,
      })
      .eq('id', expenseId)
      .select()
      .single()
    if (error || !data) {
      setError('Failed to update expense')
    } else {
      setExpense(data)
      setEditing(false)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    setDeleting(true)
    setError(null)
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId)
    if (error) {
      setError('Failed to delete expense')
      setDeleting(false)
    } else {
      router.push('/expenses')
    }
  }

  const handleAddUser = (user: { id: string, name: string, isCustom?: boolean }) => {
    if (!selectedUsers.some(u => u.id === user.id && u.name === user.name)) {
      setSelectedUsers([...selectedUsers, user])
      setUserPaidStatus((prev) => ({ ...prev, [user.id + user.name]: false }))
    }
  }
  const handleRemoveUser = (user: { id: string, name: string, isCustom?: boolean }) => {
    setSelectedUsers(selectedUsers.filter(u => !(u.id === user.id && u.name === user.name)))
    setUserPaidStatus((prev) => {
      const copy = { ...prev }
      delete copy[user.id + user.name]
      return copy
    })
  }
  const handleTogglePaid = (user: { id: string, name: string, isCustom?: boolean }) => {
    setUserPaidStatus((prev) => ({ ...prev, [user.id + user.name]: !prev[user.id + user.name] }))
  }
  const handleAddCustom = () => {
    if (customName.trim() && !selectedUsers.some(u => u.name === customName && u.isCustom)) {
      handleAddUser({ id: customName, name: customName, isCustom: true })
      setCustomName("")
    }
  }

  const handleAmountChange = (user: { id: string, name: string, isCustom?: boolean }, value: string) => {
    const num = parseFloat(value)
    setSplitAmounts(prev => ({ ...prev, [user.id + user.name]: isNaN(num) ? 0 : num }))
  }

  const splitSum = expense
    ? selectedUsers.reduce((sum, u) => sum + (splitAmounts[u.id + u.name] || 0), 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Expense Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => router.push('/expenses')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Expenses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 space-y-8">
      <Card className="w-full max-w-md border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            {editing ? (
              <input
                className="bg-transparent border-b border-gray-700 text-white w-full outline-none"
                value={editData.description}
                onChange={e => handleEditChange('description', e.target.value)}
                disabled={saving}
              />
            ) : (
              expense.description
            )}
          </CardTitle>
          <CardDescription>Expense Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-lg">
            <span className="text-gray-400">Amount</span>
            {editing ? (
              <input
                type="number"
                className="bg-transparent border-b border-gray-700 text-green-400 font-semibold w-24 outline-none"
                value={editData.amount}
                onChange={e => handleEditChange('amount', e.target.value)}
                disabled={saving}
              />
            ) : (
              <span className="text-green-400 font-semibold">${Number(expense.amount).toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Category</span>
            {editing ? (
              <input
                className="bg-transparent border-b border-gray-700 text-white w-32 outline-none"
                value={editData.category}
                onChange={e => handleEditChange('category', e.target.value)}
                disabled={saving}
              />
            ) : (
              <span>{expense.category}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            {editing ? (
              <input
                className="bg-transparent border-b border-gray-700 text-white w-24 outline-none"
                value={editData.status}
                onChange={e => handleEditChange('status', e.target.value)}
                disabled={saving}
              />
            ) : (
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                expense.status === 'Paid' ? 'bg-green-500/20 text-green-400' :
                expense.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {expense.status}
              </span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Due Date</span>
            {editing ? (
              <input
                type="date"
                className="bg-transparent border-b border-gray-700 text-white w-36 outline-none"
                value={editData.due_date ? editData.due_date.slice(0, 10) : ''}
                onChange={e => handleEditChange('due_date', e.target.value)}
                disabled={saving}
              />
            ) : (
              <span>{expense.due_date ? new Date(expense.due_date).toLocaleDateString() : 'N/A'}</span>
            )}
          </div>
          <div className="flex justify-end pt-4 gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Save
                </Button>
                <Button onClick={() => setEditing(false)} variant="outline" disabled={saving}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)} variant="outline">
                  <Pencil className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button onClick={handleDelete} variant="destructive" disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
                <Button onClick={() => router.push('/expenses')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Expenses
                </Button>
              </>
            )}
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </CardContent>
      </Card>
      {/* Split Expense Card */}
      <Card className="w-full max-w-md border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Split Expense
          </CardTitle>
          <CardDescription>Assign project users or custom names to split this expense. (UI only, not saved)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add project user */}
          <div className="flex gap-2 items-center mb-2">
            <span className="text-gray-300">Add project user:</span>
            <select
              className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
              disabled={teamLoading || !teamMembers || teamMembers.length === 0}
              onChange={e => {
                const userId = e.target.value
                const user = teamMembers.find(u => u.user.id === userId)
                if (user) handleAddUser({ id: user.user.id, name: user.user.name || user.user.email })
                e.target.selectedIndex = 0
              }}
            >
              <option value="">Select user</option>
              {teamLoading && <option>Loading...</option>}
              {teamMembers && teamMembers.map((user, idx) => (
                <option key={user.user.id + '-' + idx} value={user.user.id}>{user.user.name || user.user.email}</option>
              ))}
            </select>
          </div>
          {/* Add custom name */}
          <div className="flex gap-2 items-center mb-2">
            <span className="text-gray-300">Add custom:</span>
            <Input
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Enter name"
              className="w-32"
            />
            <Button size="sm" variant="outline" onClick={handleAddCustom}>Add</Button>
          </div>
          {/* Selected users table */}
          {expense && selectedUsers.length > 0 && (
            <div className="mt-4">
              <h4 className="text-gray-300 font-medium mb-2">Split Amounts</h4>
              <table className="min-w-full text-sm text-left text-gray-400">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUsers.map((user) => (
                    <tr key={user.id + user.name} className="border-b border-gray-800">
                      <td className="px-4 py-2">{user.name}{user.isCustom && <span className="ml-1 text-xs text-gray-500">(custom)</span>}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          className="bg-transparent border-b border-gray-700 text-white w-20 outline-none"
                          value={splitAmounts[user.id + user.name] ?? ''}
                          onChange={e => handleAmountChange(user, e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          className={userPaidStatus[user.id + user.name] ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"}
                          variant="outline"
                        >
                          {userPaidStatus[user.id + user.name] ? "Paid" : "Unpaid"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleTogglePaid(user)}>
                          {userPaidStatus[user.id + user.name] ? "Mark Unpaid" : "Mark Paid"}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveUser(user)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 