"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Pencil, Trash2, Search, UserCheck } from "lucide-react";

const ROLES = [
  { value: "Owner", label: "Owner", color: "bg-purple-900/40 text-purple-400 border-purple-500/50" },
  { value: "Admin", label: "Admin", color: "bg-red-900/40 text-red-400 border-red-500/50" },
  { value: "Manager", label: "Manager", color: "bg-blue-900/40 text-blue-400 border-blue-500/50" },
  { value: "Member", label: "Member", color: "bg-green-900/40 text-green-400 border-green-500/50" },
  { value: "Viewer", label: "Viewer", color: "bg-gray-900/40 text-gray-400 border-gray-500/50" },
];

// Avatar border color by role (top-level)
const getAvatarBorderColorByRole = (role: string) => {
  const r = (role || '').toLowerCase();
  if (r === 'owner') return 'border-purple-400';
  if (r === 'admin') return 'border-red-400';
  if (r === 'manager') return 'border-blue-400';
  if (r === 'member') return 'border-green-400';
  return 'border-gray-400';
};

// Card style by level/role
const getCardStyle = (level: number, role: string) => {
  if (level === 0) {
    return 'bg-gradient-to-r from-purple-900/40 to-purple-800/40 border-purple-500/50 text-purple-300';
  } else if (level === 1) {
    return 'bg-gradient-to-r from-red-900/40 to-red-800/40 border-red-500/50 text-red-300';
  } else if (level === 2) {
    return 'bg-gradient-to-r from-blue-900/40 to-blue-800/40 border-blue-500/50 text-blue-300';
  } else if (level === 3) {
    return 'bg-gradient-to-r from-green-900/40 to-green-800/40 border-green-500/50 text-green-300';
  } else {
    return 'bg-gradient-to-r from-gray-900/40 to-gray-800/40 border-gray-500/50 text-gray-300';
  }
};

// Badge style by level/role
const getBadgeStyle = (level: number, role: string) => {
  if (level === 0) return 'bg-purple-900/60 text-purple-300 border-purple-500/50';
  if (level === 1) return 'bg-red-900/60 text-red-300 border-red-500/50';
  if (level === 2) return 'bg-blue-900/60 text-blue-300 border-blue-500/50';
  if (level === 3) return 'bg-green-900/60 text-green-300 border-green-500/50';
  return 'bg-gray-900/60 text-gray-300 border-gray-500/50';
};

