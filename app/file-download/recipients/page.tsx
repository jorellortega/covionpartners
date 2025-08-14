"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Eye, Clock, CheckCircle, XCircle, Search, Copy, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface FileRecipient {
  id: string
  recipient_name: string
  recipient_phone: string | null
  custom_message: string | null
  access_code: string | null
  expires_at: string
  created_at: string
  accessed_at: string | null
  download_count: number
  status: string
  file_share: {
    file_name: string
    file_size: number
    file_type: string
  }
}

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<FileRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    fetchRecipients()
  }, [])

  const fetchRecipients = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('file_recipients')
        .select(`
          *,
          file_share:file_shares(file_name, file_size, file_type)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRecipients(data || [])
    } catch (error) {
      console.error('Error fetching recipients:', error)
      toast.error('Failed to load recipients')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = async (recipientId: string) => {
    const recipient = recipients.find(r => r.id === recipientId)
    if (!recipient) return

    const shareUrl = `/file-download/${recipient.file_share_id}?recipient=${encodeURIComponent(recipient.recipient_name)}`
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const getStatusBadge = (status: string, expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    
    if (status === 'expired' || now > expires) {
      return <Badge variant="destructive">Expired</Badge>
    }
    
    if (status === 'accessed') {
      return <Badge variant="default">Accessed</Badge>
    }
    
    return <Badge variant="secondary">Active</Badge>
  }

  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = recipient.recipient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.file_share.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'active') return matchesSearch && recipient.status === 'active'
    if (filterStatus === 'expired') return matchesSearch && (recipient.status === 'expired' || new Date() > new Date(recipient.expires_at))
    if (filterStatus === 'accessed') return matchesSearch && recipient.status === 'accessed'
    
    return matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading recipients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            File Recipients
          </h1>
          <p className="text-xl text-gray-400">
            Track who you've sent files to and monitor their download status
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-white">Search</Label>
            <Input
              id="search"
              placeholder="Search by recipient name or file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <div>
            <Label htmlFor="status" className="text-white">Status</Label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-2 bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="accessed">Accessed</option>
            </select>
          </div>
        </div>

        {/* Recipients List */}
        <div className="grid gap-6">
          {filteredRecipients.length === 0 ? (
            <Card className="leonardo-card border-gray-800">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  {recipients.length === 0 ? 'No recipients yet' : 'No recipients match your search'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRecipients.map((recipient) => (
              <Card key={recipient.id} className="leonardo-card border-gray-800">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* File Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {recipient.file_share.file_name}
                        </h3>
                        {getStatusBadge(recipient.status, recipient.expires_at)}
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <p><strong>Recipient:</strong> {recipient.recipient_name}</p>
                        {recipient.recipient_phone && (
                          <p><strong>Phone:</strong> {recipient.recipient_phone}</p>
                        )}
                        <p><strong>File Size:</strong> {formatFileSize(recipient.file_share.file_size)}</p>
                        <p><strong>Created:</strong> {formatDate(recipient.created_at)}</p>
                        <p><strong>Expires:</strong> {formatDate(recipient.expires_at)}</p>
                        {recipient.accessed_at && (
                          <p><strong>Accessed:</strong> {formatDate(recipient.accessed_at)}</p>
                        )}
                        <p><strong>Downloads:</strong> {recipient.download_count}</p>
                      </div>

                      {recipient.custom_message && (
                        <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                          <p className="text-sm text-gray-300">
                            <strong>Message:</strong> {recipient.custom_message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-fit">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(recipient.id)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/file-download/${recipient.file_share_id}?recipient=${encodeURIComponent(recipient.recipient_name)}`, '_blank')}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Page
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">{recipients.length}</h3>
              <p className="text-gray-400">Total Recipients</p>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === 'active' && new Date() < new Date(r.expires_at)).length}
              </h3>
              <p className="text-gray-400">Active Links</p>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === 'accessed').length}
              </h3>
              <p className="text-gray-400">Accessed</p>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-red-500/10 to-pink-500/10">
            <CardContent className="p-4 text-center">
              <h3 className="text-2xl font-bold text-white">
                {recipients.filter(r => r.status === 'expired' || new Date() > new Date(r.expires_at)).length}
              </h3>
              <p className="text-gray-400">Expired</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
