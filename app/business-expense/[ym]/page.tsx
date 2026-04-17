"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  cleanExpenseSheetNotes,
  extractExpenseSheetYmFromNotes,
  formatYmLongLabel,
  isValidSheetYm,
} from "@/lib/expense-sheet";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, FileSpreadsheet } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ExpenseRow = {
  id: string;
  description: string;
  amount: number | string;
  category: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  created_at?: string;
};

function MonthlyExpenseSheetPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const ymRaw = typeof params.ym === "string" ? params.ym : "";
  const ym = decodeURIComponent(ymRaw);
  const orgId = searchParams.get("org");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [lines, setLines] = useState<ExpenseRow[]>([]);

  const ymValid = isValidSheetYm(ym);

  const title = useMemo(() => formatYmLongLabel(ym), [ym]);

  useEffect(() => {
    if (!user || !orgId || !ymValid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: orgRow, error: orgErr }, { data: expData, error: expErr }] = await Promise.all([
          supabase.from("organizations").select("name").eq("id", orgId).maybeSingle(),
          supabase
            .from("expenses")
            .select("id, description, amount, category, status, due_date, notes, created_at")
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false }),
        ]);

        if (cancelled) return;

        if (orgErr) {
          console.error(orgErr);
        } else if (orgRow?.name) {
          setOrgName(orgRow.name);
        }

        if (expErr) {
          setError(expErr.message || "Could not load expenses");
          setLines([]);
          return;
        }

        const filtered = (expData || []).filter((e) => extractExpenseSheetYmFromNotes(e.notes) === ym);
        setLines(filtered as ExpenseRow[]);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setLines([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user, orgId, ym, ymValid]);

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-400">
        <LoadingSpinner />
      </div>
    );
  }

  if (!ymValid) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Invalid month</CardTitle>
            <CardDescription>
              Use a path like <code className="text-cyan-400">/business-expense/2026-04</code> for April 2026.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-gray-600">
              <Link href="/business-expense">Back to organization expenses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Select an organization</CardTitle>
            <CardDescription>
              Open this page from <span className="text-gray-300">Organization Expenses</span> after choosing an
              organization, or use a link that includes <code className="text-cyan-400">?org=…</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-gray-600">
              <Link href="/business-expense">Go to organization expenses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = lines.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-6">
        <Button asChild variant="ghost" className="text-gray-400 hover:text-white -ml-2 mb-2">
          <Link href={`/business-expense?org=${encodeURIComponent(orgId)}`} className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Organization expenses
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
            <FileSpreadsheet className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex flex-wrap items-center gap-2">
              <CalendarDays className="w-6 h-6 text-cyan-400 shrink-0" />
              {title}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {orgName ? (
                <>
                  <span className="text-gray-300">{orgName}</span>
                  <span className="text-gray-600"> · </span>
                </>
              ) : null}
              Monthly sheet <span className="text-gray-500 tabular-nums">{ym}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="leonardo-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-white">Sheet lines</CardTitle>
          <CardDescription>
            Expenses created from the monthly grid for this month (tagged in notes). Edit them alongside your other
            expenses in manage expenses if needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : lines.length === 0 ? (
            <p className="text-gray-500 text-sm">
              No lines found for this month and organization. They may have been removed, or the link may be wrong.
            </p>
          ) : (
            <>
              <div className="rounded-md border border-gray-800 overflow-x-auto mb-4">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="px-3 py-2 font-medium">Description</th>
                      <th className="px-3 py-2 font-medium w-28">Amount</th>
                      <th className="px-3 py-2 font-medium min-w-[100px]">Category</th>
                      <th className="px-3 py-2 font-medium w-28">Status</th>
                      <th className="px-3 py-2 font-medium min-w-[120px]">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((row) => (
                      <tr key={row.id} className="border-b border-gray-800/80">
                        <td className="px-3 py-2 text-gray-200">{row.description}</td>
                        <td className="px-3 py-2 text-gray-200 tabular-nums">
                          ${Number(row.amount || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-gray-400">{row.category || "—"}</td>
                        <td className="px-3 py-2 text-gray-400">{row.status || "—"}</td>
                        <td className="px-3 py-2 text-gray-500 text-xs max-w-[240px]">
                          {cleanExpenseSheetNotes(row.notes) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-800 pt-4">
                <span className="text-gray-500">{lines.length} line{lines.length === 1 ? "" : "s"}</span>
                <span className="text-gray-200 font-medium tabular-nums">Total ${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </CardContent>
      </div>
    </div>
  );
}

export default function MonthlyExpenseSheetPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen text-gray-400">
          <LoadingSpinner />
        </div>
      }
    >
      <MonthlyExpenseSheetPageContent />
    </Suspense>
  );
}
