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
  Briefcase,
  History,
  ShieldAlert
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [targetType, setTargetType] = useState<"department" | "section" | "team">("department");
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
      const emp = employees.find(e => e.id === Number(empId));
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
      case 'department': return <Building2 className="w-3 h-3" />;
      case 'section': return <Users className="w-3 h-3" />;
      case 'team': return <User className="w-3 h-3" />;
      default: return null;
    }
  };


  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8" dir="rtl">
      <PageHeader
        icon={ArrowLeftRight}
        title="בקשות העברה ושינוי שיבוץ"
        subtitle="מרכז ניהול מעברי כוח אדם ושינויים ארגוניים"
        category="ניהול וכוח אדם"
        categoryLink="/transfers"
        iconClassName="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <div className="flex justify-center md:justify-start overflow-x-auto pb-2 md:pb-0">
          <TabsList className="bg-muted/40 p-1.5 h-auto rounded-2xl border border-border/50 inline-flex shadow-sm">
            <TabsTrigger value="pending" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2">
              <Clock className="w-4 h-4" />
              בקשות ממתינות
              {pendingTransfers.length > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full mr-1.5">
                  {pendingTransfers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2">
              <UserPlus className="w-4 h-4" />
              בקשה חדשה
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all gap-2">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Pending Transfers --- */}
        <TabsContent value="pending" className="animate-in slide-in-from-bottom-4 duration-500">
          {pendingTransfers.length === 0 && !loading ? (
            <Card className="border-dashed py-16 bg-muted/10 border-2 rounded-3xl">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground">אין בקשות ממתינות</h3>
                  <p className="text-muted-foreground mt-1">כל הבקשות טופלו בהצלחה, או שטרם הוגשו בקשות חדשות.</p>
                </div>
                <Button variant="outline" onClick={() => setActiveTab("new")} className="mt-4 border-2 font-bold hover:bg-muted/50 transition-colors">
                  הגש בקשה חדשה
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-border shadow-sm overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-right py-5 pr-8 font-black text-xs text-muted-foreground uppercase tracking-wider w-[250px]">שוטר</TableHead>
                      <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">מסלול המעבר</TableHead>
                      <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">פרטי בקשה</TableHead>
                      <TableHead className="text-center font-black text-xs text-muted-foreground uppercase tracking-wider">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.map((req) => (
                      <TableRow key={req.id} className="group border-b border-border hover:bg-muted/20 transition-colors">
                        <TableCell className="py-5 pr-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                              {req.employee_name?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-sm">{req.employee_name}</div>
                              <div className="text-[11px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                מעוניין במעבר
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 bg-muted/40 p-2 rounded-xl w-fit border border-border/50">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground px-2">
                              <TypeIcon type={req.source_type} />
                              {req.source_name}
                            </div>
                            <ArrowLeft className="w-4 h-4 text-primary/50" />
                            <div className="flex items-center gap-1.5 text-xs font-bold text-primary px-2 bg-primary/10 rounded-lg py-1">
                              <TypeIcon type={req.target_type} />
                              {req.target_name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="text-xs font-medium text-muted-foreground">
                              <span className="font-bold text-foreground">הוגש ע"י:</span> {req.requester_name}
                            </div>
                            {req.reason && (
                              <div className="text-xs text-muted-foreground/80 italic bg-amber-50 text-amber-900/80 px-2 py-1 rounded w-fit max-w-[200px] truncate">
                                "{req.reason}"
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {canManage ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow font-bold rounded-xl transition-all"
                                  onClick={() => handleApprove(req.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 ml-1.5" /> אישור
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 px-4 border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold rounded-xl transition-all"
                                  onClick={() => handleReject(req.id)}
                                >
                                  דחייה
                                </Button>
                              </>
                            ) : req.requested_by === user?.id ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 bg-red-100 text-red-700 hover:bg-red-200 border-red-200 font-bold rounded-xl"
                                onClick={() => handleCancel(req.id)}
                              >
                                <XCircle className="w-4 h-4 ml-1.5" /> ביטול בקשה
                              </Button>
                            ) : (
                              <Badge variant="outline" className="font-medium">
                                ממתין לאישור
                              </Badge>
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
        <TabsContent value="new" className="animate-in slide-in-from-bottom-4 duration-500">
          <Card className="max-w-3xl mx-auto border-border bg-card shadow-lg rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gradient-to-l from-indigo-50/50 to-transparent border-b border-border p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-foreground">בקשה לשינוי שיבוץ</CardTitle>
                  <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                    טופס זה מיועד להגשת בקשת מעבר ארגוני עבור שוטר במערכת.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">

              {/* Step 1: Employee Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">1</div>
                  בחירת שוטר
                </div>

                <div className="relative">
                  {!selectedEmployee ? (
                    <>
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                      <Input
                        placeholder="הקלד שם או מספר אישי לחיפוש..."
                        className="h-14 pr-11 bg-muted/40 border-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-2xl text-base transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {filteredEmployees.length > 0 && searchTerm && (
                        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              className="w-full p-4 flex items-center justify-between hover:bg-muted/80 transition-colors border-b border-border last:border-0 group text-right"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setSearchTerm("");
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                  {emp.first_name[0]}{emp.last_name[0]}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                    {emp.first_name} {emp.last_name}
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {emp.personal_number}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs font-bold text-muted-foreground/70 bg-muted px-2 py-1 rounded-lg group-hover:bg-white transition-colors">
                                {emp.department_name || "ללא שיוך"}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-2 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-3 p-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-200 text-indigo-700 flex items-center justify-center font-black">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-indigo-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                          <p className="text-xs text-indigo-600/80 font-medium">{selectedEmployee.personal_number} • {selectedEmployee.department_name}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmployee(null)}
                        className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-xl h-10 px-4 font-bold"
                      >
                        החלף שוטר
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Target Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">2</div>
                  יעד המעבר
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground mr-1">סוג יחידה</label>
                    <Select
                      value={targetType}
                      onValueChange={(v: any) => {
                        setTargetType(v);
                        setTargetId("");
                      }}
                    >
                      <SelectTrigger className="h-12 bg-muted/40 border-input rounded-2xl font-medium focus:ring-2 focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="department">מחלקה</SelectItem>
                        <SelectItem value="section">מדור</SelectItem>
                        <SelectItem value="team">חולייה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground mr-1">יחידה ספציפית</label>
                    <Select value={targetId} onValueChange={setTargetId} disabled={!structure.length}>
                      <SelectTrigger className="h-12 bg-muted/40 border-input rounded-2xl font-medium focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="בחר יעד מהרשימה..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {targetType === "department" &&
                          structure.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        {targetType === "section" &&
                          structure
                            .flatMap((d) => d.sections)
                            .map((sec) => (
                              <SelectItem key={sec.id} value={sec.id.toString()}>
                                {sec.name} <span className="text-muted-foreground opacity-50 text-xs mx-1">({sec.department_name})</span>
                              </SelectItem>
                            ))}
                        {targetType === "team" &&
                          structure
                            .flatMap((d) => d.sections)
                            .flatMap((s) => s.teams)
                            .map((tm) => (
                              <SelectItem key={tm.id} value={tm.id.toString()}>
                                {tm.name} <span className="text-muted-foreground opacity-50 text-xs mx-1">({tm.section_name})</span>
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 3: Reason Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-foreground">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">3</div>
                  סיבה והערות
                </div>
                <Input
                  placeholder="פרט את הסיבה לבקשה (אופציונלי)..."
                  className="h-14 bg-muted/40 border-input focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-2xl text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleCreateRequest}
                  disabled={isSubmitting || !selectedEmployee || !targetId}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-base font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                >
                  <UserPlus className="w-5 h-5" />
                  שלח בקשת העברה לאישור
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- History --- */}
        <TabsContent value="history" className="animate-in slide-in-from-bottom-4 duration-500">
          <Card className="rounded-3xl border-border shadow-sm overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-right py-5 pr-8 font-black text-xs text-muted-foreground uppercase tracking-wider w-[200px]">שוטר</TableHead>
                    <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">מסלול</TableHead>
                    <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">תאריך</TableHead>
                    <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">סטטוס סופי</TableHead>
                    <TableHead className="text-right font-black text-xs text-muted-foreground uppercase tracking-wider">הערות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((req) => (
                    <TableRow key={req.id} className="group border-b border-border hover:bg-muted/20 transition-colors">
                      <TableCell className="py-5 pr-8 font-bold text-foreground text-sm">
                        {req.employee_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <span className="text-muted-foreground">{req.source_name}</span>
                          <ArrowLeft className="w-3 h-3 text-muted-foreground/30" />
                          <span className="text-foreground font-bold">{req.target_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground tabular-nums">
                        {new Date(req.created_at).toLocaleDateString("he-IL")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}
                          className={cn(
                            "text-[10px] uppercase border px-2 py-0.5",
                            req.status === 'approved' && "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100",
                            req.status === 'rejected' && "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
                            req.status === 'cancelled' && "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          )}
                        >
                          {req.status === 'approved' ? 'אושר' : req.status === 'rejected' ? 'נדחה' : 'בוטל'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground italic max-w-[200px] truncate">
                        {req.rejection_reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <History className="w-8 h-8 opacity-20" />
                          <p>אין היסטוריה זמינה</p>
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
        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-4 mx-auto max-w-3xl">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">גישה מוגבלת</p>
            <p className="text-xs text-amber-700/80 mt-1">
              אין לך הרשאות ניהול לאשר בקשות העברה. באפשרותך לצפות בבקשות ולהגיש בקשות חדשות בלבד.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
