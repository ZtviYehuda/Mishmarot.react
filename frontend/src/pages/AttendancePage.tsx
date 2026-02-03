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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X,
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
    getEmployeeById,
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
  const [filterOpen, setFilterOpen] = useState(false);
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
      } else if (location.state.missingIds) {
        setAlertContext({ missing_ids: location.state.missingIds });
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

  // Set initial filters based on user permissions
  // Removed to allow scopeEmployees to handle visibility.
  // "All" in filters means "Entire Scope".
  // useEffect(() => {
  //   if (user && !user.is_admin) {
  //     if (user.department_id) {
  //       setSelectedDeptId(user.department_id.toString());
  //     }
  //     if (user.section_id) {
  //       setSelectedSectionId(user.section_id.toString());
  //     }
  //     if (user.team_id) {
  //       setSelectedTeamId(user.team_id.toString());
  //     }
  //   }
  // }, [user]);

  // Calculate employees within user's command scope
  const scopeEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (!user) return true;
      if (user.is_admin) return true;

      if (user.is_commander) {
        // Commander: Filter strictly by commanded units
        // If a command ID is present, the employee MUST match it
        if (
          user.commands_department_id &&
          emp.department_id !== user.commands_department_id
        )
          return false;
        if (
          user.commands_section_id &&
          emp.section_id !== user.commands_section_id
        )
          return false;
        if (user.commands_team_id && emp.team_id !== user.commands_team_id)
          return false;
        return true;
      } else {
        // Regular User: Filter strictly by residence (Team level visibility)
        if (user.department_id && emp.department_id !== user.department_id)
          return false;
        if (user.section_id && emp.section_id !== user.section_id) return false;
        if (user.team_id && emp.team_id !== user.team_id) return false;
        return true;
      }
    });
  }, [employees, user]);

  const filteredEmployees = useMemo(() => {
    return scopeEmployees.filter((emp) => {
      // Basic Search
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const searchMatch =
        fullName.includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm);
      if (!searchMatch) return false;

      // Organizational Filters (Selection)
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
    scopeEmployees,
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

  const updatedTodayCount = scopeEmployees.filter(
    (emp) =>
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() ===
        selectedDate.toDateString(),
  ).length;

  const totalCount = scopeEmployees.length;

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
          <div className="flex flex-col gap-3 w-full items-end">
            <DateHeader className="self-end mb-1" />
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 w-full lg:w-auto">
              <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-3 w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-input gap-2 font-bold text-muted-foreground hover:bg-muted lg:px-6 lg:w-auto"
                  onClick={() => setExportDialogOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">ייצוא דו"ח</span>
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 rounded-xl gap-2 font-bold transition-all lg:px-6 lg:w-auto",
                    isReportedToday
                      ? "bg-emerald-50 border-emerald-500/30 text-emerald-700 hover:bg-emerald-100"
                      : "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10",
                  )}
                  onClick={async () => {
                    let currentUserEmp: Employee | null | undefined =
                      employees.find((e) => e.id === user?.id);
                    if (!currentUserEmp && user) {
                      currentUserEmp = await getEmployeeById(user.id);
                    }

                    if (currentUserEmp) {
                      handleOpenStatusModal(currentUserEmp);
                    } else {
                      toast.error("לא ניתן לטעון את פרטי השוטר לדיווח");
                    }
                  }}
                >
                  {isReportedToday ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-xs sm:text-sm">דיווח עצמי</span>
                </Button>
              </div>

              <Button
                className={cn(
                  "w-full lg:w-auto h-11 lg:px-8 rounded-xl shadow-lg gap-2 font-black transition-all",
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
                <span className="text-sm">
                  {selectedEmployeeIds.length > 0
                    ? `עדכון לנבחרים (${selectedEmployeeIds.length})`
                    : "עדכון נוכחות מרוכז"}
                </span>
              </Button>

              {/* Mobile Reminder Card */}
              <div className="lg:hidden mt-1 w-full">
                {!isAllReported ? (
                  <div
                    className="w-full h-14 bg-gradient-to-l from-primary to-primary/80 rounded-2xl px-4 flex items-center justify-between text-primary-foreground shadow-xl shadow-primary/20 cursor-pointer"
                    onClick={() => {
                      setAlertContext(null);
                      setBulkModalOpen(true);
                    }}
                  >
                    <div className="flex flex-row-reverse items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Clock className="w-5 h-5 text-white/90" />
                      </div>
                      <div className="flex flex-col text-right">
                        <h3 className="text-sm font-black leading-none">
                          תזכורת דיווח
                        </h3>
                        <span className="text-[10px] font-bold opacity-80 mt-1">
                          השלמה עד 09:00
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/20 h-8 px-3 rounded-full border border-white/10">
                      <AlertCircle className="w-3.5 h-3.5 text-white/70" />
                      <span className="text-[11px] font-black">
                        נותרו: {totalCount - updatedTodayCount}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 flex items-center justify-between text-emerald-800">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex flex-col text-right">
                        <h3 className="text-sm font-black leading-none">
                          הושלם הדיווח!
                        </h3>
                        <span className="text-[10px] font-bold opacity-70 mt-1">
                          כלל השוטרים דווחו
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
      />
      {/* Summary Stats & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm lg:col-span-2 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-col gap-0.5 text-right">
              <span className="text-xs sm:text-sm font-black text-foreground">
                סיכום התייצבות יחידתי
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-bold">
                מעקב דיווחים ליום{" "}
                {selectedDate.toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-2xl font-black text-primary">
                {updatedTodayCount}/{totalCount}
              </span>
              <span className="text-[9px] sm:text-[10px] block font-black text-muted-foreground uppercase tracking-tighter">
                שוטרים מדווחים
              </span>
            </div>
          </div>

          <div className="w-full h-2 sm:h-3 bg-muted rounded-full overflow-hidden mb-4 sm:mb-8">
            <div
              className="h-full bg-gradient-to-l from-primary to-primary/70 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div
            className={cn(
              "grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4",
              "lg:flex lg:flex-row lg:w-full lg:gap-0 lg:border lg:border-border/60 lg:rounded-3xl lg:overflow-hidden lg:divide-x lg:divide-x-reverse lg:divide-border/40 lg:bg-muted/5",
            )}
          >
            {stats
              .filter((s: any) => s.status_id)
              .map((s: any) => (
                <div
                  key={s.status_id}
                  onClick={() => {
                    setSelectedStatusId((prev) =>
                      prev === s.status_id.toString()
                        ? "all"
                        : s.status_id.toString(),
                    );
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center transition-all cursor-pointer group",
                    // Mobile: Individual cards - tight and efficient
                    "p-2 rounded-xl border h-16 sm:h-28 bg-muted/50 border-border hover:bg-muted/80",
                    // Desktop: Unified segments that fill the space
                    "lg:flex-1 lg:h-24 lg:p-4 lg:rounded-none lg:border-0 lg:bg-transparent hover:lg:bg-muted/20",
                    selectedStatusId === s.status_id.toString()
                      ? "bg-primary/10 border-primary shadow-sm lg:bg-primary/5"
                      : "",
                  )}
                >
                  <span className="text-sm sm:text-2xl lg:text-3xl font-black text-foreground">
                    {s.count}
                  </span>
                  <span
                    className="text-[8px] sm:text-[11px] lg:text-xs font-black uppercase text-center leading-tight mt-0.5 sm:mt-1"
                    style={{ color: s.color || "var(--muted-foreground)" }}
                  >
                    {s.status_name}
                  </span>

                  {/* Subtle selection indicator for desktop */}
                  {selectedStatusId === s.status_id.toString() && (
                    <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-1 bg-primary transition-all" />
                  )}
                </div>
              ))}
          </div>
        </div>

        {!isAllReported ? (
          <div className="hidden lg:flex bg-gradient-to-br from-primary to-primary/80 rounded-2xl lg:rounded-3xl p-3 lg:p-6 text-primary-foreground shadow-xl shadow-primary/20 flex-row lg:flex-col items-center lg:items-start justify-between gap-3 lg:gap-4 order-1 lg:order-2">
            <div className="flex items-center lg:block gap-3">
              <div className="p-2 lg:p-0 bg-white/10 lg:bg-transparent rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 lg:w-8 lg:h-8 opacity-90 lg:opacity-50" />
              </div>
              <div className="space-y-0 lg:space-y-2">
                <h3 className="text-xs lg:text-xl font-black leading-none">
                  תזכורת דיווח
                </h3>
                <p className="hidden lg:block text-sm text-primary-foreground/80 font-medium leading-relaxed">
                  יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד השעה
                  09:00.
                </p>
                <p className="lg:hidden text-[9px] font-bold opacity-80 leading-none mt-1">
                  השלמה עד 09:00
                </p>
              </div>
            </div>

            <div
              className="bg-white/10 h-10 lg:h-auto px-4 lg:p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-white/20 transition-colors border border-white/10 shrink-0"
              onClick={() => setBulkModalOpen(true)}
            >
              <AlertCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-foreground/70" />
              <span className="text-[10px] lg:text-xs font-black text-primary-foreground underline decoration-primary-foreground/30 underline-offset-4 whitespace-nowrap">
                נותרו: {totalCount - updatedTodayCount}
              </span>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex bg-emerald-500/10 border border-emerald-500/20 rounded-2xl lg:rounded-3xl p-3 lg:p-6 flex-row lg:flex-col justify-between lg:justify-center items-center text-right lg:text-center gap-3 lg:gap-2 order-1 lg:order-2">
            <div className="flex items-center lg:flex-col gap-3 lg:gap-2">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5 lg:space-y-1">
                <h3 className="text-xs lg:text-lg font-black text-emerald-800 leading-none">
                  הושלם הדיווח!
                </h3>
                <p className="text-[9px] lg:text-xs text-emerald-700/80 font-bold leading-none">
                  כלל השוטרים ({totalCount}) דווחו
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Filters Bar */}
      <div className="bg-card p-4 sm:p-6 rounded-2xl border border-border shadow-sm">
        {/* Mobile View: Search + Filter Button */}
        <div className="flex md:hidden gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="חיפוש לפי שם או מ.א..."
              className="h-11 pr-10 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-sm font-bold w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setFilterOpen(true)}
            className="h-11 w-11 p-0 rounded-xl border-dashed border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 shrink-0"
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop View: Full Filters */}
        <div className="hidden md:flex flex-row gap-4 items-end">
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

          <div className="w-36 lg:w-48 space-y-2 text-right">
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
              disabled={!!(user && !user.is_admin && user.department_id)}
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

          <div className="w-36 lg:w-48 space-y-2 text-right">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
              מדור
            </label>
            <Select
              value={selectedSectionId}
              onValueChange={(val) => {
                setSelectedSectionId(val);
                setSelectedTeamId("all");
              }}
              disabled={
                !selectedDeptId ||
                selectedDeptId === "all" ||
                !!(user && !user.is_admin && user.section_id)
              }
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

          <div className="w-36 lg:w-48 space-y-2 text-right">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
              חוליה
            </label>
            <Select
              value={selectedTeamId}
              onValueChange={(val) => setSelectedTeamId(val)}
              disabled={
                !selectedSectionId ||
                selectedSectionId === "all" ||
                !!(user && !user.is_admin && user.team_id)
              }
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

          <div className="w-36 lg:w-48 space-y-2 text-right">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
              סטטוס
            </label>
            <Select
              value={selectedStatusId}
              onValueChange={(val) => setSelectedStatusId(val)}
            >
              <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold">
                <SelectValue placeholder="הכל" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                {statusTypes.map((s: any) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-32 lg:w-36 space-y-2 text-right">
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
            className="md:col-span-1 h-11 text-muted-foreground hover:text-foreground hover:bg-muted gap-2 w-auto"
            onClick={() => {
              if (!user || user.is_admin) {
                setSelectedDeptId("all");
              } else if (!user.department_id) {
                setSelectedDeptId("all");
              }

              if (
                !user ||
                user.is_admin ||
                (!user.section_id && !user.team_id)
              ) {
                setSelectedSectionId("all");
              }

              if (!user || user.is_admin || !user.team_id) {
                setSelectedTeamId("all");
              }

              setSelectedStatusId("all");
              setSelectedServiceTypeId("all");
              setSearchTerm("");
              setSelectedEmployeeIds([]);
            }}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter Modal for Mobile */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="w-[90vw] max-w-[340px] p-0 border-none bg-transparent">
          <div className="bg-card border border-border flex flex-col rounded-2xl shadow-xl overflow-hidden max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Filter className="w-4 h-4" />
                </div>
                סינון רשימה
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                onClick={() => setFilterOpen(false)}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  מחלקה
                </label>
                <Select
                  value={selectedDeptId}
                  onValueChange={(val) => {
                    setSelectedDeptId(val);
                    setSelectedSectionId("all");
                    setSelectedTeamId("all");
                  }}
                  disabled={!!(user && !user.is_admin && user.department_id)}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
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
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  חוליה
                </label>
                <Select
                  value={selectedTeamId}
                  onValueChange={(val) => setSelectedTeamId(val)}
                  disabled={!selectedSectionId || selectedSectionId === "all"}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  סטטוס
                </label>
                <Select
                  value={selectedStatusId}
                  onValueChange={setSelectedStatusId}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    {statusTypes.map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">
                  מעמד
                </label>
                <Select
                  value={selectedServiceTypeId}
                  onValueChange={setSelectedServiceTypeId}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
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
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex gap-3">
              <Button
                className="flex-1 font-bold rounded-xl"
                onClick={() => setFilterOpen(false)}
              >
                החל סינון
              </Button>
              <Button
                variant="outline"
                className="font-bold rounded-xl"
                onClick={() => {
                  setSelectedStatusId("all");
                  setSelectedServiceTypeId("all");
                  setSelectedDeptId("all");
                  setSelectedSectionId("all");
                  setSelectedTeamId("all");
                }}
              >
                נקה
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Attendance Table - Desktop Only */}
      <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-muted/50 h-14">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="w-[60px] text-center px-4">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      className="w-5 h-5 border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg transition-all shadow-sm"
                      checked={
                        filteredEmployees.length > 0 &&
                        selectedEmployeeIds.length === filteredEmployees.length
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                    />
                  </div>
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
                  const isSelected = selectedEmployeeIds.includes(emp.id);

                  return (
                    <TableRow
                      key={emp.id}
                      data-state={isSelected ? "selected" : "unchecked"}
                      className={cn(
                        "group hover:bg-muted/50 transition-colors border-b border-border",
                        isSelected && "bg-primary/5 hover:bg-primary/10",
                        user &&
                          emp.id === user.id &&
                          !isSelected &&
                          "bg-emerald-500/5 hover:bg-emerald-500/10 border-r-4 border-r-emerald-500",
                      )}
                    >
                      <TableCell className="text-center px-4 py-4 align-middle">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            className={cn(
                              "w-5 h-5 border-2 border-muted-foreground/30 rounded-lg transition-all shadow-sm",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-background hover:border-primary/50",
                            )}
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectOne(emp.id, checked as boolean)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl shadow-sm flex items-center justify-center text-muted-foreground font-black text-[10px] uppercase transition-transform hover:scale-105 shrink-0",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-white dark:bg-muted/50 border border-border/50",
                            )}
                          >
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span>
                                {emp.first_name[0]}
                                {emp.last_name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col text-right">
                            <EmployeeLink
                              employee={emp}
                              className={cn(
                                "text-sm font-black transition-colors",
                                isSelected ? "text-primary" : "text-foreground",
                              )}
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

      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">
              טוען נתונים...
            </p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border shadow-sm">
            <p className="text-xs font-bold text-muted-foreground">
              לא נמצאו שוטרים
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 text-xs font-bold text-muted-foreground uppercase">
              <span>רשימת שוטרים ({filteredEmployees.length})</span>
              <div className="flex items-center gap-3">
                <span
                  onClick={() =>
                    handleSelectAll(
                      selectedEmployeeIds.length !== filteredEmployees.length,
                    )
                  }
                  className="text-primary cursor-pointer active:opacity-70 select-none"
                >
                  {selectedEmployeeIds.length === filteredEmployees.length
                    ? "בטל בחירה"
                    : "בחר הכל"}
                </span>
                <Checkbox
                  className="w-4 h-4"
                  checked={
                    filteredEmployees.length > 0 &&
                    selectedEmployeeIds.length === filteredEmployees.length
                  }
                  onCheckedChange={(checked) =>
                    handleSelectAll(checked as boolean)
                  }
                />
              </div>
            </div>
            {filteredEmployees.map((emp) => {
              const isUpdatedToday =
                emp.last_status_update &&
                new Date(emp.last_status_update).toDateString() ===
                  selectedDate.toDateString();
              const isSelected = selectedEmployeeIds.includes(emp.id);

              return (
                <div
                  key={emp.id}
                  className={cn(
                    "group bg-card rounded-2xl border shadow-sm overflow-hidden transition-all",
                    isSelected
                      ? "bg-primary/5 border-primary/30"
                      : "border-border",
                    !emp.is_active && "bg-destructive/5 grayscale opacity-80",
                  )}
                  onClick={() => handleSelectOne(emp.id, !isSelected)}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) =>
                          handleSelectOne(emp.id, c as boolean)
                        }
                        className="mt-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex-1 min-w-0">
                        {/* Top Row: Name & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h3 className="font-black text-sm text-foreground truncate leading-tight">
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <div className="text-[11px] text-muted-foreground font-bold font-mono">
                              {emp.personal_number}
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "border-none text-[10px] px-2 h-6 flex gap-1.5 items-center font-bold shrink-0",
                              isUpdatedToday
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-600",
                            )}
                          >
                            {isUpdatedToday ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>תקין</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                <span>חסר</span>
                              </>
                            )}
                          </Badge>
                        </div>

                        {/* Middle Row: Org Info */}
                        <div className="text-[11px] text-muted-foreground/80 font-medium truncate mb-2.5">
                          {emp.department_name || "-"}
                          {emp.section_name && ` • ${emp.section_name}`}
                          {emp.team_name && ` • ${emp.team_name}`}
                        </div>

                        {/* Status Bar */}
                        <div className="bg-muted/50 rounded-lg p-2 flex items-center justify-between border border-border/50">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full ring-2 ring-background"
                              style={{
                                backgroundColor: emp.status_color || "#ccc",
                              }}
                            />
                            <span className="text-xs font-black text-foreground">
                              {emp.status_name || "ללא סטטוס"}
                            </span>
                          </div>
                          {isUpdatedToday && (
                            <span className="text-[10px] font-bold text-muted-foreground bg-background/50 px-1.5 rounded">
                              {format(
                                new Date(emp.last_status_update!),
                                "HH:mm",
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Update/History) - Condensed */}
                  <div className="grid grid-cols-2 divide-x divide-x-reverse divide-border/50 border-t border-border/50 bg-muted/20">
                    <button
                      className="py-2.5 text-xs font-bold text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStatusModal(emp);
                      }}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      עדכון
                    </button>
                    <button
                      className="py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenHistoryModal(emp);
                      }}
                    >
                      <History className="w-3.5 h-3.5" />
                      היסטוריה
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
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
