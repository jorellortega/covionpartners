'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multiselect';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Calendar as CalendarIcon, CheckCircle, Clock, Target, Users, TrendingUp, AlertCircle, Plus, Edit, Trash2, Calendar as CalendarIcon2, CalendarDays, CalendarRange, Eye, ListTodo, Search, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';

const supabase = createClientComponentClient();

interface CorporateTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string;
  assigned_by: string;
  due_date: string;
  category: 'strategy' | 'operations' | 'finance' | 'hr' | 'marketing' | 'technology' | 'other';
  project_id?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface OrganizationGoal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  status: 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  category: 'financial' | 'growth' | 'operational' | 'strategic';
  goal_type: 'weekly' | 'monthly' | 'yearly' | 'scheduled';
  project_id?: string;
  organization_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  subtasks_completed?: number;
  subtasks_total?: number;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
}

interface GoalSubtask {
  id: string;
  goal_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  assigned_users?: {
    id: string;
    name: string;
    email: string;
  }[];
}

export default function CorporatePage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [tasks, setTasks] = useState<CorporateTask[]>([]);
  const [goals, setGoals] = useState<OrganizationGoal[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingTask, setEditingTask] = useState<CorporateTask | null>(null);
  const [editingGoal, setEditingGoal] = useState<OrganizationGoal | null>(null);
  const [deletingTask, setDeletingTask] = useState<CorporateTask | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<OrganizationGoal | null>(null);
  const [viewingTask, setViewingTask] = useState<CorporateTask | null>(null);
  const [viewingGoal, setViewingGoal] = useState<OrganizationGoal | null>(null);
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterGoalType, setFilterGoalType] = useState<string>('all');
  const [organizationStaff, setOrganizationStaff] = useState<any[]>([]);
  const [activeGoalTab, setActiveGoalTab] = useState<string>('all');
  const [subtasks, setSubtasks] = useState<GoalSubtask[]>([]);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState<GoalSubtask | null>(null);
  const [deletingSubtask, setDeletingSubtask] = useState<GoalSubtask | null>(null);
  const [selectedGoalForSubtasks, setSelectedGoalForSubtasks] = useState<OrganizationGoal | null>(null);
  const [projectSearchGoal, setProjectSearchGoal] = useState<string>("");
  const [projectSearchGoalEdit, setProjectSearchGoalEdit] = useState<string>("");
  const [projectSearchTask, setProjectSearchTask] = useState<string>("");
  const [projectSearchTaskEdit, setProjectSearchTaskEdit] = useState<string>("");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    assigned_to: "unassigned",
    assigned_users: [] as string[],
    due_date: "",
    category: "other" as const,
    project_id: "no-project"
  });

  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    target_date: "",
    priority: "medium" as const,
    category: "strategic" as const,
    goal_type: "scheduled" as const,
    project_id: "no-project",
    assigned_to: "unassigned",
    assigned_users: [] as string[]
  });

  const [newSubtask, setNewSubtask] = useState({
    title: "",
    description: "",
    priority: "medium" as const,
    assigned_users: [] as string[],
    due_date: ""
  });

  const selectedOrganization = organizations.find(org => org.id === selectedOrg);

  // Check if user has permission to manage corporate tasks
  const canManageCorporate = isOwner || userAccessLevel >= 4;

  // Filter projects based on search query
  // Always includes the currently selected project (if any) even if it doesn't match the search
  const getFilteredProjects = (searchQuery: string, selectedProjectId?: string | null) => {
    if (!searchQuery.trim()) {
      return projects;
    }
    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(project => 
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
    
    // If there's a selected project and it's not in the filtered results, add it
    if (selectedProjectId && selectedProjectId !== 'no-project') {
      const selectedProject = projects.find(p => p.id === selectedProjectId);
      if (selectedProject && !filtered.find(p => p.id === selectedProjectId)) {
        return [selectedProject, ...filtered];
      }
    }
    
    return filtered;
  };

  // Fetch organizations from the database
  useEffect(() => {
    const fetchOrgs = async () => {
      if (!user) return;
      
      try {
        // Get organizations where user is staff
        const { data: staffOrgs, error: staffError } = await supabase
          .from("organization_staff")
          .select("organization_id, access_level")
          .eq("user_id", user.id);
        
        if (staffError) throw staffError;
        
        // Get organizations where user is owner
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from("organizations")
          .select("id, name, owner_id")
          .eq("owner_id", user.id);
          
        if (ownedError) throw ownedError;
        
        // Combine and get full org details
        const allOrgIds = new Set([
          ...(staffOrgs?.map(s => s.organization_id) || []),
          ...(ownedOrgs?.map(o => o.id) || [])
        ]);
        
        if (allOrgIds.size > 0) {
          const { data: orgDetails, error: detailsError } = await supabase
            .from("organizations")
            .select("id, name, owner_id")
            .in("id", Array.from(allOrgIds));
            
          if (detailsError) throw detailsError;
          
          // Add access level info
          const orgsWithAccess = orgDetails?.map(org => {
            const staffOrg = staffOrgs?.find(s => s.organization_id === org.id);
            const isOwned = ownedOrgs?.some(o => o.id === org.id);
            return {
              ...org,
              access_level: isOwned ? 5 : staffOrg?.access_level || 1,
              is_owner: isOwned
            };
          }) || [];
          
          setOrganizations(orgsWithAccess);
          if (orgsWithAccess.length > 0) {
            setSelectedOrg(orgsWithAccess[0].id);
            setUserAccessLevel(orgsWithAccess[0].access_level);
            setIsOwner(orgsWithAccess[0].is_owner);
          }
        }
      } catch (error) {
        console.error("Error fetching organizations:", error);
      }
    };
    
    fetchOrgs();
  }, [user]);

  // Fetch corporate tasks
  useEffect(() => {
    if (!selectedOrg) return;
    
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/corporate-tasks?organizationId=${selectedOrg}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 500) {
            // Tables don't exist yet or other DB error, set empty array
            console.log("Tables may not exist yet, setting empty tasks array");
            setTasks([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Corporate - Tasks received:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('[DEBUG] Corporate - Sample task:', {
            id: data[0].id,
            title: data[0].title,
            assigned_users_count: data[0].assigned_users?.length || 0,
            assigned_users: data[0].assigned_users?.map((u: any) => ({ name: u.name, email: u.email })) || [],
            assigned_to: data[0].assigned_to
          });
        }
        setTasks(data || []);
      } catch (error) {
        console.log("Error fetching tasks (tables may not exist yet):", error);
        // Set empty array on error to prevent UI issues
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [selectedOrg]);

  // Fetch projects for the organization
  useEffect(() => {
    if (!selectedOrg) {
      console.log('[DEBUG] Corporate - No selectedOrg, skipping project fetch');
      return;
    }
    
    console.log('[DEBUG] Corporate - Fetching projects for organization:', selectedOrg);
    
    const fetchProjects = async () => {
      try {
        const url = `/api/projects?organizationId=${selectedOrg}`;
        console.log('[DEBUG] Corporate - Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('[DEBUG] Corporate - Response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[DEBUG] Corporate - Projects received:', data?.length || 0);
          console.log('[DEBUG] Corporate - Projects data:', data?.map((p: any) => ({ id: p.id, name: p.name })));
          setProjects(data || []);
        } else {
          const errorText = await response.text();
          console.error('[DEBUG] Corporate - Error response:', response.status, errorText);
          console.log("No projects found or API not available yet");
          setProjects([]);
        }
      } catch (error) {
        console.error('[DEBUG] Corporate - Exception fetching projects:', error);
        console.log("Error fetching projects (tables may not exist yet):", error);
        setProjects([]);
      }
    };

    fetchProjects();
    
    // Reset filters when organization changes
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterCategory('all');
    setFilterProject('all');
    setFilterGoalType('all');
  }, [selectedOrg]);

  // Fetch organization staff members
  useEffect(() => {
    if (!selectedOrg) return;
    
    const fetchStaff = async () => {
      try {
        const { data, error } = await supabase
          .from('organization_staff')
          .select('id, user_id, access_level')
          .eq('organization_id', selectedOrg)
          .order('access_level', { ascending: false });

        if (error) {
          console.error('Error fetching staff:', error);
          setOrganizationStaff([]);
        } else {
          // Fetch user details separately to avoid complex joins
          const staffWithUsers = await Promise.all(
            (data || []).map(async (staff) => {
              const { data: userData } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', staff.user_id)
                .single();
              
              return {
                ...staff,
                user: userData || { name: 'Unknown', email: 'Unknown' }
              };
            })
          );
          
          setOrganizationStaff(staffWithUsers);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
        setOrganizationStaff([]);
      }
    };

    fetchStaff();
  }, [selectedOrg]);

  // Fetch organization goals
  useEffect(() => {
    if (!selectedOrg) return;
    
    const fetchGoals = async () => {
      try {
        const response = await fetch(`/api/organization-goals?organizationId=${selectedOrg}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 500) {
            // Tables don't exist yet or other DB error, set empty array
            console.log("Tables may not exist yet, setting empty goals array");
            setGoals([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[DEBUG] Corporate - Goals received:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('[DEBUG] Corporate - Sample goal:', {
            id: data[0].id,
            title: data[0].title,
            project_id: data[0].project_id,
            project: data[0].project,
            assigned_users_count: data[0].assigned_users?.length || 0,
            assigned_users: data[0].assigned_users?.map((u: any) => ({ name: u.name, email: u.email })) || [],
            assigned_to: data[0].assigned_to
          });
        }
        setGoals(data || []);
      } catch (error) {
        console.log("Error fetching goals (tables may not exist yet):", error);
        // Set empty array on error to prevent UI issues
        setGoals([]);
      }
    };

    fetchGoals();
  }, [selectedOrg]);

  const handleAddTask = async () => {
    if (!selectedOrg || !user) return;
    
    try {
      const response = await fetch('/api/corporate-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTask,
          organization_id: selectedOrg,
          assigned_to: newTask.assigned_to === 'unassigned' ? null : newTask.assigned_to,
          assigned_users: newTask.assigned_users,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTasks(prev => [data, ...prev]);
      setShowAddTask(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        assigned_to: "unassigned",
        assigned_users: [],
        due_date: "",
        category: "other",
        project_id: "no-project"
      });
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleAddGoal = async () => {
    if (!selectedOrg) return;
    
    try {
      const response = await fetch('/api/organization-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newGoal,
          organization_id: selectedOrg,
          assigned_to: newGoal.assigned_to === 'unassigned' ? null : newGoal.assigned_to,
          assigned_users: newGoal.assigned_users,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGoals(prev => [data, ...prev]);
      setShowAddGoal(false);
      setNewGoal({
        title: "",
        description: "",
        target_date: "",
        priority: "medium",
        category: "strategic",
        goal_type: "yearly",
        project_id: "no-project",
        assigned_to: "unassigned",
        assigned_users: []
      });
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch('/api/corporate-tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: status as any } : task
      ));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, status: string) => {
    try {
      const response = await fetch('/api/organization-goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: goalId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? { ...goal, status: status as any } : goal
      ));
    } catch (error) {
      console.error("Error updating goal status:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedOrg) return;
    
    try {
      const response = await fetch(`/api/corporate-tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      setDeletingTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!selectedOrg) return;
    
    try {
      const response = await fetch(`/api/organization-goals?id=${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      setDeletingGoal(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const handleUpdateTask = async (updatedTask: CorporateTask) => {
    if (!selectedOrg) return;
    
    try {
      const response = await fetch('/api/corporate-tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedTask,
          assigned_to: updatedTask.assigned_to === 'unassigned' ? null : updatedTask.assigned_to,
          assigned_users: updatedTask.assigned_users?.map(u => u.id) || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleUpdateGoal = async (updatedGoal: OrganizationGoal) => {
    if (!selectedOrg) return;
    
    const requestData = {
      id: updatedGoal.id,
      title: updatedGoal.title,
      description: updatedGoal.description,
      target_date: updatedGoal.target_date,
      status: updatedGoal.status,
      priority: updatedGoal.priority,
      category: updatedGoal.category,
      goal_type: updatedGoal.goal_type,
      organization_id: updatedGoal.organization_id,
      assigned_users: updatedGoal.assigned_users?.map(u => u.id) || [], // Only send assigned_users, not assigned_to
      project_id: updatedGoal.project_id === 'no-project' ? null : updatedGoal.project_id,
    };
    
    console.log('DEBUG: Sending goal update data:', requestData);
    
    try {
      const response = await fetch('/api/organization-goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('DEBUG: Server response error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('DEBUG: Goal update response:', data);
      
      setGoals(prev => prev.map(goal => 
        goal.id === updatedGoal.id ? data : goal
      ));
      setEditingGoal(null);
    } catch (error) {
      console.error("Error updating goal:", error);
    }
  };

  // Subtasks functions
  const fetchSubtasks = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goal-subtasks?goalId=${goalId}`);
      if (response.ok) {
        const data = await response.json();
        setSubtasks(data || []);
      } else {
        console.log("No subtasks found or API not available yet");
        setSubtasks([]);
      }
    } catch (error) {
      console.log("Error fetching subtasks:", error);
      setSubtasks([]);
    }
  };

  const handleAddSubtask = async () => {
    if (!selectedGoalForSubtasks) return;
    
    try {
      const response = await fetch('/api/goal-subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId: selectedGoalForSubtasks.id,
          ...newSubtask,
          assigned_users: newSubtask.assigned_users,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSubtasks(prev => [data, ...prev]);
      setShowAddSubtask(false);
      setNewSubtask({
        title: "",
        description: "",
        priority: "medium",
        assigned_users: [],
        due_date: ""
      });
      
      // Refresh goals to update subtask counts
      const goalsResponse = await fetch(`/api/organization-goals?organizationId=${selectedOrg}`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData || []);
      }
    } catch (error) {
      console.error("Error adding subtask:", error);
    }
  };

  const handleUpdateSubtask = async (updatedSubtask: GoalSubtask) => {
    try {
      const response = await fetch('/api/goal-subtasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedSubtask,
          assigned_users: updatedSubtask.assigned_users?.map(u => u.id) || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSubtasks(prev => prev.map(subtask => 
        subtask.id === updatedSubtask.id ? data : subtask
      ));
      setEditingSubtask(null);
      
      // Refresh goals to update subtask counts
      const goalsResponse = await fetch(`/api/organization-goals?organizationId=${selectedOrg}`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData || []);
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/goal-subtasks?id=${subtaskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
      setDeletingSubtask(null);
      
      // Refresh goals to update subtask counts
      const goalsResponse = await fetch(`/api/organization-goals?organizationId=${selectedOrg}`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData || []);
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const handleUpdateSubtaskStatus = async (subtaskId: string, status: string) => {
    try {
      const response = await fetch('/api/goal-subtasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: subtaskId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setSubtasks(prev => prev.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, status: status as any } : subtask
      ));
      
      // Refresh goals to update subtask counts
      const goalsResponse = await fetch(`/api/organization-goals?organizationId=${selectedOrg}`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData || []);
      }
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredTasks = (tasks?.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    if (filterProject !== 'all') {
      if (filterProject === 'no-project' && task.project_id !== null) return false;
      if (filterProject !== 'no-project' && task.project_id !== filterProject) return false;
    }
    return true;
  }) || []).sort((a, b) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Get due dates, defaulting to far future if no due date
    const getDueDate = (task: CorporateTask): Date => {
      if (!task.due_date) return new Date('9999-12-31');
      try {
        const date = new Date(task.due_date + 'T00:00:00');
        return isNaN(date.getTime()) ? new Date('9999-12-31') : date;
      } catch {
        return new Date('9999-12-31');
      }
    };
    
    const dateA = getDueDate(a);
    const dateB = getDueDate(b);
    
    // Check if dates are upcoming (in the future)
    const aIsUpcoming = dateA > now;
    const bIsUpcoming = dateB > now;
    
    // Upcoming tasks come first
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // If both are upcoming or both are not, sort by due date (earliest first)
    if (aIsUpcoming && bIsUpcoming) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // For non-upcoming tasks, sort by due date (most recent first)
    return dateB.getTime() - dateA.getTime();
  });

  const filteredGoals = (goals?.filter(goal => {
    if (filterProject !== 'all') {
      if (filterProject === 'no-project' && goal.project_id !== null) return false;
      if (filterProject !== 'no-project' && goal.project_id !== filterProject) return false;
    }
    if (filterGoalType !== 'all' && goal.goal_type !== filterGoalType) return false;
    return true;
  }) || []).sort((a, b) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Get target dates, defaulting to far future if no target date
    const getTargetDate = (goal: OrganizationGoal): Date => {
      if (!goal.target_date) return new Date('9999-12-31');
      try {
        const date = new Date(goal.target_date + 'T00:00:00');
        return isNaN(date.getTime()) ? new Date('9999-12-31') : date;
      } catch {
        return new Date('9999-12-31');
      }
    };
    
    const dateA = getTargetDate(a);
    const dateB = getTargetDate(b);
    
    // Check if dates are upcoming (in the future)
    const aIsUpcoming = dateA > now;
    const bIsUpcoming = dateB > now;
    
    // Upcoming goals come first
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (!aIsUpcoming && bIsUpcoming) return 1;
    
    // If both are upcoming or both are not, sort by target date (earliest first)
    if (aIsUpcoming && bIsUpcoming) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // For non-upcoming goals, sort by target date (most recent first)
    return dateB.getTime() - dateA.getTime();
  });

  // Separate goals by type for tabs
  const weeklyGoals = (goals?.filter(goal => goal.goal_type === 'weekly') || []);
  const monthlyGoals = (goals?.filter(goal => goal.goal_type === 'monthly') || []);
  const yearlyGoals = (goals?.filter(goal => goal.goal_type === 'yearly') || []);
  const scheduledGoals = (goals?.filter(goal => goal.goal_type === 'scheduled') || []);

  const pendingTasks = (tasks?.filter(t => t.status === 'pending') || []).length;
  const inProgressTasks = (tasks?.filter(t => t.status === 'in_progress') || []).length;
  const completedTasks = (tasks?.filter(t => t.status === 'completed') || []).length;
  const activeGoals = (goals?.filter(g => g.status === 'active') || []).length;
  
  // Calculate upcoming tasks and goals
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const upcomingTask = (tasks?.filter(task => {
    if (!task.due_date) return false;
    try {
      const dueDate = new Date(task.due_date + 'T00:00:00');
      return !isNaN(dueDate.getTime()) && dueDate > now;
    } catch {
      return false;
    }
  }) || []).sort((a, b) => {
    try {
      const dateA = new Date(a.due_date + 'T00:00:00');
      const dateB = new Date(b.due_date + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  })[0]; // Show only the next upcoming task
  
  const upcomingGoal = (goals?.filter(goal => {
    if (!goal.target_date) return false;
    try {
      const targetDate = new Date(goal.target_date + 'T00:00:00');
      return !isNaN(targetDate.getTime()) && targetDate > now;
    } catch {
      return false;
    }
  }) || []).sort((a, b) => {
    try {
      const dateA = new Date(a.target_date + 'T00:00:00');
      const dateB = new Date(b.target_date + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  })[0]; // Show only the next upcoming goal

  // Helper function to render goals list
  const renderGoalsList = (goalsList: OrganizationGoal[]) => {
    if (goalsList.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No goals found for this time period</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {goalsList.map((goal) => {
          const isExpanded = expandedGoals.has(goal.id);
          return (
            <Collapsible
              key={goal.id}
              open={isExpanded}
              onOpenChange={(open) => {
                const newSet = new Set(expandedGoals);
                if (open) {
                  newSet.add(goal.id);
                } else {
                  newSet.delete(goal.id);
                }
                setExpandedGoals(newSet);
              }}
            >
              <div
                className="rounded-lg p-3 sm:p-4 mb-3 border border-gray-700"
                style={{ backgroundColor: '#000000' }}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-2 w-full">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    <div className="font-semibold text-white text-sm sm:text-base">{goal.title}</div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col sm:flex-row items-start gap-3 mt-3 pt-3 border-t border-gray-700">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 text-xs text-gray-400/25 hover:text-gray-400 transition-colors">
                        <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                        <span>Target: {goal.target_date ? (() => {
                          try {
                            const date = new Date(goal.target_date + 'T00:00:00');
                            return isNaN(date.getTime()) ? '--' : date.toLocaleDateString();
                          } catch {
                            return '--';
                          }
                        })() : '--'}</span>
                      </div>
                      {goal.project && goal.project.id && (
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          <span className="text-xs text-gray-400">Project:</span>
                          <Link 
                            href={`/projects/${goal.project.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-block"
                          >
                            <Badge className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30 transition-colors cursor-pointer">
                              {goal.project.name}
                            </Badge>
                          </Link>
                        </div>
                      )}
                      {goal.assigned_users && goal.assigned_users.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 flex-wrap">
                          <span className="text-xs text-gray-400">Assigned to:</span>
                          {goal.assigned_users.map((assignedUser, index) => (
                            <Badge key={index} className="text-xs bg-green-600/20 text-green-300 border-green-500/30">
                              {assignedUser.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {goal.description && (
                        <div className="text-xs text-gray-400 leading-relaxed">
                          {goal.description}
                        </div>
                      )}
                    </div>
                    {canManageCorporate && (
                      <div className="w-full sm:w-auto flex flex-col sm:flex-col gap-3">
                        <Select value={goal.status} onValueChange={(value) => handleUpdateGoalStatus(goal.id, value)}>
                          <SelectTrigger className="w-full sm:w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2 sm:gap-1 flex-wrap sm:flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-2 sm:px-2 sm:py-1 bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 flex-1 sm:flex-1 min-w-0"
                            onClick={() => setViewingGoal(goal)}
                          >
                            <Eye className="w-3 h-3 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-2 sm:px-2 sm:py-1 bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30 flex-1 sm:flex-1 min-w-0 overflow-hidden"
                            onClick={() => {
                              setSelectedGoalForSubtasks(goal);
                              fetchSubtasks(goal.id);
                            }}
                          >
                            <div className="flex items-center gap-1 sm:gap-1 min-w-0">
                              <ListTodo className="w-3 h-3 flex-shrink-0" />
                              <span className="hidden sm:inline flex-shrink-0">Subtasks</span>
                              {goal.subtasks_total && goal.subtasks_total > 0 && (() => {
                                const completed = Number.isFinite(goal.subtasks_completed) ? goal.subtasks_completed : 0;
                                const total = Number.isFinite(goal.subtasks_total) ? goal.subtasks_total : 0;
                                if (isNaN(completed) || isNaN(total)) {
                                  console.log('[DEBUG] NaN detected in subtasks display:', { 
                                    goalId: goal.id, 
                                    completed: goal.subtasks_completed, 
                                    total: goal.subtasks_total,
                                    completedType: typeof goal.subtasks_completed,
                                    totalType: typeof goal.subtasks_total
                                  });
                                }
                                return (
                                  <span className="bg-purple-500/30 px-1 rounded text-xs hidden sm:inline flex-shrink-0">
                                    {String(completed)}/{String(total)}
                                  </span>
                                );
                              })()}
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-2 sm:px-2 sm:py-1 bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30 flex-1 sm:flex-1 min-w-0"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit className="w-3 h-3 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3 py-2 sm:px-2 sm:py-1 bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30 flex-1 sm:flex-1 min-w-0"
                            onClick={() => setDeletingGoal(goal)}
                          >
                            <Trash2 className="w-3 h-3 mr-0 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please log in to access the corporate dashboard</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Corporate Dashboard</h1>
          <p className="text-gray-600">Manage organizational goals, tasks, and strategic objectives</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedOrg && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {!upcomingTask ? (
                  <p className="text-sm text-gray-500">No upcoming tasks</p>
                ) : (() => {
                  const dueDate = upcomingTask.due_date ? (() => {
                    try {
                      const date = new Date(upcomingTask.due_date + 'T00:00:00');
                      return isNaN(date.getTime()) ? null : date;
                    } catch {
                      return null;
                    }
                  })() : null;
                  
                  return (
                    <div
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => setViewingTask(upcomingTask)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{upcomingTask.title}</p>
                        {dueDate && (
                          <p className="text-xs text-gray-400">
                            Due: {dueDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {!upcomingGoal ? (
                  <p className="text-sm text-gray-500">No upcoming goals</p>
                ) : (() => {
                  const targetDate = upcomingGoal.target_date ? (() => {
                    try {
                      const date = new Date(upcomingGoal.target_date + 'T00:00:00');
                      return isNaN(date.getTime()) ? null : date;
                    } catch {
                      return null;
                    }
                  })() : null;
                  
                  return (
                    <div
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => setViewingGoal(upcomingGoal)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{upcomingGoal.title}</p>
                        {targetDate && (
                          <p className="text-xs text-gray-400">
                            Target: {targetDate.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterGoalType} onValueChange={setFilterGoalType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Goal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          {canManageCorporate && (
            <div className="flex gap-2">
              <Dialog open={showAddTask} onOpenChange={(open) => {
                setShowAddTask(open);
                if (!open) {
                  setProjectSearchTask(""); // Clear search when dialog closes
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Corporate Task</DialogTitle>
                    <DialogDescription>Create a new task for organizational staff</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Task description"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newTask.category} onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strategy">Strategy</SelectItem>
                        <SelectItem value="operations">Operations</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assign To (Optional)</label>
                      <MultiSelect
                        options={organizationStaff.map(staff => ({
                          value: staff.id,
                          label: staff.user?.name || staff.user?.email || 'Unknown'
                        }))}
                        value={newTask.assigned_users}
                        onChange={(values) => setNewTask(prev => ({ ...prev, assigned_users: values }))}
                        placeholder="Select team members"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={newTask.due_date || ''}
                        onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                        className="w-full calendar-picker-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project (Optional)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search projects..."
                          value={projectSearchTask}
                          onChange={(e) => setProjectSearchTask(e.target.value)}
                          className="pl-10 mb-2"
                        />
                      </div>
                      <Select value={newTask.project_id} onValueChange={(value) => {
                        console.log('[DEBUG] Corporate - Task project selected:', value);
                        setNewTask(prev => ({ ...prev, project_id: value }));
                        if (value !== 'no-project') {
                          setProjectSearchTask(""); // Clear search when project is selected
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Project (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-project">No Project</SelectItem>
                          {(() => {
                            const filteredProjects = getFilteredProjects(projectSearchTask, newTask.project_id);
                            return filteredProjects.length > 0 ? (
                              filteredProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-projects" disabled>
                                {projects.length === 0 
                                  ? "No projects available (check console)"
                                  : `No projects match "${projectSearchTask}"`
                                }
                              </SelectItem>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                      {projects.length === 0 && (
                        <p className="text-xs text-yellow-400">⚠️ Debug: No projects found. Check browser console and server logs for details.</p>
                      )}
                      {projects.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Showing {getFilteredProjects(projectSearchTask, newTask.project_id).length} of {projects.length} project(s)
                          {projectSearchTask && ` matching "${projectSearchTask}"`}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => {
                      handleAddTask();
                      setProjectSearchTask(""); // Clear search after adding
                    }} className="w-full">Add Task</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddGoal} onOpenChange={(open) => {
                setShowAddGoal(open);
                if (!open) {
                  setProjectSearchGoal(""); // Clear search when dialog closes
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Add Goal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Organization Goal</DialogTitle>
                    <DialogDescription>Create a new strategic goal for the organization</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Goal title"
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Goal description"
                      value={newGoal.description}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <Select value={newGoal.priority} onValueChange={(value) => setNewGoal(prev => ({ ...prev, priority: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="strategic">Strategic</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newGoal.goal_type} onValueChange={(value) => setNewGoal(prev => ({ ...prev, goal_type: value as any }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Goal Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Assign To (Optional)</label>
                      <MultiSelect
                        options={organizationStaff.map(staff => ({
                          value: staff.id,
                          label: staff.user?.name || staff.user?.email || 'Unknown'
                        }))}
                        value={newGoal.assigned_users}
                        onChange={(values) => setNewGoal(prev => ({ ...prev, assigned_users: values }))}
                        placeholder="Select team members"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Date</label>
                      <Input
                        type="date"
                        value={newGoal.target_date || ''}
                        onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                        className="w-full calendar-picker-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project (Optional)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search projects..."
                          value={projectSearchGoal}
                          onChange={(e) => setProjectSearchGoal(e.target.value)}
                          className="pl-10 mb-2"
                        />
                      </div>
                      <Select value={newGoal.project_id} onValueChange={(value) => {
                        console.log('[DEBUG] Corporate - Goal project selected:', value);
                        setNewGoal(prev => ({ ...prev, project_id: value }));
                        if (value !== 'no-project') {
                          setProjectSearchGoal(""); // Clear search when project is selected
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Project (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-project">No Project</SelectItem>
                          {(() => {
                            const filteredProjects = getFilteredProjects(projectSearchGoal, newGoal.project_id);
                            return filteredProjects.length > 0 ? (
                              filteredProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-projects" disabled>
                                {projects.length === 0 
                                  ? "No projects available (check console)"
                                  : `No projects match "${projectSearchGoal}"`
                                }
                              </SelectItem>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                      {projects.length === 0 && (
                        <p className="text-xs text-yellow-400">⚠️ Debug: No projects found. Check browser console and server logs for details.</p>
                      )}
                      {projects.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Showing {getFilteredProjects(projectSearchGoal, newGoal.project_id).length} of {projects.length} project(s)
                          {projectSearchGoal && ` matching "${projectSearchGoal}"`}
                        </p>
                      )}
                    </div>
                    <Button onClick={() => {
                      handleAddGoal();
                      setProjectSearchGoal(""); // Clear search after adding
                    }} className="w-full">Add Goal</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Tasks Section */}
          <Card>
            <CardHeader>
              <CardTitle>Corporate Tasks</CardTitle>
              <CardDescription>Manage organizational tasks and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {tasks.length === 0 && !loading ? (
                    <div>
                      <p>No tasks found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Database tables may not be set up yet. Run the migration to create the corporate_tasks table.
                      </p>
                    </div>
                  ) : (
                    "No tasks match the current filters"
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id);
                    return (
                      <Collapsible
                        key={task.id}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newSet = new Set(expandedTasks);
                          if (open) {
                            newSet.add(task.id);
                          } else {
                            newSet.delete(task.id);
                          }
                          setExpandedTasks(newSet);
                        }}
                      >
                        <div
                          className="rounded-lg p-2 sm:p-3 mb-2 border border-gray-700"
                          style={{ backgroundColor: '#000000' }}
                        >
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-start gap-2 sm:gap-3 w-full">
                              <div className="flex-1 flex items-center gap-2">
                                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                <div className="font-semibold text-white text-xs sm:text-base">{task.title}</div>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="flex items-start gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-700">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-400">
                                  <span>Status: <span className="font-medium">{task.status}</span></span>
                                  <span>Due: {task.due_date ? (() => {
                                    try {
                                      const date = new Date(task.due_date + 'T00:00:00');
                                      return isNaN(date.getTime()) ? '--' : date.toLocaleDateString();
                                    } catch {
                                      return '--';
                                    }
                                  })() : '--'}</span>
                                  <span>Priority: <span className="font-medium">{task.priority}</span></span>
                                  <span>Category: <span className="font-medium">{task.category}</span></span>
                                </div>
                                {task.description && (
                                  <div className="mt-1 text-xs text-gray-400">
                                    {task.description}
                                  </div>
                                )}
                                {task.project && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-gray-400">Project:</span>
                                    <Badge className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30">
                                      {task.project.name}
                                    </Badge>
                                  </div>
                                )}
                                {task.assigned_users && task.assigned_users.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                                    <span className="text-xs text-gray-400">Assigned to:</span>
                                    {task.assigned_users.map((assignedUser, index) => (
                                      <Badge key={index} className="text-xs bg-green-600/20 text-green-300 border-green-500/30">
                                        {assignedUser.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {canManageCorporate && (
                                <div className="flex flex-col gap-2 mt-2">
                                  <Select value={task.status} onValueChange={(value) => handleUpdateTaskStatus(task.id, value)}>
                                    <SelectTrigger className="w-full text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex gap-1 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-2 py-1 bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30 flex-1 min-w-0"
                                      onClick={() => setViewingTask(task)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-2 py-1 bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30 flex-1 min-w-0"
                                      onClick={() => setEditingTask(task)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs px-2 py-1 bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30 flex-1 min-w-0"
                                      onClick={() => setDeletingTask(task)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals Section with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Goals</CardTitle>
              <CardDescription>Strategic objectives and organizational targets</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No goals found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Database tables may not be set up yet. Run the migration to create the organization_goals table.
                  </p>
                </div>
              ) : (
                <Tabs value={activeGoalTab} onValueChange={setActiveGoalTab} className="w-full">
                  <div className="relative">
                    <div className="overflow-x-auto scrollbar-hide">
                      <TabsList className="inline-flex w-max min-w-full gap-1 p-1 bg-gray-800/50">
                        <TabsTrigger value="all" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                          <Target className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">All Goals</span>
                          <span className="sm:hidden">All</span>
                          <span className="text-xs ml-1">({goals.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="weekly" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                          <CalendarIcon2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Weekly</span>
                          <span className="sm:hidden">Week</span>
                          <span className="text-xs ml-1">({weeklyGoals.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Monthly</span>
                          <span className="sm:hidden">Month</span>
                          <span className="text-xs ml-1">({monthlyGoals.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="yearly" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                          <CalendarRange className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Yearly</span>
                          <span className="sm:hidden">Year</span>
                          <span className="text-xs ml-1">({yearlyGoals.length})</span>
                        </TabsTrigger>
                        <TabsTrigger value="scheduled" className="flex items-center gap-1 text-xs sm:text-sm px-3 py-2 whitespace-nowrap">
                          <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="hidden sm:inline">Scheduled</span>
                          <span className="sm:hidden">Sched</span>
                          <span className="text-xs ml-1">({scheduledGoals.length})</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  
                  <TabsContent value="all" className="mt-4">
                    {renderGoalsList(filteredGoals)}
                  </TabsContent>
                  
                  <TabsContent value="weekly" className="mt-4">
                    {renderGoalsList(weeklyGoals)}
                  </TabsContent>
                  
                  <TabsContent value="monthly" className="mt-4">
                    {renderGoalsList(monthlyGoals)}
                  </TabsContent>
                  
                  <TabsContent value="yearly" className="mt-4">
                    {renderGoalsList(yearlyGoals)}
                  </TabsContent>
                  
                  <TabsContent value="scheduled" className="mt-4">
                    {renderGoalsList(scheduledGoals)}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!selectedOrg && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Selected</h3>
          <p className="text-gray-500">Please select an organization to view the corporate dashboard</p>
        </div>
      )}

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTask && handleDeleteTask(deletingTask.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => {
        if (!open) {
          setEditingTask(null);
          setProjectSearchTaskEdit(""); // Clear search when dialog closes
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={editingTask?.title || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
            <Textarea
              placeholder="Task description"
              value={editingTask?.description || ''}
              onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
            />
            <Select value={editingTask?.priority || 'medium'} onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, priority: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editingTask?.category || 'other'} onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, category: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To (Optional)</label>
              <MultiSelect
                options={organizationStaff.map(staff => ({
                  value: staff.id,
                  label: staff.user?.name || staff.user?.email || 'Unknown'
                }))}
                value={editingTask?.assigned_users?.map(u => u.id) || []}
                onChange={(values) => setEditingTask(prev => prev ? { 
                  ...prev, 
                  assigned_users: values.map(id => {
                    const staff = organizationStaff.find(s => s.id === id);
                    return {
                      id,
                      name: staff?.user?.name || staff?.user?.email || 'Unknown',
                      email: staff?.user?.email || '',
                      avatar_url: staff?.profile?.avatar_url || ''
                    };
                  })
                } : null)}
                placeholder="Select team members"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={editingTask?.due_date || ''}
                onChange={(e) => setEditingTask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
                className="w-full calendar-picker-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project (Optional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={projectSearchTaskEdit}
                  onChange={(e) => setProjectSearchTaskEdit(e.target.value)}
                  className="pl-10 mb-2"
                />
              </div>
              <Select value={editingTask?.project_id || 'no-project'} onValueChange={(value) => {
                console.log('[DEBUG] Corporate - Editing task project selected:', value);
                setEditingTask(prev => prev ? { ...prev, project_id: value } : null);
                if (value !== 'no-project') {
                  setProjectSearchTaskEdit(""); // Clear search when project is selected
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">No Project</SelectItem>
                  {(() => {
                    const filteredProjects = getFilteredProjects(projectSearchTaskEdit, editingTask?.project_id);
                    return filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>
                        {projects.length === 0 
                          ? "No projects available (check console)"
                          : `No projects match "${projectSearchTaskEdit}"`
                        }
                      </SelectItem>
                    );
                  })()}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-yellow-400">⚠️ Debug: No projects found. Check browser console and server logs for details.</p>
              )}
              {projects.length > 0 && (
                <p className="text-xs text-gray-400">
                  Showing {getFilteredProjects(projectSearchTaskEdit, editingTask?.project_id).length} of {projects.length} project(s)
                  {projectSearchTaskEdit && ` matching "${projectSearchTaskEdit}"`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingTask(null);
                setProjectSearchTaskEdit(""); // Clear search when canceling
              }} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => {
                if (editingTask) {
                  handleUpdateTask(editingTask);
                  setProjectSearchTaskEdit(""); // Clear search after updating
                }
              }} className="flex-1">Update Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => {
        if (!open) {
          setEditingGoal(null);
          setProjectSearchGoalEdit(""); // Clear search when dialog closes
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update goal details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Goal title"
              value={editingGoal?.title || ''}
              onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
            <Textarea
              placeholder="Goal description"
              value={editingGoal?.description || ''}
              onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
            />
            <Select value={editingGoal?.priority || 'medium'} onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, priority: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editingGoal?.category || 'strategic'} onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, category: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="growth">Growth</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editingGoal?.goal_type || 'yearly'} onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, goal_type: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Goal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To (Optional)</label>
              <MultiSelect
                options={organizationStaff.map(staff => ({
                  value: staff.id,
                  label: staff.user?.name || staff.user?.email || 'Unknown'
                }))}
                value={editingGoal?.assigned_users?.map(u => u.id) || []}
                onChange={(values) => setEditingGoal(prev => prev ? { 
                  ...prev, 
                  assigned_users: values.map(id => {
                    const staff = organizationStaff.find(s => s.id === id);
                    return {
                      id,
                      name: staff?.user?.name || staff?.user?.email || 'Unknown',
                      email: staff?.user?.email || '',
                      avatar_url: staff?.profile?.avatar_url || ''
                    };
                  })
                } : null)}
                placeholder="Select team members"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Date</label>
              <Input
                type="date"
                value={editingGoal?.target_date || ''}
                onChange={(e) => setEditingGoal(prev => prev ? { ...prev, target_date: e.target.value } : null)}
                className="w-full calendar-picker-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project (Optional)</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={projectSearchGoalEdit}
                  onChange={(e) => setProjectSearchGoalEdit(e.target.value)}
                  className="pl-10 mb-2"
                />
              </div>
              <Select value={editingGoal?.project_id || 'no-project'} onValueChange={(value) => {
                console.log('[DEBUG] Corporate - Editing goal project selected:', value);
                setEditingGoal(prev => prev ? { ...prev, project_id: value } : null);
                if (value !== 'no-project') {
                  setProjectSearchGoalEdit(""); // Clear search when project is selected
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">No Project</SelectItem>
                  {(() => {
                    const filteredProjects = getFilteredProjects(projectSearchGoalEdit, editingGoal?.project_id);
                    return filteredProjects.length > 0 ? (
                      filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-projects" disabled>
                        {projects.length === 0 
                          ? "No projects available (check console)"
                          : `No projects match "${projectSearchGoalEdit}"`
                        }
                      </SelectItem>
                    );
                  })()}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-yellow-400">⚠️ Debug: No projects found. Check browser console and server logs for details.</p>
              )}
              {projects.length > 0 && (
                <p className="text-xs text-gray-400">
                  Showing {getFilteredProjects(projectSearchGoalEdit, editingGoal?.project_id).length} of {projects.length} project(s)
                  {projectSearchGoalEdit && ` matching "${projectSearchGoalEdit}"`}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => {
                setEditingGoal(null);
                setProjectSearchGoalEdit(""); // Clear search when canceling
              }} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => {
                if (editingGoal) {
                  handleUpdateGoal(editingGoal);
                  setProjectSearchGoalEdit(""); // Clear search after updating
                }
              }} className="flex-1">Update Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Goal Confirmation Dialog */}
      <AlertDialog open={!!deletingGoal} onOpenChange={() => setDeletingGoal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingGoal?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGoal && handleDeleteGoal(deletingGoal.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Task Dialog */}
      <Dialog open={!!viewingTask} onOpenChange={() => {
        console.log('[DEBUG] View Task Dialog closing, viewingTask:', viewingTask);
        setViewingTask(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{viewingTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewingTask?.description && (
              <div>
                <p className="text-gray-300 whitespace-pre-wrap">{viewingTask.description}</p>
              </div>
            )}
            
            <div className="text-sm text-gray-400/25">
              <strong>Due Date:</strong> {viewingTask?.due_date ? (() => {
                try {
                  const date = new Date(viewingTask.due_date + 'T00:00:00');
                  const isValid = !isNaN(date.getTime());
                  if (!isValid) {
                    console.log('[DEBUG] Invalid date in viewingTask:', viewingTask.due_date);
                  }
                  return isValid ? date.toLocaleDateString() : 'Invalid date';
                } catch (e) {
                  console.log('[DEBUG] Error parsing date in viewingTask:', viewingTask.due_date, e);
                  return 'Invalid date';
                }
              })() : 'No due date'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Goal Dialog */}
      <Dialog open={!!viewingGoal} onOpenChange={() => {
        console.log('[DEBUG] View Goal Dialog closing, viewingGoal:', viewingGoal);
        if (viewingGoal) {
          console.log('[DEBUG] viewingGoal subtasks_completed:', viewingGoal.subtasks_completed, 'type:', typeof viewingGoal.subtasks_completed);
          console.log('[DEBUG] viewingGoal subtasks_total:', viewingGoal.subtasks_total, 'type:', typeof viewingGoal.subtasks_total);
          console.log('[DEBUG] isNaN checks:', {
            completed: isNaN(Number(viewingGoal.subtasks_completed)),
            total: isNaN(Number(viewingGoal.subtasks_total))
          });
        }
        setViewingGoal(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{viewingGoal?.title}</DialogTitle>
            <DialogDescription>Complete goal details and information</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {viewingGoal?.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap p-3 rounded-lg" style={{ backgroundColor: '#141414' }}>{viewingGoal.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Status</h4>
                  <Badge className={`${
                    viewingGoal?.status === 'active' ? 'bg-green-600/20 text-green-300 border-green-500/30' :
                    viewingGoal?.status === 'completed' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                    'bg-yellow-600/20 text-yellow-300 border-yellow-500/30'
                  }`}>
                    {viewingGoal?.status?.charAt(0).toUpperCase() + viewingGoal?.status?.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Priority</h4>
                  <Badge className={`${
                    viewingGoal?.priority === 'high' ? 'bg-red-600/20 text-red-300 border-red-500/30' :
                    viewingGoal?.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' :
                    'bg-green-600/20 text-green-300 border-green-500/30'
                  }`}>
                    {viewingGoal?.priority?.charAt(0).toUpperCase() + viewingGoal?.priority?.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Category</h4>
                  <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                    {viewingGoal?.category?.charAt(0).toUpperCase() + viewingGoal?.category?.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Goal Type</h4>
                  <Badge className={`${
                    viewingGoal?.goal_type === 'weekly' ? 'bg-blue-600/20 text-blue-300 border-blue-500/30' :
                    viewingGoal?.goal_type === 'monthly' ? 'bg-green-600/20 text-green-300 border-green-500/30' :
                    viewingGoal?.goal_type === 'yearly' ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' :
                    'bg-orange-600/20 text-orange-300 border-orange-500/30'
                  }`}>
                    {viewingGoal?.goal_type?.charAt(0).toUpperCase() + viewingGoal?.goal_type?.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-1">Target Date</h4>
                  <p className="text-gray-300">
                    {viewingGoal?.target_date ? (() => {
                      try {
                        const date = new Date(viewingGoal.target_date + 'T00:00:00');
                        const isValid = !isNaN(date.getTime());
                        if (!isValid) {
                          console.log('[DEBUG] Invalid target_date in viewingGoal:', viewingGoal.target_date);
                        }
                        return isValid ? date.toLocaleDateString() : 'Invalid date';
                      } catch (e) {
                        console.log('[DEBUG] Error parsing target_date in viewingGoal:', viewingGoal.target_date, e);
                        return 'Invalid date';
                      }
                    })() : 'No target date set'}
                  </p>
                </div>
                
                <div className="hover:text-gray-300 transition-colors">
                  <h4 className="text-sm font-semibold text-gray-300/25 hover:text-gray-300 transition-colors mb-1">Created</h4>
                  <p className="text-gray-300/25 hover:text-gray-300 transition-colors">
                    {viewingGoal?.created_at ? (() => {
                      try {
                        const date = new Date(viewingGoal.created_at);
                        const isValid = !isNaN(date.getTime());
                        if (!isValid) {
                          console.log('[DEBUG] Invalid created_at in viewingGoal:', viewingGoal.created_at);
                        }
                        return isValid ? date.toLocaleDateString() : 'Unknown';
                      } catch (e) {
                        console.log('[DEBUG] Error parsing created_at in viewingGoal:', viewingGoal.created_at, e);
                        return 'Unknown';
                      }
                    })() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            
            {viewingGoal?.project && viewingGoal.project.id && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Associated Project</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">Project:</span>
                    <Link 
                      href={`/projects/${viewingGoal.project.id}`}
                      className="inline-block"
                    >
                      <Badge className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30 transition-colors cursor-pointer">
                        {viewingGoal.project.name}
                      </Badge>
                    </Link>
                  </div>
                  {viewingGoal.project.description && (
                    <p className="text-gray-400 text-sm mt-1">{viewingGoal.project.description}</p>
                  )}
                </div>
              </div>
            )}
            
            {viewingGoal?.assigned_users && viewingGoal.assigned_users.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Assigned Team Members</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingGoal.assigned_users.map((assignedUser, index) => (
                    <Badge key={index} className="bg-green-600/20 text-green-300 border-green-500/30">
                      {assignedUser.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Subtasks Dialog */}
      <Dialog open={!!selectedGoalForSubtasks} onOpenChange={() => setSelectedGoalForSubtasks(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Subtasks for "{selectedGoalForSubtasks?.title}"
            </DialogTitle>
            <DialogDescription className="text-sm">Manage subtasks for this goal</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Subtask Button */}
            {canManageCorporate && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <Button
                  onClick={() => setShowAddSubtask(true)}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Subtask
                </Button>
                <div className="text-sm text-gray-400 text-center sm:text-right w-full sm:w-auto">
                  {subtasks.filter(s => s.status === 'completed').length} of {subtasks.length} completed
                </div>
              </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2">
              {subtasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No subtasks found for this goal</p>
                </div>
              ) : (
                subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className="flex flex-col sm:flex-row items-start gap-3 rounded-lg p-3 border border-gray-700 bg-gray-800/50"
                  >
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium text-white text-sm">{subtask.title}</div>
                        <Badge className={`text-xs ${
                          subtask.priority === 'high' ? 'bg-red-600/20 text-red-300 border-red-500/30' :
                          subtask.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30' :
                          'bg-green-600/20 text-green-300 border-green-500/30'
                        }`}>
                          {subtask.priority}
                        </Badge>
                      </div>
                      {subtask.description && (
                        <div className="text-xs text-gray-400 mb-2 leading-relaxed">{subtask.description}</div>
                      )}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-xs text-gray-400">
                        <span className="text-gray-400/25 hover:text-gray-400 transition-colors">Due: {subtask.due_date ? (() => {
                          try {
                            const date = new Date(subtask.due_date + 'T00:00:00');
                            return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
                          } catch {
                            return 'Invalid date';
                          }
                        })() : 'No due date'}</span>
                        {subtask.assigned_users && subtask.assigned_users.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span>Assigned to:</span>
                            {subtask.assigned_users.map((user, idx) => (
                              <Badge key={idx} className="text-xs bg-green-600/20 text-green-300 border-green-500/30">
                                {user.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {(!subtask.assigned_users || subtask.assigned_users.length === 0) && subtask.assigned_user && (
                          <span>Assigned to: {subtask.assigned_user.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select 
                        value={subtask.status} 
                        onValueChange={(value) => handleUpdateSubtaskStatus(subtask.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {canManageCorporate && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                            onClick={() => setEditingSubtask(subtask)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30"
                            onClick={() => setDeletingSubtask(subtask)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Subtask Dialog */}
      <Dialog open={showAddSubtask} onOpenChange={setShowAddSubtask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subtask</DialogTitle>
            <DialogDescription>Create a new subtask for this goal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Subtask title"
              value={newSubtask.title}
              onChange={(e) => setNewSubtask(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Subtask description"
              value={newSubtask.description}
              onChange={(e) => setNewSubtask(prev => ({ ...prev, description: e.target.value }))}
            />
            <Select value={newSubtask.priority} onValueChange={(value) => setNewSubtask(prev => ({ ...prev, priority: value as any }))}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To (Optional)</label>
              <MultiSelect
                options={organizationStaff.map(staff => ({
                  value: staff.id,
                  label: staff.user?.name || staff.user?.email || 'Unknown'
                }))}
                value={newSubtask.assigned_users}
                onChange={(values) => setNewSubtask(prev => ({ ...prev, assigned_users: values }))}
                placeholder="Select team members"
              />
            </div>
            <Input
              type="date"
              placeholder="Due Date"
              value={newSubtask.due_date}
              onChange={(e) => setNewSubtask(prev => ({ ...prev, due_date: e.target.value }))}
              className="calendar-picker-white"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowAddSubtask(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={handleAddSubtask} className="flex-1">Add Subtask</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subtask Dialog */}
      <Dialog open={!!editingSubtask} onOpenChange={() => setEditingSubtask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subtask</DialogTitle>
            <DialogDescription>Update subtask details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Subtask title"
              value={editingSubtask?.title || ''}
              onChange={(e) => setEditingSubtask(prev => prev ? { ...prev, title: e.target.value } : null)}
            />
            <Textarea
              placeholder="Subtask description"
              value={editingSubtask?.description || ''}
              onChange={(e) => setEditingSubtask(prev => prev ? { ...prev, description: e.target.value } : null)}
            />
            <Select value={editingSubtask?.priority || 'medium'} onValueChange={(value) => setEditingSubtask(prev => prev ? { ...prev, priority: value as any } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To (Optional)</label>
              <MultiSelect
                options={organizationStaff.map(staff => ({
                  value: staff.id,
                  label: staff.user?.name || staff.user?.email || 'Unknown'
                }))}
                value={editingSubtask?.assigned_users?.map(u => u.id) || []}
                onChange={(values) => setEditingSubtask(prev => prev ? {
                  ...prev,
                  assigned_users: values.map(id => {
                    const staff = organizationStaff.find(s => s.id === id);
                    return {
                      id,
                      name: staff?.user?.name || staff?.user?.email || 'Unknown',
                      email: staff?.user?.email || ''
                    };
                  })
                } : null)}
                placeholder="Select team members"
              />
            </div>
            <Input
              type="date"
              placeholder="Due Date"
              value={editingSubtask?.due_date || ''}
              onChange={(e) => setEditingSubtask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
              className="calendar-picker-white"
            />
            <div className="flex gap-2">
              <Button onClick={() => setEditingSubtask(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => editingSubtask && handleUpdateSubtask(editingSubtask)} className="flex-1">Update Subtask</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subtask Confirmation Dialog */}
      <AlertDialog open={!!deletingSubtask} onOpenChange={() => setDeletingSubtask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subtask</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSubtask?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingSubtask && handleDeleteSubtask(deletingSubtask.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
