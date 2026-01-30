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

  // Cascading Selection
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
    if (!selectedEmployee || (!targetDeptId && !targetSectionId && !targetTeamId)) {
      toast.error("יש לבחור שוטר ויעד להעברה");
      return;
    }

    let finalTargetType: "department" | "section" | "team" = "department";
    let finalTargetId = "";

    if (targetTeamId) {
      finalTargetType = "team";
      finalTargetId = targetTeamId;
    } else if (targetSectionId) {
      finalTargetType = "section";
      finalTargetId = targetSectionId;
    } else {
      finalTargetType = "department";
      finalTargetId = targetDeptId;
    }

    setIsSubmitting(true);
    const success = await createTransfer({
      employee_id: selectedEmployee.id,
      target_type: finalTargetType,
      target_id: parseInt(finalTargetId),
      reason,
    });

    if (success) {
      toast.success("בקשת ההעברה הוגשה בהצלחה");
      setSelectedEmployee(null);
      setTargetDeptId("");
      setTargetSectionId("");
      setTargetTeamId("");
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
      className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      dir="rtl"
    >
      <PageHeader
        icon={ArrowLeftRight}
        title="בקשות העברה ושיבוץ"
        subtitle="ניהול מעברי כוח אדם ושינויים ארגוניים"
        category="ניהול משאבי אנוש"
        categoryLink="/transfers"
        className="text-right"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        {[
          { label: "ממתינות", value: pendingTransfers.length, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
          {
            label: "אושרו החודש",
            value: history.filter(h => h.status === "approved" && new Date(h.created_at).getMonth() === new Date().getMonth()).length,
            icon: CheckCircle2,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
          },
          { label: "סה\"כ בקשות", value: pendingTransfers.length + history.length, icon: ArrowLeftRight, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          {
            label: "נדחו / בוטלו",
            value: history.filter(h => h.status === "rejected" || h.status === "cancelled").length,
            icon: XCircle,
            color: "text-rose-500",
            bg: "bg-rose-500/10"
          },
        ].map((stat, i) => (
          <Card key={i} className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full space-y-6"
      >
        <div className="flex justify-end items-center w-full">
          <TabsList className="bg-muted/50 p-1 rounded-lg border">
            <TabsTrigger value="pending" className="px-6 py-2 rounded-md font-bold gap-2 flex-row-reverse">
              <Clock className="w-4 h-4" />
              בקשות ממתינות
            </TabsTrigger>
            <TabsTrigger value="new" className="px-6 py-2 rounded-md font-bold gap-2 flex-row-reverse">
              <UserPlus className="w-4 h-4" />
              בקשה חדשה
            </TabsTrigger>
            <TabsTrigger value="history" className="px-6 py-2 rounded-md font-bold gap-2 flex-row-reverse">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- Pending Transfers --- */}
        <TabsContent value="pending" className="animate-in fade-in duration-500">
          <Card className="border shadow-sm overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground w-[300px]">פרטי שוטר</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">מסלול המעבר</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">מידע על הבקשה</TableHead>
                    <TableHead className="text-center font-bold text-xs text-muted-foreground">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <CheckCircle2 className="w-12 h-12" />
                          <p className="font-semibold">אין בקשות ממתינות</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingTransfers.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {req.employee_name?.[0]}
                            </div>
                            <div>
                              <div className="font-bold">{req.employee_name}</div>
                              <div className="text-xs text-muted-foreground">מ"א: {req.employee_id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="text-muted-foreground">{req.source_name}</span>
                            <ArrowLeft className="w-4 h-4 text-muted-foreground/30" />
                            <span className="text-primary font-bold">{req.target_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit text-[10px] bg-amber-50 text-amber-600 border-amber-200 font-bold">ממתין</Badge>
                            <span className="text-xs text-muted-foreground">הוגש ע"י {req.requester_name}</span>
                            {req.reason && (
                              <p className="text-xs mt-1 italic text-muted-foreground/70 underline underline-offset-4 decoration-dotted">"{req.reason}"</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            {canManage ? (
                              <>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 font-bold" onClick={() => handleApprove(req.id)}>
                                  אישור
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5 h-8 font-bold" onClick={() => handleReject(req.id)}>
                                  דחייה
                                </Button>
                              </>
                            ) : req.requested_by === user?.id ? (
                              <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 h-8 font-bold" onClick={() => handleCancel(req.id)}>
                                ביטול
                              </Button>
                            ) : (
                              <Badge variant="secondary">בבדיקה</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* --- New Transfer Form --- */}
        <TabsContent value="new" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar info - NOW ON LEFT (first in RTL) */}
            <div className="space-y-6">
              <Card className="border shadow-sm bg-card rounded-xl overflow-hidden">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-primary flex-row-reverse justify-end">
                    <ShieldAlert className="w-4 h-4" />
                    הנחיות ודגשים
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed text-right">
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p>מעבר ארגוני כפוף לאישור מפקד היחידה וגורמי כוח האדם המוסמכים.</p>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p>השיבוץ יתעדכן במערכת באופן אוטומטי רק לאחר קבלת אישור סופי מהגורמים הרלוונטיים.</p>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p>ניתן לעקוב אחר סטטוס הטיפול בלשונית בקשות ממתינות.</p>
                  </div>
                  <div className="pt-4 border-t text-[11px] font-bold text-primary/70 italic text-right">
                    * המערכת מתעדת את כלל הפעולות לצרכי מעקב ובקרה.
                  </div>
                </CardContent>
              </Card>

              <Card className="border shadow-sm bg-muted/20 rounded-xl overflow-hidden">
                <CardContent className="p-4 flex items-center gap-3 flex-row-reverse">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">זמן טיפול משוער</p>
                    <p className="text-[10px] text-muted-foreground">בין 24 ל-48 שעות עבודה</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form - NOW ON RIGHT (second in RTL) */}
            <Card className="lg:col-span-2 border shadow-sm rounded-xl">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-right">טופס בקשת העברה</CardTitle>
                <CardDescription className="text-right">מלא את פרטי השוטר והיעד המבוקש להגשת הבקשה לאישור.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8 text-right">
                {/* Employee Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">1</span>
                    בחירת שוטר
                  </h3>
                  {!selectedEmployee ? (
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="חיפוש לפי שם או מספר אישי..."
                        className="pr-10 h-12 rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {filteredEmployees.length > 0 && searchTerm && (
                        <Card className="absolute top-full mt-2 w-full z-20 shadow-xl overflow-hidden border">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              className="w-full p-4 flex items-center gap-3 hover:bg-muted text-right border-b last:border-0"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setSearchTerm("");
                              }}
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {emp.first_name[0]}{emp.last_name[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-bold">{emp.first_name} {emp.last_name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {emp.personal_number} • {emp.department_name}
                                  {emp.section_name && ` • ${emp.section_name}`}
                                  {emp.team_name && ` • ${emp.team_name}`}
                                </span>
                              </div>
                            </button>
                          ))}
                        </Card>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border rounded-xl bg-primary/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold">{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {selectedEmployee.personal_number} • {selectedEmployee.department_name}
                            {selectedEmployee.section_name && ` • ${selectedEmployee.section_name}`}
                            {selectedEmployee.team_name && ` • ${selectedEmployee.team_name}`}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)} className="text-xs h-8 font-bold">החלף שוטר</Button>
                    </div>
                  )}
                </div>

                {/* Target Destination - Cascading */}
                <div className="space-y-4 border-t pt-8">
                  <h3 className="text-sm font-bold flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">2</span>
                    יעד המעבר המבוקש
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Department */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground grayscale">מחלקה</label>
                      <Select value={targetDeptId} onValueChange={(v) => {
                        setTargetDeptId(v);
                        setTargetSectionId("");
                        setTargetTeamId("");
                      }}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="בחר מחלקה..." />
                        </SelectTrigger>
                        <SelectContent>
                          {structure.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground grayscale">מדור</label>
                      <Select
                        value={targetSectionId}
                        onValueChange={(v) => {
                          setTargetSectionId(v);
                          setTargetTeamId("");
                        }}
                        disabled={!targetDeptId}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="בחר מדור..." />
                        </SelectTrigger>
                        <SelectContent>
                          {structure.find(d => d.id.toString() === targetDeptId)?.sections.map((s: any) => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Team */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground grayscale">חוליה / צוות</label>
                      <Select
                        value={targetTeamId}
                        onValueChange={setTargetTeamId}
                        disabled={!targetSectionId}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="בחר חוליה..." />
                        </SelectTrigger>
                        <SelectContent>
                          {structure
                            .find(d => d.id.toString() === targetDeptId)
                            ?.sections.find((s: any) => s.id.toString() === targetSectionId)
                            ?.teams.map((t: any) => (
                              <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-4 border-t pt-8">
                  <h3 className="text-sm font-bold flex items-center gap-2 flex-row-reverse justify-end">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">3</span>
                    סיבה והערות
                  </h3>
                  <textarea
                    placeholder="פרט את הסיבה לבקשה ומטרת המעבר..."
                    className="w-full min-h-[100px] p-4 bg-muted/30 border rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleCreateRequest}
                  disabled={isSubmitting || !selectedEmployee || !targetDeptId}
                  className="w-full h-12 text-base font-bold shadow-sm"
                >
                  {isSubmitting ? "שולח..." : "שלח בקשת העברה"}
                </Button>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* --- History --- */}
        <TabsContent value="history" className="animate-in fade-in duration-500">
          <Card className="border shadow-sm overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground w-[250px]">שוטר</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">מסלול</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">תאריך</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">סטטוס</TableHead>
                    <TableHead className="text-right font-bold text-xs text-muted-foreground">הערות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-64 text-center opacity-30 italic">
                        אין היסטוריה זמינה
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center font-bold text-xs">
                              {req.employee_name?.[0]}
                            </div>
                            <span className="text-sm font-semibold">{req.employee_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs flex items-center gap-1">
                            <span className="text-muted-foreground">{req.source_name}</span>
                            <ArrowLeft className="w-3 h-3 opacity-30 mx-1" />
                            <span className="font-bold text-primary">{req.target_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString("he-IL")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            req.status === "approved" ? "default" :
                              req.status === "rejected" ? "destructive" : "secondary"
                          } className="text-[10px] font-bold px-2">
                            {req.status === "approved" ? "אושר" : req.status === "rejected" ? "נדחה" : "בוטל"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground italic truncate max-w-[150px]">
                          {req.rejection_reason || req.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {!canManage && (
        <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-4">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-1" />
          <div className="text-right">
            <p className="text-sm font-bold text-amber-900">מצב צפייה בלבד</p>
            <p className="text-xs text-amber-800/80">אין לך הרשאות ניהול לביצוע פעולות אישור או דחייה.</p>
          </div>
        </div>
      )}
    </div>
  );
}
