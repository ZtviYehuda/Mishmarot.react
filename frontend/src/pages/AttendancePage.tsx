import { useState, useEffect, useMemo } from "react";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { useDateContext } from "@/context/DateContext";
import { format } from "date-fns";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
  StatusHistoryModal,
  ExportReportDialog,
} from "@/components/employees/modals";
import { History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateHeader } from "@/components/common/DateHeader";
import type { Employee } from "@/types/employee.types";

export default function AttendancePage() {
  const { user } = useAuthContext();
  const { selectedDate } = useDateContext();
  const location = useLocation();
  const {
    employees,
    loading,
    fetchEmployees,
    getStructure,
    getDashboardStats,
    getStatusTypes,
    getServiceTypes,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [structure, setStructure] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("all");
  const [selectedServiceTypeId, setSelectedServiceTypeId] =
    useState<string>("all");
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  // Selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  // Modal states
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [alertContext, setAlertContext] = useState<any>(null);

  // Check for auto-open modal from navigation state
  useEffect(() => {
    if (location.state?.openBulkModal) {
      if (location.state.alertData) {
        setAlertContext(location.state.alertData);
      } else {
        setAlertContext(null);
      }
      setBulkModalOpen(true);
      // Clear state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Refetch employees when selectedDate changes
  useEffect(() => {
    fetchEmployees(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      format(selectedDate, "yyyy-MM-dd"),
    );
  }, [selectedDate, fetchEmployees]);

  useEffect(() => {
    const init = async () => {
      const struct = await getStructure();
      if (struct) setStructure(struct);

      const dashboardStats = await getDashboardStats({
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      if (dashboardStats && dashboardStats.stats) {
        setStats(dashboardStats.stats);
      }

      const statuses = await getStatusTypes();
      if (statuses) setStatusTypes(statuses);

      const sTypes = await getServiceTypes();
      if (sTypes) setServiceTypes(sTypes);
    };
    init();
  }, [
    getStructure,
    getDashboardStats,
    getStatusTypes,
    getServiceTypes,
    selectedDate,
  ]);

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

      // Service Type Filter
      if (
        selectedServiceTypeId !== "all" &&
        emp.service_type_id?.toString() !== selectedServiceTypeId
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
    selectedServiceTypeId,
  ]);

  const employeesForModal = useMemo(() => {
    if (alertContext && alertContext.missing_ids) {
      return employees.filter((e) => alertContext.missing_ids.includes(e.id));
    }
    return filteredEmployees;
  }, [employees, alertContext, filteredEmployees]);

  const departments = structure;
  const sections = useMemo(() => {
    return (
      departments.find((d: any) => d.id.toString() === selectedDeptId)
        ?.sections || []
    );
  }, [departments, selectedDeptId]);

  const teams = useMemo(() => {
    return (
      sections.find((s: any) => s.id.toString() === selectedSectionId)?.teams ||
      []
    );
  }, [sections, selectedSectionId]);

  const refreshData = async () => {
    await fetchEmployees(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      format(selectedDate, "yyyy-MM-dd"),
    );
    const dashboardStats = await getDashboardStats({
      date: format(selectedDate, "yyyy-MM-dd"),
    });
    if (dashboardStats && dashboardStats.stats) {
      setStats(dashboardStats.stats);
    }
    setSelectedEmployeeIds([]);
  };

  const handleOpenStatusModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStatusModalOpen(true);
  };

  const handleOpenHistoryModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setHistoryModalOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(filteredEmployees.map((e) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds((prev) => [...prev, id]);
    } else {
      setSelectedEmployeeIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const updatedTodayCount = employees.filter(
    (emp) =>
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() ===
        selectedDate.toDateString(),
  ).length;

  const totalCount = employees.length;

  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== "מטה") return "מפקד חוליה";
      if (emp.section_name && emp.section_name !== "מטה") return "מפקד מדור";
      if (emp.department_name && emp.department_name !== "מטה")
        return "מפקד מחלקה";
      return "מפקד יחידה";
    }
    return "שוטר";
  };

  const currentUserEmployee = user
    ? employees.find((e) => e.id === user.id)
    : null;
  const isReportedToday =
    currentUserEmployee?.last_status_update &&
    new Date(currentUserEmployee.last_status_update).toDateString() ===
      selectedDate.toDateString();

  const progressPercent =
    totalCount > 0 ? (updatedTodayCount / totalCount) * 100 : 0;

  const isAllReported = totalCount > 0 && updatedTodayCount === totalCount;

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
            <DateHeader className="w-full sm:w-auto order-first sm:order-none" />
            <Button
              variant="outline"
              className="h-10 sm:h-11 rounded-xl border-input gap-2 font-bold text-muted-foreground hover:bg-muted flex-1 sm:flex-none"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ייצוא דוח</span>{" "}
              <span className="sm:hidden">ייצוא</span>
            </Button>
            <Button
              className={cn(
                "h-10 sm:h-11 rounded-xl shadow-lg px-4 sm:px-6 gap-2 font-black flex-1 sm:flex-none transition-all",
                selectedEmployeeIds.length > 0
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-secondary/20"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
              )}
              onClick={() => {
                setAlertContext(null);
                setBulkModalOpen(true);
              }}
            >
              <ClipboardCheck className="w-4 h-4" />
              {selectedEmployeeIds.length > 0 ? (
                <span className="hidden sm:inline">
                  עדכון לנבחרים ({selectedEmployeeIds.length})
                </span>
              ) : (
                <span className="hidden sm:inline">עדכון נוכחות מרוכז</span>
              )}
              <span className="sm:hidden">עדכון</span>
            </Button>
            {user && (
              <Button
                variant={isReportedToday ? "outline" : "outline"}
                className={cn(
                  "h-10 sm:h-11 rounded-xl px-4 sm:px-6 gap-2 font-bold flex-1 sm:flex-none transition-all",
                  isReportedToday
                    ? "bg-emerald-50 border-emerald-500/30 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                    : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                )}
                onClick={() => {
                  const currentUserEmp = employees.find(
                    (e) => e.id === user.id,
                  );
                  if (currentUserEmp) {
                    handleOpenStatusModal(currentUserEmp);
                  }
                }}
              >
                {isReportedToday ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">דיווח עצמי</span>
                <span className="sm:hidden">דיווח</span>
              </Button>
            )}
          </div>
        }
      />
      {/* Summary Stats & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm font-black text-foreground">
                סיכום התייצבות יחידתי
              </span>
              <span className="text-xs text-muted-foreground font-bold">
                מעקב דיווחים ליום{" "}
                {selectedDate.toLocaleDateString("he-IL", {
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

          <div className="flex flex-wrap gap-4 items-stretch justify-start">
            {stats
              .filter((s: any) => s.status_id)
              .map((s: any) => (
                <div
                  key={s.status_id}
                  className="flex-1 min-w-[100px] p-4 rounded-2xl bg-muted/50 border border-border flex flex-col items-center gap-1 hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xl font-black text-foreground">
                    {s.count}
                  </span>
                  <span
                    className="text-[11px] font-bold uppercase text-center"
                    style={{ color: s.color || "var(--muted-foreground)" }}
                  >
                    {s.status_name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {!isAllReported ? (
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/20 flex flex-col justify-between">
            <div className="space-y-2">
              <Clock className="w-8 h-8 opacity-50" />
              <h3 className="text-xl font-black">תזכורת דיווח</h3>
              <p className="text-sm text-primary-foreground/80 font-medium leading-relaxed">
                יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד השעה 09:00.
              </p>
            </div>
            <div className="pt-4 flex items-center gap-3">
              <div
                className="bg-white/10 p-2 rounded-xl flex-1 flex items-center justify-center gap-2 cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => setBulkModalOpen(true)}
              >
                <AlertCircle className="w-4 h-4 text-primary-foreground/70" />
                <span className="text-xs font-bold text-primary-foreground underline decoration-primary-foreground/30 underline-offset-4">
                  נותרו לדווח: {totalCount - updatedTodayCount}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-center items-center text-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-emerald-800">
              הושלם הדיווח היומי!
            </h3>
            <p className="text-xs text-emerald-700/80 font-bold">
              כלל שוטרי היחידה ({totalCount}) דווחו במערכת
            </p>
          </div>
        )}
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
            חוליה
          </label>
          <Select
            value={selectedTeamId}
            onValueChange={(val) => setSelectedTeamId(val)}
            disabled={!selectedSectionId || selectedSectionId === "all"}
          >
            <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
              <SelectValue placeholder="כל החוליות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל החוליות</SelectItem>
              {teams.map((t: any) => (
                <SelectItem key={t.id} value={t.id.toString()}>
                  {t.name}
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

        <div className="w-full md:w-36 space-y-2 text-right">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
            מעמד
          </label>
          <Select
            value={selectedServiceTypeId}
            onValueChange={(val) => setSelectedServiceTypeId(val)}
          >
            <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
              <SelectValue placeholder="הכל" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">הכל</SelectItem>
              {serviceTypes.map((s: any) => (
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
            setSelectedTeamId("all");
            setSelectedStatusId("all");
            setSelectedServiceTypeId("all");
            setSearchTerm("");
            setSelectedEmployeeIds([]);
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
                <TableHead className="w-[50px] pr-6">
                  <Checkbox
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedEmployeeIds.length === filteredEmployees.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(checked as boolean)
                    }
                  />
                </TableHead>
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
                    colSpan={7}
                    className="h-32 text-center text-muted-foreground"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                      selectedDate.toDateString();

                  return (
                    <TableRow
                      key={emp.id}
                      className={cn(
                        "group hover:bg-muted/50 transition-colors border-b border-border",
                        user &&
                          emp.id === user.id &&
                          "bg-emerald-500/5 hover:bg-emerald-500/10 border-r-4 border-r-emerald-500",
                        selectedEmployeeIds.includes(emp.id) && "bg-muted/30",
                      )}
                    >
                      <TableCell className="pr-6">
                        <Checkbox
                          checked={selectedEmployeeIds.includes(emp.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(emp.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-[10px] uppercase shadow-sm">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <div className="flex flex-col text-right">
                            <EmployeeLink
                              employee={emp}
                              className="text-sm font-bold text-foreground"
                            />
                            <span className="text-[10px] text-muted-foreground font-bold">
                              {emp.personal_number}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col">
                          <Badge
                            variant="outline"
                            className="font-medium text-[10px] border-none px-2.5 py-1 bg-muted text-muted-foreground w-fit mb-1"
                          >
                            {getProfessionalTitle(emp)}
                          </Badge>
                          {emp.service_type_name && (
                            <span className="text-[10px] font-bold text-muted-foreground/60">
                              {emp.service_type_name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col text-right">
                          {emp.department_name && (
                            <span className="text-xs font-bold text-foreground/80">
                              {emp.department_name}
                            </span>
                          )}
                          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-0.5">
                            {emp.section_name && emp.section_name !== "מטה" && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                מדור {emp.section_name}
                              </span>
                            )}
                            {emp.section_name &&
                              emp.section_name !== "מטה" &&
                              emp.team_name &&
                              emp.team_name !== "מטה" && (
                                <span className="text-[10px] text-muted-foreground/40">
                                  •
                                </span>
                              )}
                            {emp.team_name && emp.team_name !== "מטה" && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                חוליה {emp.team_name}
                              </span>
                            )}
                          </div>
                          {!emp.department_name &&
                            !emp.section_name &&
                            !emp.team_name && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor:
                                emp.status_color || "var(--muted-foreground)",
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
                              {selectedDate.toDateString() ===
                              new Date().toDateString()
                                ? "היום"
                                : format(selectedDate, "dd/MM")}
                              ,{" "}
                              {new Date(
                                emp.last_status_update!,
                              ).toLocaleTimeString("he-IL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-rose-500/80">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">לא עודכן</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                            onClick={() => handleOpenHistoryModal(emp)}
                          >
                            <History className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 rounded-lg"
                            onClick={() => handleOpenStatusModal(emp)}
                          >
                            <ClipboardCheck className="w-4 h-4" />
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

      {selectedEmployee && (
        <StatusUpdateModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          employee={selectedEmployee}
          onSuccess={refreshData}
        />
      )}

      {selectedEmployee && (
        <StatusHistoryModal
          open={historyModalOpen}
          onOpenChange={setHistoryModalOpen}
          employee={selectedEmployee}
        />
      )}

      <BulkStatusUpdateModal
        open={bulkModalOpen}
        onOpenChange={(open) => {
          setBulkModalOpen(open);
          if (!open) setAlertContext(null);
        }}
        employees={employeesForModal}
        initialSelectedIds={selectedEmployeeIds}
        onSuccess={refreshData}
        alertContext={alertContext}
        onNudge={() => {
          toast.success(
            `נשלחה תזכורת למפקד ${alertContext?.commander_name || ""}`,
          );
        }}
      />
      <ExportReportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}
