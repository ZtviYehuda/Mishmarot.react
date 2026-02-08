import { useState, useEffect, useMemo } from "react";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { WhatsAppReportDialog } from "@/components/dashboard/WhatsAppReportDialog";
import { DashboardStatusTable } from "@/components/dashboard/DashboardStatusTable";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useDateContext } from "@/context/DateContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
} from "@/components/employees/modals";
import { CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee.types";

interface Team {
  id: number;
  name: string;
  section_id: number;
}
interface Section {
  id: number;
  name: string;
  department_id: number;
  teams: Team[];
}
interface Department {
  id: number;
  name: string;
  sections: Section[];
}

import { DateHeader } from "@/components/common/DateHeader";

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { selectedDate } = useDateContext();
  const {
    employees, // Get employees from hook
    getStructure,
    getDashboardStats,
    getComparisonStats,
    getTrendStats,
    getServiceTypes,
    fetchEmployees,
  } = useEmployees();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);

  // Filter Modal State
  const [filterOpen, setFilterOpen] = useState(false);

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [trendRange, setTrendRange] = useState(7);
  const [comparisonRange, setComparisonRange] = useState(1);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [missingReportIds, setMissingReportIds] = useState<number[]>([]);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);

  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserEmp, setCurrentUserEmp] = useState<Employee | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedSelfEmp, setSelectedSelfEmp] = useState<Employee | null>(null);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedStatusData, setSelectedStatusData] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(
    [],
  );

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("dashboard_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.deptId) setSelectedDeptId(filters.deptId);
        if (filters.sectionId) setSelectedSectionId(filters.sectionId);
        if (filters.teamId) setSelectedTeamId(filters.teamId);
        if (filters.statusData) setSelectedStatusData(filters.statusData);
        if (filters.serviceTypes) setSelectedServiceTypes(filters.serviceTypes);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save filters to localStorage when they change
  useEffect(() => {
    if (!isInitialized) return; // Wait until loaded

    const filters = {
      deptId: selectedDeptId,
      sectionId: selectedSectionId,
      teamId: selectedTeamId,
      statusData: selectedStatusData,
      serviceTypes: selectedServiceTypes,
    };
    localStorage.setItem("dashboard_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData,
    selectedServiceTypes,
  ]);

  // Initialize filters based on user permissions (only if no saved filters AND initialized)
  useEffect(() => {
    if (!isInitialized) return;
    const savedFilters = localStorage.getItem("dashboard_filters");

    // Check if saved filters are effectively empty
    const hasSavedData =
      savedFilters &&
      (() => {
        try {
          const f = JSON.parse(savedFilters);
          return (
            f.deptId ||
            f.sectionId ||
            f.teamId ||
            f.statusData ||
            (f.serviceTypes && f.serviceTypes.length > 0)
          );
        } catch (e) {
          return false;
        }
      })();

    if (hasSavedData) return;

    if (user && !user.is_admin) {
      if (user.commands_department_id) {
        setSelectedDeptId(user.commands_department_id.toString());
      } else if (user.commands_section_id) {
        if (user.assigned_department_id)
          setSelectedDeptId(user.assigned_department_id.toString());
        setSelectedSectionId(user.commands_section_id.toString());
      } else if (user.commands_team_id) {
        if (user.assigned_department_id)
          setSelectedDeptId(user.assigned_department_id.toString());
        if (user.assigned_section_id)
          setSelectedSectionId(user.assigned_section_id.toString());
        setSelectedTeamId(user.commands_team_id.toString());
      }
    }
  }, [user, isInitialized]);

  // Fetch Structure and Service Types
  useEffect(() => {
    const fetchSelects = async () => {
      const structData = await getStructure();
      if (structData) setStructure(structData);

      const srvData = await getServiceTypes();
      if (srvData) setServiceTypes(srvData);
    };
    fetchSelects();
  }, [getStructure, getServiceTypes]);

  // Fetch current user separately since they are excluded from lists
  const { getEmployeeById } = useEmployees();
  useEffect(() => {
    if (user) {
      getEmployeeById(user.id).then(setCurrentUserEmp);
    }
  }, [user, getEmployeeById]);

  // Fetch Comparison Stats
  useEffect(() => {
    const fetchComparison = async () => {
      setLoadingExtras(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const compData = await getComparisonStats(formattedDate, comparisonRange);
      setComparisonStats(compData);
      setLoadingExtras(false);
    };
    fetchComparison();
  }, [getComparisonStats, selectedDate, comparisonRange]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      setLoadingTrend(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const trendData = await getTrendStats(trendRange, formattedDate);
      setTrendStats(trendData);
      setLoadingTrend(false);
    };
    fetchTrend();
  }, [getTrendStats, selectedDate, trendRange]);

  // Fetch active statuses
  useEffect(() => {
    const fetchActiveStatuses = async () => {
      const data = await getDashboardStats({
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        team_id: selectedTeamId,
        date: format(selectedDate, "yyyy-MM-dd"),
      });

      if (data && data.stats) {
        setAllStatuses(data.stats.filter((s: any) => s.status_id !== null));
      }
    };

    fetchActiveStatuses();
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedServiceTypes,
    getDashboardStats,
    selectedDate,
  ]);

  // Sync main employees list for the unit (used by Bulk Update, etc.)
  useEffect(() => {
    fetchEmployees(
      undefined,
      selectedDeptId ? parseInt(selectedDeptId) : undefined,
      undefined,
      undefined,
      selectedSectionId ? parseInt(selectedSectionId) : undefined,
      selectedTeamId ? parseInt(selectedTeamId) : undefined,
      format(selectedDate, "yyyy-MM-dd"),
      selectedServiceTypes,
    );
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedDate,
    selectedServiceTypes,
    fetchEmployees,
  ]);

  // Fetch Stats for the chart and table
  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      const data = await getDashboardStats({
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        team_id: selectedTeamId,
        status_id: selectedStatusData?.id?.toString(),
        date: format(selectedDate, "yyyy-MM-dd"),
        serviceTypes: selectedServiceTypes.join(","),
      });

      if (data) {
        setStats(data.stats || []);
        setBirthdays(data.birthdays || []);
      }
      setLoading(false);
    };

    fetchStatsData();
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
    getDashboardStats,
    selectedDate,
  ]);

  const handleFilterChange = (
    type:
      | "department"
      | "section"
      | "team"
      | "status"
      | "serviceType"
      | "reset",
    value?: any,
  ) => {
    if (type === "reset") {
      localStorage.removeItem("dashboard_filters");
      if (user?.is_admin) {
        setSelectedDeptId("");
        setSelectedSectionId("");
        setSelectedTeamId("");
      } else if (user?.commands_department_id) {
        setSelectedSectionId("");
        setSelectedTeamId("");
      } else if (user?.commands_section_id) {
        setSelectedTeamId("");
      }
      setSelectedStatusData(null);
      setSelectedServiceTypes([]);
      return;
    }

    if (type === "serviceType") {
      setSelectedServiceTypes(value || []);
    } else if (type === "department") {
      setSelectedDeptId(value || "");
      setSelectedSectionId("");
      setSelectedTeamId("");
    } else if (type === "section") {
      setSelectedSectionId(value || "");
      setSelectedTeamId("");
    } else if (type === "team") {
      setSelectedTeamId(value || "");
    } else if (type === "status") {
      const status = allStatuses.find((s) => s.status_id.toString() === value);
      if (status) {
        setSelectedStatusData({
          id: status.status_id,
          name: status.status_name,
          color: status.color,
        });
      } else {
        setSelectedStatusData(null);
      }
    }
  };

  const isReportedToday =
    currentUserEmp?.last_status_update &&
    new Date(currentUserEmp.last_status_update).toDateString() ===
      selectedDate.toDateString();

  // Comparison Matrix: Admin, Dept Commander, Section Commander (Hide for Team Commander)
  const showComparisonMatrix = useMemo(() => {
    if (user?.is_admin) return true;
    if (user?.commands_department_id) return true;
    if (user?.commands_section_id) return true;
    return false;
  }, [user]);

  // Trend Graph: Admin, Dept, Section, and Team Commanders
  const showTrendGraph = useMemo(() => {
    if (user?.is_admin) return true;
    if (user?.commands_department_id) return true;
    if (user?.commands_section_id) return true;
    if (user?.commands_team_id) return true;
    return false;
  }, [user]);

  const handleOpenSelfReport = () => {
    if (currentUserEmp) {
      setSelectedSelfEmp(currentUserEmp);
      setStatusModalOpen(true);
    } else {
      toast.error("לא ניתן לטעון את פרטי השוטר לדיווח");
    }
  };

  const refreshSelfStatus = async () => {
    if (user) {
      const me = await getEmployeeById(user.id);
      setCurrentUserEmp(me);
    }
  };

  const currentDept = structure.find((d) => d.id.toString() === selectedDeptId);
  const currentSection = currentDept?.sections.find(
    (s) => s.id.toString() === selectedSectionId,
  );
  const currentTeam = currentSection?.teams.find(
    (t) => t.id.toString() === selectedTeamId,
  );

  const unitName =
    currentTeam?.name ||
    currentSection?.name ||
    currentDept?.name ||
    "כלל היחידה";

  const serviceTypeLabel =
    selectedServiceTypes.length > 0
      ? selectedServiceTypes.length === 1
        ? selectedServiceTypes[0]
        : `${selectedServiceTypes.length} מעמדות`
      : "";

  const chartTitle = useMemo(() => {
    let title = unitName;

    if (selectedStatusData) {
      title = `${selectedStatusData.name} | ${title}`;
    }

    if (serviceTypeLabel) {
      title = `${serviceTypeLabel} | ${title}`;
    }

    if (title === "כלל היחידה") return "נתוני כלל היחידה";
    return title;
  }, [unitName, selectedStatusData, serviceTypeLabel]);

  const chartDescription = useMemo(() => {
    const filters: string[] = [];
    if (selectedStatusData) filters.push(`בסטטוס ${selectedStatusData.name}`);
    if (serviceTypeLabel) filters.push(`ב - ${serviceTypeLabel}`);

    const filterText =
      filters.length > 0 ? `\nמציג שוטרים ${filters.join(" ו")}` : "";
    return `פירוט נוכחות וסטטיסטיקה עבור ${unitName}${filterText}`;
  }, [unitName, selectedStatusData, serviceTypeLabel]);

  const hasActiveFilters =
    !!selectedDeptId ||
    !!selectedSectionId ||
    !!selectedTeamId ||
    !!selectedStatusData ||
    selectedServiceTypes.length > 0;

  const handleStatusClick = (
    statusId: number,
    statusName: string,
    color: string,
  ) => {
    if (selectedStatusData?.id === statusId) {
      setSelectedStatusData(null);
    } else {
      setSelectedStatusData({ id: statusId, name: statusName, color });
      const tableElement = document.getElementById("status-details-table");
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const canSelectDept = !!user?.is_admin;
  const canSelectSection = !!user?.is_admin || !!user?.commands_department_id;
  const canSelectTeam =
    !!user?.is_admin ||
    !!user?.commands_department_id ||
    !!user?.commands_section_id;

  return (
    <div className="w-full h-full space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="לוח בקרה מרכזי"
        subtitle="נתוני נוכחות, ימי הולדת וסטטיסטיקות כוח אדם"
        category="לוח בקרה"
        categoryLink="/"
        badge={
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full lg:w-auto">
            <DateHeader className="w-full justify-end lg:justify-start" />
            <Button
              variant={isReportedToday ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-10 rounded-xl gap-2 font-black transition-all px-4 shrink-0 shadow-sm",
                isReportedToday
                  ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-emerald-500/20"
                  : "border-primary/20 bg-primary/5 text-primary",
              )}
              onClick={handleOpenSelfReport}
            >
              {isReportedToday ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-xs">דיווח עצמי</span>
            </Button>
          </div>
        }
      />

      <CriticalAlerts
        onOpenBulkUpdate={(missingIds) => {
          setMissingReportIds(missingIds);
          setIsBulkUpdateOpen(true);
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-start">
        {/* Main Section - Takes 2 columns on desktop */}
        <div className="xl:col-span-2 space-y-6">
          {/* Top Row: Filters & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Filter Column (Desktop Only) */}
            <div className="hidden lg:flex flex-col">
              <DashboardFilters
                structure={structure}
                statuses={allStatuses}
                selectedDeptId={selectedDeptId}
                selectedSectionId={selectedSectionId}
                selectedTeamId={selectedTeamId}
                selectedStatusId={selectedStatusData?.id?.toString()}
                serviceTypes={serviceTypes}
                selectedServiceTypes={selectedServiceTypes}
                onFilterChange={handleFilterChange}
                canSelectDept={canSelectDept}
                canSelectSection={canSelectSection}
                canSelectTeam={canSelectTeam}
              />
            </div>

            {/* Chart Column */}
            <div className="flex flex-col">
              <EmployeesChart
                stats={stats}
                loading={loading}
                onOpenWhatsAppReport={() => setWhatsAppDialogOpen(true)}
                onStatusClick={handleStatusClick}
                onFilterClick={() => setFilterOpen(true)}
                title={chartTitle}
                description={chartDescription}
              />
            </div>
          </div>

          {/* Mobile Only: Birthdays (Under Graph) */}
          <div className="xl:hidden">
            <BirthdaysCard birthdays={birthdays} />
          </div>

          <div id="status-details-table">
            <DashboardStatusTable
              statusId={selectedStatusData?.id || null}
              statusName={selectedStatusData?.name || ""}
              statusColor={selectedStatusData?.color || ""}
              departmentId={selectedDeptId}
              sectionId={selectedSectionId}
              teamId={selectedTeamId}
              date={format(selectedDate, "yyyy-MM-dd")}
              serviceTypes={selectedServiceTypes}
            />
          </div>

          {/* Widgets Row */}
          {(showComparisonMatrix || showTrendGraph) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showComparisonMatrix && (
                <StatsComparisonCard
                  data={comparisonStats}
                  loading={loadingExtras}
                  days={comparisonRange}
                  onDaysChange={setComparisonRange}
                  onShare={() => setWhatsAppDialogOpen(true)}
                />
              )}
              {showTrendGraph && (
                <AttendanceTrendCard
                  data={trendStats}
                  loading={loadingTrend}
                  range={trendRange}
                  onRangeChange={setTrendRange}
                  onOpenReport={() => setWhatsAppDialogOpen(true)}
                  className={!showComparisonMatrix ? "md:col-span-2" : ""}
                />
              )}
            </div>
          )}
        </div>

        {/* Desktop Only: Birthdays (Side Column) */}
        <div className="hidden xl:block xl:col-span-1">
          <BirthdaysCard birthdays={birthdays} />
        </div>
      </div>

      <WhatsAppReportDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
        currentStats={stats}
        unitName={unitName}
        isFiltered={hasActiveFilters}
      />

      {/* Mobile Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[340px] w-full mx-auto">
          <DashboardFilters
            structure={structure}
            statuses={allStatuses}
            selectedDeptId={selectedDeptId}
            selectedSectionId={selectedSectionId}
            selectedTeamId={selectedTeamId}
            selectedStatusId={selectedStatusData?.id?.toString()}
            serviceTypes={serviceTypes}
            selectedServiceTypes={selectedServiceTypes}
            onFilterChange={handleFilterChange}
            canSelectDept={canSelectDept}
            canSelectSection={canSelectSection}
            canSelectTeam={canSelectTeam}
            isMobile={true}
          />
        </DialogContent>
      </Dialog>

      <BulkStatusUpdateModal
        open={isBulkUpdateOpen}
        onOpenChange={setIsBulkUpdateOpen}
        employees={employees}
        initialSelectedIds={missingReportIds}
        onSuccess={() => {
          // efficient refresh?
          window.location.reload();
        }}
        // The modal logic requires `employees` array to function.
        // I need to fetch the specific missing employees to pass them.
      />

      {selectedSelfEmp && (
        <StatusUpdateModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          employee={selectedSelfEmp}
          onSuccess={() => {
            refreshSelfStatus();
            // Also refresh stats since report changed
            getDashboardStats({
              department_id: selectedDeptId,
              section_id: selectedSectionId,
              team_id: selectedTeamId,
              date: format(selectedDate, "yyyy-MM-dd"),
            }).then((data) => {
              if (data) {
                setStats(data.stats || []);
              }
            });
          }}
        />
      )}
    </div>
  );
}
