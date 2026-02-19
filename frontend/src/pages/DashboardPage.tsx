import { useRef, useState, useEffect, useMemo } from "react";
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

import { ReportHub } from "@/components/dashboard/ReportHub";

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

  // Refs for reports
  const snapshotRef = useRef<any>(null);
  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const birthdaysRef = useRef<any>(null);
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
  // const [stats, setStats] = useState<any[]>([]); // Removed in favor of computedStats
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);

  // Filter Modal State
  const [filterOpen, setFilterOpen] = useState(false);

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);

  const [viewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "weekly",
  );

  const trendRange = useMemo(() => {
    switch (viewMode) {
      case "daily":
        return 7;
      case "weekly":
        return 7;
      case "monthly":
        return 30;
      case "yearly":
        return 365;
      default:
        return 7;
    }
  }, [viewMode]);

  const comparisonRange = useMemo(() => {
    switch (viewMode) {
      case "daily":
        return 1;
      case "weekly":
        return 7;
      case "monthly":
        return 30;
      case "yearly":
        return 365;
      default:
        return 1;
    }
  }, [viewMode]);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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
    if (user?.is_impersonated) return; // Don't save filters when impersonating

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
    user?.is_impersonated,
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

  // Fetch Comparison Stats
  useEffect(() => {
    const fetchComparison = async () => {
      setLoadingExtras(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const compData = await getComparisonStats(
        formattedDate,
        comparisonRange,
        {
          department_id: selectedDeptId,
          section_id: selectedSectionId,
          team_id: selectedTeamId,
          status_id: selectedStatusData?.id?.toString(),
          serviceTypes: selectedServiceTypes.join(","),
        },
      );
      setComparisonStats(compData);
      setLoadingExtras(false);
    };
    fetchComparison();
  }, [
    getComparisonStats,
    selectedDate,
    comparisonRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
  ]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      setLoadingTrend(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const trendData = await getTrendStats(trendRange, formattedDate, {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        team_id: selectedTeamId,
        status_id: selectedStatusData?.id?.toString(),
        serviceTypes: selectedServiceTypes.join(","),
      });
      setTrendStats(trendData);
      setLoadingTrend(false);
    };
    fetchTrend();
  }, [
    getTrendStats,
    selectedDate,
    trendRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
  ]);

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

  // --- STATISTICS (Unified Logic) ---
  const isReportedOnDate = (emp: any, date: Date) => {
    if (!emp.status_id) return false;
    const isStartedOnDay =
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() === date.toDateString();
    if (isStartedOnDay) return true;
    if (emp.status_end_datetime) {
      const endDate = new Date(emp.status_end_datetime);
      endDate.setHours(23, 59, 59, 999);
      if (date <= endDate) return true;
    }
    return false;
  };

  const computedStats = useMemo(() => {
    const statusMap = new Map<
      string,
      { status_id: number; status_name: string; color: string; count: number }
    >();

    let notReportedCount = 0;

    employees.forEach((emp: any) => {
      if (isReportedOnDate(emp, selectedDate)) {
        const statusName = emp.status_name?.trim() || "ללא שם";
        const key = statusName;

        if (!statusMap.has(key)) {
          statusMap.set(key, {
            status_id: emp.status_id,
            status_name: statusName,
            color: emp.status_color || "#cbd5e1",
            count: 0,
          });
        }

        const entry = statusMap.get(key)!;
        entry.count++;
      } else {
        notReportedCount++;
      }
    });

    const results = Array.from(statusMap.values());

    // Add "Not Reported" category if there are unreported employees or if the list is empty
    if (
      notReportedCount > 0 ||
      (results.length === 0 && employees.length > 0)
    ) {
      results.push({
        status_id: 0,
        status_name: "לא דווח",
        color: "#94a3b8", // Slate-400 equivalent for neutral gray
        count: notReportedCount,
      });
    }

    results.sort((a, b) => b.count - a.count);

    if (selectedStatusData) {
      return results.filter((s) => s.status_id === selectedStatusData.id);
    }

    return results;
  }, [employees, selectedDate, selectedStatusData]);
  // -----------------------------------------------------

  // Fetch Stats (Server-side) - ONLY for Birthdays now, since we compute stats client-side
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
        // We DO NOT setStats here anymore to avoid conflicting with client-side logic
        // setStats(data.stats || []);
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

  const currentDept = structure.find((d) => d.id.toString() === selectedDeptId);
  const currentSection = currentDept?.sections.find(
    (s) => s.id.toString() === selectedSectionId,
  );
  const currentTeam = currentSection?.teams.find(
    (t) => t.id.toString() === selectedTeamId,
  );

  const unitName = useMemo(() => {
    if (selectedTeamId) return currentTeam?.name || "חוליה";
    if (selectedSectionId) return currentSection?.name || "מדור";
    if (selectedDeptId) return currentDept?.name || "מחלקה";

    if (user?.commands_team_id) return "כלל החוליה";
    if (user?.commands_section_id) return "כלל המדור";
    if (user?.commands_department_id) return "כלל המחלקה";
    return "כלל היחידה";
  }, [
    selectedTeamId,
    selectedSectionId,
    selectedDeptId,
    currentTeam,
    currentSection,
    currentDept,
    user,
  ]);

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

    if (
      title === "כלל היחידה" ||
      title === "כלל החוליה" ||
      title === "כלל המדור" ||
      title === "כלל המחלקה"
    )
      return `נתוני ${title}`;
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

  const currentUnitName = useMemo(() => {
    if (selectedTeamId) {
      for (const dept of structure) {
        for (const sec of dept.sections) {
          const team = sec.teams.find((t) => t.id === Number(selectedTeamId));
          if (team) return team.name;
        }
      }
    }
    if (selectedSectionId) {
      for (const dept of structure) {
        const sec = dept.sections.find(
          (s) => s.id === Number(selectedSectionId),
        );
        if (sec) return sec.name;
      }
    }
    if (selectedDeptId) {
      const dept = structure.find((d) => d.id === Number(selectedDeptId));
      if (dept) return dept.name;
    }

    if (user?.commands_team_id) return "כלל החוליה";
    if (user?.commands_section_id) return "כלל המדור";
    if (user?.commands_department_id) return "כלל המחלקה";
    return "כלל היחידה";
  }, [selectedTeamId, selectedSectionId, selectedDeptId, structure, user]);

  return (
    <div className="w-full space-y-6" dir="rtl">
      <PageHeader
        icon={LayoutDashboard}
        title="לוח בקרה ראשי"
        subtitle="נתוני נוכחות, ימי הולדת וסטטיסטיקות כוח אדם"
        category="מערכת משמרות"
        categoryLink="/"
        badge={
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <DateHeader className="w-full sm:w-auto flex-1" />
            {!user?.is_temp_commander && (
              <ReportHub
                className="w-full sm:w-auto h-auto min-h-[44px] sm:min-h-0 rounded-xl border border-primary/10 bg-white text-primary hover:bg-primary/5 gap-2 font-black px-4 transition-all shadow-sm flex items-center justify-center"
                onShareBirthdays={() => birthdaysRef.current?.share()}
                initialViewMode={viewMode}
                initialDate={selectedDate}
                filters={{
                  department_id: selectedDeptId?.toString() || "",
                  section_id: selectedSectionId?.toString() || "",
                  team_id: selectedTeamId?.toString() || "",
                  serviceTypes: selectedServiceTypes,
                  unitName: currentUnitName,
                  statusName: selectedStatusData?.name,
                  status_id: selectedStatusData?.id?.toString(),
                }}
              />
            )}
          </div>
        }
      />

      <div className="space-y-6">
        {/* Top Section: Filters, Main Chart & Birthdays (Desktop) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {/* Filters - Always visible on desktop XL, or inside mobile dialog */}
          <div className="hidden lg:flex flex-col xl:col-span-1">
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

          {/* Main Attendance Chart */}
          <div className="flex flex-col xl:col-span-1">
            {/* Main Attendance Chart */}
            <EmployeesChart
              ref={snapshotRef}
              stats={computedStats} // Use computed stats
              loading={loading}
              onOpenWhatsAppReport={
                user?.is_temp_commander
                  ? undefined
                  : () => setWhatsAppDialogOpen(true)
              }
              onStatusClick={handleStatusClick}
              onFilterClick={
                setFilterOpen ? () => setFilterOpen(true) : undefined
              }
              title={chartTitle}
              description={chartDescription}
              selectedDate={selectedDate}
              hideExportControls={user?.is_temp_commander}
            />
          </div>

          {/* Birthdays (Desktop Version) */}
          <div className="hidden xl:flex flex-col xl:col-span-1">
            <BirthdaysCard ref={birthdaysRef} birthdays={birthdays} />
          </div>
        </div>

        {/* Mobile/Tablet Only: Birthdays (When not in top row) */}
        <div className="xl:hidden">
          <BirthdaysCard ref={birthdaysRef} birthdays={birthdays} />
        </div>

        {/* Middle Section: Status Details Table (Full Width) */}
        <div id="status-details-table" className="w-full">
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

        {/* Bottom Section: Wider Comparison & Trend Charts - HIDDEN FOR TEMP COMMANDERS */}
        {!user?.is_temp_commander &&
          (showComparisonMatrix || showTrendGraph) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
              {showComparisonMatrix && (
                <StatsComparisonCard
                  ref={comparisonRef}
                  data={comparisonStats}
                  loading={loadingExtras}
                  days={comparisonRange}
                  unitName={unitName}
                  subtitle={chartDescription}
                  selectedDate={selectedDate}
                />
              )}
              {showTrendGraph && (
                <AttendanceTrendCard
                  ref={trendRef}
                  data={trendStats}
                  loading={loadingTrend}
                  range={trendRange}
                  unitName={unitName}
                  subtitle={chartDescription}
                  selectedDate={selectedDate}
                  className={!showComparisonMatrix ? "md:col-span-2" : ""}
                />
              )}
            </div>
          )}
      </div>

      <WhatsAppReportDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
        currentStats={computedStats} // Use computed stats
        unitName={unitName}
        isFiltered={hasActiveFilters}
      />

      {/* Mobile Filter Dialog */}
      <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
        <DialogContent className="p-0 border-none bg-transparent  max-w-[340px] w-full mx-auto">
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
    </div>
  );
}
