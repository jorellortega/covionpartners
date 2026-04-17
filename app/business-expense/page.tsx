// This file has been moved to app/business-expenses/page.tsx

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DollarSign, Plus, Pencil, Trash2, Repeat, FileText, FileSpreadsheet, Save, ListPlus } from "lucide-react";
import Link from 'next/link';

// Helper to parse YYYY-MM-DD as local date
function parseLocalDate(dateString: string): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  // month is 0-based in JS Date
  return new Date(year, month - 1, day);
}

// Helper to determine if recurring badge should be red and if verified should be auto-off
function shouldBeRedAndUnverify(expense: any) {
  if (!expense.is_recurring || !expense.due_date) return false;
  const due = parseLocalDate(expense.due_date);
  if (!due) return false;
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (expense.recurrence === 'Monthly' && diffDays <= 14 && diffDays >= 0) return true;
  if (expense.recurrence === 'Yearly' && diffDays <= 60 && diffDays >= 0) return true;
  return false;
}

/** YYYY-MM → last calendar day of that month as YYYY-MM-DD */
function lastDayOfCalendarMonth(ym: string): string | null {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  const last = new Date(year, month, 0);
  const d = String(last.getDate()).padStart(2, "0");
  return `${year}-${String(month).padStart(2, "0")}-${d}`;
}

function expenseSheetTag(ym: string) {
  return `[Expense sheet: ${ym}]`;
}

function newSheetRowId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1).padStart(2, "0");
  const d = new Date(2000, i, 1);
  return { value, label: d.toLocaleString("en-US", { month: "long" }) };
});

function yearOptions(): number[] {
  const y = new Date().getFullYear();
  const out: number[] = [];
  for (let i = y - 10; i <= y + 5; i++) out.push(i);
  return out;
}

function parseSheetYm(ym: string): { year: string; month: string } {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (m) return { year: m[1], month: m[2] };
  const d = new Date();
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, "0"),
  };
}

type MonthlySheetRow = {
  id: string;
  description: string;
  amount: string;
  category: string;
  notes: string;
  /** When set, this row was copied from an existing org expense (for deduping imports). */
  sourceExpenseId?: string;
};

type MonthlySheetDraft = {
  sheetMonth: string;
  sheetRows: MonthlySheetRow[];
  sheetStatus: string;
  updatedAt: string;
};

const monthlySheetDraftKey = (orgId: string) =>
  `covion-monthly-expense-sheet-draft:${orgId}`;

