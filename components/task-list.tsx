import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks, TaskWithUser } from '@/hooks/useTasks';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useAuth } from '@/hooks/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TaskListProps {
  projectId: string;
}

export function TaskList({ projectId }: TaskListProps) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks(projectId);
  const { teamMembers } = useTeamMembers(projectId);
  const { user } = useAuth();
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: null as Date | null,
    priority: 'medium' as string,
  });
  const [isAddingTask, setIsAddingTask] = useState(false);

  const handleCreateTask = async () => {
    if (!newTask.title || !user) return;

    try {
      console.log('Creating task with data:', {
        project_id: projectId,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date ? newTask.due_date.toISOString() : null,
        priority: newTask.priority || 'medium',
        status: 'pending',
        created_by: user.id,
      });

      const { data, error } = await createTask({
        project_id: projectId,
        title: newTask.title,
        description: newTask.description || null,
        due_date: newTask.due_date ? newTask.due_date.toISOString() : null,
        priority: newTask.priority || 'medium',
        status: 'pending',
        created_by: user.id,
      });

      if (error) {
        console.error('Error from Supabase:', error.message || error);
        throw error;
      }

      console.log('Task created successfully:', data);

      setNewTask({
        title: '',
        description: '',
        due_date: null,
        priority: 'medium',
      });
      setIsAddingTask(false);
    } catch (error: any) {
      console.error('Failed to create task:', error.message || error);
    }
  };

  const handleStatusChange = async (task: TaskWithUser, status: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updateTask(task.id, { status });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading tasks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button
          onClick={() => setIsAddingTask(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {isAddingTask && (
        <div className="bg-card p-4 rounded-lg border space-y-4">
          <Input
            placeholder="Task title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <Textarea
            placeholder="Task description"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[240px] justify-start text-left font-normal',
                    !newTask.due_date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newTask.due_date ? format(newTask.due_date, 'PPP') : 'Set due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newTask.due_date || undefined}
                  onSelect={(date) => setNewTask({ ...newTask, due_date: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select
              value={newTask.priority}
              onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Create Task</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-card p-4 rounded-lg border flex items-start gap-4"
          >
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={(checked) =>
                handleStatusChange(task, checked ? 'completed' : 'pending')
              }
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {task.due_date && (
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </div>
                )}
                {task.assigned_user && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {task.assigned_user.name || task.assigned_user.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 