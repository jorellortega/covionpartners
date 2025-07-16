"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Globe,
  ArrowLeft,
  MoreVertical,
  UserPlus,
  Filter,
  Download,
  Upload,
  Star,
  StarOff,
  MapPin,
  Calendar,
  Tags,
  ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  position?: string
  website?: string
  address?: string
  notes?: string
  category: 'business' | 'personal' | 'client' | 'vendor' | 'other'
  is_favorite: boolean
  tags: string[]
  created_at: string
  updated_at: string
}

export default function ContactsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const supabaseClient = createClientComponentClient()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    website: '',
    address: '',
    notes: '',
    category: 'business' as 'business' | 'personal' | 'client' | 'vendor' | 'other',
    tags: [] as string[],
    is_favorite: false
  })

  useEffect(() => {
    if (user) {
      fetchContacts()
    }
  }, [user])

  // Debounce user search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery.length >= 3) {
        searchUsers(userSearchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [userSearchQuery])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      // For now, using localStorage until we create the contacts table
      const savedContacts = localStorage.getItem(`contacts_${user?.id}`)
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts))
      } else {
        // Add mock data if no saved contacts exist
        const mockContacts: Contact[] = [
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@techcorp.com',
            phone: '+1 (555) 123-4567',
            company: 'TechCorp Solutions',
            position: 'Senior Developer',
            website: 'https://techcorp.com',
            address: '123 Tech Street, San Francisco, CA 94105',
            notes: 'Great collaboration on the mobile app project. Very responsive and detail-oriented.',
            category: 'business',
            is_favorite: true,
            tags: ['developer', 'mobile', 'react', 'team'],
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            name: 'Mike Chen',
            email: 'mike.chen@designstudio.co',
            phone: '+1 (555) 987-6543',
            company: 'Creative Design Studio',
            position: 'UX Designer',
            website: 'https://designstudio.co',
            address: '456 Design Ave, New York, NY 10001',
            notes: 'Excellent eye for user experience. Worked on several successful projects together.',
            category: 'client',
            is_favorite: true,
            tags: ['designer', 'ux', 'creative', 'contractor'],
            created_at: '2024-01-10T14:20:00Z',
            updated_at: '2024-01-10T14:20:00Z'
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            email: 'emily.rodriguez@marketing.pro',
            phone: '+1 (555) 456-7890',
            company: 'Marketing Pro Agency',
            position: 'Digital Marketing Manager',
            website: 'https://marketingpro.agency',
            address: '789 Marketing Blvd, Austin, TX 78701',
            notes: 'Handles all our digital marketing campaigns. Very results-driven.',
            category: 'vendor',
            is_favorite: false,
            tags: ['marketing', 'digital', 'campaigns'],
            created_at: '2024-01-08T09:15:00Z',
            updated_at: '2024-01-08T09:15:00Z'
          },
          {
            id: '4',
            name: 'David Williams',
            email: 'david.williams@freelance.com',
            phone: '+1 (555) 321-9876',
            company: 'Freelance',
            position: 'Full Stack Developer',
            website: 'https://davidwilliams.dev',
            address: '321 Code Lane, Seattle, WA 98101',
            notes: 'Reliable freelancer for backend development. Quick turnaround times.',
            category: 'business',
            is_favorite: false,
            tags: ['freelancer', 'backend', 'nodejs'],
            created_at: '2024-01-05T16:45:00Z',
            updated_at: '2024-01-05T16:45:00Z'
          },
          {
            id: '5',
            name: 'Lisa Thompson',
            email: 'lisa.thompson@gmail.com',
            phone: '+1 (555) 654-3210',
            company: '',
            position: '',
            website: '',
            address: '987 Oak Street, Portland, OR 97201',
            notes: 'College friend who moved to Portland. Great photographer.',
            category: 'personal',
            is_favorite: true,
            tags: ['friend', 'photographer', 'college'],
            created_at: '2024-01-03T11:30:00Z',
            updated_at: '2024-01-03T11:30:00Z'
          },
          {
            id: '6',
            name: 'James Anderson',
            email: 'j.anderson@consulting.biz',
            phone: '+1 (555) 789-0123',
            company: 'Anderson Consulting',
            position: 'Business Consultant',
            website: 'https://andersonconsulting.biz',
            address: '654 Business Park Dr, Chicago, IL 60601',
            notes: 'Helped with business strategy planning. Very insightful and professional.',
            category: 'client',
            is_favorite: false,
            tags: ['consultant', 'strategy', 'business'],
            created_at: '2024-01-01T08:00:00Z',
            updated_at: '2024-01-01T08:00:00Z'
          },
          {
            id: '7',
            name: 'Maria Garcia',
            email: 'maria.garcia@lawfirm.com',
            phone: '+1 (555) 234-5678',
            company: 'Garcia & Associates Law Firm',
            position: 'Corporate Lawyer',
            website: 'https://garcialaw.com',
            address: '111 Legal Plaza, Los Angeles, CA 90210',
            notes: 'Handles all legal matters for the company. Very thorough and knowledgeable.',
            category: 'vendor',
            is_favorite: false,
            tags: ['lawyer', 'legal', 'corporate'],
            created_at: '2023-12-28T13:20:00Z',
            updated_at: '2023-12-28T13:20:00Z'
          },
          {
            id: '8',
            name: 'Robert Kim',
            email: 'robert.kim@startup.io',
            phone: '+1 (555) 567-8901',
            company: 'Innovation Startup',
            position: 'Co-founder & CTO',
            website: 'https://innovationstartup.io',
            address: '222 Startup St, San Jose, CA 95110',
            notes: 'Met at tech conference. Interesting AI startup. Potential collaboration opportunity.',
            category: 'other',
            is_favorite: true,
            tags: ['startup', 'ai', 'cto', 'hired'],
            created_at: '2023-12-25T19:45:00Z',
            updated_at: '2023-12-25T19:45:00Z'
          },
          {
            id: '9',
            name: 'Jennifer Walsh',
            email: 'jen.walsh@accounting.pro',
            phone: '+1 (555) 890-1234',
            company: 'Walsh Accounting Services',
            position: 'Senior Accountant',
            website: 'https://walshaccounting.pro',
            address: '333 Finance Blvd, Miami, FL 33101',
            notes: 'Company accountant. Handles all financial reporting and tax preparation.',
            category: 'vendor',
            is_favorite: false,
            tags: ['accounting', 'finance', 'taxes'],
            created_at: '2023-12-20T10:15:00Z',
            updated_at: '2023-12-20T10:15:00Z'
          },
          {
            id: '10',
            name: 'Alex Murphy',
            email: 'alex.murphy@email.com',
            phone: '+1 (555) 012-3456',
            company: '',
            position: '',
            website: 'https://alexmurphy.blog',
            address: '444 Writer Ave, Boston, MA 02101',
            notes: 'Content writer and blogger. Good for copywriting projects.',
            category: 'personal',
            is_favorite: false,
            tags: ['writer', 'blogger', 'content'],
            created_at: '2023-12-15T15:30:00Z',
            updated_at: '2023-12-15T15:30:00Z'
          }
        ]
        
        setContacts(mockContacts)
        // Also save to localStorage so the mock data persists
        localStorage.setItem(`contacts_${user?.id}`, JSON.stringify(mockContacts))
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async (email: string) => {
    if (!email || email.length < 3) {
      setSearchResults([])
      return
    }

    try {
      setSearchingUsers(true)
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, avatar_url')
        .ilike('email', `%${email}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      })
    } finally {
      setSearchingUsers(false)
    }
  }

  const addUserAsContact = async (userData: any) => {
    // Check if user is already a contact
    const existingContact = contacts.find(contact => contact.email === userData.email)
    if (existingContact) {
      toast({
        title: "Info",
        description: "This user is already in your contacts",
        variant: "default"
      })
      return
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      name: userData.name || userData.email,
      email: userData.email,
      phone: '',
      company: '',
      position: '',
      website: '',
      address: '',
      notes: `Added from user search`,
      category: 'business',
      is_favorite: false,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedContacts = [...contacts, newContact]
    saveContactsToStorage(updatedContacts)

    toast({
      title: "Success",
      description: "User added to contacts successfully"
    })

    setShowUserSearch(false)
    setUserSearchQuery('')
    setSearchResults([])
  }

  const saveContactsToStorage = (updatedContacts: Contact[]) => {
    localStorage.setItem(`contacts_${user?.id}`, JSON.stringify(updatedContacts))
    setContacts(updatedContacts)
  }

  const handleAddContact = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive"
      })
      return
    }

    const newContact: Contact = {
      id: Date.now().toString(),
      ...formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const updatedContacts = [...contacts, newContact]
    saveContactsToStorage(updatedContacts)

    toast({
      title: "Success",
      description: "Contact added successfully"
    })

    setShowAddDialog(false)
    resetForm()
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return

    const updatedContacts = contacts.map(contact =>
      contact.id === editingContact.id
        ? { ...formData, id: editingContact.id, created_at: editingContact.created_at, updated_at: new Date().toISOString() }
        : contact
    )

    saveContactsToStorage(updatedContacts)

    toast({
      title: "Success",
      description: "Contact updated successfully"
    })

    setEditingContact(null)
    resetForm()
  }

  const handleDeleteContact = async (contactId: string) => {
    const updatedContacts = contacts.filter(contact => contact.id !== contactId)
    saveContactsToStorage(updatedContacts)

    toast({
      title: "Success",
      description: "Contact deleted successfully"
    })
  }

  const toggleFavorite = (contactId: string) => {
    const updatedContacts = contacts.map(contact =>
      contact.id === contactId
        ? { ...contact, is_favorite: !contact.is_favorite, updated_at: new Date().toISOString() }
        : contact
    )
    saveContactsToStorage(updatedContacts)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      website: '',
      address: '',
      notes: '',
      category: 'business',
      tags: [],
      is_favorite: false
    })
  }

  const openEditDialog = (contact: Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      website: contact.website || '',
      address: contact.address || '',
      notes: contact.notes || '',
      category: contact.category,
      tags: contact.tags || [],
      is_favorite: contact.is_favorite
    })
    setEditingContact(contact)
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.position?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory
    const matchesFavorites = !showOnlyFavorites || contact.is_favorite

    return matchesSearch && matchesCategory && matchesFavorites
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'business':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'personal':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'client':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50'
      case 'vendor':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access your contacts</h1>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4 hover:bg-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-2 mr-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Contacts</h1>
                  <p className="text-gray-400">Manage your contact library</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              >
                {showOnlyFavorites ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
              </Button>
              <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-gray-700 hover:bg-blue-900/20 hover:text-blue-400"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find User
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Search Users</DialogTitle>
                    <DialogDescription>
                      Search for existing users by their email address and add them to your contacts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by email address..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="mt-4 max-h-60 overflow-y-auto">
                      {searchingUsers ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
                          <span className="ml-2 text-gray-400">Searching...</span>
                        </div>
                      ) : userSearchQuery.length >= 3 ? (
                        searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((user) => (
                              <div key={user.id} className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800/50">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                      {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : user.email[0].toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{user.name || user.email}</p>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => addUserAsContact(user)}
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No users found with that email</p>
                          </div>
                        )
                      ) : userSearchQuery.length > 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>Type at least 3 characters to search</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Contact</DialogTitle>
                    <DialogDescription>
                      Add a new contact to your library
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position</Label>
                        <Input
                          id="position"
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          placeholder="Job title"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Full address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddContact}>Add Contact</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Team Members</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => 
                    c.category === 'business' || 
                    c.tags.some(tag => ['employee', 'team', 'hired', 'freelancer', 'contractor'].includes(tag.toLowerCase()))
                  ).length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Contacts</p>
                  <p className="text-2xl font-bold">{contacts.length}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Business</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.category === 'business').length}</p>
                </div>
                <Building className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Clients</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.category === 'client').length}</p>
                </div>
                <UserPlus className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Favorites</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.is_favorite).length}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading contacts...</p>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || selectedCategory !== 'all' || showOnlyFavorites
                ? 'Try adjusting your search or filters'
                : 'Start building your contact library by adding your first contact'}
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Contact
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="leonardo-card border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contact.name}</CardTitle>
                        <p className="text-sm text-gray-400">{contact.position}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(contact.id)}
                        className={contact.is_favorite ? 'text-yellow-400' : 'text-gray-400'}
                      >
                        {contact.is_favorite ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(contact)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{contact.phone}</span>
                      </div>
                    )}
                    {contact.company && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{contact.company}</span>
                      </div>
                    )}
                    {contact.website && (
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Website
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <Badge className={`${getCategoryColor(contact.category)} border text-xs`}>
                        {contact.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div>
                <Label htmlFor="edit-position">Position</Label>
                <Input
                  id="edit-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Job title"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContact(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateContact}>Update Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 