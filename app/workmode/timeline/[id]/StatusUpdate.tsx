"use client";
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface StatusUpdateProps {
  id: string;
  status: string;
  onStatusChange?: (newStatus: string) => void;
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'active', label: 'Active', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-700/80 text-white' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/20 text-green-400' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-500/20 text-gray-400' },
];

export default function StatusUpdate({ id, status, onStatusChange }: StatusUpdateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentStatus = statusOptions.find(opt => opt.value === status) || statusOptions[0];

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_timeline')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Status Updated',
        description: `Status changed to ${statusOptions.find(opt => opt.value === newStatus)?.label}`,
      });

      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${currentStatus.color}`}
      >
        {currentStatus.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={loading}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${
                option.value === status ? 'bg-gray-800' : ''
              }`}
            >
              <span className={option.color.replace('bg-', 'text-').split(' ')[0]}>
                {option.label}
              </span>
              {option.value === status && <Check className="w-4 h-4 text-green-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
} 