function readMonthlySheetDraft(orgId: string): MonthlySheetDraft | null {
  if (typeof window === "undefined" || !orgId) return null;
  try {
    const raw = localStorage.getItem(monthlySheetDraftKey(orgId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MonthlySheetDraft;
    if (!parsed.sheetMonth || !Array.isArray(parsed.sheetRows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeMonthlySheetDraft(orgId: string, draft: MonthlySheetDraft) {
  localStorage.setItem(monthlySheetDraftKey(orgId), JSON.stringify(draft));
}

function removeMonthlySheetDraft(orgId: string) {
  localStorage.removeItem(monthlySheetDraftKey(orgId));
}

function normalizeMonthlySheetRows(rows: unknown): MonthlySheetRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [{ id: newSheetRowId(), description: "", amount: "", category: "", notes: "" }];
  }
  return rows.map((r: any) => ({
    id: typeof r?.id === "string" && r.id ? r.id : newSheetRowId(),
    description: String(r?.description ?? ""),
    amount: String(r?.amount ?? ""),
    category: String(r?.category ?? ""),
    notes: String(r?.notes ?? ""),
    sourceExpenseId:
      typeof r?.sourceExpenseId === "string" && r.sourceExpenseId ? r.sourceExpenseId : undefined,
  }));
}

const EXPENSE_SHEET_TAG_RE = /\[Expense sheet: \d{4}-\d{2}\]\s*/g;

function cleanImportedNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  return notes.replace(EXPENSE_SHEET_TAG_RE, "").trim();
}

function formatAmountForSheetInput(v: unknown): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (Number.isFinite(n)) return String(n);
  return String(v);
}

/** Match saved expenses to a calendar month (due date, created date, or prior sheet tag in notes). */
function expenseMatchesSheetMonth(exp: any, ym: string): boolean {
  if (!ym.match(/^\d{4}-\d{2}$/)) return false;
  if (exp.due_date && String(exp.due_date).slice(0, 7) === ym) return true;
  if (exp.created_at && String(exp.created_at).slice(0, 7) === ym) return true;
  const n = exp.notes;
  if (typeof n === "string" && n.includes(`[Expense sheet: ${ym}]`)) return true;
  return false;
}

export default function BusinessExpensePage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [userStaffLevel, setUserStaffLevel] = useState<number | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  // Add back the missing expense state
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "",
    status: "Pending",
    due_date: "",
    receipt_url: "",
    notes: "",
    recurrence: "One-time",
    is_recurring: false,
    next_payment_date: "",
    verified: false,
    payment_account: ""
  });
  const [editExpense, setEditExpense] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  // Add notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [editNote, setEditNote] = useState<any>(null);
  const [showEditNote, setShowEditNote] = useState(false);
  // Extract unique categories from expenses
  const uniqueCategories = Array.from(new Set(expenses.map((e: any) => e.category).filter(Boolean)));
  const [useNewCategory, setUseNewCategory] = useState(false);

  const [showMonthlySheet, setShowMonthlySheet] = useState(false);
  const [sheetMonth, setSheetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [sheetRows, setSheetRows] = useState<MonthlySheetRow[]>([
    { id: newSheetRowId(), description: "", amount: "", category: "", notes: "" },
  ]);
  const [sheetStatus, setSheetStatus] = useState("Pending");
  const [savingSheet, setSavingSheet] = useState(false);
  const [hasSheetDraft, setHasSheetDraft] = useState(false);
  const [sheetDraftSavedAt, setSheetDraftSavedAt] = useState<string | null>(null);
  const [showImportFromExisting, setShowImportFromExisting] = useState(false);
  const [importScope, setImportScope] = useState<"sheet_month" | "all">("sheet_month");
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const monthlySheetTableRef = useRef<HTMLDivElement>(null);

  const importCandidateExpenses = useMemo(() => {
    const list =
      importScope === "sheet_month"
        ? expenses.filter((e) => expenseMatchesSheetMonth(e, sheetMonth))
        : [...expenses];
    return list.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
  }, [expenses, sheetMonth, importScope]);

  const sheetImportedExpenseIds = useMemo(
    () => new Set(sheetRows.map((r) => r.sourceExpenseId).filter(Boolean) as string[]),
    [sheetRows]
  );

  useEffect(() => {
    setSelectedImportIds([]);
  }, [importScope]);

  useEffect(() => {
    if (!selectedOrg) {
      setHasSheetDraft(false);
      return;
    }
    setHasSheetDraft(!!readMonthlySheetDraft(selectedOrg));
  }, [selectedOrg]);

  useEffect(() => {
    if (!user) return;
    const fetchOrgs = async () => {
      try {
        // Get organization IDs from staff table only
        const { data: staffOrgs, error: staffError } = await supabase
          .from("organization_staff")
          .select("organization_id, access_level")
          .eq("user_id", user.id);
        
        if (staffError) {
          console.error('Error fetching staff organizations:', staffError);
        }
        
        // Collect all organization IDs user is staff of
        const staffOrgIds = new Set();
        let userAccessLevel = null;
        if (staffOrgs) {
          staffOrgs.forEach(item => {
            staffOrgIds.add(item.organization_id);
            // Store the access level for the selected org
            if (item.organization_id === selectedOrg) {
              userAccessLevel = item.access_level;
            }
          });
        }
        setUserStaffLevel(userAccessLevel);
        
        // Get organizations where user is owner
        const { data: ownedOrgs, error: ownedError } = await supabase
          .from("organizations")
          .select("id, name, owner_id")
          .eq("owner_id", user.id);
          
        if (ownedError) {
          console.error('Error fetching owned organizations:', ownedError);
        }
        
        // Get organizations where user is staff member
        let staffMemberOrgs: any[] = [];
        if (staffOrgIds.size > 0) {
          const { data: memberOrgs, error: memberError } = await supabase
            .from("organizations")
            .select("id, name, owner_id")
            .in("id", Array.from(staffOrgIds));
          
          if (memberError) {
            console.error('Error fetching staff member organizations:', memberError);
          } else {
            staffMemberOrgs = memberOrgs || [];
          }
        }
        
        // Combine and deduplicate results
        const allOrgs = [...(ownedOrgs || []), ...staffMemberOrgs];
        const uniqueOrgs = allOrgs.filter((org, index, self) => 
          index === self.findIndex(o => o.id === org.id)
        );
        
        // Build a map of orgId -> access_level for staff orgs
        const staffAccessMap = new Map();
        if (staffOrgs) {
          staffOrgs.forEach(item => {
            staffAccessMap.set(item.organization_id, item.access_level);
          });
        }
        
        // Only show orgs where user is owner or has access level 5
        const visibleOrgs = uniqueOrgs.filter(org => {
          if (org.owner_id === user.id) return true;
          const staffLevel = staffAccessMap.get(org.id);
          return staffLevel === 5;
        });
        
        setOrganizations(visibleOrgs);
        if (visibleOrgs.length > 0) setSelectedOrg(visibleOrgs[0].id);
        
        // Show toast error only if both queries failed
        if (ownedError && staffError) {
          toast.error("Failed to fetch organizations");
        }
      } catch (error) {
        console.error('Error in fetchOrgs:', error);
        toast.error("Failed to fetch organizations");
      }
    };
    fetchOrgs();
  }, [user]);

  // Check access for the selected organization
  const selectedOrgObj = organizations.find(org => org.id === selectedOrg);
  const isOwner = selectedOrgObj && user && selectedOrgObj.owner_id === user.id;
  const hasAccess = isOwner || userStaffLevel === 5;

  useEffect(() => {
    if (!selectedOrg || !hasAccess) return;
    setLoading(true);
    const fetchExpenses = async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false });
      if (error) toast.error("Failed to fetch expenses");
      setExpenses(data || []);
      setLoading(false);
    };
    fetchExpenses();
  }, [selectedOrg, hasAccess]);

  // Add notes fetch effect
  useEffect(() => {
    if (!selectedOrg) return;
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from("business_notes")
        .select("*")
        .eq("organization_id", selectedOrg)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch notes:", error);
        // If table doesn't exist, create it
        if (error.code === '42P01') {
          await createNotesTable();
        }
      } else {
        setNotes(data || []);
      }
    };
    fetchNotes();
  }, [selectedOrg]);

  // Update userStaffLevel when selectedOrg changes
  useEffect(() => {
    if (!selectedOrg || !user) return;
    const updateStaffLevel = async () => {
      const { data: staffData, error } = await supabase
        .from("organization_staff")
        .select("access_level")
        .eq("user_id", user.id)
        .eq("organization_id", selectedOrg)
        .single();
      
      if (!error && staffData) {
        setUserStaffLevel(staffData.access_level);
      } else {
        setUserStaffLevel(null);
      }
    };
    updateStaffLevel();
  }, [selectedOrg, user]);

  // Create notes table if it doesn't exist
  const createNotesTable = async () => {
    const { error } = await supabase.rpc('create_business_notes_table');
    if (error) {
      console.error("Failed to create notes table:", error);
    }
  };

  // Add note handlers
  const handleAddNote = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("business_notes")
        .insert([
          {
            organization_id: selectedOrg,
            user_id: user.id,
            title: newNote.title,
            content: newNote.content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => [data, ...prev]);
      setShowAddNote(false);
      setNewNote({ title: "", content: "" });
      toast.success("Note added successfully");
    } catch (error) {
      toast.error("Failed to add note");
    }
  };

  const handleEditNote = async () => {
    try {
      const { data, error } = await supabase
        .from("business_notes")
        .update({
          title: editNote.title,
          content: editNote.content,
          updated_at: new Date().toISOString()
        })
        .eq("id", editNote.id)
        .select()
        .single();
      if (error) throw error;
      setNotes(prev => prev.map(note => note.id === editNote.id ? data : note));
      setShowEditNote(false);
      setEditNote(null);
      toast.success("Note updated successfully");
    } catch (error) {
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("business_notes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setNotes(prev => prev.filter(note => note.id !== id));
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const monthlyExpenses = expenses.filter(e => e.recurrence === 'Monthly').reduce((sum, e) => sum + (e.amount || 0), 0);
  const yearlyExpenses = expenses.filter(e => e.recurrence === 'Yearly').reduce((sum, e) => sum + (e.amount || 0), 0);

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen text-gray-400">Loading...</div>;
  }

  const handleAddExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .insert([
          {
            organization_id: selectedOrg,
            user_id: user.id,
            description: newExpense.description,
            amount: Number(newExpense.amount),
            category: newExpense.category,
            status: newExpense.status,
            due_date: newExpense.due_date ? newExpense.due_date : null,
            receipt_url: newExpense.receipt_url,
            notes: newExpense.notes,
            recurrence: newExpense.is_recurring ? newExpense.recurrence : "One-time",
            is_recurring: newExpense.is_recurring,
            next_payment_date: newExpense.is_recurring && newExpense.next_payment_date ? newExpense.next_payment_date : null,
            verified: newExpense.verified,
            payment_account: newExpense.payment_account,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      setShowAdd(false);
      setNewExpense({ description: "", amount: "", category: "", status: "Pending", due_date: "", receipt_url: "", notes: "", recurrence: "One-time", is_recurring: false, next_payment_date: "", verified: false, payment_account: "" });
      toast.success("Expense added successfully");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const handleEditExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update({
          description: editExpense.description,
          amount: Number(editExpense.amount),
          category: editExpense.category,
          status: editExpense.status,
          due_date: editExpense.due_date,
          receipt_url: editExpense.receipt_url,
          notes: editExpense.notes,
          is_recurring: editExpense.is_recurring,
          recurrence: editExpense.is_recurring ? editExpense.recurrence : "One-time",
          next_payment_date: editExpense.is_recurring && editExpense.next_payment_date ? editExpense.next_payment_date : null,
          verified: editExpense.verified,
          payment_account: editExpense.payment_account,
          updated_at: new Date().toISOString()
        })
        .eq("id", editExpense.id)
        .select()
        .single();
      if (error) throw error;
      setExpenses(prev => prev.map(exp => exp.id === editExpense.id ? data : exp));
      setShowEdit(false);
      setEditExpense(null);
      toast.success("Expense updated successfully");
    } catch (error) {
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setExpenses(prev => prev.filter(exp => exp.id !== id));
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const openMonthlySheet = () => {
    if (!selectedOrg) {
      toast.error("Select an organization first");
      return;
    }
    const draft = readMonthlySheetDraft(selectedOrg);
    if (draft) {
      const ym = /^\d{4}-\d{2}$/.test(draft.sheetMonth)
        ? draft.sheetMonth
        : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      setSheetMonth(ym);
      setSheetRows(normalizeMonthlySheetRows(draft.sheetRows));
      setSheetStatus(draft.sheetStatus || "Pending");
      setSheetDraftSavedAt(draft.updatedAt || null);
      toast.info("Loaded your saved draft — finish and save, or discard to start over.");
    } else {
      const d = new Date();
      setSheetMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      setSheetRows([{ id: newSheetRowId(), description: "", amount: "", category: "", notes: "" }]);
      setSheetStatus("Pending");
      setSheetDraftSavedAt(null);
    }
    setShowMonthlySheet(true);
  };

  const saveMonthlySheetDraft = () => {
    if (!selectedOrg) {
      toast.error("Select an organization");
      return;
    }
    const updatedAt = new Date().toISOString();
    const draft: MonthlySheetDraft = {
      sheetMonth,
      sheetRows,
      sheetStatus,
      updatedAt,
    };
    writeMonthlySheetDraft(selectedOrg, draft);
    setHasSheetDraft(true);
    setSheetDraftSavedAt(updatedAt);
    toast.success("Draft saved on this device — open this sheet anytime to keep editing.");
  };

  const discardMonthlySheetDraft = () => {
    if (!selectedOrg) return;
    removeMonthlySheetDraft(selectedOrg);
    setHasSheetDraft(false);
    setSheetDraftSavedAt(null);
    const d = new Date();
    setSheetMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    setSheetRows([{ id: newSheetRowId(), description: "", amount: "", category: "", notes: "" }]);
    setSheetStatus("Pending");
    toast.success("Draft discarded — you can start a new sheet.");
  };

  const openImportFromSaved = () => {
    setSelectedImportIds([]);
    setShowImportFromExisting(true);
  };

  const toggleImportSelection = (id: string) => {
    setSelectedImportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllImportable = () => {
    const ids = importCandidateExpenses
      .filter((e) => e.id && !sheetImportedExpenseIds.has(e.id))
      .map((e) => e.id as string);
    setSelectedImportIds(ids);
  };

  const applyImportFromOrg = () => {
    const picked = expenses.filter((e) => selectedImportIds.includes(e.id));
    if (picked.length === 0) {
      toast.error("Select at least one expense to import");
      return;
    }
    const newRows: MonthlySheetRow[] = picked.map((e) => ({
      id: newSheetRowId(),
      description: String(e.description ?? ""),
      amount: formatAmountForSheetInput(e.amount),
      category: String(e.category ?? ""),
      notes: cleanImportedNotes(e.notes),
      sourceExpenseId: e.id,
    }));
    setSheetRows((prev) => {
      const onlyEmpty =
        prev.length === 1 &&
        !String(prev[0].description || "").trim() &&
        !String(prev[0].amount || "").trim();
      if (onlyEmpty) return newRows.length ? newRows : prev;
      return [...prev, ...newRows];
    });
    setShowImportFromExisting(false);
    setSelectedImportIds([]);
    requestAnimationFrame(() => {
      monthlySheetTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    toast.success(
      `Added ${picked.length} line(s). Imported rows are highlighted with an “Imported” badge — edit or remove in the sheet.`
    );
  };

  /** Fill this sheet row from a saved org expense — data appears in the same line’s fields. */
  const onRowSourceChange = (rowId: string, value: string) => {
    if (value === "__manual__") {
      setSheetRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, sourceExpenseId: undefined } : r))
      );
      return;
    }
    const exp = expenses.find((e) => e.id === value);
    if (!exp) return;
    setSheetRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              sourceExpenseId: exp.id,
              description: String(exp.description ?? ""),
              amount: formatAmountForSheetInput(exp.amount),
              category: String(exp.category ?? ""),
              notes: cleanImportedNotes(exp.notes),
            }
          : r
      )
    );
    toast.message("Row filled from saved expense — edit the cells above if needed.");
  };

  const addSheetLine = () => {
    setSheetRows((prev) => [
      ...prev,
      { id: newSheetRowId(), description: "", amount: "", category: "", notes: "" },
    ]);
  };

  const removeSheetLine = (id: string) => {
    setSheetRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const sheetTotal = sheetRows.reduce((sum, r) => {
    const n = parseFloat(r.amount);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const handleSaveMonthlySheet = async () => {
    if (!selectedOrg || !user) {
      toast.error("Select an organization");
      return;
    }
    const lastDay = lastDayOfCalendarMonth(sheetMonth);
    if (!lastDay) {
      toast.error("Pick a valid month");
      return;
    }
    const tag = expenseSheetTag(sheetMonth);
    const lines = sheetRows
      .map((r) => ({
        ...r,
        description: r.description.trim(),
        amountNum: parseFloat(r.amount),
      }))
      .filter(
        (r) =>
          r.description.length > 0 &&
          Number.isFinite(r.amountNum) &&
          !Number.isNaN(r.amountNum) &&
          r.amountNum > 0
      );

    if (lines.length === 0) {
      toast.error("Add at least one line with a description and a positive amount");
      return;
    }

    setSavingSheet(true);
    try {
      const createdAt = `${sheetMonth}-01T12:00:00.000Z`;
      const now = new Date().toISOString();
      const payload = lines.map((r) => {
        const cat = (r.category || "General").trim() || "General";
        const noteExtra = r.notes.trim();
        return {
          organization_id: selectedOrg,
          user_id: user.id,
          description: r.description,
          amount: r.amountNum,
          category: cat,
          status: sheetStatus,
          due_date: lastDay,
          receipt_url: null,
          notes: noteExtra ? `${tag} ${noteExtra}` : tag,
          recurrence: "One-time",
          is_recurring: false,
          next_payment_date: null,
          verified: false,
          payment_account: "",
          created_at: createdAt,
          updated_at: now,
        };
      });

      const { data, error } = await supabase.from("expenses").insert(payload).select();
      if (error) throw error;
      if (data?.length) setExpenses((prev) => [...data, ...prev]);
      if (selectedOrg) {
        removeMonthlySheetDraft(selectedOrg);
        setHasSheetDraft(false);
        setSheetDraftSavedAt(null);
      }
      toast.success(`Saved ${data?.length ?? lines.length} expense(s) for ${sheetMonth}`);
      setShowMonthlySheet(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save monthly expense sheet");
    } finally {
      setSavingSheet(false);
    }
  };

  const sheetYmParsed = parseSheetYm(sheetMonth);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="leonardo-card border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Organization Expenses
          </CardTitle>
          <CardDescription>Track and manage expenses for your organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="org">Select Organization</Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full max-w-md leonardo-input text-white">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {/* After fetching organizations and staffOrgs, filter organizations for dropdown
                    // Build a map of orgId -> access_level for staff orgs
                    const staffAccessMap = new Map();
                    if (Array.isArray(staffOrgs)) {
                      staffOrgs.forEach(item => {
                        staffAccessMap.set(item.organization_id, item.access_level);
                      });
                    }
                    // Only show orgs where user is owner or has access level 5
                    const visibleOrganizations = organizations.filter(org => {
                      if (org.owner_id === user?.id) return true;
                      const staffLevel = staffAccessMap.get(org.id);
                      return staffLevel === 5;
                    }); */}
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end mb-4">
            <Link href="/business-expense-history">
              <Button variant="outline" className="mr-2">View Expense History</Button>
            </Link>
          </div>

          {/* Show access message if user doesnt have permission */}
          {selectedOrg && !hasAccess && (
            <div className="text-center py-8">
              <div className="leonardo-card p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-2">Access Restricted</h3>
                <p className="text-gray-400 mb-4">You need to be the organization owner or have Access Level 5 to view business expenses.</p>
                <p className="text-sm text-gray-500">Your current access level: {userStaffLevel || 'Not a staff member'}</p>
              </div>
            </div>
          )}

          {/* Only show expense data if user has access */}
          {selectedOrg && hasAccess && (
            <>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="leonardo-card p-4 flex items-center border-2 !border-green-500 group cursor-pointer">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Total Expenses</p>
                    <h3 className="text-lg font-bold mt-1 hidden group-hover:block text-green-400">
                      ${totalExpenses.toFixed(2)}
                    </h3>
                  </div>
                </div>
                <div className="leonardo-card p-4 flex items-center border-2 !border-blue-500 group cursor-pointer">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Monthly Expenses</p>
                    <h3 className="text-lg font-bold mt-1 hidden group-hover:block text-green-400">
                      ${monthlyExpenses.toFixed(2)}
                    </h3>
                  </div>
                </div>
                <div className="leonardo-card p-4 flex items-center border-2 !border-purple-500 group cursor-pointer">
                  <div className="p-3 rounded-full bg-green-500/20 mr-4 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm font-medium mb-1">Yearly Expenses</p>
                    <h3 className="text-lg font-bold mt-1 hidden group-hover:block text-green-400">
                      ${yearlyExpenses.toFixed(2)}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="flex justify-end flex-wrap gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-cyan-600/60 text-cyan-200 hover:bg-cyan-950/50"
                  onClick={openMonthlySheet}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Create monthly expense
                  {hasSheetDraft && (
                    <Badge variant="secondary" className="ml-2 bg-amber-900/60 text-amber-200 border-amber-700/50">
                      Draft saved
                    </Badge>
                  )}
                </Button>
                <Dialog open={showMonthlySheet} onOpenChange={setShowMonthlySheet}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-gray-800 bg-gray-950 text-white">
                    <DialogHeader>
                      <DialogTitle>Monthly expense sheet</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Choose the calendar month, then add rows like a spreadsheet. Each row becomes one expense
                        booked for that month (due date = last day of the month). This is separate from recurring
                        subscriptions. Use <span className="text-cyan-400/90">Save draft</span> to park your work in
                        this browser and finish later — drafts load automatically when you open this dialog. You can
                        also <span className="text-cyan-400/90">import from saved expenses</span> already on this page.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-gray-300">Expense month</Label>
                          <p className="text-xs text-gray-500 mt-0.5 mb-2">
                            Choose the calendar month for this sheet.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Select
                              value={sheetYmParsed.month}
                              onValueChange={(mo) =>
                                setSheetMonth(`${sheetYmParsed.year}-${mo}`)
                              }
                            >
                              <SelectTrigger
                                id="sheet_month_name"
                                className="w-full leonardo-input text-white"
                              >
                                <SelectValue placeholder="Month" />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTH_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={sheetYmParsed.year}
                              onValueChange={(yr) =>
                                setSheetMonth(`${yr}-${sheetYmParsed.month}`)
                              }
                            >
                              <SelectTrigger className="w-full leonardo-input text-white">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[220px]">
                                {yearOptions().map((yy) => (
                                  <SelectItem key={yy} value={String(yy)}>
                                    {yy}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-300">Status (all lines)</Label>
                          <Select value={sheetStatus} onValueChange={setSheetStatus}>
                            <SelectTrigger className="w-full leonardo-input text-white mt-1">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                              <SelectItem value="Unpaid">Unpaid</SelectItem>
                              <SelectItem value="Overdue">Overdue</SelectItem>
                              <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Use the <span className="text-violet-300">Source</span> column on each row to load a saved
                        expense into that line — description, amount, category, and notes fill in right here. Edit or
                        clear as needed. Rows loaded from saved expenses are tinted violet.
                      </p>
                      <div
                        ref={monthlySheetTableRef}
                        className="rounded-md border border-gray-800 overflow-x-auto scroll-mt-4"
                      >
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-800 text-left text-gray-400">
                              <th className="px-2 py-2 font-medium w-10 text-center">#</th>
                              <th className="px-2 py-2 font-medium min-w-[220px]">Source</th>
                              <th className="px-2 py-2 font-medium min-w-[140px]">Description</th>
                              <th className="px-2 py-2 font-medium w-28">Amount</th>
                              <th className="px-2 py-2 font-medium min-w-[120px]">Category</th>
                              <th className="px-2 py-2 font-medium min-w-[100px]">Notes</th>
                              <th className="px-2 py-2 w-10" />
                            </tr>
                          </thead>
                          <tbody>
                            {sheetRows.map((row, rowIndex) => (
                              <tr
                                key={row.id}
                                className={`border-b border-gray-800/80 ${
                                  row.sourceExpenseId ? "bg-violet-950/30 border-l-2 border-l-violet-500/70" : ""
                                }`}
                              >
                                <td className="px-2 py-2 align-top text-center text-gray-500 text-xs tabular-nums">
                                  {rowIndex + 1}
                                </td>
                                <td className="px-2 py-1 align-top min-w-[220px]">
                                  <Select
                                    value={row.sourceExpenseId ?? "__manual__"}
                                    onValueChange={(val) => onRowSourceChange(row.id, val)}
                                  >
                                    <SelectTrigger className="h-auto min-h-9 leonardo-input text-white text-left text-xs py-1.5">
                                      <SelectValue placeholder="Load saved expense into this row" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                      <SelectItem value="__manual__" className="text-gray-300">
                                        Manual — type in the row below
                                      </SelectItem>
                                      {row.sourceExpenseId &&
                                        !expenses.some((e) => e.id === row.sourceExpenseId) && (
                                          <SelectItem value={row.sourceExpenseId} className="text-amber-500/90 text-xs">
                                            Linked expense no longer in list — change source or edit row
                                          </SelectItem>
                                        )}
                                      {expenses
                                        .filter((e) => e.id)
                                        .sort((a, b) => {
                                          const ta = new Date(a.created_at || 0).getTime();
                                          const tb = new Date(b.created_at || 0).getTime();
                                          return tb - ta;
                                        })
                                        .map((exp) => {
                                          const label = `${String(exp.description || "Expense").slice(0, 80)}${String(exp.description || "").length > 80 ? "…" : ""} · $${Number(exp.amount || 0).toFixed(2)}`;
                                          return (
                                            <SelectItem key={exp.id} value={exp.id} className="text-xs">
                                              <span className="line-clamp-2" title={label}>
                                                {label}
                                              </span>
                                            </SelectItem>
                                          );
                                        })}
                                    </SelectContent>
                                  </Select>
                                  {row.sourceExpenseId && expenses.some((e) => e.id === row.sourceExpenseId) && (
                                    <p className="text-[10px] text-violet-400/90 mt-1">Filled from saved · editable</p>
                                  )}
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <Input
                                    placeholder="e.g. Software"
                                    value={row.description}
                                    onChange={(e) =>
                                      setSheetRows((prev) =>
                                        prev.map((r) =>
                                          r.id === row.id ? { ...r, description: e.target.value } : r
                                        )
                                      )
                                    }
                                    className="leonardo-input text-white h-9"
                                  />
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-2 h-9">
                                    <span className="text-gray-500 mr-1 text-xs">$</span>
                                    <input
                                      className="bg-transparent outline-none w-full text-white text-sm py-1"
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0"
                                      value={row.amount}
                                      onChange={(e) =>
                                        setSheetRows((prev) =>
                                          prev.map((r) =>
                                            r.id === row.id ? { ...r, amount: e.target.value } : r
                                          )
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <Select
                                    value={row.category ? row.category : "__general__"}
                                    onValueChange={(val) =>
                                      setSheetRows((prev) =>
                                        prev.map((r) =>
                                          r.id === row.id
                                            ? { ...r, category: val === "__general__" ? "" : val }
                                            : r
                                        )
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-9 leonardo-input text-white">
                                      <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__general__">General</SelectItem>
                                      {row.category &&
                                        !uniqueCategories.includes(row.category) &&
                                        row.category !== "General" && (
                                          <SelectItem value={row.category}>{row.category}</SelectItem>
                                        )}
                                      {uniqueCategories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                          {cat}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <Input
                                    placeholder="Optional"
                                    value={row.notes}
                                    onChange={(e) =>
                                      setSheetRows((prev) =>
                                        prev.map((r) =>
                                          r.id === row.id ? { ...r, notes: e.target.value } : r
                                        )
                                      )
                                    }
                                    className="leonardo-input text-white h-9"
                                  />
                                </td>
                                <td className="px-1 py-1 align-top">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-gray-500 hover:text-red-400"
                                    onClick={() => removeSheetLine(row.id)}
                                    title="Remove line"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" onClick={addSheetLine} className="bg-gray-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Add line
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-violet-600/50 text-violet-200 hover:bg-violet-950/40"
                            onClick={() =>
                              showImportFromExisting
                                ? setShowImportFromExisting(false)
                                : openImportFromSaved()
                            }
                          >
                            <ListPlus className="w-4 h-4 mr-2" />
                            {showImportFromExisting ? "Hide bulk import" : "Bulk import (many rows)"}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Sheet total:{" "}
                          <span className="text-white font-semibold">${sheetTotal.toFixed(2)}</span>
                        </p>
                      </div>
                      {showImportFromExisting && (
                        <div className="rounded-lg border border-cyan-900/50 bg-gray-900/70 p-4 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-white">Bulk import</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Add several saved expenses as new rows at once. To fill one line at a time, use the{" "}
                                <span className="text-violet-300">Source</span> dropdown on each row in the table above.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 shrink-0"
                              onClick={() => setShowImportFromExisting(false)}
                            >
                              Close
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Label className="text-gray-400 text-xs shrink-0">Show:</Label>
                            <Select
                              value={importScope}
                              onValueChange={(v) => setImportScope(v as "sheet_month" | "all")}
                            >
                              <SelectTrigger className="w-[min(100%,280px)] leonardo-input text-white h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sheet_month">
                                  Only expenses for {sheetMonth} (due / created / sheet tag)
                                </SelectItem>
                                <SelectItem value="all">All organization expenses on this page</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-gray-600"
                              onClick={selectAllImportable}
                            >
                              Select all in list
                            </Button>
                          </div>
                          <div className="max-h-52 overflow-y-auto rounded border border-gray-800">
                            {importCandidateExpenses.length === 0 ? (
                              <p className="text-sm text-gray-500 p-4">
                                No matching expenses. Try &quot;All organization expenses&quot; or add expenses on
                                this page first.
                              </p>
                            ) : (
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-800 text-gray-400 text-left">
                                    <th className="w-10 p-2" />
                                    <th className="p-2">Description</th>
                                    <th className="p-2 w-24">Amount</th>
                                    <th className="p-2 min-w-[100px]">Category</th>
                                    <th className="p-2 w-28">Date</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {importCandidateExpenses.map((exp) => {
                                    const onSheet = sheetImportedExpenseIds.has(exp.id);
                                    const disabled = onSheet;
                                    return (
                                      <tr key={exp.id} className="border-b border-gray-800/80">
                                        <td className="p-2 align-middle">
                                          <Checkbox
                                            checked={selectedImportIds.includes(exp.id)}
                                            disabled={disabled}
                                            onCheckedChange={() => {
                                              if (!disabled) toggleImportSelection(exp.id);
                                            }}
                                            aria-label={`Select ${exp.description}`}
                                          />
                                        </td>
                                        <td className="p-2 text-gray-200">
                                          {exp.description}
                                          {onSheet && (
                                            <span className="block text-[10px] text-amber-500/90 mt-0.5">
                                              On sheet — edit/remove in grid above
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2 text-gray-300">
                                          ${Number(exp.amount || 0).toFixed(2)}
                                        </td>
                                        <td className="p-2 text-gray-400">{exp.category || "—"}</td>
                                        <td className="p-2 text-gray-500 text-xs whitespace-nowrap">
                                          {exp.due_date
                                            ? String(exp.due_date).slice(0, 10)
                                            : exp.created_at
                                              ? String(exp.created_at).slice(0, 10)
                                              : "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                              type="button"
                              variant="secondary"
                              className="bg-cyan-900/40 text-cyan-100 hover:bg-cyan-900/60"
                              onClick={applyImportFromOrg}
                              disabled={selectedImportIds.length === 0}
                            >
                              Add selected to sheet ({selectedImportIds.length})
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="rounded-md border border-gray-800 bg-gray-900/40 p-3 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-gray-600 text-gray-200"
                            onClick={saveMonthlySheetDraft}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save draft
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-300"
                            onClick={discardMonthlySheetDraft}
                          >
                            Discard draft
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Drafts stay on this browser only (not synced to your account or other devices).
                        </p>
                        {sheetDraftSavedAt && (
                          <p className="text-xs text-cyan-500/90">
                            Last saved: {new Date(sheetDraftSavedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        className="w-full bg-cyan-700 hover:bg-cyan-600 text-white"
                        onClick={handleSaveMonthlySheet}
                        disabled={savingSheet}
                      >
                        {savingSheet ? "Saving…" : `Save ${sheetMonth} sheet to expenses`}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showAdd} onOpenChange={setShowAdd}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="bg-cyan-700 text-white"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Organization Expense</DialogTitle>
                      <DialogDescription>Add a new expense for your organization</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                      <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                        <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                        <input
                          className="bg-transparent outline-none w-full text-white py-2 pl-0"
                          placeholder="Amount"
                          type="number"
                          value={newExpense.amount}
                          onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {/* Category dropdown/select */}
                      <Select
                        value={useNewCategory ? "__new__" : newExpense.category}
                        onValueChange={val => {
                          if (val === "__new__") {
                            setUseNewCategory(true);
                            setNewExpense({ ...newExpense, category: "" });
                          } else {
                            setUseNewCategory(false);
                            setNewExpense({ ...newExpense, category: val });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full leonardo-input text-white">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                          <SelectItem value="__new__">Add new category</SelectItem>
                        </SelectContent>
                      </Select>
                      {useNewCategory && (
                        <Input
                          placeholder="New Category"
                          value={newExpense.category}
                          onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                          className="leonardo-input text-white mt-2"
                        />
                      )}
                      {/* Recurring expense fields */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_recurring"
                          checked={newExpense.is_recurring}
                          onChange={e => setNewExpense({ ...newExpense, is_recurring: e.target.checked })}
                        />
                        <label htmlFor="is_recurring" className="text-gray-300">Recurring Expense</label>
                      </div>
                      {newExpense.is_recurring && (
                        <div className="flex flex-col gap-2">
                          <Select
                            value={newExpense.recurrence}
                            onValueChange={val => setNewExpense({ ...newExpense, recurrence: val })}
                          >
                            <SelectTrigger className="w-full leonardo-input text-white">
                              <SelectValue placeholder="Recurrence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                              <SelectItem value="Yearly">Yearly</SelectItem>
                              <SelectItem value="Quarterly">Quarterly</SelectItem>
                              <SelectItem value="One-time">One-time</SelectItem>
                            </SelectContent>
                          </Select>
                          <div>
                            <Label htmlFor="next_payment_date" className="text-sm text-gray-300 mb-1 block">Next Payment Date</Label>
                            <Input
                              id="next_payment_date"
                              placeholder="Next Payment Date"
                              type="date"
                              value={newExpense.next_payment_date || ""}
                              onChange={e => setNewExpense({ ...newExpense, next_payment_date: e.target.value })}
                              className="leonardo-input text-white"
                            />
                          </div>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="due_date" className="text-sm text-gray-300 mb-1 block">Due Date</Label>
                        <Input 
                          id="due_date"
                          placeholder="Due Date" 
                          type="date" 
                          value={newExpense.due_date} 
                          onChange={e => setNewExpense({ ...newExpense, due_date: e.target.value })} 
                        />
                      </div>
                      <Input placeholder="Receipt URL" value={newExpense.receipt_url} onChange={e => setNewExpense({ ...newExpense, receipt_url: e.target.value })} />
                      <Input placeholder="Payment Account (Bank/Card)" value={newExpense.payment_account} onChange={e => setNewExpense({ ...newExpense, payment_account: e.target.value })} />
                      <Input placeholder="Notes" value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} />
                      <Select
                        value={newExpense.status}
                        onValueChange={val => setNewExpense({ ...newExpense, status: val })}
                      >
                        <SelectTrigger className="w-full leonardo-input text-white">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Overdue">Overdue</SelectItem>
                          <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="add_verified"
                          checked={newExpense.verified}
                          onChange={e => setNewExpense({ ...newExpense, verified: e.target.checked })}
                        />
                        <label htmlFor="add_verified" className="text-gray-300">Verified</label>
                      </div>
                    </div>
                    <Button onClick={handleAddExpense} className="mt-4 w-full bg-cyan-700 text-white">Add Expense</Button>
                  </DialogContent>
                </Dialog>
              </div>
              {loading ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : expenses.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No expenses found for this organization.</div>
              ) : (
                <div>
                  {Object.entries(expensesByCategory).map(([category, categoryExpenses]) => (
                    <div key={category} className="leonardo-card mb-8">
                      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">{category} Expenses</h2>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:bg-green-500/20"
                          title={`Add expense to ${category}`}
                          onClick={() => {
                            setShowAdd(true);
                            setUseNewCategory(false);
                            setNewExpense(prev => ({ ...prev, category }));
                          }}
                        >
                          <Plus className="w-5 h-5 text-gray-300" />
                        </Button>
                      </div>
                      <div className="p-4">
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="min-w-full text-sm text-left text-gray-400">
                            <thead className="bg-gray-800 text-gray-300">
                              <tr>
                                <th className="px-2 py-2"></th>
                                <th className="px-4 py-2">Description</th>
                                <th className="px-4 py-2">Amount</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Due Date</th>
                                <th className="px-4 py-2">Payment Account</th>
                                <th className="px-4 py-2">Notes</th>
                                <th className="px-4 py-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(categoryExpenses as any[]).map((expense: any) => {
                                const needsRed = shouldBeRedAndUnverify(expense);
                                if (needsRed && expense.verified) {
                                  // Auto-unverify in UI and DB
                                  setTimeout(async () => {
                                    setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: false } : exp));
                                    await supabase
                                      .from("expenses")
                                      .update({ verified: false, updated_at: new Date().toISOString() })
                                      .eq("id", expense.id);
                                  }, 0);
                                }
                                return (
                                  <tr key={expense.id} className="border-b border-gray-800">
                                    <td className="px-2 py-2 text-center">
                                      {expense.verified ? (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 ml-2 cursor-pointer"
                                          onClick={async () => {
                                            const newVerified = false;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                          title="Click to unverify"
                                        >
                                          <span className="mr-1">✓</span>Verified
                                        </span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={async (e) => {
                                            const newVerified = true;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                        />
                                      )}
                                    </td>
                                    <td className="px-4 py-2">{expense.description}</td>
                                    <td className="px-4 py-2">${(expense.amount || 0).toFixed(2)}</td>
                                    <td className={`px-4 py-2${expense.status === 'Paid' ? ' paid-tint' : ''}`}>
                                      {expense.is_recurring && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${needsRed ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'} mr-2`}>
                                          <Repeat className="w-3 h-3 mr-1" /> Recurring
                                        </span>
                                      )}
                                      {expense.status}
                                    </td>
                                    <td className="px-4 py-2">{parseLocalDate(expense.due_date) ? parseLocalDate(expense.due_date)!.toLocaleDateString() : ''}</td>
                                    <td className="px-4 py-2">{expense.payment_account || '-'}</td>
                                    <td className="px-4 py-2">{expense.notes}</td>
                                    <td className="px-4 py-2 flex gap-2">
                                      <Select
                                        value={expense.category}
                                        onValueChange={async (newCategory) => {
                                          try {
                                            const { error } = await supabase
                                              .from("expenses")
                                              .update({ 
                                                category: newCategory,
                                                updated_at: new Date().toISOString()
                                              })
                                              .eq("id", expense.id);
                                            if (error) throw error;
                                            setExpenses(prev => prev.map(exp => 
                                              exp.id === expense.id ? { ...exp, category: newCategory } : exp
                                            ));
                                            toast.success("Category updated");
                                          } catch (error) {
                                            toast.error("Failed to update category");
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="w-32 h-8 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {uniqueCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button size="icon" variant="ghost" onClick={() => { setEditExpense(expense); setShowEdit(true); }}><Pencil className="w-4 h-4" /></Button>
                                      <Button size="icon" variant="ghost" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="border-t border-gray-800 font-bold">
                                <td className="px-4 py-2 text-right" colSpan={1}>Total</td>
                                <td className="px-4 py-2">${(categoryExpenses as any[]).reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}</td>
                                <td className="px-4 py-2" colSpan={5}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="block md:hidden space-y-3">
                          {(categoryExpenses as any[]).map((expense: any) => {
                            const needsRed = shouldBeRedAndUnverify(expense);
                            if (needsRed && expense.verified) {
                              // Auto-unverify in UI and DB
                              setTimeout(async () => {
                                setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: false } : exp));
                                await supabase
                                  .from("expenses")
                                  .update({ verified: false, updated_at: new Date().toISOString() })
                                  .eq("id", expense.id);
                              }, 0);
                            }
                            return (
                              <div key={expense.id} className="leonardo-card p-4 border border-gray-700 bg-gray-900/50">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white truncate">{expense.description || "No description"}</h3>
                                    <p className="text-lg font-semibold text-cyan-400">${(expense.amount || 0).toFixed(2)}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <Select
                                      value={expense.category}
                                      onValueChange={async (newCategory) => {
                                        try {
                                          const { error } = await supabase
                                            .from("expenses")
                                            .update({ 
                                              category: newCategory,
                                              updated_at: new Date().toISOString()
                                            })
                                            .eq("id", expense.id);
                                          if (error) throw error;
                                          setExpenses(prev => prev.map(exp => 
                                            exp.id === expense.id ? { ...exp, category: newCategory } : exp
                                          ));
                                          toast.success("Category updated");
                                        } catch (error) {
                                          toast.error("Failed to update category");
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-24 h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {uniqueCategories.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => { setEditExpense(expense); setShowEdit(true); }}
                                      className="p-1 h-8 w-8"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleDeleteExpense(expense.id)}
                                      className="p-1 h-8 w-8 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 text-sm text-gray-300">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Status:</span>
                                    <div className="flex items-center gap-2">
                                      {expense.is_recurring && (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${needsRed ? 'bg-red-900 text-red-400' : 'bg-green-900 text-green-400'}`}>
                                          <Repeat className="w-3 h-3 mr-1" /> Recurring
                                        </span>
                                      )}
                                      <span className={expense.status === 'Paid' ? 'text-green-400' : ''}>{expense.status}</span>
                                    </div>
                                  </div>
                                  
                                  {expense.due_date && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Due Date:</span>
                                      <span>{parseLocalDate(expense.due_date) ? parseLocalDate(expense.due_date)!.toLocaleDateString() : ''}</span>
                                    </div>
                                  )}
                                  
                                  {expense.payment_account && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Payment Account:</span>
                                      <span className="text-right max-w-[200px] truncate">{expense.payment_account}</span>
                                    </div>
                                  )}
                                  
                                  {expense.notes && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Notes:</span>
                                      <span className="text-right max-w-[200px] truncate">{expense.notes}</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                    <span className="text-gray-400">Verified:</span>
                                    <div>
                                      {expense.verified ? (
                                        <span
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900 text-blue-400 cursor-pointer"
                                          onClick={async () => {
                                            const newVerified = false;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                          title="Click to unverify"
                                        >
                                          <span className="mr-1">✓</span>Verified
                                        </span>
                                      ) : (
                                        <input
                                          type="checkbox"
                                          checked={false}
                                          onChange={async (e) => {
                                            const newVerified = true;
                                            setExpenses(prev => prev.map(exp => exp.id === expense.id ? { ...exp, verified: newVerified } : exp));
                                            await supabase
                                              .from("expenses")
                                              .update({ verified: newVerified, updated_at: new Date().toISOString() })
                                              .eq("id", expense.id);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Mobile Category Total */}
                          <div className="leonardo-card p-4 border border-gray-700 bg-gray-800/50">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">Total for {category}:</span>
                              <span className="font-bold text-cyan-400 text-lg">
                                ${(categoryExpenses as any[]).reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </div>

      {/* Notes Section */}
      <div className="leonardo-card border-gray-800 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            Business Notes
          </CardTitle>
          <CardDescription>Keep track of important business notes and reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Dialog open={showAddNote} onOpenChange={setShowAddNote}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Business Note</DialogTitle>
                  <DialogDescription>Add a new note for your organization</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input 
                    placeholder="Note Title" 
                    value={newNote.title} 
                    onChange={e => setNewNote({ ...newNote, title: e.target.value })} 
                  />
                  <textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={e => setNewNote({ ...newNote, content: e.target.value })}
                    className="w-full min-h-[120px] p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button onClick={handleAddNote} className="mt-4 w-full bg-blue-700 text-white">
                  Add Note
                </Button>
              </DialogContent>
            </Dialog>
          </div>

          {notes.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No notes found. Add your first business note!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => (
                <div key={note.id} className="leonardo-card p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                    <div className="flex gap-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => { setEditNote(note); setShowEditNote(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={showEditNote} onOpenChange={setShowEditNote}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business Note</DialogTitle>
            <DialogDescription>Update your business note</DialogDescription>
          </DialogHeader>
          {editNote && (
            <div className="space-y-4">
              <Input 
                placeholder="Note Title" 
                value={editNote.title} 
                onChange={e => setEditNote({ ...editNote, title: e.target.value })} 
              />
              <textarea
                placeholder="Note Content"
                value={editNote.content}
                onChange={e => setEditNote({ ...editNote, content: e.target.value })}
                className="w-full min-h-[120px] p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <Button onClick={handleEditNote} className="mt-4 w-full bg-blue-700 text-white">
            Update Note
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization Expense</DialogTitle>
            <DialogDescription>Update expense details for your organization</DialogDescription>
          </DialogHeader>
          {editExpense && (
            <div className="space-y-4">
              <Input placeholder="Description" value={editExpense.description || ""} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} />
              <Input placeholder="Amount" type="number" value={editExpense.amount || ""} onChange={e => setEditExpense({ ...editExpense, amount: e.target.value })} />
              <Input placeholder="Category" value={editExpense.category || ""} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} />
              {/* Recurring expense fields for edit */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_recurring"
                  checked={editExpense.is_recurring}
                  onChange={e => setEditExpense({ ...editExpense, is_recurring: e.target.checked })}
                />
                <label htmlFor="edit_is_recurring" className="text-gray-300">Recurring Expense</label>
              </div>
              {editExpense.is_recurring && (
                <div className="flex flex-col gap-2">
                  <Select
                    value={editExpense.recurrence || ""}
                    onValueChange={val => setEditExpense({ ...editExpense, recurrence: val })}
                  >
                    <SelectTrigger className="w-full leonardo-input text-white">
                      <SelectValue placeholder="Recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Yearly">Yearly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="One-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                  <div>
                    <Label htmlFor="edit_next_payment_date" className="text-sm text-gray-300 mb-1 block">Next Payment Date</Label>
                    <Input
                      id="edit_next_payment_date"
                      placeholder="Next Payment Date"
                      type="date"
                      value={editExpense.next_payment_date || ""}
                      onChange={e => setEditExpense({ ...editExpense, next_payment_date: e.target.value })}
                      className="leonardo-input text-white"
                    />
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="edit_due_date" className="text-sm text-gray-300 mb-1 block">Due Date</Label>
                <Input 
                  id="edit_due_date"
                  placeholder="Due Date" 
                  type="date" 
                  value={editExpense.due_date || ""} 
                  onChange={e => setEditExpense({ ...editExpense, due_date: e.target.value })} 
                />
              </div>
              <Input placeholder="Receipt URL" value={editExpense.receipt_url || ""} onChange={e => setEditExpense({ ...editExpense, receipt_url: e.target.value })} />
              <Input placeholder="Payment Account (Bank/Card)" value={editExpense.payment_account || ""} onChange={e => setEditExpense({ ...editExpense, payment_account: e.target.value })} />
              <Input placeholder="Notes" value={editExpense.notes || ""} onChange={e => setEditExpense({ ...editExpense, notes: e.target.value })} />
              <Select value={editExpense.status || ""} onValueChange={val => setEditExpense({ ...editExpense, status: val })}>
                <SelectTrigger className="w-full max-w-md bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                  <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_verified"
                  checked={editExpense.verified}
                  onChange={e => setEditExpense({ ...editExpense, verified: e.target.checked })}
                />
                <label htmlFor="edit_verified" className="text-gray-300">Verified</label>
              </div>
            </div>
          )}
          <Button onClick={handleEditExpense} className="mt-4 w-full bg-cyan-700 text-white">Update Expense</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 