import { useState, useEffect, useMemo } from "react";
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
  History,
  ShieldAlert,
  TrendingUp,
  User,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Employee } from "@/types/employee.types";

export default function TransfersPage() {
  const { user } = useAuthContext();
  const { employees, getStructure } = useEmployees();
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

  // Permission Checks
  const canManage = user?.is_admin || user?.is_commander;

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      <PageHeader
        icon={ArrowLeftRight}
        title="בקשות העברה ושינוי שיבוץ"
        subtitle="ניהול מעברי שוטרים בין מחלקות, מדורים וחוליות"
        category="בקשות העברה"
        categoryLink="/transfers"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="flex w-full min-w-[400px] bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="pending" className="flex-1 rounded-lg gap-2 data-[state=active]:bg-card">
              <Clock className="w-4 h-4" />
              בקשות ממתינות
              {pendingTransfers.length > 0 && (
                <Badge
                  variant="secondary"
                  className="mr-2 bg-primary/10 text-primary border-none"
                >
                  {pendingTransfers.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="new" className="flex-1 rounded-lg gap-2 data-[state=active]:bg-card">
              <UserPlus className="w-4 h-4" />
              בקשה חדשה
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg gap-2 data-[state=active]:bg-card">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Pending Transfers --- */}
        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingTransfers.length === 0 && !loading ? (
            <Card className="border-dashed py-12 bg-transparent border-border">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">אין בקשות העברה ממתינות</p>
                <p className="text-sm">
                  כל הבקשות טופלו או שטרם הוגשו בקשות חדשות
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-right py-4 px-6 text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                        שוטר
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">ממקור</TableHead>
                      <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">ליעד</TableHead>
                      <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">הוגש ע"י</TableHead>
                      <TableHead className="text-center text-muted-foreground font-black text-[10px] uppercase tracking-widest">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransfers.map((req) => (
                      <TableRow
                        key={req.id}
                        className="group hover:bg-muted/50 border-b border-border"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {req.employee_name?.[0]}
                            </div>
                            <span className="font-bold text-foreground">
                              {req.employee_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-border bg-muted/50 text-muted-foreground"
                          >
                            {req.source_name} (
                            {req.source_type === "department"
                              ? "מחלקה"
                              : req.source_type === "section"
                                ? "מדור"
                                : "חולייה"}
                            )
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                              {req.target_name} (
                              {req.target_type === "department"
                                ? "מחלקה"
                                : req.target_type === "section"
                                  ? "מדור"
                                  : "חולייה"}
                              )
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">
                          {req.requester_name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {canManage ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                  onClick={() => handleApprove(req.id)}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  אישור
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10 gap-1.5"
                                  onClick={() => handleReject(req.id)}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  דחייה
                                </Button>
                              </>
                            ) : req.requested_by === user?.id ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleCancel(req.id)}
                              >
                                ביטול בקשה
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                ממתין לאישור
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- New Transfer Form --- */}
        <TabsContent value="new" className="mt-6">
          <Card className="max-w-2xl mx-auto border-border bg-card shadow-xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/50 border-b border-border p-8">
              <CardTitle className="text-xl font-black flex items-center gap-3">
                <UserPlus className="w-6 h-6 text-primary" />
                יצירת בקשת העברה חדשה
              </CardTitle>
              <CardDescription className="text-sm font-bold text-muted-foreground">
                עבור שוטר מעל סמכותך/מדורך או כמנהל מערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* 1. Select Employee */}
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">
                  בחר שוטר לביצוע העברה
                </label>
                <div className="relative">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <Input
                    placeholder="חפש לפי שם או מספר אישי..."
                    className="h-12 pr-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-2xl text-sm font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {filteredEmployees.length > 0 && (
                    <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {filteredEmployees.map((emp) => (
                        <button
                          key={emp.id}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors border-b border-border last:border-0"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setSearchTerm(`${emp.first_name} ${emp.last_name}`);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                              {emp.first_name[0]} {emp.last_name[0]}
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-sm font-bold text-foreground">
                                {emp.first_name} {emp.last_name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-bold">
                                {emp.personal_number}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] font-black text-primary uppercase">
                            {emp.department_name || "מטה"}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedEmployee && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-primary">
                      משבץ שוב את: {selectedEmployee.first_name}{" "}
                      {selectedEmployee.last_name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedEmployee(null)}
                    className="text-primary hover:text-primary/90 hover:bg-primary/10"
                  >
                    החלף שוטר
                  </Button>
                </div>
              )}

              {/* 2. Choose Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">
                    רמת יעד
                  </label>
                  <Select
                    value={targetType}
                    onValueChange={(v: any) => {
                      setTargetType(v);
                      setTargetId("");
                    }}
                  >
                    <SelectTrigger className="h-12 bg-muted/50 border-input rounded-2xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="department">מחלקה</SelectItem>
                      <SelectItem value="section">מדור</SelectItem>
                      <SelectItem value="team">חולייה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">
                    בחירת יעד
                  </label>
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="h-12 bg-muted/50 border-input rounded-2xl font-bold">
                      <SelectValue placeholder="בחר יעד..." />
                    </SelectTrigger>
                    <SelectContent>
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
                              {sec.name} ({sec.department_name || "?"})
                            </SelectItem>
                          ))}
                      {targetType === "team" &&
                        structure
                          .flatMap((d) => d.sections)
                          .flatMap((s) => s.teams)
                          .map((tm) => (
                            <SelectItem key={tm.id} value={tm.id.toString()}>
                              {tm.name} ({tm.section_name || "?"})
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 3. Reason */}
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block pr-1">
                  סיבה לבקשה (אופציונלי)
                </label>
                <Input
                  placeholder="פרט את הסיבה להעברה..."
                  className="h-12 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-2xl text-sm font-medium"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreateRequest}
                disabled={isSubmitting || !selectedEmployee || !targetId}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-base font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
              >
                <UserPlus className="w-5 h-5" />
                שלח בקשת העברה לאישור
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- History --- */}
        <TabsContent value="history" className="mt-6">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="text-right py-4 px-6 text-muted-foreground font-black text-[10px] uppercase tracking-widest">שוטר</TableHead>
                    <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">מסלול העברה</TableHead>
                    <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">תאריך</TableHead>
                    <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">סטטוס</TableHead>
                    <TableHead className="text-right text-muted-foreground font-black text-[10px] uppercase tracking-widest">סיבת דחייה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((req) => (
                    <TableRow
                      key={req.id}
                      className="group hover:bg-muted/50 border-b border-border"
                    >
                      <TableCell className="py-4 px-6 font-bold text-foreground">
                        {req.employee_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{req.source_name}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                          <span className="font-bold text-foreground">{req.target_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-bold uppercase">
                        {new Date(req.created_at).toLocaleDateString("he-IL")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase px-2 py-0.5 border-none",
                            req.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : req.status === "rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {req.status === "approved"
                            ? "אושר"
                            : req.status === "rejected"
                              ? "נדחה"
                              : "בוטל"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-destructive italic">
                        {req.rejection_reason}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        אין היסטוריה זמינה
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Alert for low permissions */}
      {!canManage && (
        <div className="max-w-2xl mx-auto mt-8 flex items-start gap-4 p-4 rounded-2xl bg-warning/10 border border-warning/20">
          <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-amber-800 dark:text-amber-400">
              הרשאות מוגבלות
            </span>
            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              כמשתמש ללא הרשאות ניהול, תוכל להגיש בקשות העברה בלבד. אישור הבקשות
              מתבצע ע"י מפקד היחידה או רמ"ח בלבד.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
