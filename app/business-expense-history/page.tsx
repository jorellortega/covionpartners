'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BusinessExpenseHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<{ [id: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses_history')
        .select('*')
        .order('changed_at', { ascending: false });
      if (!error) {
        setHistory(data || []);
        // Fetch user names for all unique changed_by IDs
        const userIds = Array.from(new Set((data || []).map((h: any) => h.changed_by).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);
          if (!userError && users) {
            const map: Record<string, string> = {};
            users.forEach((u: any) => { map[u.id] = u.name; });
            setUserMap(map);
          }
        }
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  // Filtered history based on search
  const filteredHistory = history.filter((h) => {
    const userName = userMap[h.changed_by] || '';
    const fields = [
      h.expense_id,
      h.new_data?.description,
      h.new_data?.amount?.toString(),
      h.new_data?.status,
      h.new_data?.due_date,
      userName
    ];
    return fields.some(f => f && f.toString().toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Business Expense History</CardTitle>
          <CardDescription>View all changes made to business expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded bg-gray-800 text-gray-200 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {loading ? (
            <div className="text-gray-400">Loading...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-gray-400">No history found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-300">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="px-4 py-2">Expense ID</th>
                    <th className="px-4 py-2">Description</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Due Date</th>
                    <th className="px-4 py-2">Changed By</th>
                    <th className="px-4 py-2">Change Type</th>
                    <th className="px-4 py-2">Changed At</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((h) => (
                    <tr key={h.id} className="border-b border-gray-800">
                      <td className="px-4 py-2 font-mono text-xs">{h.expense_id}</td>
                      <td className="px-4 py-2">{h.new_data?.description || '-'}</td>
                      <td className="px-4 py-2">{h.new_data?.amount !== undefined ? `$${Number(h.new_data.amount).toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-2">{h.new_data?.status || '-'}</td>
                      <td className="px-4 py-2">{h.new_data?.due_date ? new Date(h.new_data.due_date).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-2">{userMap[h.changed_by] || '-'}</td>
                      <td className="px-4 py-2">{h.change_type}</td>
                      <td className="px-4 py-2">{h.changed_at ? new Date(h.changed_at).toLocaleString() : ''}</td>
                      <td className="px-4 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => setExpanded((prev) => ({ ...prev, [h.id]: !prev[h.id] }))}
                        >
                          {expanded[h.id] ? 'Hide' : 'Show'} JSON
                        </Button>
                        {expanded[h.id] && (
                          <div className="mt-2 bg-gray-900 rounded p-2 overflow-x-auto text-xs max-w-xl">
                            <div className="mb-1 text-cyan-400">Old Data:</div>
                            <pre className="whitespace-pre-wrap break-all text-gray-400">{JSON.stringify(h.old_data, null, 2)}</pre>
                            <div className="mb-1 mt-2 text-green-400">New Data:</div>
                            <pre className="whitespace-pre-wrap break-all text-gray-400">{JSON.stringify(h.new_data, null, 2)}</pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 