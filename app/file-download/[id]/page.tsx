"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Download, Calendar, User, MessageSquare, AlertCircle, ArrowLeft, Clock, Eye } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Badge } from "@/components/ui/badge"

interface FileShare {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  message: string
  sender_name: string
  sender_email: string
  expires_at: string
  created_at: string
  download_count: number
}

export default function FileDownloadPage() {
  const params = useParams()
  const router = useRouter()
  const [fileShare, setFileShare] = useState<FileShare | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchFileShare(params.id as string)
    }
  }, [params.id])

  const fetchFileShare = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('file_shares')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('File not found')
        } else {
          setError('Failed to load file')
        }
        return
      }

      // Check if file has expired
      const now = new Date()
      const expiresAt = new Date(data.expires_at)
      if (now > expiresAt) {
        setExpired(true)
        setFileShare(data)
        return
      }

      setFileShare(data)
    } catch (error) {
      console.error('Error fetching file share:', error)
      setError('Failed to load file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!fileShare) return

    setDownloading(true)
    try {
      // Increment download count
      await supabase
        .from('file_shares')
        .update({ download_count: fileShare.download_count + 1 })
        .eq('id', fileShare.id)

      // Create download link
      const link = document.createElement('a')
      link.href = fileShare.file_url
      link.download = fileShare.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Update local state
      setFileShare(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null)
      
      toast.success('Download started!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to start download')
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦'
    return '📁'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">File Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/file-download')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to File Share
          </Button>
        </div>
      </div>
    )
  }

  if (!fileShare) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">File Not Found</h1>
          <p className="text-gray-400 mb-6">The requested file could not be found.</p>
          <Button onClick={() => router.push('/file-download')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to File Share
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-blue-950/20">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">


        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/file-download')}
            className="text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to File Share
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🚀 Premium File Access
            </h1>
            <p className="text-xl text-gray-300 mb-2">You're about to experience the future of file sharing</p>
            <p className="text-gray-400">Powered by Covion Partners - The Ultimate Business Platform</p>
          </div>
        </div>

        {/* Premium Features Showcase */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="leonardo-card border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">💼</div>
              <h3 className="text-white font-semibold mb-1">Project Management</h3>
              <p className="text-xs text-gray-400">Manage teams, timelines, and deliverables</p>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-green-500/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">🤝</div>
              <h3 className="text-white font-semibold mb-1">Deal Making</h3>
              <p className="text-xs text-gray-400">Close deals and manage partnerships</p>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-green-500/30 bg-gradient-to-br from-green-500/10 to-yellow-500/10">
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-semibold mb-1">Financial Tools</h3>
              <p className="text-xs text-gray-400">Track expenses, manage budgets, get funded</p>
            </CardContent>
          </Card>
        </div>

        {/* File Card */}
        <Card className="leonardo-card border-2 border-gradient-to-r from-blue-500/50 to-purple-500/50 bg-gradient-to-br from-gray-900/50 to-gray-800/50">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4 animate-pulse">{getFileIcon(fileShare.file_type)}</div>
            <CardTitle className="text-white text-2xl font-bold mb-2">{fileShare.file_name}</CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              {formatFileSize(fileShare.file_size)} • {fileShare.file_type || 'Unknown type'}
            </CardDescription>
            <div className="mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                Premium File Access
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Shared by:</span>
                <span className="text-white font-medium">{fileShare.sender_name}</span>
                <span className="text-gray-500">({fileShare.sender_email})</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Shared on:</span>
                <span className="text-white">{formatDate(fileShare.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Expires on:</span>
                <span className="text-white">{formatDate(fileShare.expires_at)}</span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Downloads:</span>
                <span className="text-white font-medium">{fileShare.download_count}</span>
              </div>
            </div>

            {/* Message */}
            {fileShare.message && (
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium">Message from sender:</span>
                </div>
                <p className="text-gray-300">{fileShare.message}</p>
              </div>
            )}

            {/* Expired Warning */}
            {expired && (
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">File Expired</span>
                </div>
                <p className="text-red-300 text-sm">
                  This file share has expired and is no longer available for download.
                </p>
              </div>
            )}

            {/* Download Button */}
            {!expired && (
              <div className="space-y-4">
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  size="lg"
                >
                  {downloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Starting Download...
                    </>
                  ) : (
                    <>
                      <Download className="w-6 h-6 mr-3" />
                      🎯 Download This Premium File
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">
                    💡 <strong>Pro Tip:</strong> Get unlimited file sharing and advanced features
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/signup?type=business')}
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                    size="sm"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}

            {/* Expired Download Button */}
            {expired && (
              <Button
                disabled
                className="w-full bg-gray-600 cursor-not-allowed"
                size="lg"
              >
                <Clock className="w-5 h-5 mr-2" />
                File Expired
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Social Proof */}
        <div className="mt-8 mb-8">
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-4">🚀 Join 10,000+ Business Leaders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">$50M+</div>
                  <div className="text-sm text-gray-400">Deals Closed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">500+</div>
                  <div className="text-sm text-gray-400">Projects Funded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">95%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "Covion Partners transformed how we manage projects and close deals. It's like having a full business team in one platform."
              </p>
              <div className="text-sm text-gray-400">- Marcus Rodriguez, CEO of Rodriguez Industries</div>
            </CardContent>
          </Card>
        </div>

        {/* MASSIVE FEATURE SHOWCASE - BRAG ABOUT EVERYTHING */}
        <div className="mb-8">
          <Card className="leonardo-card border-2 border-gradient-to-r from-yellow-500/50 to-orange-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔥</div>
              <h3 className="text-3xl font-bold text-white mb-3">Ready to Level Up Your Business?</h3>
              <p className="text-gray-300 mb-6 text-lg">
                This is just a taste of what Covion Partners can do. Get access to the full platform and unlock unlimited potential.
              </p>
              
              {/* COLLAPSIBLE FEATURE EXPLOSION */}
              <div className="mb-6">
                <Button 
                  onClick={() => setShowFeatures(!showFeatures)}
                  variant="outline"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 mb-4"
                  size="lg"
                >
                  {showFeatures ? (
                    <>
                      <span className="mr-2">👆</span>
                      Hide All Features
                    </>
                  ) : (
                    <>
                      <span className="mr-2">👇</span>
                      Click to See ALL Features
                    </>
                  )}
                </Button>
                
                {showFeatures && (
                  <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
                    {/* FEATURE EXPLOSION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Project Management */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">💼</div>
                        <h4 className="text-white font-semibold mb-2">Project Management</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Team collaboration tools</li>
                          <li>• Timeline management</li>
                          <li>• File organization</li>
                          <li>• Progress tracking</li>
                          <li>• Milestone management</li>
                        </ul>
                      </div>

                      {/* Deal Making */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">🤝</div>
                        <h4 className="text-white font-semibold mb-2">Deal Making</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Contract management</li>
                          <li>• Negotiation tools</li>
                          <li>• Deal pipeline</li>
                          <li>• Client management</li>
                          <li>• Partnership tracking</li>
                        </ul>
                      </div>

                      {/* Financial Tools */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">💰</div>
                        <h4 className="text-white font-semibold mb-2">Financial Tools</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Expense tracking</li>
                          <li>• Budget management</li>
                          <li>• Funding access</li>
                          <li>• Payment processing</li>
                          <li>• Financial analytics</li>
                        </ul>
                      </div>

                      {/* Team Management */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">👥</div>
                        <h4 className="text-white font-semibold mb-2">Team Management</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Role assignments</li>
                          <li>• Permission control</li>
                          <li>• Performance tracking</li>
                          <li>• Communication tools</li>
                          <li>• Resource allocation</li>
                        </ul>
                      </div>

                      {/* Marketing Tools */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">📢</div>
                        <h4 className="text-white font-semibold mb-2">Marketing Tools</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Campaign management</li>
                          <li>• Lead generation</li>
                          <li>• Analytics dashboard</li>
                          <li>• Social media tools</li>
                          <li>• Content creation</li>
                        </ul>
                      </div>

                      {/* Advanced Analytics */}
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 transform hover:scale-105 transition-transform">
                        <div className="text-2xl mb-2">📊</div>
                        <h4 className="text-white font-semibold mb-2">Advanced Analytics</h4>
                        <ul className="text-xs text-gray-400 space-y-1 text-left">
                          <li>• Business insights</li>
                          <li>• Performance metrics</li>
                          <li>• ROI tracking</li>
                          <li>• Predictive analytics</li>
                          <li>• Custom reports</li>
                        </ul>
                      </div>
                    </div>

                    {/* MORE FEATURES - SECOND ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-800/20 rounded-lg transform hover:scale-105 transition-transform">
                        <div className="text-xl mb-1">🔐</div>
                        <div className="text-xs text-gray-400">Secure Storage</div>
                      </div>
                      <div className="text-center p-3 bg-gray-800/20 rounded-lg transform hover:scale-105 transition-transform">
                        <div className="text-xl mb-1">⚡</div>
                        <div className="text-xs text-gray-400">Real-time Sync</div>
                      </div>
                      <div className="text-center p-3 bg-gray-800/20 rounded-lg transform hover:scale-105 transition-transform">
                        <div className="text-xl mb-1">🌐</div>
                        <div className="text-xs text-gray-400">Cloud Access</div>
                      </div>
                      <div className="text-center p-3 bg-gray-800/20 rounded-lg transform hover:scale-105 transition-transform">
                        <div className="text-xl mb-1">📱</div>
                        <div className="text-xs text-gray-400">Mobile Ready</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ULTIMATE CTA */}
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-lg text-white font-semibold mb-2">🚀 UNLOCK THE ULTIMATE BUSINESS PLATFORM 🚀</p>
                  <p className="text-gray-300 text-sm">
                    Join thousands of entrepreneurs who've already transformed their businesses
                  </p>
                </div>
                
                <Button 
                  onClick={() => router.push('/signup?type=business')}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-xl px-10 py-5 h-auto shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  🚀 GET FULL ACCESS NOW - START FREE 🚀
                </Button>
                
                <div className="text-sm text-gray-400">
                  ⭐ No credit card required • 14-day free trial • Cancel anytime • 24/7 support ⭐
                </div>
                
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    🔥 LIMITED TIME: First 100 signups get 50% off premium features! 🔥
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need to share a file? <Button variant="link" onClick={() => router.push('/file-download')} className="text-blue-400 p-0 h-auto">Create a new file share</Button>
          </p>
        </div>
      </main>
    </div>
  )
}
