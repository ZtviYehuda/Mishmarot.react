import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTransfers } from "@/hooks/useTransfers";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  CheckCircle2,
  Search,
  Clock,
  ArrowLeft,
  History,
  ShieldAlert,
  Plus,
  MapPin,
  ShieldCheck,
  User,
  Phone,
  IdCard,
  XCircle,
  CheckCircle,
  Calendar,
  MoreHorizontal,
  FileText,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Employee } from "@/types/employee.types";

export default function TransfersPage() {
  const { user } = useAuthContext();
  const { employees, getStructure } = useEmployees();
  const [searchParams] = useSearchParams();
  const {
    pendingTransfers,
    history,
    loading,
    fetchPending,
    fetchHistory,
    createTransfer,
    approveTransfer,
    rejectTransfer,
  } = useTransfers();

  const [activeTab, setActiveTab] = useState("pending");
  const [structure, setStructure] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  // Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [snoozeDate, setSnoozeDate] = useState<Date | undefined>(undefined);

  const [isSnoozing, setIsSnoozing] = useState(false);

  // Expanded Text State
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Form State
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPending();
    fetchHistory();
    const loadStructure = async () => {
      const data = await getStructure();
      if (data) setStructure(data);
    };
    loadStructure();
  }, [fetchPending, fetchHistory, getStructure]);

  useEffect(() => {
    const empId = searchParams.get("employeeId");
    if (empId && employees.length > 0) {
      const emp = employees.find((e) => e.id === Number(empId));
      if (emp) {
        setSelectedEmployee(emp);
        setActiveTab("new");
      }
    }
  }, [searchParams, employees]);

  const filteredEmployeesList = useMemo(() => {
    if (!searchTerm) return [];
    const lower = searchTerm.toLowerCase();
    return employees
      .filter(
        (emp) =>
          `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(lower) ||
          emp.personal_number.includes(searchTerm),
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

  // Cloud Stats
  const stats = useMemo(() => {
    const pending = pendingTransfers.length;
    const approved = history.filter((h) => h.status === "approved").length;
    const rejected = history.filter((h) => h.status === "rejected").length;
    return { pending, approved, rejected };
  }, [pendingTransfers, history]);

  const handleCreateRequest = async () => {
    if (!selectedEmployee || !targetDeptId) {
      toast.error("יש למלא את כל שדות החובה");
      return;
    }

    let targetType: "department" | "section" | "team" = "department";
    let targetId = targetDeptId;

    if (targetTeamId) {
      targetType = "team";
      targetId = targetTeamId;
    } else if (targetSectionId) {
      targetType = "section";
      targetId = targetSectionId;
    }

    setIsSubmitting(true);
    const success = await createTransfer({
      employee_id: selectedEmployee.id,
      target_type: targetType,
      target_id: parseInt(targetId),
      reason,
    });

    if (success) {
      toast.success("בקשת ההעברה הוגשה בהצלחה");
      setSelectedEmployee(null);
      setTargetDeptId("");
      setTargetSectionId("");
      setTargetTeamId("");
      setReason("");
      setActiveTab("pending");
      fetchPending();
    }
    setIsSubmitting(false);
  };

  const handleApprove = async (id: number) => {
    if (await approveTransfer(id)) {
      toast.success("הבקשה אושרה והשיבוץ עודכן");
      fetchPending();
      fetchHistory();
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectionReason) {
      toast.error("חובה לציין סיבת דחייה");
      return;
    }
    if (await rejectTransfer(id, rejectionReason)) {
      toast.info("הבקשה נדחתה");
      setRejectionReason("");
      setIsRejecting(false);
      setSelectedRequest(null); // Close modal
      fetchPending();
      fetchHistory();
    }
  };

  const handleSnooze = async () => {
    if (!snoozeDate || !selectedRequest) return;

    // Simulation of backend snooze logic
    toast.success(
      `תזכורת נקבעה לתאריך ${snoozeDate.toLocaleDateString("he-IL")}`,
    );
    setIsSnoozing(false);
    setSnoozeDate(undefined);
    setSelectedRequest(null);
  };

  const openProfile = async (empId: number) => {
    // First try to find in existing employees list
    let emp = employees.find((e) => e.id === empId);

    // If not found (e.g., employee from another unit in transfer request), fetch directly
    if (!emp) {
      try {
        const { data } = await apiClient.get(`/employees/${empId}`);
        emp = data;
      } catch (error) {
        toast.error("לא ניתן לטעון את פרטי השוטר");
        return;
      }
    }

    if (emp) setViewingEmployee(emp);
    else toast.error("נתוני שוטר לא נמצאו");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20",
      rejected:
        "bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20",
      cancelled: "bg-muted text-muted-foreground border-border/50",
      pending:
        "bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20",
    };
    const labels: Record<string, string> = {
      approved: "אושר",
      rejected: "נדחה",
      cancelled: "בוטל",
      pending: "ממתין",
    };
    return (
      <Badge
        variant="outline"
        className={cn(
          "font-bold text-[10px] px-2",
          styles[status] || styles.pending,
        )}
      >
        {labels[status] || labels.pending}
      </Badge>
    );
  };

  const canManage = user?.is_admin || user?.is_commander;

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500" dir="rtl">
      <PageHeader
        icon={ArrowLeftRight}
        title="בקשות העברה ושיבוץ"
        subtitle="ניהול ניוד כוח אדם ושינויים ארגוניים במערכת"
        category="ניהול משאבי אנוש"
        categoryLink="/transfers"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-[20px] p-6 border border-border shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-muted-foreground mb-1">
              בקשות ממתינות
            </span>
            <span className="text-4xl font-black text-amber-500">
              {stats.pending}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
        </div>

        <div className="bg-card rounded-[20px] p-6 border border-border shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-muted-foreground mb-1">
              אושר (היסטוריה)
            </span>
            <span className="text-4xl font-black text-emerald-500">
              {stats.approved}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        <div className="bg-card rounded-[20px] p-6 border border-border shadow-sm flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-muted-foreground mb-1">
              נדחה (היסטוריה)
            </span>
            <span className="text-4xl font-black text-rose-500">
              {stats.rejected}
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-rose-500" />
          </div>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 bg-card p-2 pl-4 rounded-[16px] border border-border shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full md:w-auto"
        >
          <TabsList className="bg-muted p-1.5 h-auto rounded-full gap-1 border border-border/50">
            <TabsTrigger
              value="history"
              className="h-9 rounded-full px-5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold text-xs transition-all flex items-center gap-2 border border-transparent data-[state=active]:border-border"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ארכיון היסטוריה</span>
              <span className="md:hidden">היסטוריה</span>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="h-9 rounded-full px-5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold text-xs transition-all flex items-center gap-2 border border-transparent data-[state=active]:border-border"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">ממתינות לטיפול</span>
              <span className="md:hidden">ממתינות</span>
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="h-9 rounded-full px-5 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground font-bold text-xs transition-all flex items-center gap-2 border border-transparent data-[state=active]:border-border hover:text-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              הגשת בקשה חדשה
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab !== "new" && (
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="סינון מהיר..."
              className="pl-10 pr-4 h-10 bg-muted/30 border-input hover:bg-muted/50 font-medium text-sm rounded-full focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        {/* Pending Requests Table */}
        {activeTab === "pending" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                      שוטר
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                      יחידה נוכחית
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                      יחידה מבוקשת
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[12%]">
                      הוגש ע"י
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[10%]">
                      תאריך
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[10%]">
                      סטטוס
                    </TableHead>
                    <TableHead className="text-right px-6 font-bold text-muted-foreground text-xs h-14 w-[15%]">
                      מידע נוסף
                    </TableHead>
                    <TableHead className="text-center px-6 font-bold text-muted-foreground text-xs h-14 w-[8%]">
                      פעולות
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-40 text-center text-muted-foreground italic"
                      >
                        טוען נתונים...
                      </TableCell>
                    </TableRow>
                  ) : pendingTransfers.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={8}
                        className="h-[400px] text-center border-none"
                      >
                        <div className="flex flex-col items-center justify-center gap-4 text-slate-300">
                          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-slate-200" />
                          </div>
                          <p className="text-lg font-bold text-slate-400">
                            אין בקשות פתוחות
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTransfers.map((req) => (
                      <TableRow
                        key={req.id}
                        className="group hover:bg-muted/30 border-b last:border-0 transition-colors"
                      >
                        <TableCell className="px-6 py-4 align-middle">
                          <button
                            onClick={() => openProfile(req.employee_id)}
                            className="flex items-center gap-3 text-right hover:bg-muted/50 p-2 -mr-2 rounded-xl transition-colors outline-none group/btn max-w-full"
                          >
                            <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center font-black text-xs text-muted-foreground shadow-sm group-hover/btn:scale-110 transition-transform shrink-0">
                              {req.employee_name?.[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-foreground truncate block max-w-[120px]">
                                {req.employee_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono truncate">
                                {req.personal_number}
                              </span>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <div className="flex items-center">
                            <Badge
                              variant="outline"
                              className="font-medium text-[10px] bg-muted/30 text-muted-foreground border-border/50 max-w-[140px] truncate block text-center"
                            >
                              {req.source_name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3 text-primary/40 shrink-0" />
                            <Badge
                              variant="outline"
                              className="font-bold text-[10px] bg-primary/5 text-primary border-primary/20 max-w-[140px] truncate block text-center"
                            >
                              {req.target_name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-bold text-foreground">
                              {req.requester_name}
                            </span>
                            <span className="text-[9px] text-primary font-black opacity-80 uppercase tracking-tighter">
                              {req.requester_unit || "מטה"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase">
                          {new Date(req.created_at).toLocaleDateString("he-IL")}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 shadow-sm rounded-lg px-2"
                          >
                            <Clock className="w-3 h-3 ml-1" />
                            ממתין
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {req.reason ? (
                            <div className="flex flex-col items-start gap-1 transition-all duration-300">
                              <span
                                className={cn(
                                  "text-xs text-muted-foreground block max-w-[200px] break-words whitespace-pre-wrap transition-all",
                                  !expandedRows.has(req.id) && "line-clamp-2",
                                )}
                              >
                                {req.reason}
                              </span>
                              {req.reason.length > 30 && (
                                <button
                                  onClick={() => toggleRowExpansion(req.id)}
                                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5 mt-1"
                                >
                                  {expandedRows.has(req.id) ? (
                                    <>
                                      הצג פחות
                                      <div className="rotate-180 transition-transform">
                                        <MoreHorizontal className="w-3 h-3" />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      הצג הכל
                                      <MoreHorizontal className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50 italic">
                              אין הערות
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                            onClick={() => setSelectedRequest(req)}
                            title="צפייה בפרטים מלאים"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* History Table */}
        {activeTab === "history" && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      שוטר
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      מסלול קודם
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      מסלול יעד
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      הוגש ע"י
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      טופל ע"י
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      תאריך
                    </TableHead>
                    <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-12">
                      סטטוס סופי
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-64 text-center opacity-30 italic"
                      >
                        אין היסטוריה זמינה
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((req) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/10 border-b last:border-0 transition-colors"
                      >
                        <TableCell className="px-6 py-4 align-middle">
                          <button
                            onClick={() => openProfile(req.employee_id)}
                            className="flex items-center gap-3 text-right hover:bg-muted/50 p-2 -mr-2 rounded-xl transition-colors outline-none group/btn max-w-full"
                          >
                            <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center font-black text-[10px] text-muted-foreground shadow-sm shrink-0">
                              {req.employee_name?.[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground truncate block max-w-[120px]">
                                {req.employee_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono truncate">
                                {req.personal_number}
                              </span>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <Badge
                            variant="outline"
                            className="font-medium text-[10px] bg-muted/30 text-muted-foreground border-border/50 max-w-[140px] truncate block text-center"
                          >
                            {req.source_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                            <Badge
                              variant="outline"
                              className="font-bold text-[10px] bg-primary/5 text-primary border-primary/20 max-w-[140px] truncate block text-center"
                            >
                              {req.target_name}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-bold">
                              {req.requester_name}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                              {req.requester_unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-bold">
                              {req.resolver_name || "---"}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                              {req.resolver_unit}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase">
                          {new Date(req.created_at).toLocaleDateString("he-IL")}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          {statusBadge(req.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* New Request Form */}
        {activeTab === "new" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-[20px] border border-border shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-border/50">
                  <h2 className="text-xl font-bold text-foreground">
                    הגשת בקשת ניוד
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    מילוי פרטים לצורך שינוי שיבוץ ארגוני ביחידה
                  </p>
                </div>

                <div className="p-8 space-y-8">
                  {/* Step 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      <label className="text-sm font-bold text-foreground">
                        בחירת שוטר
                      </label>
                    </div>

                    {!selectedEmployee ? (
                      <div className="relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          placeholder="חפש לפי שם או מ''א..."
                          className="pr-12 h-14 text-right rounded-2xl bg-muted/30 border-input focus:bg-background focus:ring-4 focus:ring-primary/20 transition-all text-base"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {filteredEmployeesList.length > 0 && searchTerm && (
                          <div className="absolute top-full mt-2 w-full z-50 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden ring-4 ring-muted/10 animate-in fade-in zoom-in-95 duration-200">
                            {filteredEmployeesList.map((emp) => (
                              <button
                                key={emp.id}
                                className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 text-right transition-colors border-b border-border/50 last:border-0 group"
                                onClick={() => {
                                  setSelectedEmployee(emp);
                                  setSearchTerm("");
                                }}
                              >
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground">
                                    {emp.first_name} {emp.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    מ"א: {emp.personal_number} •{" "}
                                    {emp.department_name}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shadow-sm">
                            {selectedEmployee.first_name[0]}
                            {selectedEmployee.last_name[0]}
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="font-bold text-foreground">
                              {selectedEmployee.first_name}{" "}
                              {selectedEmployee.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              מ"א: {selectedEmployee.personal_number} •{" "}
                              {selectedEmployee.department_name}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary hover:bg-primary/10 font-medium"
                          onClick={() => setSelectedEmployee(null)}
                        >
                          החלף שוטר
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      <label className="text-sm font-bold text-foreground">
                        יעד המעבר
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground block text-right">
                          מחלקה
                        </span>
                        <Select
                          value={targetDeptId}
                          onValueChange={(v) => {
                            setTargetDeptId(v);
                            setTargetSectionId("");
                            setTargetTeamId("");
                          }}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-input focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all focus:bg-background">
                            <SelectValue placeholder="בחר מחלקה..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-lg bg-popover">
                            {structure.map((d) => (
                              <SelectItem
                                key={d.id}
                                value={d.id.toString()}
                                className="font-medium focus:bg-accent text-foreground"
                              >
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground block text-right">
                          מדור
                        </span>
                        <Select
                          value={targetSectionId}
                          onValueChange={(v) => {
                            setTargetSectionId(v);
                            setTargetTeamId("");
                          }}
                          disabled={!targetDeptId}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-input focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all focus:bg-background disabled:opacity-50">
                            <SelectValue placeholder="בחר מדור..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-lg bg-popover">
                            {structure
                              .find((d) => d.id.toString() === targetDeptId)
                              ?.sections.map((s: any) => (
                                <SelectItem
                                  key={s.id}
                                  value={s.id.toString()}
                                  className="font-medium focus:bg-accent text-foreground"
                                >
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground block text-right">
                          חוליה
                        </span>
                        <Select
                          value={targetTeamId}
                          onValueChange={setTargetTeamId}
                          disabled={!targetSectionId}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-input focus:ring-2 focus:ring-primary/20 font-medium text-sm transition-all focus:bg-background disabled:opacity-50">
                            <SelectValue placeholder="בחר חוליה..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border shadow-lg bg-popover">
                            {structure
                              .find((d) => d.id.toString() === targetDeptId)
                              ?.sections.find(
                                (s: any) => s.id.toString() === targetSectionId,
                              )
                              ?.teams.map((t: any) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.id.toString()}
                                  className="font-medium focus:bg-accent text-foreground"
                                >
                                  {t.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      <label className="text-sm font-bold text-foreground">
                        נימוקים נוספים
                      </label>
                    </div>

                    <textarea
                      placeholder="פרט את הסיבה לבקשה..."
                      className="w-full min-h-[140px] p-4 bg-muted/30 rounded-2xl text-sm border-input focus:bg-background focus:ring-4 focus:ring-primary/20 transition-all resize-none font-sans"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      dir="rtl"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleCreateRequest}
                      disabled={
                        isSubmitting || !selectedEmployee || !targetDeptId
                      }
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30 active:scale-[0.98] text-base"
                    >
                      {isSubmitting
                        ? "בתהליך שליחה..."
                        : "שלח בקשת ניוד לאישור"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary/5 to-background rounded-[20px] p-6 border border-border/50 shadow-sm">
                <div className="flex items-center gap-3 text-primary mb-6">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold">דגשים להגשה</span>
                </div>
                <ul className="space-y-4">
                  {[
                    "כל ניוד כפוף לאישור מפקד היחידה.",
                    "יש לנמק את הצורך המבצעי במעבר.",
                    "השיבוץ יתעדכן לאחר סיום תהליך האישורים.",
                  ].map((t, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm font-medium text-muted-foreground leading-relaxed text-right items-start"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-card border border-border rounded-[20px] p-6 flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    זמן טיפול משוער
                  </p>
                  <p className="text-lg font-black text-foreground">
                    24-48 שעות
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal - Birthday Card Style */}
      <Dialog
        open={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
      >
        <DialogContent
          className="max-w-lg p-0 overflow-hidden border border-border shadow-2xl rounded-2xl bg-background"
          dir="rtl"
        >
          {viewingEmployee && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-lg font-black text-foreground leading-none">
                        {viewingEmployee.first_name} {viewingEmployee.last_name}
                      </h2>
                      <span className="text-[11px] font-bold text-muted-foreground mt-1">
                        מספר אישי: {viewingEmployee.personal_number}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-full border-none shadow-sm",
                      viewingEmployee.is_active
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white",
                    )}
                  >
                    {viewingEmployee.is_active ? "פעיל" : "לא פעיל"}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                {/* Personal Info Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <IdCard className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {viewingEmployee.national_id || "---"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      תעודת זהות
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-bold text-foreground truncate"
                      dir="ltr"
                    >
                      {viewingEmployee.phone_number || "---"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      טלפון נייד
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {viewingEmployee.city || "לא הוזנה כתובת"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                      עיר מגורים
                    </p>
                  </div>
                </div>

                {/* Service Dates Card */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        תאריך גיוס
                      </span>
                      <span className="text-xs font-bold text-foreground mt-1">
                        {viewingEmployee.enlistment_date
                          ? new Date(
                              viewingEmployee.enlistment_date,
                            ).toLocaleDateString("he-IL")
                          : "---"}
                      </span>
                    </div>
                    <div className="flex flex-col border-r border-primary/10 pr-4">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        הצבה ביחידה
                      </span>
                      <span className="text-xs font-bold text-primary mt-1">
                        {viewingEmployee.assignment_date
                          ? new Date(
                              viewingEmployee.assignment_date,
                            ).toLocaleDateString("he-IL")
                          : "---"}
                      </span>
                    </div>
                  </div>
                  {viewingEmployee.discharge_date && (
                    <div className="flex flex-col mt-3 pt-3 border-t border-primary/10">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">
                        צפי שחרור
                      </span>
                      <span className="text-xs font-bold text-rose-600 mt-1">
                        {new Date(
                          viewingEmployee.discharge_date,
                        ).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Professional Status Card */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">
                        סטטוס שירות
                      </span>
                      <span className="text-[11px] font-bold text-primary truncate">
                        {viewingEmployee.service_type_name || "---"}
                      </span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">
                        נוכחות
                      </span>
                      <span className="text-[11px] font-bold text-foreground truncate">
                        {viewingEmployee.status_name || "נוכח"}
                      </span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">
                        סיווג
                      </span>
                      <span className="text-[11px] font-bold text-foreground">
                        רמה {viewingEmployee.security_clearance || "0"}
                      </span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">
                        רישיון
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-black",
                          viewingEmployee.police_license
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-500",
                        )}
                      >
                        {viewingEmployee.police_license ? "בתוקף" : "לא בתוקף"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organizational Hierarchy Card */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-2">
                    שיוך ארגוני
                  </span>
                  <div
                    className="flex items-center gap-2 font-bold text-xs text-primary"
                    dir="ltr"
                  >
                    <span>{viewingEmployee.team_name || "כללי"}</span>
                    <span className="opacity-30">/</span>
                    <span>{viewingEmployee.section_name || "כללי"}</span>
                    <span className="opacity-30">/</span>
                    <span>{viewingEmployee.department_name}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/10 border-t border-border/50 flex justify-end">
                <Button
                  variant="outline"
                  className="h-9 rounded-xl font-black text-xs px-6 border-border hover:bg-muted"
                  onClick={() => setViewingEmployee(null)}
                >
                  סגור
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request Details Modal */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent
          className="max-w-4xl p-0 overflow-hidden border border-border shadow-2xl rounded-2xl bg-background flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {selectedRequest && (
            <div className="flex flex-col h-full">
              <div className="px-6 py-4 border-b border-border/40 bg-muted/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-sm border border-primary/10">
                    {selectedRequest.employee_name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground leading-none">
                      {selectedRequest.employee_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">
                        #{selectedRequest.id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold border border-border">
                        {selectedRequest.rank || "שוטר"}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-background px-2.5 py-0.5 text-xs font-mono"
                >
                  {new Date(selectedRequest.created_at).toLocaleDateString(
                    "he-IL",
                  )}
                </Badge>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Movement Flow - Compact */}
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0 text-center">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-1">
                        מערך נוכחי
                      </span>
                      <span
                        className="text-sm font-bold text-foreground truncate block"
                        title={selectedRequest.source_name}
                      >
                        {selectedRequest.source_name}
                      </span>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0 text-center">
                      <span className="text-[10px] font-black text-emerald-600/70 uppercase tracking-wider block mb-1">
                        מערך יעד
                      </span>
                      <span
                        className="text-sm font-bold text-emerald-700 truncate block"
                        title={selectedRequest.target_name}
                      >
                        {selectedRequest.target_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-black text-foreground">
                      נימוקי הבקשה
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-sm leading-relaxed text-muted-foreground min-h-[100px] shadow-sm break-words whitespace-pre-wrap">
                    {selectedRequest.reason || "לא צורפו הערות לבקשה זו."}
                  </div>
                </div>

                {/* Requester Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                  <span>
                    הוגש ע"י:{" "}
                    <span className="font-bold text-foreground">
                      {selectedRequest.requester_name}
                    </span>
                  </span>
                  <span>{selectedRequest.requester_unit || "מטה"}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 bg-muted/10 border-t border-border/50 flex flex-col gap-3">
                {/* Rejection / Snooze / Approve Logic */}
                {isRejecting ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <Textarea
                      placeholder="נא לפרט את סיבת הדחייה..."
                      className="bg-background min-h-[80px]"
                      value={rejectionReason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setRejectionReason(e.target.value)
                      }
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsRejecting(false)}
                      >
                        ביטול
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(selectedRequest.id)}
                      >
                        אישור דחייה
                      </Button>
                    </div>
                  </div>
                ) : isSnoozing ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold">
                        מתי להזכיר לך לטפל בבקשה?
                      </span>
                    </div>
                    <CalendarComponent
                      mode="single"
                      selected={snoozeDate}
                      onSelect={setSnoozeDate}
                      className="rounded-md border bg-background mx-auto"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSnoozing(false)}
                      >
                        ביטול
                      </Button>
                      <Button onClick={handleSnooze} disabled={!snoozeDate}>
                        קבע תזכורת
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Permission Check */}
                    {(() => {
                      return (
                        <div className="grid grid-cols-3 gap-3 w-full">
                          <Button
                            variant="outline"
                            className="w-full border-muted-foreground/30 hover:bg-accent hover:text-accent-foreground"
                            onClick={() => setIsSnoozing(true)}
                          >
                            <Clock className="w-4 h-4 ml-2" />
                            טיפול בעתיד
                          </Button>

                          <Button
                            variant="outline"
                            className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                            onClick={() => setIsRejecting(true)}
                          >
                            <XCircle className="w-4 h-4 ml-2" />
                            דחיית בקשה
                          </Button>

                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                            onClick={() => {
                              handleApprove(selectedRequest.id);
                              setSelectedRequest(null);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            אישור והעברה
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {!canManage && (
        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-right">
            <p className="text-xs font-black text-amber-900 leading-none">
              מצב צפייה
            </p>
            <p className="text-[10px] font-bold text-amber-800/80 mt-1">
              חשבונך אינו מוגדר לניהול בקשות אחרים.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
