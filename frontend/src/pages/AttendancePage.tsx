import { useState, useEffect, useMemo, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  CalendarRange,
  Search,
  Filter,
  ClipboardCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  CheckCheck,
  History,
} from "lucide-react";
import { AttendanceCalendarView } from "@/components/attendance/AttendanceCalendarView";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn, cleanUnitName } from "@/lib/utils";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
  StatusHistoryModal,
  ExportReportDialog,
} from "@/components/employees/modals";
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
    getStatusTypes,
    getServiceTypes,
    getEmployeeById,
    verifyRoster,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("all");
  const [selectedSectionId, setSelectedSectionId] = useState("all");
  const [selectedTeamId, setSelectedTeamId] = useState("all");
  const [selectedStatusId, setSelectedStatusId] = useState("all");
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState("all");

  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [currentUserEmp, setCurrentUserEmp] = useState<Employee | null>(null);
  const [alertContext, setAlertContext] = useState<{
    missing_ids: number[];
  } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // Wrap in startTransition so the button press is instant
  const openCalendar = () => startTransition(() => setCalendarOpen((v) => !v));
  const closeCalendar = () => startTransition(() => setCalendarOpen(false));

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("attendance_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
        if (filters.deptId !== undefined) setSelectedDeptId(filters.deptId);
        if (filters.sectionId !== undefined) setSelectedSectionId(filters.sectionId);
        if (filters.teamId !== undefined) setSelectedTeamId(filters.teamId);
        if (filters.statusId !== undefined) setSelectedStatusId(filters.statusId);
        if (filters.serviceTypeId !== undefined) setSelectedServiceTypeId(filters.serviceTypeId);
      } catch (e) {
        console.error("Failed to parse saved attendance filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return; // Wait until loaded
    if (user?.is_impersonated) return; // Don't save filters when impersonating

    const filters = {
      searchTerm,
      deptId: selectedDeptId,
      sectionId: selectedSectionId,
      teamId: selectedTeamId,
      statusId: selectedStatusId,
      serviceTypeId: selectedServiceTypeId,
    };
    localStorage.setItem("attendance_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    searchTerm,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    selectedServiceTypeId,
    user?.is_impersonated,
  ]);

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
      if (struct) {
        setDepartments(struct);
      }

      const statuses = await getStatusTypes();
      if (statuses) setStatusTypes(statuses);

      const sTypes = await getServiceTypes();
      if (sTypes) setServiceTypes(sTypes);

      if (user) {
        const me = await getEmployeeById(user.id);
        setCurrentUserEmp(me);
      }
    };
    init();
  }, [getStructure, getStatusTypes, getServiceTypes, getEmployeeById, user]);

  // Update sections and teams when department/section changes
  useEffect(() => {
    const currentDept = departments.find(
      (d: any) => d.id.toString() === selectedDeptId,
    );
    setSections(currentDept?.sections || []);
    setSelectedSectionId("all"); // Reset section when department changes
    setTeams([]); // Reset teams
    setSelectedTeamId("all"); // Reset team
  }, [selectedDeptId, departments]);

  useEffect(() => {
    const currentSection = sections.find(
      (s: any) => s.id.toString() === selectedSectionId,
    );
    setTeams(currentSection?.teams || []);
    setSelectedTeamId("all"); // Reset team when section changes
  }, [selectedSectionId, sections]);

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
      const searchMatch = fullName.includes(searchTerm.toLowerCase()) || false;
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
        if (selectedStatusId === "GROUP_VACATION") {
          if (!emp.status_name?.includes("חופשה")) return false;
        } else if (selectedStatusId === "GROUP_OFFICE") {
          if (!emp.status_name?.includes("משרד")) return false;
        } else if (emp.status_id?.toString() !== selectedStatusId) {
          return false;
        }
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
  ]);

  const employeesForModal = useMemo(() => {
    if (alertContext && alertContext.missing_ids) {
      return employees.filter((e) => alertContext.missing_ids.includes(e.id));
    }
    return filteredEmployees;
  }, [employees, alertContext, filteredEmployees]);

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

  // Mobile-specific grouped stats for a cleaner gauge
  const mobileGaugeStats = useMemo(() => {
    const grouped = new Map<
      string,
      { status_id: string; status_name: string; color: string; count: number }
    >();

    computedStats.forEach((s) => {
      let groupName = s.status_name;
      let groupId = s.status_id.toString();
      let color = s.color;

      if (s.status_name.includes("חופשה")) {
        groupName = "חופשה";
        groupId = "GROUP_VACATION";
        color = "#3b82f6"; // Primary Blue
      } else if (s.status_name.includes("משרד")) {
        groupName = "משרד";
        groupId = "GROUP_OFFICE";
        color = "#10b981"; // Emerald Green
      }

      if (grouped.has(groupName)) {
        grouped.get(groupName)!.count += s.count;
      } else {
        grouped.set(groupName, {
          status_id: groupId,
          status_name: groupName,
          color: color,
          count: s.count,
        });
      }
    });

    return Array.from(grouped.values())
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [computedStats]);

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
      className="flex flex-col min-h-full selection:bg-primary/10 selection:text-primary transition-all"
      dir="rtl"
    >
      <div className="pt-3 pb-1 shrink-0 transition-all px-4">
        {/* Premium Page Header Section */}
        <PageHeader
          icon={CalendarDays}
          title="מעקב נוכחות"
          className="mb-2"
          hideMobile={true}
          badge={
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6 w-full lg:w-auto mt-4 lg:mt-0">
              {/* Unified Date Selector */}
              <div className="hidden lg:flex">
                <DateHeader className="w-auto shadow-none" compact={true} />
              </div>
              {/* Mobile-First Action Bar */}
              <div className="lg:hidden">
                {/* Mobile buttons outside PageHeader to achieve full screen width */}
              </div>

              {/* Desktop Action Bar */}
              <div className="hidden lg:flex items-center gap-2 w-full lg:w-auto">
                {/* Calendar toggle button */}
                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl gap-2 font-black px-4 justify-center transition-all shadow-none",
                    calendarOpen
                      ? "text-primary bg-primary/10 border-primary/30"
                      : "text-primary hover:bg-primary/5",
                  )}
                  onClick={openCalendar}
                >
                  <CalendarRange className="w-4 h-4" />
                  <span className="text-xs">לוח שנה</span>
                </Button>

                {!user?.is_temp_commander && (
                  <Button
                    variant="ghost"
                    className="h-10 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl text-primary hover:bg-primary/5 gap-2 font-black px-4 justify-center transition-all shadow-none"
                    onClick={() => setExportDialogOpen(true)}
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs"> ייצוא דו"חות </span>
                  </Button>
                )}

                <Button
                  variant={isReportedToday ? "default" : "ghost"}
                  className={cn(
                    "h-10 rounded-xl gap-2 font-black transition-all px-4 justify-center shadow-none backdrop-blur-xl",
                    isReportedToday
                      ? "bg-emerald-500/90 hover:bg-emerald-600 border-white/20 text-white"
                      : "border border-border/40 bg-card/40 text-primary hover:bg-primary/5",
                  )}
                  onClick={() => {
                    if (currentUserEmp) {
                      setSelectedEmployee(currentUserEmp);
                      setStatusModalOpen(true);
                    }
                  }}
                >
                  {isReportedToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">דווח</span>
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="w-4 h-4" />
                      <span className="text-xs">דיווח עצמי</span>
                    </>
                  )}
                </Button>

                {unverifiedEmployees.length > 0 && (
                  <Button
                    variant="default"
                    className="h-10 rounded-xl gap-2 font-black px-4 justify-center transition-all bg-primary hover:bg-primary/90 text-white shadow-none"
                    onClick={async () => {
                      const success = await verifyRoster(
                        format(selectedDate, "yyyy-MM-dd"),
                        unverifiedEmployees.map((e) => e.id),
                      );
                      if (success) {
                        toast.success(
                          `אושר סידור עבור ${unverifiedEmployees.length} שוטרים`,
                        );
                        refreshData();
                      }
                    }}
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="text-xs">
                      אישור ({unverifiedEmployees.length})
                    </span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className={cn(
                    "h-10 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl text-primary hover:bg-primary/5 gap-2 font-black px-4 justify-center transition-all shadow-none",
                    selectedEmployeeIds.length > 0 &&
                      "bg-primary/10 border-primary/20",
                  )}
                  onClick={() => {
                    setAlertContext(null);
                    setBulkModalOpen(true);
                  }}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span className="text-xs">עדכון מרוכז</span>
                </Button>
              </div>
            </div>
          }
        />

        {/* Mobile Action Buttons - Full Screen Width */}
        <div className="lg:hidden w-full px-4 mb-2">
          <div
            className={cn(
              "grid gap-2",
              unverifiedEmployees.length > 0 && !user?.is_temp_commander
                ? "grid-cols-5"
                : !user?.is_temp_commander
                  ? "grid-cols-4"
                  : "grid-cols-3",
            )}
          >
            {/* Calendar button mobile */}
            <Button
              variant="outline"
              className={cn(
                "h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1",
                calendarOpen
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/40 bg-card/40 text-primary hover:bg-primary/5",
              )}
              onClick={openCalendar}
            >
              <CalendarRange className="w-4 h-4" />
              <span>לוח שנה</span>
            </Button>
            {!user?.is_temp_commander && (
              <Button
                variant="outline"
                className="h-11 rounded-xl border-border/40 bg-card/40 text-primary hover:bg-primary/5 gap-1 font-black text-[10px] flex-col py-2 px-1"
                onClick={() => setExportDialogOpen(true)}
              >
                <Download className="w-4 h-4" />
                <span>ייצוא</span>
              </Button>
            )}

            <Button
              variant={isReportedToday ? "default" : "outline"}
              className={cn(
                "h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1",
                isReportedToday
                  ? "bg-emerald-500 hover:bg-emerald-600 border-white/20 text-white"
                  : "border-border/40 bg-card/40 text-primary hover:bg-primary/5",
              )}
              onClick={() => {
                if (currentUserEmp) {
                  setSelectedEmployee(currentUserEmp);
                  setStatusModalOpen(true);
                }
              }}
            >
              {isReportedToday ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>דווח</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  <span>דיווח עצמי</span>
                </>
              )}
            </Button>

            {unverifiedEmployees.length > 0 && (
              <Button
                variant="default"
                className="h-11 rounded-xl gap-1 font-black text-[10px] flex-col py-2 px-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  const success = await verifyRoster(
                    format(selectedDate, "yyyy-MM-dd"),
                    unverifiedEmployees.map((e) => e.id),
                  );
                  if (success) {
                    toast.success(
                      `אושר סידור עבור ${unverifiedEmployees.length} שוטרים`,
                    );
                    refreshData();
                  }
                }}
              >
                <CheckCheck className="w-4 h-4" />
                <span>אישור ({unverifiedEmployees.length})</span>
              </Button>
            )}

            <Button
              variant="outline"
              className={cn(
                "h-11 rounded-xl border-border/40 bg-card/40 text-primary hover:bg-primary/5 gap-1 font-black text-[10px] flex-col py-2 px-1",
                selectedEmployeeIds.length > 0 &&
                  "bg-primary/10 border-primary/20",
              )}
              onClick={() => {
                setAlertContext(null);
                setBulkModalOpen(true);
              }}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>עדכון מרוכז</span>
            </Button>
          </div>
        </div>

        {/* Mobile Reminder Banner */}
        <div className="lg:hidden w-full mb-4">
          {!isAllReported && (
            <div
              className="w-full bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between cursor-pointer active:scale-95 transition-all shadow-sm"
              onClick={() => {
                setAlertContext({ missing_ids: missingEmployeeIds });
                setSelectedEmployeeIds(missingEmployeeIds);
                setBulkModalOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-px font-black text-foreground leading-tight">
                    נשארו דיווחים
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/60">
                    יעד יום: 09:00
                  </span>
                </div>
              </div>
              <div className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                <span className="text-[10px] font-black text-amber-700">
                  נותרו: {totalCount - activeEmployees.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content: calendar view OR normal stats+table */}
      <AnimatePresence>
        {calendarOpen ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="flex-1 px-2 sm:px-4 pb-4"
          >
            <div className="bg-card border border-border/50 rounded-2xl p-3 sm:p-4 md:p-5 shadow-sm h-full">
              <AttendanceCalendarView
                statusTypes={statusTypes}
                scopeEmployees={scopeEmployees}
                onClose={closeCalendar}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="pb-4 space-y-4"
          >
            {/* Summary Stats & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="p-4 sm:p-8 lg:col-span-3 order-2 lg:order-1 relative overflow-hidden">
                {/* Subtle Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex flex-col gap-1 text-right">
                    <span className="text-sm sm:text-base font-black text-foreground tracking-tight">
                      סיכום התייצבות למשמרת
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
                      <span className="text-3xl sm:text-4xl font-black text-primary">
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

                {/* Mobile Gauge Area */}
                <div className="lg:hidden flex flex-col items-center pt-6 pb-4 bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/20 mx-3 mb-2 overflow-hidden relative z-10">
                  {/* Semi-Circle Gauge - Ultra Wide Viewport to prevent clipping */}
                  <div className="relative w-full max-w-[360px] aspect-[1.6/1] flex flex-col items-center justify-center">
                    <svg
                      viewBox="0 0 160 100"
                      className="w-full h-full overflow-visible"
                    >
                      {/* Gauge Base Track - Centered at 80, 75 with R=50 */}
                      <path
                        d="M 30 70 A 50 50 0 0 1 130 70"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted/10"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />

                      {/* Categorized Segments with Intelligent Labels */}
                      {(() => {
                        let cumulativePercentage = 0;
                        const totalReported =
                          mobileGaugeStats.reduce(
                            (sum, s) => sum + s.count,
                            0,
                          ) || 1;
                        const circumference = 157.08; // PI * R (R=50)

                        return mobileGaugeStats.map((s) => {
                          const share = s.count / totalReported;
                          const size = share * 100;
                          const dashArray = `${share * circumference} ${circumference * 2}`;
                          const dashOffset = -(
                            (cumulativePercentage / 100) *
                            circumference
                          );

                          const isSelected =
                            selectedStatusId === s.status_id.toString();
                          const isAnySelected = selectedStatusId !== "all";

                          // Label Geometry Positioning
                          const midShare = cumulativePercentage + size / 2;
                          const angle = 180 - midShare * 1.8;
                          const rad = (angle * Math.PI) / 180;

                          // Intelligent radius: push further out at the edges to avoid caps
                          const lr = angle < 25 || angle > 155 ? 80 : 74;
                          const lx = 80 + lr * Math.cos(rad);
                          const ly = 70 - lr * Math.sin(rad);

                          cumulativePercentage += size;

                          if (s.count === 0) return null;

                          return (
                            <g
                              key={s.status_id}
                              className="cursor-pointer group"
                              onClick={() =>
                                setSelectedStatusId(
                                  isSelected ? "all" : s.status_id.toString(),
                                )
                              }
                            >
                              <circle
                                cx="80"
                                cy="70"
                                r="50"
                                fill="none"
                                stroke={s.color}
                                strokeWidth={isSelected ? 16 : 12}
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="butt"
                                transform="rotate(180 80 70)"
                                className="transition-all"
                                style={{
                                  opacity:
                                    isAnySelected && !isSelected ? 0.2 : 1,
                                  filter: isSelected
                                    ? `drop-shadow(0 0 10px ${s.color}44)`
                                    : "none",
                                }}
                              />

                              {/* Refined Label & Count Spacing */}
                              <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="pointer-events-none"
                              >
                                <text
                                  x={lx}
                                  y={ly}
                                  textAnchor={
                                    angle > 140
                                      ? "end"
                                      : angle < 40
                                        ? "start"
                                        : "middle"
                                  }
                                  direction="rtl"
                                  unicodeBidi="isolate"
                                  className={cn(
                                    "text-[4px] font-black tracking-tight transition-all",
                                    isSelected
                                      ? "fill-foreground"
                                      : "fill-muted-foreground/50",
                                  )}
                                >
                                  {s.status_name}
                                </text>
                                <text
                                  x={lx}
                                  y={ly + 4.5}
                                  textAnchor={
                                    angle > 140
                                      ? "end"
                                      : angle < 40
                                        ? "start"
                                        : "middle"
                                  }
                                  direction="rtl"
                                  unicodeBidi="isolate"
                                  className={cn(
                                    "text-[5px] font-black tabular-nums transition-all",
                                    isSelected
                                      ? "fill-foreground"
                                      : "fill-muted-foreground/80",
                                  )}
                                >
                                  {s.count}
                                </text>
                              </motion.g>
                            </g>
                          );
                        });
                      })()}

                      <circle
                        cx="80"
                        cy="70"
                        r="1"
                        className="fill-foreground/10"
                      />
                    </svg>

                    {/* Central Focus Display & Progress Integrated */}
                    <div
                      className="absolute top-[48%] flex flex-col items-center select-none"
                      onClick={() => setSelectedStatusId("all")}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedStatusId}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex flex-col items-center"
                        >
                          <span className="text-[34px] font-black text-foreground tracking-tighter tabular-nums leading-none">
                            {selectedStatusId === "all"
                              ? activeEmployees.length
                              : (mobileGaugeStats.find(
                                  (s) =>
                                    s.status_id.toString() === selectedStatusId,
                                )?.count ?? 0)}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mt-1">
                            {selectedStatusId === "all"
                              ? 'סה"כ מדווחים'
                              : "נוכחות בסטטוס"}
                          </span>
                        </motion.div>
                      </AnimatePresence>

                      {/* Compact Progress Bar - Now inside the Gauge Area */}
                      <div className="w-32 mt-5">
                        <div className="flex items-center justify-between text-[7px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">
                          <span>דיווח יחידתי</span>
                          <span className="text-primary/60">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden border border-border/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className="h-full bg-primary/80"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reset Control - Tightened spacing */}
                  {selectedStatusId !== "all" && (
                    <button
                      onClick={() => setSelectedStatusId("all")}
                      className="mt-4 text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-[0.2em] transition-colors"
                    >
                      לביטול הבחירה
                    </button>
                  )}
                </div>
              </Card>

              {!isAllReported ? (
                <div className="hidden lg:flex bg-card/40 dark:bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl lg:rounded-3xl p-4 lg:p-6 flex-row lg:flex-col items-center lg:items-start justify-between gap-4 order-1 lg:order-2 hover:border-border transition-all">
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
                        יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד
                        השעה{" "}
                        <span className="font-black text-foreground">
                          09:00
                        </span>
                      </p>
                      <p className="lg:hidden text-[10px] text-muted-foreground font-medium">
                        השלמה עד{" "}
                        <span className="font-black text-foreground">
                          09:00
                        </span>
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
                    placeholder="חיפוש שם או מ.א..."
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
                      placeholder="שם שוטר או שם משתמש..."
                      className="h-11 pr-11 bg-muted/50 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-sm font-bold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Department Filter - Only for Admins or those without a fixed Dept */}
                {(user?.is_admin || !user?.department_id) && (
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
                      disabled={
                        !!(user && !user.is_admin && user.department_id)
                      }
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
                )}

                {/* Section Filter - Only for Admins or those without a fixed Section */}
                {(user?.is_admin || !user?.section_id) && (
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
                )}

                {/* Team Filter - Only for Admins or those without a fixed Team */}
                {(user?.is_admin || !user?.team_id) && (
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
                )}

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
                    localStorage.removeItem("attendance_filters");
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
                  <span className="hidden lg:inline text-xs font-bold">
                    נקה
                  </span>
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
                    {(user?.is_admin || !user?.department_id) && (
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
                          disabled={
                            !!(user && !user.is_admin && user.department_id)
                          }
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
                    )}

                    {(user?.is_admin || !user?.section_id) && (
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
                          disabled={
                            !selectedDeptId ||
                            selectedDeptId === "all" ||
                            !!(user && !user.is_admin && user.section_id)
                          }
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
                    )}

                    {(user?.is_admin || !user?.team_id) && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground">
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
                    )}

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
                        localStorage.removeItem("attendance_filters");
                        setSelectedStatusId("all");
                        setSelectedServiceTypeId("all");
                        if (!user || user.is_admin || !user.department_id)
                          setSelectedDeptId("all");
                        if (!user || user.is_admin || !user.section_id)
                          setSelectedSectionId("all");
                        if (!user || user.is_admin || !user.team_id)
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
                        const isUpdatedToday = isReportedOnDate(
                          emp,
                          selectedDate,
                        );
                        const isSelected = selectedEmployeeIds.includes(emp.id);

                        return (
                          <TableRow
                            key={emp.id}
                            data-state={isSelected ? "selected" : "unchecked"}
                            className={cn(
                              "group/row transition-all border-b border-border/40",
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
                                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm group-hover/row:scale-110 transition-all shrink-0",
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
                                    #{emp.username}
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
                                          {emp.team_name &&
                                          emp.team_name !== "מטה"
                                            ? cleanUnitName(emp.team_name)
                                            : cleanUnitName(
                                                emp.section_name || "",
                                              )}
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
                            selectedEmployeeIds.length !==
                              filteredEmployees.length,
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
                          selectedEmployeeIds.length ===
                            filteredEmployees.length
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
                          "group bg-card/60 backdrop-blur-xl rounded-[24px] border  overflow-hidden transition-all active:scale-[0.98]",
                          isSelected
                            ? "bg-primary/10 border-primary "
                            : "border-border/40",
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
                                  <EmployeeLink
                                    employee={emp}
                                    className="text-[15px] font-black text-foreground truncate text-right justify-start p-0 h-auto hover:no-underline"
                                  />
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-muted-foreground font-black tracking-widest">
                                      {emp.username}
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
                                            ].some((s) =>
                                              statusName.includes(s),
                                            );

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
              selectedDate={selectedDate}
              isReportedCheck={isReportedOnDate}
            />
            <ExportReportDialog
              open={exportDialogOpen}
              onOpenChange={setExportDialogOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
