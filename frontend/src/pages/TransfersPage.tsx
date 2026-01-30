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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ArrowLeftRight,
  CheckCircle2,
  Search,
  Clock,
  ArrowLeft,
  History,
  ShieldAlert,
  Plus,
  ExternalLink,
  MapPin,
  ShieldCheck,
  User,
  Phone,
  IdCard,
} from "lucide-react";
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
    cancelTransfer,
  } = useTransfers();

  const [activeTab, setActiveTab] = useState("pending");
  const [structure, setStructure] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

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
      .filter((emp) =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(lower) ||
        emp.personal_number.includes(searchTerm)
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

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
    const reason = prompt("סיבת הדחייה:");
    if (reason === null) return;
    if (await rejectTransfer(id, reason)) {
      toast.info("הבקשה נדחתה");
      fetchPending();
      fetchHistory();
    }
  };

  const handleCancel = async (id: number) => {
    if (confirm("האם לבטל את הבקשה?")) {
      if (await cancelTransfer(id)) {
        toast.info("הבקשה בוטלה");
        fetchPending();
        fetchHistory();
      }
    }
  };

  const openProfile = async (empId: number) => {
    // First try to find in existing employees list
    let emp = employees.find(e => e.id === empId);

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
      approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
      rejected: "bg-rose-50 text-rose-700 border-rose-100",
      cancelled: "bg-muted text-muted-foreground",
      pending: "bg-amber-50 text-amber-700 border-amber-100",
    };
    const labels: Record<string, string> = {
      approved: "אושר",
      rejected: "נדחה",
      cancelled: "בוטל",
      pending: "ממתין",
    };
    return (
      <Badge variant="outline" className={cn("font-bold text-[10px] px-2", styles[status] || styles.pending)}>
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

      {/* Action Bar - Matching EmployeeTable Consistency */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="bg-muted/50 p-1 rounded-xl h-11">
            <TabsTrigger value="pending" className="px-6 rounded-lg font-bold text-xs sm:text-sm gap-2">
              <Clock className="w-4 h-4" />
              ממתינות {pendingTransfers.length > 0 && `(${pendingTransfers.length})`}
            </TabsTrigger>
            <TabsTrigger value="new" className="px-6 rounded-lg font-bold text-xs sm:text-sm gap-2">
              <Plus className="w-4 h-4" />
              בקשה חדשה
            </TabsTrigger>
            <TabsTrigger value="history" className="px-6 rounded-lg font-bold text-xs sm:text-sm gap-2">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab !== "new" && (
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש לפי שם או מ''א..."
              className="pr-10 h-11 text-right border-input rounded-xl text-sm"
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
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border">
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">שוטר</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">מסלול נוכחי</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">מסלול יעד</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">הוגש ע"י</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">מידע נוסף</TableHead>
                    <TableHead className="text-center font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">טוען נתונים...</TableCell></TableRow>
                  ) : pendingTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <CheckCircle2 className="w-16 h-16" />
                          <p className="text-lg font-black">אין בקשות פתוחות</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTransfers.map((req) => (
                      <TableRow key={req.id} className="group hover:bg-muted/30 border-b last:border-0 transition-colors">
                        <TableCell className="px-6 py-4">
                          <button
                            onClick={() => openProfile(req.employee_id)}
                            className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity outline-none group/btn"
                          >
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover/btn:bg-primary group-hover/btn:text-white transition-colors">
                              {req.employee_name?.[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground flex items-center gap-1">
                                {req.employee_name}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">מ"א: {req.personal_number}</span>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground" dir="rtl">{req.source_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-3.5 h-3.5 text-primary/30" />
                            <span className="text-[11px] font-black text-primary" dir="rtl">{req.target_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-xs font-bold text-foreground">{req.requester_name}</span>
                            <span className="text-[9px] text-primary font-black opacity-80 uppercase tracking-tighter">{req.requester_unit || "מטה"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            {statusBadge("pending")}
                            {req.reason && <p className="text-[10px] italic text-muted-foreground/60 max-w-[150px] truncate" title={req.reason}>"{req.reason}"</p>}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {canManage ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-9 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold px-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border-0"
                                  onClick={() => handleApprove(req.id)}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                                  אישור
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold px-5 rounded-xl transition-all duration-200"
                                  onClick={() => handleReject(req.id)}
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 ml-1.5" />
                                  דחייה
                                </Button>
                              </>
                            ) : req.requested_by === user?.id ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold px-5 rounded-xl transition-all duration-200"
                                onClick={() => handleCancel(req.id)}
                              >
                                ביטול
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="px-3 py-1.5 font-bold text-[10px] rounded-lg">בבדיקה</Badge>
                            )}
                          </div>
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
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">שוטר</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">מסלול קודם</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">מסלול יעד</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">הוגש ע"י</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">טופל ע"י</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">תאריך</TableHead>
                    <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">סטטוס סופי</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-30 italic">אין היסטוריה זמינה</TableCell></TableRow>
                  ) : (
                    history.map((req) => (
                      <TableRow key={req.id} className="hover:bg-muted/10 border-b last:border-0 transition-colors">
                        <TableCell className="px-6 py-4">
                          <button
                            onClick={() => openProfile(req.employee_id)}
                            className="flex items-center gap-3 text-right hover:opacity-80 transition-all outline-none group/btn"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs group-hover/btn:bg-primary group-hover/btn:text-white transition-colors">
                              {req.employee_name?.[0]}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                                {req.employee_name}
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">מ"א: {req.personal_number}</span>
                            </div>
                          </button>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-muted-foreground" dir="rtl">{req.source_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <ArrowLeft className="w-3 h-3 opacity-20" />
                            <span className="text-[11px] font-black text-primary" dir="rtl">{req.target_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-bold">{req.requester_name}</span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">{req.requester_unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-bold">{req.resolver_name || "---"}</span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">{req.resolver_unit}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase">{new Date(req.created_at).toLocaleDateString("he-IL")}</TableCell>
                        <TableCell className="px-6 py-4">{statusBadge(req.status)}</TableCell>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/20 border-b px-6 py-5">
                  <CardTitle className="text-lg font-black text-right">הגשת בקשת ניוד</CardTitle>
                  <CardDescription className="text-right text-xs">מילוי פרטים לצורך שינוי שיבוץ ארגוני ביחידה</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  {/* Step 1 */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">1. בחירת שוטר</label>
                    {!selectedEmployee ? (
                      <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="חפש לפי שם או מ''א..."
                          className="pr-10 h-11 text-right rounded-xl"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {filteredEmployeesList.length > 0 && searchTerm && (
                          <div className="absolute top-full mt-2 w-full z-50 bg-card border rounded-xl shadow-xl overflow-hidden">
                            {filteredEmployeesList.map((emp) => (
                              <button key={emp.id} className="w-full p-4 flex items-center gap-3 hover:bg-muted text-right transition-colors border-b last:border-0" onClick={() => { setSelectedEmployee(emp); setSearchTerm(""); }}>
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{emp.first_name[0]}{emp.last_name[0]}</div>
                                <div className="flex flex-col"><span className="text-sm font-bold">{emp.first_name} {emp.last_name}</span><span className="text-[10px] text-muted-foreground">מ"א: {emp.personal_number} • {emp.department_name}</span></div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-md shadow-primary/20">{selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}</div>
                          <div className="flex flex-col text-right"><span className="font-black text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</span><span className="text-[10px] text-muted-foreground">מ"א: {selectedEmployee.personal_number} • {selectedEmployee.department_name}</span></div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-primary font-bold hover:bg-primary/10" onClick={() => setSelectedEmployee(null)}>החלף שוטר</Button>
                      </div>
                    )}
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-4 pt-4 border-t border-muted">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">2. יעד המעבר</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground block text-right pr-1">מחלקה</span>
                        <Select value={targetDeptId} onValueChange={(v) => { setTargetDeptId(v); setTargetSectionId(""); setTargetTeamId(""); }}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-none font-bold"><SelectValue placeholder="בחר מחלקה..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">{structure.map(d => <SelectItem key={d.id} value={d.id.toString()} className="font-bold">{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground block text-right pr-1">מדור</span>
                        <Select value={targetSectionId} onValueChange={(v) => { setTargetSectionId(v); setTargetTeamId(""); }} disabled={!targetDeptId}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-none font-bold disabled:opacity-30"><SelectValue placeholder="בחר מדור..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">{structure.find(d => d.id.toString() === targetDeptId)?.sections.map((s: any) => <SelectItem key={s.id} value={s.id.toString()} className="font-bold">{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground block text-right pr-1">חוליה</span>
                        <Select value={targetTeamId} onValueChange={setTargetTeamId} disabled={!targetSectionId}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/40 border-none font-bold disabled:opacity-30"><SelectValue placeholder="בחר חוליה..." /></SelectTrigger>
                          <SelectContent className="rounded-xl">{structure.find(d => d.id.toString() === targetDeptId)?.sections.find((s: any) => s.id.toString() === targetSectionId)?.teams.map((t: any) => <SelectItem key={t.id} value={t.id.toString()} className="font-bold">{t.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-4 pt-4 border-t border-muted">
                    <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">3. נימוקים נוספים</label>
                    <textarea placeholder="פרט את הסיבה לבקשה..." className="w-full min-h-[120px] p-4 bg-muted/30 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary/20 transition-all resize-none shadow-inner" value={reason} onChange={(e) => setReason(e.target.value)} dir="rtl" />
                  </div>

                  <Button onClick={handleCreateRequest} disabled={isSubmitting || !selectedEmployee || !targetDeptId} className="w-full h-12 text-sm font-black shadow-lg shadow-primary/20 rounded-xl transition-all active:scale-[0.98]">{isSubmitting ? "בתהליך שליחה..." : "שלח בקשת ניוד לאישור"}</Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-none bg-primary/5 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-primary mb-4">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-sm font-black">דגשים להגשה</span>
                </div>
                <ul className="space-y-3">
                  {[
                    "כל ניוד כפוף לאישור מפקד היחידה.",
                    "יש לנמק את הצורך המבצעי במעבר.",
                    "השיבוץ יתעדכן לאחר סיום תהליך האישורים.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-2 text-[11px] font-bold text-muted-foreground/80 leading-relaxed text-right">
                      <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0 opacity-50" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Card>
              <div className="bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all hover:bg-muted/30">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-muted-foreground" /></div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">זמן טיפול</p>
                  <p className="text-xs font-black text-foreground mt-1">24-48 שעות</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal - Birthday Card Style */}
      <Dialog open={!!viewingEmployee} onOpenChange={(open) => !open && setViewingEmployee(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border border-border shadow-2xl rounded-2xl bg-background" dir="rtl">
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
                      <h2 className="text-lg font-black text-foreground leading-none">{viewingEmployee.first_name} {viewingEmployee.last_name}</h2>
                      <span className="text-[11px] font-bold text-muted-foreground mt-1">מספר אישי: {viewingEmployee.personal_number}</span>
                    </div>
                  </div>
                  <Badge className={cn("px-3 py-1 text-[10px] font-black rounded-full border-none shadow-sm",
                    viewingEmployee.is_active ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
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
                    <p className="text-xs font-bold text-foreground truncate">{viewingEmployee.national_id || "---"}</p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">תעודת זהות</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate" dir="ltr">{viewingEmployee.phone_number || "---"}</p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">טלפון נייד</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 transition-all hover:border-border">
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border/50 shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{viewingEmployee.city || "לא הוזנה כתובת"}</p>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">עיר מגורים</p>
                  </div>
                </div>

                {/* Service Dates Card */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">תאריך גיוס</span>
                      <span className="text-xs font-bold text-foreground mt-1">{viewingEmployee.enlistment_date ? new Date(viewingEmployee.enlistment_date).toLocaleDateString("he-IL") : "---"}</span>
                    </div>
                    <div className="flex flex-col border-r border-primary/10 pr-4">
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">הצבה ביחידה</span>
                      <span className="text-xs font-bold text-primary mt-1">{viewingEmployee.assignment_date ? new Date(viewingEmployee.assignment_date).toLocaleDateString("he-IL") : "---"}</span>
                    </div>
                  </div>
                  {viewingEmployee.discharge_date && (
                    <div className="flex flex-col mt-3 pt-3 border-t border-primary/10">
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">צפי שחרור</span>
                      <span className="text-xs font-bold text-rose-600 mt-1">{new Date(viewingEmployee.discharge_date).toLocaleDateString("he-IL")}</span>
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
                      <span className="text-[9px] font-black text-muted-foreground uppercase">סטטוס שירות</span>
                      <span className="text-[11px] font-bold text-primary truncate">{viewingEmployee.service_type_name || "---"}</span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">נוכחות</span>
                      <span className="text-[11px] font-bold text-foreground truncate">{viewingEmployee.status_name || "נוכח"}</span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">סיווג</span>
                      <span className="text-[11px] font-bold text-foreground">רמה {viewingEmployee.security_clearance || "0"}</span>
                    </div>
                    <div className="flex flex-col border-r border-border/10 pr-2">
                      <span className="text-[9px] font-black text-muted-foreground uppercase">רישיון</span>
                      <span className={cn("text-[10px] font-black", viewingEmployee.police_license ? "text-emerald-600" : "text-rose-500")}>
                        {viewingEmployee.police_license ? "בתוקף" : "לא בתוקף"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Organizational Hierarchy Card */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block mb-2">שיוך ארגוני</span>
                  <div className="flex items-center gap-2 font-bold text-xs text-primary" dir="ltr">
                    <span>{viewingEmployee.team_name || "כללי"}</span>
                    <span className="opacity-30">/</span>
                    <span>{viewingEmployee.section_name || "כללי"}</span>
                    <span className="opacity-30">/</span>
                    <span>{viewingEmployee.department_name}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
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

      {!canManage && (
        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-right">
            <p className="text-xs font-black text-amber-900 leading-none">מצב צפייה</p>
            <p className="text-[10px] font-bold text-amber-800/80 mt-1">חשבונך אינו מוגדר לניהול בקשות אחרים.</p>
          </div>
        </div>
      )}
    </div>
  );
}
