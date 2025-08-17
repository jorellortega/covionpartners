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

  MapPin,
  Calendar,
  Tags,
  ExternalLink,
  X
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
  platform_user_id?: string // Add this field for platform users
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
      
      if (!user?.id) return

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching contacts:', error)
        toast({
          title: "Error",
          description: "Failed to fetch contacts",
          variant: "destructive"
        })
        return
      }

      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
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
      notes: '',
      category: 'other',
      is_favorite: false,
      tags: ['platform-user'],
      platform_user_id: userData.id, // Store the platform user ID directly
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    await addContact(newContact)
    setShowUserSearch(false)
    setUserSearchQuery('')
    setSearchResults([])
  }

  const addContact = async (contactData: Contact) => {
    try {
      if (!user?.id) return

      // Prepare the data with proper column names
      const insertData = {
        user_id: user.id,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        "position": contactData.position, // Quote the position column
        website: contactData.website,
        address: contactData.address,
        notes: contactData.notes,
        category: contactData.category,
        is_favorite: contactData.is_favorite,
        tags: contactData.tags,
        platform_user_id: contactData.platform_user_id
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error

      setContacts(prev => [data, ...prev])
      setShowAddDialog(false)
      resetForm()
      toast({
        title: "Success",
        description: "Contact added successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Error adding contact:', error)
      toast({
        title: "Error",
        description: "Failed to add contact",
        variant: "destructive"
      })
    }
  }

  const updateContact = async (contactData: Contact) => {
    try {
      // Prepare the update data with proper column names
      const updateData = {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        "position": contactData.position, // Quote the position column
        website: contactData.website,
        address: contactData.address,
        notes: contactData.notes,
        category: contactData.category,
        is_favorite: contactData.is_favorite,
        tags: contactData.tags,
        platform_user_id: contactData.platform_user_id
      }

      const { error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactData.id)

      if (error) throw error

      setContacts(prev => prev.map(c => c.id === contactData.id ? { ...c, ...contactData } : c))
      setEditingContact(null)
      toast({
        title: "Success",
        description: "Contact updated successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Error updating contact:', error)
      toast({
        title: "Error",
        description: "Failed to update contact",
        variant: "destructive"
      })
    }
  }

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      setContacts(prev => prev.filter(c => c.id !== contactId))
      toast({
        title: "Success",
        description: "Contact deleted successfully",
        variant: "default"
      })
    } catch (error) {
      console.error('Error deleting contact:', error)
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive"
      })
    }
  }

  const toggleFavorite = async (contactId: string) => {
    try {
      const contact = contacts.find(c => c.id === contactId)
      if (!contact) return

      const { error } = await supabase
        .from('contacts')
        .update({ is_favorite: !contact.is_favorite })
        .eq('id', contactId)

      if (error) throw error

      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, is_favorite: !c.is_favorite } : c
      ))
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive"
      })
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      })
      return
    }

    if (editingContact) {
      await updateContact({ ...editingContact, ...formData })
    } else {
      await addContact({
        ...formData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory
    const matchesFavorites = !showOnlyFavorites || contact.is_favorite

    return matchesSearch && matchesCategory && matchesFavorites
  })

  const exportContacts = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Company', 'Position', 'Website', 'Address', 'Notes', 'Category', 'Tags'],
      ...filteredContacts.map(contact => [
        contact.name,
        contact.email || '',
        contact.phone || '',
        contact.company || '',
        contact.position || '',
        contact.website || '',
        contact.address || '',
        contact.notes || '',
        contact.category,
        contact.tags.join(', ')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Please log in to access contacts</h1>
            <Button onClick={() => router.push('/login')}>Go to Login</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Contacts</h1>
              <p className="text-gray-400">Manage your professional network</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={exportContacts}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showOnlyFavorites ? "default" : "outline"}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={showOnlyFavorites ? "bg-blue-600 hover:bg-blue-700" : "border-gray-600 text-gray-300 hover:bg-gray-800"}
          >
            <MapPin className={`w-4 h-4 mr-2 ${showOnlyFavorites ? 'text-white' : 'text-blue-500'}`} />
            Pinned
          </Button>
        </div>

        {/* User Search */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Find Platform Users
          </Button>
          
          {showUserSearch && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Search by email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Button
                  onClick={() => setShowUserSearch(false)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {searchingUsers && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => router.push(`/profile/${user.id}`)}
                          title="Click to view profile"
                        >
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt={user.name || user.email}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">${user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addUserAsContact(user)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Add as Contact
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contacts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="border-gray-800 bg-gray-800/50 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || selectedCategory !== 'all' || showOnlyFavorites
                ? 'Try adjusting your search criteria'
                : 'Start building your network by adding your first contact'
              }
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="border-gray-800 bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          // If this is a platform user, navigate to their profile
                          if (contact.platform_user_id) {
                            router.push(`/profile/${contact.platform_user_id}`);
                          }
                        }}
                        title={contact.platform_user_id ? "Click to view profile" : "Contact avatar"}
                      >
                        <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                        <p className="text-gray-400">{contact.position || 'No position'}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
                        <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteContact(contact.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${contact.email}`} className="text-blue-400 hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${contact.phone}`} className="text-blue-400 hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    
                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{contact.company}</span>
                      </div>
                    )}
                    
                    {contact.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a 
                          href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          {contact.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {contact.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`border-gray-600 ${
                        contact.category === 'business' ? 'text-blue-400' :
                        contact.category === 'personal' ? 'text-green-400' :
                        contact.category === 'client' ? 'text-purple-400' :
                        contact.category === 'vendor' ? 'text-orange-400' :
                        'text-gray-400'
                      }`}
                    >
                      {contact.category}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(contact.id)}
                      className={contact.is_favorite ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-blue-500'}
                    >
                      <MapPin className={`w-5 h-5 ${contact.is_favorite ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showAddDialog || !!editingContact} onOpenChange={() => {
        setShowAddDialog(false)
        setEditingContact(null)
        resetForm()
      }}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update your contact information' : 'Add a new contact to your network'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
                placeholder="Add any additional notes about this contact..."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="developer, mobile, react"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_favorite"
                checked={formData.is_favorite}
                onChange={(e) => setFormData(prev => ({ ...prev, is_favorite: e.target.checked }))}
                className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="is_favorite">Pin this contact</Label>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setEditingContact(null)
                  resetForm()
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 