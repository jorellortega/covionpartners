"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BalanceDebugPage() {
  const [balanceRow, setBalanceRow] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchBalanceRow = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not logged in");
        return;
      }
      const userId = session.user.id;
      const { data, error } = await supabase
        .from('cvnpartners_user_balances')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        setError(error.message);
      } else {
        setBalanceRow(data);
      }
    };
    fetchBalanceRow();
  }, [supabase]);

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Your Balance Row (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
            {balanceRow ? JSON.stringify(balanceRow, null, 2) : "No row found for this user."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
} 