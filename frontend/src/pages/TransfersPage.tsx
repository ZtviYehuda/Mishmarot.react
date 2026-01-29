import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTransfers } from "@/hooks/useTransfers";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Search,
  UserPlus,
  Clock,
  User,
  ArrowLeft,
  Building2,
  Users,
  History,
  ShieldAlert,
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
  const [targetType, setTargetType] = useState<
    "department" | "section" | "team"
  >("department");
  const [targetId, setTargetId] = useState<string>("");
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

  // Pre-select employee from URL if available
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

  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return [];
    return employees
      .filter(
        (emp) =>
          emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.personal_number.includes(searchTerm),
      )
      .slice(0, 5);
  }, [employees, searchTerm]);

  const handleCreateRequest = async () => {
    if (!selectedEmployee || !targetId) {
      toast.error("אנא בחר שוטר ויעד להעברה");
      return;
    }

    setIsSubmitting(true);
    const success = await createTransfer({
      employee_id: selectedEmployee.id,
      target_type: targetType,
      target_id: parseInt(targetId),
      reason,
    });

    if (success) {
      toast.success("בקשת ההעברה נוצרה בהצלחה");
      setSelectedEmployee(null);
      setTargetId("");
      setReason("");
      setSearchTerm("");
      setActiveTab("pending");
    }
    setIsSubmitting(false);
  };

  const handleApprove = async (id: number) => {
    if (!confirm("האם אתה בטוח שברצונך לאשר העברה זו?")) return;
    const success = await approveTransfer(id);
    if (success) toast.success("ההעברה אושרה בוצעה בהצלחה");
  };

  const handleReject = async (id: number) => {
    const reason = prompt("סיבת הדחייה:");
    if (reason === null) return;
    const success = await rejectTransfer(id, reason);
    if (success) toast.error("הבקשה נדחתה");
  };

  const handleCancel = async (id: number) => {
    if (!confirm("לבטל את הבקשה?")) return;
    const success = await cancelTransfer(id);
    if (success) toast.info("הבקשה בוטלה");
  };

  const canManage = user?.is_admin || user?.is_commander;

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "department":
        return <Building2 className="w-3 h-3" />;
      case "section":
        return <Users className="w-3 h-3" />;
      case "team":
        return <User className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="space-y-6 pb-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <PageHeader
        icon={ArrowLeftRight}
        title="בקשות העברה ושינוי שיבוץ"
        subtitle="מרכז ניהול מעברי כוח אדם ושינויים ארגוניים"
        category="ניהול וכוח אדם"
        categoryLink="/transfers"
        iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <Card className="rounded-[2rem] border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  ממתינות
                </p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">
                  {pendingTransfers.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  אושרו החודש
                </p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">
                  {
                    history.filter(
                      (h) =>
                        h.status === "approved" &&
                        new Date(h.created_at).getMonth() ===
                          new Date().getMonth(),
                    ).length
                  }
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <ArrowLeftRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  סה"כ בקשות
                </p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">
                  {pendingTransfers.length + history.length}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  בוטלו / נדחו
                </p>
                <h3 className="text-2xl font-black text-foreground mt-0.5">
                  {
                    history.filter(
                      (h) =>
                        h.status === "rejected" || h.status === "cancelled",
                    ).length
                  }
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-8"
      >
        <div className="flex justify-center md:justify-start overflow-x-auto pb-2 md:pb-0">
          <TabsList className="bg-muted/40 p-1.5 h-auto rounded-2xl border border-border/50 inline-flex shadow-sm">
            <TabsTrigger
              value="pending"
              className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2"
            >
              <Clock className="w-4 h-4" />
              בקשות ממתינות
              {pendingTransfers.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full mr-1.5">
                  {pendingTransfers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2"
            >
              <UserPlus className="w-4 h-4" />
              בקשה חדשה
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2"
            >
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Pending Transfers --- */}
        <TabsContent
          value="pending"
          className="animate-in slide-in-from-bottom-4 duration-500"
        >
          {pendingTransfers.length === 0 && !loading ? (
            <Card className="border-dashed py-24 bg-muted/5 border-4 rounded-[3rem] transition-all hover:bg-muted/10">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[2.5rem] bg-muted/50 flex items-center justify-center mb-2 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground/20" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground">
                    אין בקשות ממתינות לטיפול
                  </h3>
                  <p className="text-muted-foreground mt-2 font-medium max-w-sm mx-auto">
                    מצוין! כל בקשות ההעברה והשינויים הארגוניים טופלו או שטרם
                    הוגשו בקשות חדשות.
                  </p>
                </div>
                <Button
                  variant="default"
                  onClick={() => setActiveTab("new")}
                  className="mt-6 h-12 px-8 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  הגש בקשת העברה חדשה
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[2.5rem] border-border shadow-2xl overflow-hidden bg-card border-2">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30 border-b-2 border-border">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right py-6 pr-10 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] w-[300px]">
                        פרטי השוטר
                      </TableHead>
                      <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                        מסלול השינוי המבוקש
                      </TableHead>
                      <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                        פרטי הבקשה והערות
                      </TableHead>
                      <TableHead className="text-center font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                        פעולות ניהול
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.map((req) => (
                      <TableRow
                        key={req.id}
                        className="group border-b border-border/50 hover:bg-primary/[0.02] transition-colors last:border-0"
                      >
                        <TableCell className="py-6 pr-10">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 border-2 border-indigo-200/50 flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                                {req.employee_name?.[0]}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border-2 border-indigo-100 flex items-center justify-center shadow-sm">
                                <User className="w-3 h-3 text-indigo-500" />
                              </div>
                            </div>
                            <div>
                              <div className="font-black text-foreground text-base tracking-tight">
                                {req.employee_name}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] font-black px-1.5 py-0 h-4 bg-muted/60"
                                >
                                  ID: {req.employee_id}
                                </Badge>
                                <span className="text-[11px] font-bold text-muted-foreground line-clamp-1">
                                  מעמד: שוטר יחידה
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl w-fit border border-border/40 shadow-inner group-hover:bg-white transition-colors duration-300">
                            <div className="flex flex-col gap-0.5 px-3 min-w-[100px]">
                              <span className="text-[9px] font-black text-muted-foreground/60 uppercase">
                                ממקור
                              </span>
                              <div className="flex items-center gap-2 text-xs font-black text-muted-foreground">
                                <TypeIcon type={req.source_type} />
                                {req.source_name}
                              </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center shadow-sm group-hover:rotate-180 transition-transform duration-500">
                              <ArrowLeft className="w-5 h-5 text-primary/60" />
                            </div>
                            <div className="flex flex-col gap-0.5 px-3 min-w-[100px]">
                              <span className="text-[9px] font-black text-primary/60 uppercase">
                                ליעד
                              </span>
                              <div className="flex items-center gap-2 text-xs font-black text-primary">
                                <TypeIcon type={req.target_type} />
                                {req.target_name}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200/50 text-[10px] font-black h-5">
                                ממתין
                              </Badge>
                              <span className="text-[11px] font-bold text-muted-foreground">
                                ע"י {req.requester_name}
                              </span>
                            </div>
                            {req.reason ? (
                              <div className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-[250px] bg-muted/20 p-2 rounded-xl border border-dashed border-border group-hover:bg-white transition-colors">
                                "{req.reason}"
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/40 italic mr-1">
                                ללא הערות נוספות
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-3">
                            {canManage ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-black rounded-2xl transition-all active:scale-95 group/btn"
                                  onClick={() => handleApprove(req.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-2 group-hover/btn:scale-125 transition-transform" />{" "}
                                  אישור
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-11 px-5 border-2 border-destructive/20 text-destructive hover:bg-red-50 hover:border-destructive/40 font-black rounded-2xl transition-all active:scale-95"
                                  onClick={() => handleReject(req.id)}
                                >
                                  דחייה
                                </Button>
                              </>
                            ) : req.requested_by === user?.id ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-11 px-6 bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200 font-black rounded-2xl transition-all"
                                onClick={() => handleCancel(req.id)}
                              >
                                <XCircle className="w-4 h-4 ml-2" /> ביטול בקשה
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 py-2 px-4 bg-muted/40 rounded-xl border border-dashed border-border">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                                  בבדיקה
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* --- New Transfer Form --- */}
        <TabsContent
          value="new"
          className="animate-in slide-in-from-bottom-4 duration-500 pb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Section */}
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-border bg-card shadow-lg rounded-[2.5rem] overflow-hidden border-2">
                <CardHeader className="bg-gradient-to-l from-primary/5 via-transparent to-transparent border-b border-border p-8">
                  <div className="flex items-center gap-5 text-right">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                      <UserPlus className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-black text-foreground">
                        בקשה לשינוי שיבוץ
                      </CardTitle>
                      <CardDescription className="text-sm font-medium text-muted-foreground mt-1.5 leading-relaxed text-right">
                        טופס זה מיועד להגשת בקשת מעבר ארגוני עבור שוטר במערכת.
                        <br className="hidden sm:block" /> אנא מלא את הפרטים
                        בקפידה ושלח לאישור הגורמים הרלוונטיים.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-12">
                  {/* Step 1: Employee Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-right">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                        1
                      </div>
                      <h3 className="text-lg font-black text-foreground">
                        בחירת שוטר להעברה
                      </h3>
                    </div>

                    <div className="relative">
                      {!selectedEmployee ? (
                        <div className="space-y-4">
                          <p className="text-sm font-bold text-muted-foreground mr-1">
                            חפש שוטר לפי שם או מספר אישי:
                          </p>
                          <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                            <Input
                              placeholder="הקלד לחיפוש..."
                              className="h-16 pr-12 bg-muted/50 border-input focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary rounded-3xl text-lg font-bold transition-all placeholder:font-medium shadow-inner"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {filteredEmployees.length > 0 && searchTerm && (
                              <div className="absolute top-full mt-3 w-full bg-card border border-border rounded-3xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 ring-1 ring-black/5">
                                {filteredEmployees.map((emp) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    className="w-full p-5 flex items-center justify-between hover:bg-muted transition-all border-b border-border last:border-0 group text-right active:bg-muted/80"
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setSearchTerm("");
                                    }}
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm shadow-sm group-hover:scale-110 transition-transform">
                                        {emp.first_name[0]}
                                        {emp.last_name[0]}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                                          {emp.first_name} {emp.last_name}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-black tracking-wide">
                                          {emp.personal_number}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest bg-muted px-3 py-1.5 rounded-xl group-hover:bg-white transition-colors border border-border/50">
                                      {emp.department_name || "ללא שיוך"}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-3xl bg-primary/[0.03] border-2 border-primary/10 flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-5 p-2">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner">
                              <User className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-black text-lg text-foreground tracking-tight">
                                {selectedEmployee.first_name}{" "}
                                {selectedEmployee.last_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-black border-primary/20 bg-white shadow-sm"
                                >
                                  {selectedEmployee.personal_number}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-bold">
                                  {selectedEmployee.department_name}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEmployee(null)}
                            className="bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-2xl h-11 px-6 font-black text-xs transition-all border-2"
                          >
                            החלף שוטר
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Target Selection */}
                  <div className="space-y-6 pt-4 border-t border-border/50">
                    <div
                      className="flex items-center gap-3 text-right"
                      dir="rtl"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                        2
                      </div>
                      <h3 className="text-lg font-black text-foreground">
                        יעד המעבר המבוקש
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">
                          סוג יחידה
                        </label>
                        <Select
                          value={targetType}
                          onValueChange={(v: any) => {
                            setTargetType(v);
                            setTargetId("");
                          }}
                        >
                          <SelectTrigger className="h-14 bg-muted/50 border-input rounded-2xl font-black text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2 shadow-xl">
                            <SelectItem
                              value="department"
                              className="font-bold"
                            >
                              מחלקה
                            </SelectItem>
                            <SelectItem value="section" className="font-bold">
                              מדור
                            </SelectItem>
                            <SelectItem value="team" className="font-bold">
                              חולייה (צוות)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">
                          בחירת היחידה
                        </label>
                        <Select
                          value={targetId}
                          onValueChange={setTargetId}
                          disabled={!structure.length}
                        >
                          <SelectTrigger className="h-14 bg-muted/50 border-input rounded-2xl font-black text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-inner">
                            <SelectValue placeholder="בחר יעד מהרשימה..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[350px] rounded-2xl border-2 shadow-xl">
                            {targetType === "department" &&
                              structure.map((dept) => (
                                <SelectItem
                                  key={dept.id}
                                  value={dept.id.toString()}
                                  className="font-bold"
                                >
                                  {dept.name}
                                </SelectItem>
                              ))}
                            {targetType === "section" &&
                              structure
                                .flatMap((d) => d.sections)
                                .map((sec) => (
                                  <SelectItem
                                    key={sec.id}
                                    value={sec.id.toString()}
                                    className="font-bold"
                                  >
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <span>{sec.name}</span>
                                      <span className="text-[10px] text-muted-foreground mr-2 font-medium opacity-60 tracking-tight">
                                        ({sec.department_name})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                            {targetType === "team" &&
                              structure
                                .flatMap((d) => d.sections)
                                .flatMap((s) => s.teams)
                                .map((tm) => (
                                  <SelectItem
                                    key={tm.id}
                                    value={tm.id.toString()}
                                    className="font-bold"
                                  >
                                    <div className="flex items-center justify-between w-full gap-4">
                                      <span>{tm.name}</span>
                                      <span className="text-[10px] text-muted-foreground mr-2 font-medium opacity-60 tracking-tight">
                                        ({tm.section_name})
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Reason Selection */}
                  <div className="space-y-6 pt-4 border-t border-border/50">
                    <div
                      className="flex items-center gap-3 text-right"
                      dir="rtl"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-black shadow-lg shadow-primary/20">
                        3
                      </div>
                      <h3 className="text-lg font-black text-foreground">
                        סיבה והערות נוספות
                      </h3>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">
                        סיבת הבקשה
                      </label>
                      <textarea
                        placeholder="פרט את הסיבה לבקשה (אופציונלי). הערות אלו יופיעו בפני הגורמים המאשרים..."
                        className="w-full min-h-[120px] p-5 bg-muted/50 border-input border-2 focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary rounded-3xl text-sm font-bold transition-all shadow-inner resize-none overflow-hidden"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={handleCreateRequest}
                      disabled={isSubmitting || !selectedEmployee || !targetId}
                      className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-3xl text-lg font-black shadow-[0_15px_30px_-5px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98] gap-4 mb-2"
                    >
                      {isSubmitting ? (
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ArrowLeftRight className="w-6 h-6" />
                      )}
                      שלח בקשת העברה לבדיקה ואישור
                    </Button>
                    <p className="text-center text-[11px] text-muted-foreground font-bold tracking-wide">
                      ניתן לעקוב אחר סטטוס הבקשה בלשונית "בקשות ממתינות"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="lg:col-span-4 sticky top-24">
              <Card className="border-2 border-primary/5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="p-8 space-y-8 relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                  <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />

                  <div
                    className="relative z-10 flex flex-col items-end text-right space-y-4"
                    dir="rtl"
                  >
                    <div className="w-20 h-20 rounded-[2rem] bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                      <ArrowLeftRight className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight">
                        תצוגה מקדימה
                      </h3>
                      <p className="text-[10px] font-black text-white/70 mt-1 uppercase tracking-[0.2em]">
                        טופס בקשה דיגיטלי
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Source Unit */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mr-1">
                        יחידת מקור
                      </p>
                      <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 font-black text-xs">
                          <Building2 className="w-5 h-5 text-indigo-100" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black truncate">
                            {selectedEmployee
                              ? selectedEmployee.department_name
                              : "---"}
                          </p>
                          <p className="text-[10px] text-white/60 font-medium">
                            {selectedEmployee
                              ? selectedEmployee.team_name
                              : "ממתין לבחירה"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow Spacer */}
                    <div className="flex justify-center -my-2">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                        <ArrowLeft className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Target Unit */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mr-1">
                        יחידת יעד מבוקשת
                      </p>
                      <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 font-black text-xs">
                          <Users className="w-5 h-5 text-indigo-100" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black truncate">
                            {targetId
                              ? targetType === "department"
                                ? structure.find(
                                    (d) => d.id.toString() === targetId,
                                  )?.name
                                : targetType === "section"
                                  ? structure
                                      .flatMap((d) => d.sections)
                                      .find((s) => s.id.toString() === targetId)
                                      ?.name
                                  : structure
                                      .flatMap((d) => d.sections)
                                      .flatMap((s) => s.teams)
                                      .find((t) => t.id.toString() === targetId)
                                      ?.name
                              : "---"}
                          </p>
                          <p className="text-[10px] text-white/60 font-medium">
                            יעד חדש במערכת
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 pt-4 border-t border-white/10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/60">
                          שם השוטר:
                        </span>
                        <span className="text-sm font-black">
                          {selectedEmployee
                            ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                            : "---"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white/60">
                          מספר אישי:
                        </span>
                        <span className="text-sm font-mono font-bold tracking-tighter">
                          {selectedEmployee
                            ? selectedEmployee.personal_number
                            : "---"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Important Note */}
                  <div
                    className="relative z-10 p-4 bg-amber-400/20 border border-amber-400/30 rounded-2xl flex items-start gap-3 text-right"
                    dir="rtl"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-50 leading-relaxed">
                      שים לב: מעבר זה כפוף לאישור מפקד היחידה וגורמי כוח האדם.
                      השוטר יועבר במערכת באופן אוטומטי רק לאחר אישור סופי.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- History --- */}
        <TabsContent
          value="history"
          className="animate-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="rounded-[2.5rem] border-border shadow-2xl overflow-hidden bg-card border-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b-2 border-border">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-right py-6 pr-10 font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em] w-[250px]">
                      שוטר
                    </TableHead>
                    <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      מסלול המעבר
                    </TableHead>
                    <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      תאריך ביצוע
                    </TableHead>
                    <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      סטטוס סופי
                    </TableHead>
                    <TableHead className="text-right font-black text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      הערות וסיבות
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((req) => (
                    <TableRow
                      key={req.id}
                      className="group border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0"
                    >
                      <TableCell className="py-6 pr-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center font-black text-xs text-muted-foreground border border-border">
                            {req.employee_name?.[0]}
                          </div>
                          <div>
                            <div className="font-black text-foreground text-sm tracking-tight">
                              {req.employee_name}
                            </div>
                            <div className="text-[10px] font-bold text-muted-foreground mt-0.5">
                              ID: {req.employee_id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-black">
                          <span className="text-muted-foreground opacity-60">
                            {req.source_name}
                          </span>
                          <div className="bg-muted rounded-full p-1 border border-border">
                            <ArrowLeft className="w-3 h-3 text-muted-foreground/40" />
                          </div>
                          <span className="text-foreground tracking-tight">
                            {req.target_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-black text-muted-foreground tabular-nums opacity-70">
                        {new Date(req.created_at).toLocaleDateString("he-IL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border-2",
                            req.status === "approved" &&
                              "bg-emerald-50 text-emerald-600 border-emerald-100/50 shadow-sm",
                            req.status === "rejected" &&
                              "bg-rose-50 text-rose-600 border-rose-100/50 shadow-sm",
                            req.status === "cancelled" &&
                              "bg-gray-50 text-gray-500 border-gray-100/50 shadow-sm",
                          )}
                        >
                          {req.status === "approved"
                            ? "אושר"
                            : req.status === "rejected"
                              ? "נדחה"
                              : "בוטל"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground/70 font-medium italic max-w-[200px] truncate">
                        {req.rejection_reason || req.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-4 opacity-30">
                          <History className="w-16 h-16" />
                          <p className="font-black uppercase tracking-widest text-xs">
                            אין היסטוריה זמינה במערכת
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {!canManage && (
        <div className="mt-12 p-6 rounded-[2rem] bg-amber-500/[0.03] border-2 border-amber-200/40 flex items-start gap-5 mx-auto max-w-4xl shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-base font-black text-amber-900 tracking-tight">
              גישה מוגבלת - מצב צפייה
            </p>
            <p className="text-xs text-amber-800/70 mt-1.5 leading-relaxed font-bold">
              אין לך הרשאות ניהול לאשר או לדחות בקשות העברה במערכת. באפשרותך
              לצפות בסטטוס הבקשות הנוכחי ולהגיש בקשות חדשות עבורך או עבור פקודיך
              במידה ואתה מוגדר כמפקד.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
