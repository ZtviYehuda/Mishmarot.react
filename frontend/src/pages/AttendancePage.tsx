import { useState, useEffect, useMemo } from "react";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { useDateContext } from "@/context/DateContext";
import { format } from "date-fns";
import { he } from "date-fns/locale";
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
import { Card } from "@/components/ui/card";
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
  CheckCheck,
  CalendarRange,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
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
  const navigate = useNavigate();
  const {
    employees,
    loading,
    fetchEmployees,
    getStructure,
    getDashboardStats,
    getStatusTypes,
    getServiceTypes,
    getEmployeeById,
    verifyRoster,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [structure, setStructure] = useState<any[]>([]);
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
  const [currentUserEmp, setCurrentUserEmp] = useState<Employee | null>(null);
  const [alertContext, setAlertContext] = useState<any>(null);

  // Check for auto-open modal from navigation state
  useEffect(() => {
    if (location.state?.openBulkModal) {
      if (location.state.alertData) {
        setAlertContext(location.state.alertData);
        if (location.state.alertData.missing_ids) {
          setSelectedEmployeeIds(location.state.alertData.missing_ids);
        }
      } else if (location.state.missingIds) {
        setAlertContext({ missing_ids: location.state.missingIds });
        setSelectedEmployeeIds(location.state.missingIds);
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

      const statuses = await getStatusTypes();
      if (statuses) setStatusTypes(statuses);

      const sTypes = await getServiceTypes();
      if (sTypes) setServiceTypes(sTypes);

      if (user) {
        const me = await getEmployeeById(user.id);
        console.log("[DEBUG] getEmployeeById result:", me);
        setCurrentUserEmp(me);
      }
    };
    init();
  }, [
    getStructure,
    getDashboardStats,
    getStatusTypes,
    getServiceTypes,
    getEmployeeById,
    selectedDate,
    user,
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

  // Smart Continuity Logic - matches the backend get_dashboard_stats and the Work Roster
  // An employee is "active" (reported) for a date if:
  //   1. They have a PERSISTENT status that started on or before that date
  //   2. They are in a DATE-RANGE status (has end_datetime) that covers that date
  //   3. Their status started on that exact date
  // "Not Reported" = NO status entry at all
  const isReportedOnDate = (emp: any, date: Date) => {
    if (!emp.status_id) return false;

    const targetDateStr = date.toDateString();
    const startDate = emp.last_status_update
      ? new Date(emp.last_status_update)
      : null;

    // Started on the exact target date
    if (startDate && startDate.toDateString() === targetDateStr) return true;

    // Within an active date range (has an end date that hasn't passed)
    if (emp.status_end_datetime) {
      const endDate = new Date(emp.status_end_datetime);
      endDate.setHours(23, 59, 59, 999);
      if (startDate && startDate <= date && date <= endDate) return true;
    }

    // Persistent status active from a previous day (no end date = ongoing)
    if (emp.status_is_persistent && !emp.status_end_datetime) {
      if (startDate && startDate <= date) return true;
    }

    return false;
  };

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
      if (selectedStatusId !== "all") {
        if (emp.status_id !== parseInt(selectedStatusId)) return false;
      }

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
    selectedDate,
  ]);

  const unitLabel = useMemo(() => {
    if (user?.commands_team_id) return "חולייתי";
    if (user?.commands_section_id) return "מדורי";
    if (user?.commands_department_id) return "מחלקתי";
    return "יחידתי";
  }, [user]);

  const unitTypeLabel = useMemo(() => {
    if (user?.commands_team_id) return "חוליה";
    if (user?.commands_section_id) return "מדור";
    if (user?.commands_department_id) return "מחלקה";
    return "יחידה";
  }, [user]);

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
    if (user) {
      const me = await getEmployeeById(user.id);
      setCurrentUserEmp(me);
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

  // 1. Superset (For logic/missing checks - includes long-term statuses)
  const activeEmployees = useMemo(() => {
    return scopeEmployees.filter((emp) => isReportedOnDate(emp, selectedDate));
  }, [scopeEmployees, selectedDate]);

  const unverifiedEmployees = useMemo(
    () => activeEmployees.filter((e) => e.status_id && e.is_verified === false),
    [activeEmployees],
  );

  const updatedTodayCount = activeEmployees.length;

  const computedStats = useMemo(() => {
    const statusMap = new Map<
      string,
      { status_id: number; status_name: string; color: string; count: number }
    >();

    // Build a lookup: sub-status id → parent status
    const subToParent = new Map<number, any>();
    statusTypes.forEach((st) => {
      if (st.parent_status_id) {
        const parent = statusTypes.find((p) => p.id === st.parent_status_id);
        if (parent) subToParent.set(st.id, parent);
      }
    });

    // 1. Initialize with PARENT status types only (no parent_status_id)
    statusTypes
      .filter((st) => !st.parent_status_id)
      .forEach((st) => {
        statusMap.set(st.name, {
          status_id: st.id,
          status_name: st.name,
          color: st.color || "#cbd5e1",
          count: 0,
        });
      });

    // 2. Count active employees - sub-statuses count toward their parent
    activeEmployees.forEach((emp: any) => {
      const statusName = emp.status_name?.trim();
      if (!statusName) return;

      // Check if this is a sub-status → map to parent name
      const parent = emp.status_id ? subToParent.get(emp.status_id) : null;
      const key = parent ? parent.name : statusName;

      if (statusMap.has(key)) {
        statusMap.get(key)!.count++;
      } else {
        // Unknown status not yet in map (e.g. custom added) — add it
        statusMap.set(key, {
          status_id: parent ? parent.id : emp.status_id,
          status_name: key,
          color: parent ? parent.color : emp.status_color || "#cbd5e1",
          count: 1,
        });
      }
    });

    return Array.from(statusMap.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.status_name.localeCompare(b.status_name);
    });
  }, [activeEmployees, statusTypes]);

  const totalCount = scopeEmployees.length;

  const missingEmployeeIds = useMemo(() => {
    return scopeEmployees
      .filter((emp) => !isReportedOnDate(emp, selectedDate))
      .map((e) => e.id);
  }, [scopeEmployees, selectedDate]);

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

  const isReportedToday = currentUserEmp
    ? isReportedOnDate(currentUserEmp, selectedDate)
    : false;

  const progressPercent =
    totalCount > 0 ? (updatedTodayCount / totalCount) * 100 : 0;

  const isAllReported = totalCount > 0 && activeEmployees.length === totalCount;

  return (
    <div
      className="flex flex-col min-h-full selection:bg-primary/10 selection:text-primary transition-all duration-500"
      dir="rtl"
    >
      {/* Unified Page Header Wrapper */}
      <div className="px-6 md:px-10 pt-2 pb-4 shrink-0 transition-all">
        <PageHeader
          icon={CalendarDays}
          title="מעקב נוכחות יומי"
          subtitle={`ניהול ודיווח סטטוס נוכחות לכלל שוטרי ה${unitTypeLabel}`}
          category="נוכחות"
          categoryLink="/attendance"
          iconClassName="from-primary/10 to-primary/5 border-primary/20"
          className="mb-0"
          badge={
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
                <DateHeader className="w-full justify-center sm:w-auto" />

                <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 w-full lg:w-auto">
                  {!user?.is_temp_commander && (
                    <>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 gap-2 font-black px-4 w-full sm:w-auto justify-center transition-all bg-white"
                        onClick={() => navigate("/roster")}
                      >
                        <CalendarRange className="w-4 h-4" />
                        <span className="text-xs">סידור עבודה</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 gap-2 font-black px-4 w-full sm:w-auto justify-center transition-all bg-white"
                        onClick={() => setExportDialogOpen(true)}
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-xs">ייצוא</span>
                      </Button>
                    </>
                  )}

                  {unverifiedEmployees.length > 0 && (
                    <Button
                      variant="default" // Primary style to encourage verification
                      className="h-10 rounded-xl gap-2 font-black px-4 w-full sm:w-auto justify-center transition-all bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={async () => {
                        const success = await verifyRoster(
                          format(selectedDate, "yyyy-MM-dd"),
                          unverifiedEmployees.map((e) => e.id),
                        );
                        if (success) {
                          toast.success(
                            `אושר סידור עבור ${unverifiedEmployees.length} שוטרים`,
                            { description: "הדיווחים הפכו למאומתים (ירוק)" },
                          );
                          refreshData();
                        }
                      }}
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="text-xs">
                        אישור סידור ({unverifiedEmployees.length})
                      </span>
                    </Button>
                  )}

                  <Button
                    variant={isReportedToday ? "default" : "outline"}
                    className={cn(
                      "h-10 rounded-xl gap-2 font-black transition-all px-4 w-full sm:w-auto justify-center",
                      isReportedToday
                        ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white"
                        : "border-primary/20 bg-primary/5 text-primary bg-white hover:bg-primary/10",
                    )}
                    onClick={() => {
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
                    <span className="text-xs">דיווח עצמי</span>
                  </Button>

                  <Button
                    variant="outline"
                    className={cn(
                      "h-10 rounded-xl border-input gap-2 font-black text-muted-foreground hover:bg-muted px-4 col-span-2 sm:w-auto justify-center bg-white transition-all",
                      selectedEmployeeIds.length > 0 &&
                        "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
                    )}
                    onClick={() => {
                      setAlertContext(null);
                      setBulkModalOpen(true);
                    }}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="text-xs font-black">
                      {selectedEmployeeIds.length > 0
                        ? `עדכון לנבחרים (${selectedEmployeeIds.length})`
                        : "עדכון נוכחות מרוכז"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Mobile Reminder Banner - Show only on small screens when not reported */}
              <div className="lg:hidden w-full">
                {!isAllReported && (
                  <div
                    className="w-full bg-gradient-to-l from-rose-500 to-rose-600 rounded-xl p-3 flex items-center justify-between text-white cursor-pointer"
                    onClick={() => {
                      setAlertContext({ missing_ids: missingEmployeeIds });
                      setSelectedEmployeeIds(missingEmployeeIds);
                      setBulkModalOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-white/20 rounded-lg">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-[12px] font-black leading-none">
                          יש להשלים דיווחים
                        </h3>
                        <span className="text-[10px] font-bold opacity-80 mt-0.5">
                          עד השעה 09:00
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-white/20 h-7 px-3 rounded-full border border-white/10">
                      <span className="text-[10px] font-black">
                        נותרו: {totalCount - activeEmployees.length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        />
      </div>

      <div className="px-6 md:px-10 pb-10 space-y-4">
        {/* Summary Stats & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-6 sm:p-8 border border-border lg:col-span-3 order-2 lg:order-1 relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex flex-col gap-1 text-right">
                <span className="text-sm sm:text-base font-black text-foreground tracking-tight">
                  סיכום התייצבות {unitLabel}
                </span>
                <span className="text-[11px] sm:text-sm text-muted-foreground font-bold italic">
                  מעקב דיווחים להיום,{" "}
                  {format(selectedDate, "EEEE, d MMM", {
                    locale: he,
                  })}
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-primary animate-in zoom-in duration-500">
                    {updatedTodayCount}
                  </span>
                  <span className="text-base sm:text-xl font-bold text-muted-foreground/40">
                    / {totalCount}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-black text-muted-foreground uppercase mt-1">
                  שוטרים מדווחים
                </span>
              </div>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-8 relative">
              <div
                className="h-full bg-gradient-to-l from-primary via-primary/80 to-primary/60 transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div
              className={cn(
                "grid grid-cols-3 sm:grid-cols-4 gap-2",
                "lg:flex lg:flex-row lg:w-full lg:gap-0 lg:border lg:border-border/60 lg:rounded-3xl lg:overflow-hidden lg:divide-x lg:divide-x-reverse lg:divide-border/40 lg:bg-muted/5",
              )}
            >
              {computedStats
                .filter((s: any) => s.status_id)
                .map((s: any) => (
                  <div
                    key={s.status_id}
                    onClick={() => {
                      if (s.count > 0) {
                        setSelectedStatusId((prev) =>
                          prev === s.status_id.toString()
                            ? "all"
                            : s.status_id.toString(),
                        );
                      }
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center transition-all cursor-pointer group rounded-xl border h-20 sm:h-24",
                      "lg:flex-1 lg:h-24 lg:p-4 lg:rounded-none",
                      selectedStatusId === s.status_id.toString()
                        ? "text-white scale-[1.02] z-10"
                        : "bg-muted/30 border-transparent hover:bg-muted/50 lg:bg-transparent lg:border-0",
                      s.count === 0 &&
                        "opacity-60 grayscale cursor-default hover:bg-muted/30",
                    )}
                    style={{
                      backgroundColor:
                        selectedStatusId === s.status_id.toString()
                          ? s.color
                          : undefined,
                      borderColor:
                        selectedStatusId === s.status_id.toString()
                          ? s.color
                          : undefined,
                    }}
                  >
                    <span
                      className={cn(
                        "text-xl sm:text-2xl lg:text-3xl font-black",
                        selectedStatusId === s.status_id.toString()
                          ? "text-white"
                          : "text-foreground",
                      )}
                    >
                      {s.count > 0 ? s.count : "-"}
                    </span>
                    <span
                      className="text-[9px] sm:text-[10px] lg:text-xs font-black uppercase text-center leading-tight mt-1 px-1 truncate w-full"
                      style={{
                        color:
                          selectedStatusId === s.status_id.toString()
                            ? "#ffffff"
                            : s.color || "var(--muted-foreground)",
                      }}
                    >
                      {s.status_name}
                    </span>

                    {/* Desktop Selection Bar */}
                    {selectedStatusId === s.status_id.toString() && (
                      <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-1 bg-white transition-all" />
                    )}
                  </div>
                ))}
            </div>
          </Card>

          {!isAllReported ? (
            <div className="hidden lg:flex bg-card/40 dark:bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl lg:rounded-3xl p-4 lg:p-6 flex-row lg:flex-col items-center lg:items-start justify-between gap-4 order-1 lg:order-2 hover:border-border transition-all duration-300">
              {/* Header Section */}
              <div className="flex items-start gap-3 lg:gap-4 flex-1">
                <div className="relative">
                  {/* Icon Container with subtle pulse */}
                  <div className="relative p-2.5 lg:p-3 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl lg:rounded-2xl border border-primary/20 dark:border-primary/30">
                    <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-primary/20 animate-ping opacity-20" />
                  </div>
                  {/* Corner accent */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>

                <div className="flex-1 space-y-1 lg:space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm lg:text-lg font-black text-foreground">
                      תזכורת דיווח
                    </h3>
                    <div className="hidden lg:block px-2 py-0.5 bg-primary/10 dark:bg-primary/20 rounded-full">
                      <span className="text-[10px] font-bold text-primary">
                        דחוף
                      </span>
                    </div>
                  </div>
                  <p className="hidden lg:block text-xs lg:text-sm text-muted-foreground font-medium leading-relaxed">
                    יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד השעה{" "}
                    <span className="font-black text-foreground">09:00</span>
                  </p>
                  <p className="lg:hidden text-[10px] text-muted-foreground font-medium">
                    השלמה עד{" "}
                    <span className="font-black text-foreground">09:00</span>
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="w-full lg:flex lg:justify-center">
                <button
                  className="group relative h-10 lg:h-11 w-full lg:w-auto px-4 lg:px-6 bg-primary hover:bg-primary/90 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  onClick={() => {
                    setAlertContext({ missing_ids: missingEmployeeIds });
                    setBulkModalOpen(true);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  <AlertCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-foreground relative z-10" />
                  <span className="text-xs lg:text-sm font-black text-primary-foreground whitespace-nowrap relative z-10">
                    נותרו: {totalCount - updatedTodayCount}
                  </span>
                </button>
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
        <Card className="p-4 sm:p-6 overflow-hidden">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
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
                <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold text-right">
                  <SelectValue placeholder="כל המחלקות" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
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
                <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold text-right">
                  <SelectValue placeholder="כל המדורים" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
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
                <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold text-right">
                  <SelectValue placeholder="כל החוליות" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
                סטטוס
              </label>
              <Select
                value={selectedStatusId}
                onValueChange={(val) => setSelectedStatusId(val)}
              >
                <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold text-right">
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              <label className="text-[10px] font-black text-muted-foreground uppercase mr-1">
                מעמד
              </label>
              <Select
                value={selectedServiceTypeId}
                onValueChange={(val) => setSelectedServiceTypeId(val)}
              >
                <SelectTrigger className="h-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl font-bold text-right">
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent dir="rtl">
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
              className="md:col-span-1 h-11 text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2 w-auto min-w-[44px]"
              title="נקה סינון"
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
              <X className="w-4 h-4" />
              <span className="hidden lg:inline text-xs font-bold">נקה</span>
            </Button>
          </div>
        </Card>

        {/* Filter Modal for Mobile */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="w-[90vw] max-w-[340px] p-0 border-none bg-transparent">
            <div className="bg-card border border-border flex flex-col rounded-2xl  overflow-hidden max-h-[85vh]">
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
                    <SelectContent dir="rtl">
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
                    <SelectContent dir="rtl">
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
                    <SelectContent dir="rtl">
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
                    <SelectContent dir="rtl">
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
                    <SelectContent dir="rtl">
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
        <div className="hidden lg:block bg-card rounded-2xl border border-border  overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader className="bg-muted/30 backdrop-blur-sm">
                <TableRow className="border-b border-border/60 hover:bg-transparent">
                  <TableHead className="w-[60px] text-center px-4 h-16">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        className="w-5 h-5 border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg transition-all "
                        checked={
                          filteredEmployees.length > 0 &&
                          selectedEmployeeIds.length ===
                            filteredEmployees.length
                        }
                        onCheckedChange={(checked) =>
                          handleSelectAll(checked as boolean)
                        }
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right px-6 font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                    שוטר
                  </TableHead>
                  <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                    תפקיד/סמכות
                  </TableHead>
                  <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                    שיוך ארגוני
                  </TableHead>
                  <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                    סטטוס נוכחות
                  </TableHead>
                  <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
                    עדכון אחרון
                  </TableHead>
                  <TableHead className="text-center font-black text-muted-foreground uppercase text-[10px] tracking-widest h-16">
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
                    const isUpdatedToday = isReportedOnDate(emp, selectedDate);
                    const isSelected = selectedEmployeeIds.includes(emp.id);

                    return (
                      <TableRow
                        key={emp.id}
                        data-state={isSelected ? "selected" : "unchecked"}
                        className={cn(
                          "group/row transition-all duration-300 border-b border-border/40",
                          isSelected
                            ? "bg-primary/[0.03] border-r-4 border-r-primary"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/40 border-r-4 border-r-transparent hover:border-r-primary/40",
                          user &&
                            emp.id === user.id &&
                            !isSelected &&
                            "bg-emerald-500/[0.02] border-r-4 border-r-emerald-500",
                        )}
                      >
                        <TableCell className="text-center px-4 py-5 align-middle">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              className={cn(
                                "w-5 h-5 border-2 rounded-lg transition-all",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "border-muted-foreground/30 bg-background hover:border-primary/50",
                              )}
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectOne(emp.id, checked as boolean)
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right align-middle">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div
                                className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm group-hover/row:scale-110 transition-all duration-500 shrink-0",
                                  isSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-400 border border-border/50",
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
                              {!isSelected && (
                                <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
                              )}
                            </div>
                            <div className="flex flex-col text-right min-w-0">
                              <EmployeeLink
                                employee={emp}
                                className={cn(
                                  "text-base font-black truncate tracking-tight transition-colors",
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground group-hover/row:text-primary",
                                )}
                              />
                              <span className="text-[10px] text-muted-foreground/50 font-black tracking-[0.1em]">
                                #{emp.personal_number}
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
                        <TableCell className="text-right py-5">
                          <div className="flex flex-col text-right min-w-[140px]">
                            {emp.department_name &&
                            emp.department_name !== "מטה" ? (
                              <>
                                <span className="text-[11px] font-black text-foreground">
                                  {cleanUnitName(emp.department_name)}
                                </span>
                                {((emp.section_name &&
                                  emp.section_name !== "מטה") ||
                                  (emp.team_name &&
                                    emp.team_name !== "מטה")) && (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-black text-primary/60 truncate bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                      {emp.team_name && emp.team_name !== "מטה"
                                        ? cleanUnitName(emp.team_name)
                                        : cleanUnitName(emp.section_name || "")}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] font-black text-muted-foreground/30">
                                מטה / ללא שיוך
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: (() => {
                                  const isToday =
                                    selectedDate.toDateString() ===
                                    new Date().toDateString();

                                  const statusName =
                                    emp.status_name?.trim() || "";
                                  const isDefaultStatus = [
                                    "משרד",
                                    "נוכח",
                                    "ביחידה",
                                    "בבסיס",
                                    "רגיל",
                                  ].some((s) => statusName.includes(s));

                                  if (!isToday && isDefaultStatus) {
                                    return "var(--muted-foreground)"; // Gray for unreported
                                  }
                                  return (
                                    emp.status_color ||
                                    "var(--muted-foreground)"
                                  );
                                })(),
                              }}
                            />
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold border-none bg-muted py-0.5 px-2 text-muted-foreground"
                            >
                              {(() => {
                                const isToday =
                                  selectedDate.toDateString() ===
                                  new Date().toDateString();

                                // Check if status is "Default" (Office/Present)
                                const statusName =
                                  emp.status_name?.trim() || "";
                                const isDefaultStatus = [
                                  "משרד",
                                  "נוכח",
                                  "ביחידה",
                                  "בבסיס",
                                  "רגיל",
                                ].some((s) => statusName.includes(s));

                                // Logic: If NOT today, and status is default -> It's a placeholder -> Show Unreported
                                if (!isToday && isDefaultStatus) {
                                  return "לא דווח";
                                }
                                return statusName || "לא מדווח";
                              })()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isUpdatedToday ? (
                            emp.is_verified !== false ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">
                                  {selectedDate.toDateString() ===
                                  new Date().toDateString()
                                    ? "היום"
                                    : format(selectedDate, "dd/MM")}
                                  ,{" "}
                                  {activeEmployees.find(
                                    (e) =>
                                      e.id === emp.id &&
                                      new Date(
                                        e.last_status_update!,
                                      ).toDateString() !==
                                        selectedDate.toDateString(),
                                  )
                                    ? "08:00"
                                    : new Date(
                                        emp.last_status_update!,
                                      ).toLocaleTimeString("he-IL", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black">
                                  מתוכנן
                                </span>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500/80">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">
                                לא עודכן
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!user?.is_temp_commander && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
                                onClick={() => handleOpenHistoryModal(emp)}
                              >
                                <History className="w-4 h-4" />
                              </Button>
                            )}
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
            <div className="bg-card rounded-2xl p-8 text-center border border-border ">
              <p className="text-xs font-bold text-muted-foreground">
                טוען נתונים...
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border ">
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
                      "group bg-card rounded-[24px] border  overflow-hidden transition-all active:scale-[0.98]",
                      isSelected
                        ? "bg-primary/5 border-primary "
                        : "border-border",
                      !emp.is_active && "grayscale opacity-80",
                    )}
                    onClick={() => handleSelectOne(emp.id, !isSelected)}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Avatar/Initials */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-xs shrink-0 transition-transform",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border/50",
                          )}
                        >
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex flex-col">
                              <h3 className="font-black text-[15px] text-foreground truncate leading-none mb-1">
                                {emp.first_name} {emp.last_name}
                              </h3>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground font-black tracking-widest">
                                  {emp.personal_number}
                                </span>
                                <span className="text-[10px] text-muted-foreground/30">
                                  •
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">
                                  {emp.service_type_name}
                                </span>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ",
                                isUpdatedToday
                                  ? "ring-4 ring-emerald-500/10"
                                  : "animate-pulse ring-4 ring-rose-500/10",
                              )}
                              style={{
                                backgroundColor: (() => {
                                  const isToday =
                                    selectedDate.toDateString() ===
                                    new Date().toDateString();

                                  const statusName =
                                    emp.status_name?.trim() || "";

                                  // Allowlist: Only these statuses "stick" without explicit daily update
                                  const isLongTermStatus = [
                                    "חופש",
                                    "מחלה",
                                    "גימל",
                                    "קורס",
                                    "אבטחה",
                                    "תגבור",
                                    'חו"ל',
                                    "סיפוח",
                                    "הפניה",
                                    "מיוחדת",
                                  ].some((s) => statusName.includes(s));

                                  // If not today, and not explicitly updated for this date, and NOT a long-term status -> Show Gray
                                  if (
                                    !isToday &&
                                    !isUpdatedToday &&
                                    !isLongTermStatus
                                  ) {
                                    return "#94a3b8"; // Slate-400
                                  }
                                  return emp.status_color || "#cbd5e1";
                                })(),
                              }}
                            />
                          </div>

                          {/* Org Path */}
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium mb-3">
                            <span className="truncate">
                              {emp.department_name}
                            </span>
                            {emp.section_name && (
                              <>
                                <span className="opacity-30">/</span>
                                <span className="truncate">
                                  {emp.section_name}
                                </span>
                              </>
                            )}
                            {emp.team_name && (
                              <>
                                <span className="opacity-30">/</span>
                                <span className="truncate">
                                  {emp.team_name}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Status Capsule */}
                          <div
                            className={cn(
                              "rounded-2xl p-2.5 flex items-center justify-between border transition-colors",
                              isUpdatedToday
                                ? "bg-emerald-500/[0.03] border-emerald-500/10"
                                : "bg-muted/50 border-border/50",
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs font-black",
                                  isUpdatedToday
                                    ? "text-emerald-700"
                                    : (() => {
                                        const isToday =
                                          selectedDate.toDateString() ===
                                          new Date().toDateString();
                                        const statusName =
                                          emp.status_name?.trim() || "";
                                        const isLongTermStatus = [
                                          "חופש",
                                          "מחלה",
                                          "גימל",
                                          "קורס",
                                          "אבטחה",
                                          "תגבור",
                                          'חו"ל',
                                          "סיפוח",
                                          "הפניה",
                                          "מיוחדת",
                                        ].some((s) => statusName.includes(s));

                                        if (
                                          !isToday &&
                                          !isUpdatedToday &&
                                          !isLongTermStatus
                                        ) {
                                          return "text-muted-foreground";
                                        }
                                        return "text-foreground";
                                      })(),
                                )}
                              >
                                {(() => {
                                  const isToday =
                                    selectedDate.toDateString() ===
                                    new Date().toDateString();
                                  const statusName =
                                    emp.status_name?.trim() || "";
                                  const isLongTermStatus = [
                                    "חופש",
                                    "מחלה",
                                    "גימל",
                                    "קורס",
                                    "אבטחה",
                                    "תגבור",
                                    'חו"ל',
                                    "סיפוח",
                                    "הפניה",
                                    "מיוחדת",
                                  ].some((s) => statusName.includes(s));

                                  if (
                                    !isToday &&
                                    !isUpdatedToday &&
                                    !isLongTermStatus
                                  ) {
                                    return "לא דווח";
                                  }
                                  return statusName || "טרם דווח";
                                })()}
                              </span>
                            </div>
                            {isUpdatedToday && (
                              <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600/70 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                {format(
                                  new Date(emp.last_status_update!),
                                  "HH:mm",
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex border-t border-border/50 bg-muted/20">
                      <button
                        className="flex-1 py-3 text-[11px] font-black text-primary hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-2 border-l border-border/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStatusModal(emp);
                        }}
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        עדכן נוכחות
                      </button>
                      {!user?.is_temp_commander && (
                        <button
                          className="flex-1 py-3 text-[11px] font-black text-muted-foreground hover:bg-muted/50 active:bg-muted transition-colors flex items-center justify-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHistoryModal(emp);
                          }}
                        >
                          <History className="w-3.5 h-3.5" />
                          היסטוריה
                        </button>
                      )}
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
          selectedDate={selectedDate}
          isReportedCheck={isReportedOnDate}
        />
        <ExportReportDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      </div>
    </div>
  );
}
