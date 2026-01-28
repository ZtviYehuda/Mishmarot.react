import { useState, useEffect, useMemo } from "react";
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
import {
  CalendarDays,
  Search,
  Filter,
  ClipboardCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
} from "@/components/employees/modals";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Employee } from "@/types/employee.types";

export default function AttendancePage() {
  const { user } = useAuthContext();
  const {
    employees,
    loading,
    fetchEmployees,
    getStructure,
    getDashboardStats,
    getStatusTypes,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [structure, setStructure] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [statusTypes, setStatusTypes] = useState<any[]>([]);

  // Modal states
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  useEffect(() => {
    const init = async () => {
      const struct = await getStructure();
      if (struct) setStructure(struct);

      const dashboardStats = await getDashboardStats();
      if (dashboardStats && dashboardStats.stats) {
        setStats(dashboardStats.stats);
      }

      const statuses = await getStatusTypes();
      if (statuses) setStatusTypes(statuses);
    };
    init();
  }, [getStructure, getDashboardStats, getStatusTypes]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Basic Search
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const searchMatch =
        fullName.includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm);
      if (!searchMatch) return false;

      // Organizational Filters
      if (
        selectedDeptId !== "all" &&
        emp.department_id !== parseInt(selectedDeptId)
      )
        return false;
      if (
        selectedSectionId !== "all" &&
        emp.section_id !== parseInt(selectedSectionId)
      )
        return false;
      if (selectedTeamId !== "all" && emp.team_id !== parseInt(selectedTeamId))
        return false;

      // Status Filter
      if (
        selectedStatusId !== "all" &&
        emp.status_id !== parseInt(selectedStatusId)
      )
        return false;

      return true;
    });
  }, [
    employees,
    searchTerm,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
  ]);

  const departments = structure;
  const sections =
    departments.find((d: any) => d.id.toString() === selectedDeptId)
      ?.sections || [];

  const handleOpenStatusModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStatusModalOpen(true);
  };

  const updatedTodayCount = employees.filter(
    (emp) =>
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() ===
      new Date().toDateString(),
  ).length;

  const totalCount = employees.length;

  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== "מטה") return "מפקד חוליה";
      if (emp.section_name && emp.section_name !== "מטה") return "מפקד מדור";
      if (emp.department_name && emp.department_name !== "מטה") return "מפקד מחלקה";
      return "מפקד יחידה";
    }
    return "שוטר";
  };

  const currentUserEmployee = user ? employees.find((e) => e.id === user.id) : null;
  const isReportedToday =
    currentUserEmployee?.last_status_update &&
    new Date(currentUserEmployee.last_status_update).toDateString() ===
    new Date().toDateString();

  const progressPercent =
    totalCount > 0 ? (updatedTodayCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      <PageHeader
        icon={CalendarDays}
        title="מעקב נוכחות יומי"
        subtitle="ניהול ודיווח סטטוס נוכחות לכלל שוטרי היחידה"
        category="נוכחות"
        categoryLink="/attendance"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
        badge={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-10 sm:h-11 rounded-xl border-input gap-2 font-bold text-muted-foreground hover:bg-muted flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ייצוא דוח יומי</span>
              <span className="sm:hidden">ייצוא</span>
            </Button>
            <Button
              className="h-10 sm:h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-4 sm:px-6 gap-2 font-black flex-1 sm:flex-none"
              onClick={() => setBulkModalOpen(true)}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">עדכון נוכחות מרוכז</span>
              <span className="sm:hidden">עדכון מרוכז</span>
            </Button>
            {user && (
              <Button
                variant="outline"
                className="h-10 sm:h-11 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 px-4 sm:px-6 gap-2 font-bold flex-1 sm:flex-none"
                onClick={() => {
                  const currentUserEmp = employees.find(e => e.id === user.id);
                  if (currentUserEmp) {
                    handleOpenStatusModal(currentUserEmp);
                  }
                }}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">דיווח עצמי</span>
                <span className="sm:hidden">דיווח</span>
              </Button>
            )}
          </div>
        }
      />

      {/* Self-Report Status Indicator */}
      {isReportedToday && currentUserEmployee && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-right flex-1 min-w-0">
              <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                דיווחת נוכחות בהצלחה!
              </span>
              <p className="text-xs font-bold text-emerald-600/80">
                הסטטוס המעודכן שלך: <span className="text-emerald-700 dark:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30">{currentUserEmployee.status_name}</span> • בוצע בשעה {new Date(currentUserEmployee.last_status_update!).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenStatusModal(currentUserEmployee)}
            className="text-emerald-700 hover:bg-emerald-500/10 font-black gap-2 hidden sm:flex"
          >
            <Clock className="w-4 h-4" />
            עדכן שוב
          </Button>
        </div>
      )}

      {/* Summary Stats & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-3xl p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm font-black text-foreground">
                סיכום התייצבות יחידתי
              </span>
              <span className="text-xs text-muted-foreground font-bold">
                מעקב דיווחים ליום{" "}
                {new Date().toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">
                {updatedTodayCount}/{totalCount}
              </span>
              <span className="text-[10px] block font-black text-muted-foreground uppercase tracking-tighter">
                שוטרים מדווחים
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-l from-primary to-primary/70 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats
              .filter((s: any) => s.status_id)
              .slice(0, 4)
              .map((s: any) => (
                <div
                  key={s.status_id}
                  className="p-4 rounded-2xl bg-muted/50 border border-border flex flex-col items-center gap-1"
                >
                  <span className="text-xl font-black text-foreground">
                    {s.count}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: s.color || "var(--muted-foreground)" }}
                  >
                    {s.status_name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/20 flex flex-col justify-between">
          <div className="space-y-2">
            <Clock className="w-8 h-8 opacity-50" />
            <h3 className="text-xl font-black">תזכורת דיווח</h3>
            <p className="text-sm text-primary-foreground/80 font-medium leading-relaxed">
              יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד השעה 09:00.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl flex-1 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary-foreground/70" />
              <span className="text-xs font-bold text-primary-foreground">
                נותרו לדווח: {totalCount - updatedTodayCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 text-right">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
            חיפוש מהיר
          </label>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="שם שוטר או מספר אישי..."
              className="h-11 pr-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
            מחלקה
          </label>
          <Select
            value={selectedDeptId}
            onValueChange={(val) => {
              setSelectedDeptId(val);
              setSelectedSectionId("all");
              setSelectedTeamId("all");
            }}
          >
            <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
              <SelectValue placeholder="כל המחלקות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המחלקות</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
            מדור
          </label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => {
              setSelectedSectionId(val);
              setSelectedTeamId("all");
            }}
            disabled={!selectedDeptId || selectedDeptId === "all"}
          >
            <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
              <SelectValue placeholder="כל המדורים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המדורים</SelectItem>
              {sections.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
            סטטוס
          </label>
          <Select
            value={selectedStatusId}
            onValueChange={(val) => setSelectedStatusId(val)}
          >
            <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
              <SelectValue placeholder="כל הסטטוסים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {statusTypes.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          className="h-11 text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
          onClick={() => {
            setSelectedDeptId("all");
            setSelectedSectionId("all");
            setSelectedTeamId("all");
            setSelectedStatusId("all");
            setSearchTerm("");
          }}
        >
          <Filter className="w-4 h-4" />
          נקה סינון
        </Button>
      </div>

      {/* Attendance Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50 h-14">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  שוטר
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  סטטוס נוכחות
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  עדכון אחרון
                </TableHead>
                <TableHead className="text-center font-black text-muted-foreground uppercase text-[10px] tracking-widest">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground font-medium"
                  >
                    לא נמצאו שוטרים התואמים את הסינון
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => {
                  const isUpdatedToday =
                    emp.last_status_update &&
                    new Date(emp.last_status_update).toDateString() ===
                    new Date().toDateString();

                  return (
                    <TableRow
                      key={emp.id}
                      className={cn(
                        "group hover:bg-muted/50 transition-colors border-b border-border",
                        user &&
                        emp.id === user.id &&
                        "bg-emerald-500/5 hover:bg-emerald-500/10 border-r-4 border-r-emerald-500",
                      )}
                    >
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-[10px] uppercase shadow-sm">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
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
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="font-medium text-[10px] border-none px-2.5 py-1 bg-muted text-muted-foreground"
                        >
                          {getProfessionalTitle(emp)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {emp.department_name && emp.department_name !== "מטה" ? (
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-bold text-foreground/80">
                              {emp.department_name}
                            </span>
                            {((emp.section_name && emp.section_name !== "מטה") || (emp.team_name && emp.team_name !== "מטה")) && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                {emp.section_name && emp.section_name !== "מטה" && `מדור ${emp.section_name}`}
                                {emp.section_name && emp.section_name !== "מטה" && emp.team_name && emp.team_name !== "מטה" && " • "}
                                {emp.team_name && emp.team_name !== "מטה" && `חוליה ${emp.team_name}`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: emp.status_color || "var(--muted-foreground)",
                            }}
                          />
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-none bg-muted py-0.5 px-2 text-muted-foreground"
                          >
                            {emp.status_name || "לא מדווח"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isUpdatedToday ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">
                              היום,{" "}
                              {new Date(
                                emp.last_status_update!,
                              ).toLocaleTimeString("he-IL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium italic">
                            טרם עודכן היום
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg gap-2 text-primary hover:text-primary/90 hover:bg-primary/10 font-bold text-xs"
                            onClick={() => handleOpenStatusModal(emp)}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            עדכן סטטוס
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <BulkStatusUpdateModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        employees={filteredEmployees}
        onSuccess={() => fetchEmployees()}
      />

      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        employee={selectedEmployee}
        onSuccess={() => fetchEmployees()}
      />
    </div >
  );
}
