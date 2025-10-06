'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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
import { Calendar as CalendarIcon, CheckCircle, Clock, Target, Users, TrendingUp, AlertCircle, Plus, Edit, Trash2, Calendar as CalendarIcon2, CalendarDays, CalendarRange, Eye, ListTodo } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    assigned_to: "unassigned",
    due_date: ""
  });

  const selectedOrganization = organizations.find(org => org.id === selectedOrg);

  // Check if user has permission to manage corporate tasks
  const canManageCorporate = isOwner || userAccessLevel >= 4;

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
    if (!selectedOrg) return;
    
    const fetchProjects = async () => {
      try {
        const response = await fetch(`/api/projects?organizationId=${selectedOrg}`);
        if (response.ok) {
          const data = await response.json();
          setProjects(data || []);
        } else {
          console.log("No projects found or API not available yet");
          setProjects([]);
        }
      } catch (error) {
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
      assigned_to: updatedGoal.assigned_to === 'unassigned' ? null : updatedGoal.assigned_to,
      assigned_users: updatedGoal.assigned_users?.map(u => u.id) || [],
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

      setGoals(prev => prev.map(goal => 
        goal.id === updatedGoal.id ? updatedGoal : goal
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
          assigned_to: newSubtask.assigned_to === 'unassigned' ? null : newSubtask.assigned_to,
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
        assigned_to: "unassigned",
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
          assigned_to: updatedSubtask.assigned_to === 'unassigned' ? null : updatedSubtask.assigned_to,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSubtasks(prev => prev.map(subtask => 
        subtask.id === updatedSubtask.id ? updatedSubtask : subtask
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
  }) || []);

  const filteredGoals = (goals?.filter(goal => {
    if (filterProject !== 'all') {
      if (filterProject === 'no-project' && goal.project_id !== null) return false;
      if (filterProject !== 'no-project' && goal.project_id !== filterProject) return false;
    }
    if (filterGoalType !== 'all' && goal.goal_type !== filterGoalType) return false;
    return true;
  }) || []);

  // Separate goals by type for tabs
  const weeklyGoals = (goals?.filter(goal => goal.goal_type === 'weekly') || []);
  const monthlyGoals = (goals?.filter(goal => goal.goal_type === 'monthly') || []);
  const yearlyGoals = (goals?.filter(goal => goal.goal_type === 'yearly') || []);
  const scheduledGoals = (goals?.filter(goal => goal.goal_type === 'scheduled') || []);

  const pendingTasks = (tasks?.filter(t => t.status === 'pending') || []).length;
  const inProgressTasks = (tasks?.filter(t => t.status === 'in_progress') || []).length;
  const completedTasks = (tasks?.filter(t => t.status === 'completed') || []).length;
  const activeGoals = (goals?.filter(g => g.status === 'active') || []).length;

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
        {goalsList.map((goal) => (
          <div
            key={goal.id}
            className="flex flex-col sm:flex-row items-start gap-3 rounded-lg p-3 sm:p-4 mb-3 cursor-pointer hover:bg-gray-800 transition border border-gray-700"
            style={{ backgroundColor: '#000000' }}
          >
            <div className="flex-1 w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-semibold text-white text-sm sm:text-base">{goal.title}</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 text-xs text-gray-400/25 hover:text-gray-400 transition-colors">
                <span>Target: {goal.target_date ? new Date(goal.target_date + 'T00:00:00').toLocaleDateString() : '--'}</span>
              </div>
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
                      {goal.subtasks_total && goal.subtasks_total > 0 && (
                        <span className="bg-purple-500/30 px-1 rounded text-xs hidden sm:inline flex-shrink-0">
                          {goal.subtasks_completed || 0}/{goal.subtasks_total}
                        </span>
                      )}
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
        ))}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGoals}</div>
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
              <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
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
                        className="w-full"
                      />
                    </div>
                    <Select value={newTask.project_id} onValueChange={(value) => setNewTask(prev => ({ ...prev, project_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Project (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No Project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddTask} className="w-full">Add Task</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
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
                        className="w-full"
                      />
                    </div>
                    <Select value={newGoal.project_id} onValueChange={(value) => setNewGoal(prev => ({ ...prev, project_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Project (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-project">No Project</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddGoal} className="w-full">Add Goal</Button>
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
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 mb-2 cursor-pointer hover:bg-gray-800 transition border border-gray-700"
                      style={{ backgroundColor: '#000000' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white text-xs sm:text-base">{task.title}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-400">
                          <span>Status: <span className="font-medium">{task.status}</span></span>
                          <span>Due: {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString() : '--'}</span>
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
                  ))}
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
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
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
                className="w-full"
              />
            </div>
            <Select value={editingTask?.project_id || 'no-project'} onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, project_id: value } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => setEditingTask(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => editingTask && handleUpdateTask(editingTask)} className="flex-1">Update Task</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
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
                className="w-full"
              />
            </div>
            <Select value={editingGoal?.project_id || 'no-project'} onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, project_id: value } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-project">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => setEditingGoal(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={() => editingGoal && handleUpdateGoal(editingGoal)} className="flex-1">Update Goal</Button>
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
      <Dialog open={!!viewingTask} onOpenChange={() => setViewingTask(null)}>
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
              <strong>Due Date:</strong> {viewingTask?.due_date ? new Date(viewingTask.due_date + 'T00:00:00').toLocaleDateString() : 'No due date'}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Goal Dialog */}
      <Dialog open={!!viewingGoal} onOpenChange={() => setViewingGoal(null)}>
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
                    {viewingGoal?.target_date ? new Date(viewingGoal.target_date + 'T00:00:00').toLocaleDateString() : 'No target date set'}
                  </p>
                </div>
                
                <div className="hover:text-gray-300 transition-colors">
                  <h4 className="text-sm font-semibold text-gray-300/25 hover:text-gray-300 transition-colors mb-1">Created</h4>
                  <p className="text-gray-300/25 hover:text-gray-300 transition-colors">
                    {viewingGoal?.created_at ? new Date(viewingGoal.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            
            {viewingGoal?.project && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Associated Project</h4>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-gray-300 font-medium">{viewingGoal.project.name}</p>
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
                        <span className="text-gray-400/25 hover:text-gray-400 transition-colors">Due: {subtask.due_date ? new Date(subtask.due_date + 'T00:00:00').toLocaleDateString() : 'No due date'}</span>
                        {subtask.assigned_user && (
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
            <Select value={newSubtask.assigned_to} onValueChange={(value) => setNewSubtask(prev => ({ ...prev, assigned_to: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Assign To (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {organizationStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.user?.name || staff.user?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Due Date"
              value={newSubtask.due_date}
              onChange={(e) => setNewSubtask(prev => ({ ...prev, due_date: e.target.value }))}
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
            <Select value={editingSubtask?.assigned_to || 'unassigned'} onValueChange={(value) => setEditingSubtask(prev => prev ? { ...prev, assigned_to: value } : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Assign To (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {organizationStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.user?.name || staff.user?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Due Date"
              value={editingSubtask?.due_date || ''}
              onChange={(e) => setEditingSubtask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
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