export default function OrganizationStaffPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showSetManager, setShowSetManager] = useState(false);
  const [editStaff, setEditStaff] = useState<any>(null);
  const [selectedStaffForManager, setSelectedStaffForManager] = useState<any>(null);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", role: "Member", position: "", status: "Invited", avatar_url: "", access_level: 2, user_id: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const selectedOrganization = organizations.find(org => org.id === selectedOrg);

  // Check if user has permission to edit access levels
  const canEditAccessLevels = isOwner || userAccessLevel === 5;

  // Fetch organizations from the database
  useEffect(() => {
    const fetchOrgs = async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, owner_id")
        .order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        setOrganizations(data);
        if (data.length > 0) setSelectedOrg(data[0].id);
      }
    };
    fetchOrgs();
  }, []);

  // Check user's access level and ownership for selected organization
  useEffect(() => {
    if (!selectedOrg || !user) return;
    
    const checkUserPermissions = async () => {
      // Check if user is owner
      const selectedOrgObj = organizations.find(org => org.id === selectedOrg);
      const userIsOwner = selectedOrgObj && selectedOrgObj.owner_id === user.id;
      setIsOwner(userIsOwner);
      
      // Check users access level in staff table
      const { data: staffData, error } = await supabase
        .from("organization_staff")
        .select("access_level")
        .eq("user_id", user.id)
        .eq("organization_id", selectedOrg)
        .single();
      
      if (!error && staffData) {
        setUserAccessLevel(staffData.access_level);
      } else {
        setUserAccessLevel(null);
      }
    };
    
    checkUserPermissions();
  }, [selectedOrg, user, organizations]);

  // Fetch staff from API when selectedOrg changes
  useEffect(() => {
    if (!selectedOrg) return;
    setLoading(true);
    fetch(`/api/organization-staff?organizationId=${selectedOrg}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStaff(data);
        } else {
          setStaff([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setStaff([]);
        setLoading(false);
      });
  }, [selectedOrg]);

  // Filter staff based on search query
  const filteredStaff = staff.filter(member => {
    const user = member.user || {};
    return (
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.position || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      `level ${member.access_level}`.includes(searchQuery.toLowerCase()))
    );
  });

  // Group staff by position for category cards
  const staffByPosition = filteredStaff.reduce((acc, member) => {
    const position = member.position || "Unknown";
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(member);
    return acc;
  }, {} as Record<string, any[]>);

  const handleAddStaff = async () => {
    try {
      const response = await fetch('/api/organization-staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: selectedOrg,
          user_id: newStaff.user_id, // You'll need to get this from user lookup
          position: newStaff.position,
          role: newStaff.role,
          access_level: newStaff.access_level,
          status: newStaff.status,
          hire_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add staff member');
      }

      const addedStaff = await response.json();
      setStaff(prev => [addedStaff, ...prev]);
      setShowAdd(false);
      setNewStaff({ name: "", email: "", role: "Member", position: "", status: "Invited", avatar_url: "", access_level: 2, user_id: "" });
    } catch (error) {
      console.error('Error adding staff:', error);
      // You might want to show a toast notification here
    }
  };

  const handleEditStaff = async () => {
    try {
      const response = await fetch('/api/organization-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editStaff.id,
          position: editStaff.position,
          role: editStaff.role,
          access_level: editStaff.access_level,
          status: editStaff.status,
          hire_date: editStaff.hire_date,
          reports_to: editStaff.reports_to,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff member');
      }

      const updatedStaff = await response.json();
      setStaff(prev => prev.map(s => s.id === editStaff.id ? updatedStaff : s));
      setShowEdit(false);
      setEditStaff(null);
    } catch (error) {
      console.error('Error updating staff:', error);
      // You might want to show a toast notification here
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const response = await fetch(`/api/organization-staff?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete staff member');
      }

      setStaff(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting staff:', error);
      // You might want to show a toast notification here
    }
  };

  const handleSetManager = async (staffId: string, managerId: string | null) => {
    try {
      const response = await fetch('/api/organization-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: staffId,
          reports_to: managerId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update manager');
      }

      const updatedStaff = await response.json();
      setStaff(prev => prev.map(s => s.id === staffId ? updatedStaff : s));
      setShowSetManager(false);
      setSelectedStaffForManager(null);
    } catch (error) {
      console.error('Error setting manager:', error);
    }
  };

  // Build hierarchy tree
  const buildHierarchy = (staffList: any[]) => {
    const staffMap = new Map();
    const roots: any[] = [];

    // Create a map of all staff members
    staffList.forEach(staff => {
      staffMap.set(staff.id, { ...staff, children: [] });
    });

    // Build the tree structure
    staffList.forEach(staff => {
      if (staff.reports_to && staffMap.has(staff.reports_to)) {
        staffMap.get(staff.reports_to).children.push(staffMap.get(staff.id));
      } else {
        roots.push(staffMap.get(staff.id));
      }
    });

    return roots;
  };

  const hierarchyData = buildHierarchy(staff);

  // Recursive component to render hierarchy tree
  const HierarchyNode = ({ node, level = 0 }: { node: any; level?: number }) => {
    // Color scheme based on level and role
    const cardStyle = getCardStyle(level, node.role);
    const badgeStyle = getBadgeStyle(level, node.role);
    
    return (
      <div className="flex flex-col items-center">
        <div className={`${cardStyle} border rounded-lg p-3 text-center mb-4 ${level === 0 ? 'w-48' : level === 1 ? 'w-40' : 'w-32'}`}>
          <Avatar className={`mx-auto mb-2 border-2 ${getAvatarBorderColorByRole((node.role || ''))} ${level === 0 ? 'w-16 h-16' : level === 1 ? 'w-12 h-12' : 'w-10 h-10'}`}>
            <AvatarImage src={node.user?.avatar || undefined} alt={node.user?.name || node.name || ''} />
            <AvatarFallback className={level === 0 ? 'text-xl' : level === 1 ? 'text-lg' : 'text-base'}>
              {node.user?.name ? node.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : (node.name?.[0] || '?')}
            </AvatarFallback>
          </Avatar>
          <h4 className={`text-white font-medium ${level === 0 ? 'text-sm' : 'text-xs'}`}>
            {node.user?.name || "Unknown"}
          </h4>
          <p className={`${level === 0 ? 'text-xs' : 'text-xs'}`}>
            {node.position || "No Position"}
          </p>
          <Badge className={`${badgeStyle} mt-1 ${level === 0 ? 'text-xs' : 'text-xs'}`}>
            {node.role}
          </Badge>
          {node.manager && (
            <div className="text-xs text-gray-400 mt-1">
              Reports to: {node.manager.name}
            </div>
          )}
        </div>
        
        {node.children && node.children.length > 0 && (
          <>
            <div className="w-px h-6 bg-gradient-to-b from-gray-400 to-cyan-400 mb-4"></div>
            <div className="flex gap-4">
              {node.children.map((child: any, index: number) => (
                <div key={child.id} className="flex flex-col items-center">
                  {index > 0 && <div className="w-px h-6 bg-gradient-to-b from-gray-400 to-cyan-400 mb-4"></div>}
                  <HierarchyNode node={child} level={level + 1} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-20 px-4 flex flex-col items-center">
      <Card className="leonardo-card border-gray-800 mb-8 w-full">
        <CardHeader className="flex flex-col items-center">
          <Users className="w-10 h-10 text-cyan-400 mb-2" />
          <CardTitle className="text-2xl">Organization Staff Management</CardTitle>
          <CardDescription className="text-center mt-2">
            Manage team members and their roles in {selectedOrganization?.name || "your organization"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="org">Select Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mb-4">
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-cyan-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Staff</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Replace User ID input with Email input and lookup logic */}
                  <Input
                    placeholder="User Email"
                    value={newStaff.email}
                    onChange={async (e) => {
                      const email = e.target.value;
                      setNewStaff((prev) => ({ ...prev, email, user_id: "" }));
                      if (email && email.includes("@")) {
                        const { data, error } = await supabase
                          .from("users")
                          .select("id")
                          .eq("email", email)
                          .single();
                        if (data?.id) {
                          setNewStaff((prev) => ({ ...prev, user_id: data.id }));
                        }
                      }
                    }}
                  />
                  {newStaff.email && !newStaff.user_id && (
                    <div className="text-red-500 text-xs mt-1">No user found with this email.</div>
                  )}
                  {newStaff.user_id && (
                    <div className="text-green-500 text-xs mt-1">User found!</div>
                  )}
                  <Input placeholder="Position" value={newStaff.position} onChange={e => setNewStaff({ ...newStaff, position: e.target.value })} />
                  <Select value={newStaff.role} onValueChange={val => setNewStaff({ ...newStaff, role: val })}>
                    <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Label>Access Level</Label>
                    <Select 
                      value={String(newStaff.access_level)} 
                      onValueChange={val => setNewStaff({ ...newStaff, access_level: Number(val) })}
                      disabled={!canEditAccessLevels}
                    >
                      <SelectTrigger className={`w-full max-w-md bg-gray-900 border-gray-700 text-white ${!canEditAccessLevels ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Access Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Level 1 - Minimal Access</SelectItem>
                        <SelectItem value="2">Level 2 - Basic Access</SelectItem>
                        <SelectItem value="3">Level 3 - Standard Access</SelectItem>
                        <SelectItem value="4">Level 4 - Advanced Access</SelectItem>
                        <SelectItem value="5">Level 5 - Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                    {!canEditAccessLevels && (
                      <p className="text-xs text-gray-500">
                        Only organization owners and users with Access Level 5 can modify access levels.
                      </p>
                    )}
                  </div>
                  <Select value={newStaff.status} onValueChange={val => setNewStaff({ ...newStaff, status: val })}>
                    <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Invited">Invited</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddStaff} className="mt-4 w-full bg-cyan-700 text-white" disabled={!newStaff.user_id}>Add Staff</Button>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search staff by name, email, role, position, or access level..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="py-2 px-4">Name</th>
                  <th className="py-2 px-4">Email</th>
                  <th className="py-2 px-4">Position</th>
                  <th className="py-2 px-4">Role</th>
                  <th className="py-2 px-4">Access Level</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map(member => (
                  <tr key={member.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                    <td className="py-2 px-4 flex items-center gap-2">
                      <Avatar className={`w-8 h-8 border-2 ${getAvatarBorderColorByRole(member.role)}`}>
                        <AvatarImage src={member.user?.avatar || undefined} alt={member.user?.name || member.name || ''} />
                        <AvatarFallback>{member.user?.name ? member.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : (member.name?.[0] || '?')}</AvatarFallback>
                      </Avatar>
                      <span className="text-white font-medium">{member.user?.name || 'Unknown'}</span>
                    </td>
                    <td className="py-2 px-4 text-white">{member.user?.email || "Unknown"}</td>
                    <td className="py-2 px-4 text-white">{member.position}</td>
                    <td className="py-2 px-4">
                      <span className={`inline-block px-4 py-1 rounded-full font-semibold text-sm border ${ROLES.find(r => r.value.toLowerCase() === (member.role || "").toLowerCase())?.color}`}>{member.role}</span>
                    </td>
                    <td className="py-2 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        member.access_level === 5 ? 'bg-purple-900/40 text-purple-400 border border-purple-500/50' :
                        member.access_level === 4 ? 'bg-red-900/40 text-red-400 border border-red-500/50' :
                        member.access_level === 3 ? 'bg-blue-900/40 text-blue-400 border border-blue-500/50' :
                        member.access_level === 2 ? 'bg-green-900/40 text-green-400 border border-green-500/50' :
                        'bg-gray-900/40 text-gray-400 border border-gray-500/50'
                      }`}>
                        Level {member.access_level}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <Badge variant={member.status === "Active" ? "default" : member.status === "Invited" ? "secondary" : "outline"}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setEditStaff(member); setShowEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => { setSelectedStaffForManager(member); setShowSetManager(true); }}
                          title="Set Manager"
                        >
                          <Users className="w-4 h-4 text-blue-400" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteStaff(member.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStaff.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? `No staff members found matching "${searchQuery}"` : "No staff members found"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organizational Hierarchy - Separate Card */}
      <Card className="leonardo-card border-gray-800 mb-8 w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Organizational Hierarchy
          </CardTitle>
          <CardDescription>
            Visual representation of reporting relationships and organizational structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hierarchyData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No staff members found. Add staff members to see the organizational hierarchy.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {hierarchyData.map((root, index) => (
                <div key={root.id}>
                  {index > 0 && <div className="w-px h-8 bg-gradient-to-b from-gray-400 to-cyan-400 mb-8"></div>}
                  <HierarchyNode node={root} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {editStaff && (
            <div className="space-y-4">
              <Input placeholder="Full Name" value={editStaff.user?.name} onChange={e => setEditStaff({ ...editStaff, user: { ...editStaff.user, name: e.target.value } })} />
              <Input placeholder="Email" value={editStaff.user?.email} onChange={e => setEditStaff({ ...editStaff, user: { ...editStaff.user, email: e.target.value } })} />
              <Input placeholder="Position" value={editStaff.position} onChange={e => setEditStaff({ ...editStaff, position: e.target.value })} />
              <Select value={editStaff.role} onValueChange={val => setEditStaff({ ...editStaff, role: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select 
                  value={String(editStaff.access_level)} 
                  onValueChange={val => setEditStaff({ ...editStaff, access_level: Number(val) })}
                  disabled={!canEditAccessLevels}
                >
                  <SelectTrigger className={`w-full max-w-md bg-gray-900 border-gray-700 text-white ${!canEditAccessLevels ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder="Access Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Level 1 - Minimal Access</SelectItem>
                    <SelectItem value="2">Level 2 - Basic Access</SelectItem>
                    <SelectItem value="3">Level 3 - Standard Access</SelectItem>
                    <SelectItem value="4">Level 4 - Advanced Access</SelectItem>
                    <SelectItem value="5">Level 5 - Full Access</SelectItem>
                  </SelectContent>
                </Select>
                {!canEditAccessLevels && (
                  <p className="text-xs text-gray-500">
                    Only organization owners and users with Access Level 5 can modify access levels.
                  </p>
                )}
              </div>
              <Select value={editStaff.status} onValueChange={val => setEditStaff({ ...editStaff, status: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Invited">Invited</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleEditStaff} className="mt-4 w-full bg-cyan-700 text-white">Update Staff</Button>
        </DialogContent>
      </Dialog>

      {/* Set Manager Dialog */}
      <Dialog open={showSetManager} onOpenChange={setShowSetManager}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Manager for {selectedStaffForManager?.user?.name}</DialogTitle>
          </DialogHeader>
          {selectedStaffForManager && (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                Current manager: {selectedStaffForManager.manager?.name || "None"}
              </div>
              <div>
                <Label>Select Manager</Label>
                <Select 
                  value={selectedStaffForManager.reports_to || ""} 
                  onValueChange={(value) => {
                    const managerId = value === "none" ? null : value;
                    handleSetManager(selectedStaffForManager.id, managerId);
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager (Top Level)</SelectItem>
                    {staff
                      .filter(s => s.id !== selectedStaffForManager.id) // Can't report to self
                      .map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user?.name} - {member.position}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-gray-500">
                <p>• Select "No Manager" to make this person a top-level employee</p>
                <p>• Select another staff member to set up a reporting relationship</p>
                <p>• Changes will be reflected in the organizational hierarchy</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 