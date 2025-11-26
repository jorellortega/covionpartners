"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download, UploadCloud, FileText, FileImage, FileArchive, File } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

// Mock document data
const mockDocuments = [
  {
    name: "Business_Plan.pdf",
    type: "pdf",
    size: "1.2 MB",
    uploaded: "2024-06-01",
    url: "#",
  },
  {
    name: "Logo.png",
    type: "image",
    size: "320 KB",
    uploaded: "2024-05-28",
    url: "#",
  },
  {
    name: "Financials.xlsx",
    type: "excel",
    size: "540 KB",
    uploaded: "2024-05-20",
    url: "#",
  },
  {
    name: "Archive.zip",
    type: "archive",
    size: "4.8 MB",
    uploaded: "2024-05-15",
    url: "#",
  },
  {
    name: "Notes.txt",
    type: "text",
    size: "8 KB",
    uploaded: "2024-05-10",
    url: "#",
  },
]

function getFileIcon(type: string) {
  switch (type) {
    case "pdf":
      return <FileText className="w-7 h-7 text-red-400" />
    case "image":
      return <FileImage className="w-7 h-7 text-blue-400" />
    case "excel":
      return <FileText className="w-7 h-7 text-green-400" />
    case "archive":
      return <FileArchive className="w-7 h-7 text-yellow-400" />
    case "text":
      return <FileText className="w-7 h-7 text-gray-400" />
    default:
      return <File className="w-7 h-7 text-gray-400" />
  }
}

export default function OrganizationDocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params?.slug as string
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Verify user has access to this organization
  useEffect(() => {
    const verifyAccess = async () => {
      if (!slug) {
        setAccessError("Invalid organization")
        setLoading(false)
        return
      }

      if (!user) {
        setAccessError("Please log in to access documents")
        setLoading(false)
        return
      }

      try {
        let org: any = null

        // Handle special "my" slug - find user's first accessible organization
        if (slug === 'my') {
          // Get organizations where user is owner
          const { data: ownedOrgs, error: ownedError } = await supabase
            .from('organizations')
            .select('id, name, owner_id, slug')
            .eq('owner_id', user.id)
            .limit(1)
            .single()

          if (!ownedError && ownedOrgs) {
            org = ownedOrgs
          } else {
            // If not owner, check if user is staff member
            const { data: staffOrgs, error: staffError } = await supabase
              .from('organization_staff')
              .select('organization_id, organization:organizations(id, name, owner_id, slug)')
              .eq('user_id', user.id)
              .limit(1)
              .single()

            if (!staffError && staffOrgs?.organization) {
              org = staffOrgs.organization
            }
          }

          if (!org) {
            setAccessError("You are not a member of any organizations")
            setLoading(false)
            return
          }

          // Redirect to the actual organization slug for better URL
          if (org.slug && org.slug !== 'my') {
            router.replace(`/company/${org.slug}/documents`)
            return
          }
        } else {
          // Fetch organization by slug
          const { data: fetchedOrg, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, owner_id, slug')
            .eq('slug', slug)
            .single()

          if (orgError || !fetchedOrg) {
            setAccessError("Organization not found")
            setLoading(false)
            return
          }

          org = fetchedOrg
        }

        setOrganization(org)

        // Check if user is owner
        const isOwner = org.owner_id === user.id

        // Check if user is a staff member
        const { data: staffMember, error: staffError } = await supabase
          .from('organization_staff')
          .select('id')
          .eq('organization_id', org.id)
          .eq('user_id', user.id)
          .single()

        if (isOwner || (!staffError && staffMember)) {
          setHasAccess(true)
        } else {
          setAccessError("You do not have access to this organization's documents")
        }
      } catch (error) {
        console.error('Error verifying access:', error)
        setAccessError("An error occurred while verifying access")
      } finally {
        setLoading(false)
      }
    }

    verifyAccess()
  }, [slug, user])

  const filteredDocs = mockDocuments.filter(doc =>
    doc.name.toLowerCase().includes(search.toLowerCase()) &&
    (selectedCategory === "all" || doc.type === selectedCategory)
  )
  const totalSize = mockDocuments.reduce((acc, doc) => {
    const size = parseFloat(doc.size)
    if (doc.size.includes("MB")) return acc + size
    if (doc.size.includes("KB")) return acc + size / 1024
    return acc
  }, 0)
  const maxStorage = 20 // MB, mock max storage
  const storagePercent = Math.min((totalSize / maxStorage) * 100, 100)
  const categories = [
    { key: "all", label: "All Documents" },
    { key: "image", label: "Images" },
    { key: "pdf", label: "PDFs" },
    { key: "excel", label: "Excel Files" },
    { key: "archive", label: "Archives" },
    { key: "text", label: "Text Files" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-10 px-4 flex items-center justify-center">
        <div className="text-center text-gray-400">Loading...</div>
      </div>
    )
  }

  if (accessError || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-950 py-10 px-4 flex items-center justify-center">
        <Card className="bg-gray-900/50 border-gray-800 max-w-md">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-4">{accessError || "You do not have access to this organization's documents"}</p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0 mb-8 md:mb-0">
          <Card className="bg-gray-900/50 border-gray-800 mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Library Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between text-sm text-gray-400">
                <span>{totalSize.toFixed(2)} MB used</span>
                <span>{maxStorage} MB</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mb-2">Storage usage is for demo purposes.</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {categories.map(cat => (
                  <li key={cat.key}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded transition-colors text-sm font-medium ${selectedCategory === cat.key ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                      onClick={() => setSelectedCategory(cat.key)}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
        {/* Main Content */}
        <div className="flex-1">
          <Card className="bg-gray-900/50 border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UploadCloud className="w-6 h-6 text-indigo-400" /> Organization Document Portal
              </CardTitle>
              {organization && (
                <p className="text-sm text-gray-400 mt-1">{organization.name}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold text-gray-200">{filteredDocs.length} Documents</span>
                  <span className="text-sm text-gray-400">{totalSize.toFixed(2)} MB used</span>
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Search documents..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-56"
                  />
                  <Button disabled variant="outline" className="flex items-center gap-2 cursor-not-allowed">
                    <UploadCloud className="w-4 h-4" /> Upload (Coming Soon)
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredDocs.length === 0 ? (
                  <div className="col-span-full text-gray-400 text-center py-8">No documents found.</div>
                ) : (
                  filteredDocs.map(doc => (
                    <div key={doc.name} className="bg-gray-800 rounded-lg p-5 flex flex-col gap-3 shadow hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3">
                        {getFileIcon(doc.type)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-100 truncate">{doc.name}</div>
                          <div className="text-xs text-gray-400">{doc.size} • Uploaded {doc.uploaded}</div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button asChild size="sm" variant="outline" className="flex items-center gap-1">
                          <a href={doc.url} download>
                            <Download className="w-4 h-4" /> Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 