"use client";
import { useState } from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface StatusUpdateProps {
  id: string;
  status: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function StatusUpdate({ id, status }: StatusUpdateProps) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  const handleChange = async (value: string) => {
    setLoading(true);
    setCurrent(value);
    await supabase.from('project_timeline').update({ status: value }).eq('id', id);
    setLoading(false);
  };

  return (
    <Select value={current} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-[120px] h-8 text-xs">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(opt => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 