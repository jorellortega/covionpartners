'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Target, Users, AlertCircle } from 'lucide-react';

const supabase = createClientComponentClient();

interface AssignedTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  category: string;
  project?: {
    id: string;
    name: string;
    description?: string;
  };
  assigned_by_staff?: {
    user: {
      name: string;
      email: string;
    };
    profile: {
      avatar_url: string;
    };
  };
}

interface AssignedGoal {
  id: string;
  title: string;
  description: string;
  target_date: string;
  status: string;
  priority: string;
  category: string;
  assigned_by_staff?: {
    user: {
      name: string;
      email: string;
    };
    profile: {
      avatar_url: string;
    };
  };
}

export default function MyAssignmentsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [assignedGoals, setAssignedGoals] = useState<AssignedGoal[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's organizations
  useEffect(() => {
    const fetchOrgs = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('organization_staff')
          .select(`
            organization:organizations(
              id,
              name,
              description
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching organizations:', error);
        } else {
          const orgs = data?.map(item => item.organization).filter(Boolean) || [];
          setOrganizations(orgs);
          if (orgs.length > 0) {
            setSelectedOrg(orgs[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrgs();
  }, [user]);

  // Fetch assigned tasks and goals
  useEffect(() => {
    if (!selectedOrg) return;
    
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/my-assignments?organizationId=${selectedOrg}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAssignedTasks(data.tasks || []);
        setAssignedGoals(data.goals || []);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignedTasks([]);
        setAssignedGoals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedOrg]);

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
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please log in to view your assignments</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Assignments</h1>
          <p className="text-gray-600">View tasks and goals assigned to you</p>
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

      {!selectedOrg && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Selected</h3>
          <p className="text-gray-500">Please select an organization to view your assignments</p>
        </div>
      )}

      {selectedOrg && (
        <>
          {/* Assigned Tasks Section */}
          <Card>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Tasks assigned to you in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : assignedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tasks assigned to you</p>
                  <p className="text-sm text-gray-400 mt-2">Tasks will appear here when managers assign them to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 sm:gap-3 bg-gray-800/80 rounded-lg p-2 sm:p-3 mb-2 border border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white text-xs sm:text-base">{task.title}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-400">
                          <span>Status: <span className="font-medium">{task.status}</span></span>
                          <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '--'}</span>
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
                        {task.assigned_by_staff && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400">Assigned by:</span>
                            <Badge className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">
                              {task.assigned_by_staff.user?.name || task.assigned_by_staff.user?.email || 'Unknown'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Goals Section */}
          <Card>
            <CardHeader>
              <CardTitle>My Goals</CardTitle>
              <CardDescription>Goals assigned to you in this organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading goals...</div>
              ) : assignedGoals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No goals assigned to you</p>
                  <p className="text-sm text-gray-400 mt-2">Goals will appear here when managers assign them to you</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-start gap-2 sm:gap-3 bg-gray-800/80 rounded-lg p-2 sm:p-3 mb-2 border border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-semibold text-white text-xs sm:text-base">{goal.title}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-400">
                          <span>Status: <span className="font-medium">{goal.status}</span></span>
                          <span>Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : '--'}</span>
                          <span>Priority: <span className="font-medium">{goal.priority}</span></span>
                          <span>Category: <span className="font-medium">{goal.category}</span></span>
                        </div>
                        {goal.description && (
                          <div className="mt-1 text-xs text-gray-400">
                            {goal.description}
                          </div>
                        )}
                        {goal.assigned_by_staff && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400">Assigned by:</span>
                            <Badge className="text-xs bg-purple-600/20 text-purple-300 border-purple-500/30">
                              {goal.assigned_by_staff.user?.name || goal.assigned_by_staff.user?.email || 'Unknown'}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
