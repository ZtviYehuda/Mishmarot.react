import { useRef, useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
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
import { format, subDays, isBefore } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgeDistributionChart } from "@/components/dashboard/AgeDistributionChart";
import { Badge } from "@/components/ui/badge";
import { ReportHub } from "@/components/dashboard/ReportHub";
import { DateHeader } from "@/components/common/DateHeader";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";

// Helper types for structure
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

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { selectedDate } = useDateContext();

  // Refs for reports
  const snapshotRef = useRef<any>(null);
  const trendRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const birthdaysRef = useRef<any>(null);
  const {
    getStructure,
    getDashboardStats,
    getComparisonStats,
    getTrendStats,
    getServiceTypes,
    getStatusTypes,
  } = useEmployees();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [allStatusTypes, setAllStatusTypes] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);

  // Filter Modal State
  const [filterOpen, setFilterOpen] = useState(false);

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [averageAge, setAverageAge] = useState(0);

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
  const [hasArchiveAccess, setHasArchiveAccess] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  const isOldDate = useMemo(() => {
    return isBefore(selectedDate, subDays(new Date(), 30));
  }, [selectedDate]);

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
  const [selectedAgeRange, setSelectedAgeRange] = useState<{
    min?: number;
    max?: number;
  }>({});

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
        if (filters.ageRange) setSelectedAgeRange(filters.ageRange);
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
      ageRange: selectedAgeRange,
    };
    localStorage.setItem("dashboard_filters", JSON.stringify(filters));
  }, [
    isInitialized,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
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

  // Fetch Structure  // Initial Load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const [struct, stTypes, svTypes] = await Promise.all([
        getStructure(),
        getStatusTypes(),
        getServiceTypes(),
      ]);
      setStructure(struct);
      setAllStatusTypes(stTypes);
      setServiceTypes(svTypes);
      setIsInitialized(true);
      setLoading(false);
    };
    init();
  }, [getStructure, getStatusTypes, getServiceTypes]);

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
          status_id: selectedStatusData?.id?.toString(),
          serviceTypes: selectedServiceTypes.join(","),
          min_age: selectedAgeRange.min,
          max_age: selectedAgeRange.max,
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
    selectedAgeRange,
  ]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      setLoadingTrend(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const trendData = await getTrendStats(trendRange, formattedDate, {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        status_id: selectedStatusData?.id?.toString(),
        serviceTypes: selectedServiceTypes.join(","),
        min_age: selectedAgeRange.min,
        max_age: selectedAgeRange.max,
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
    selectedAgeRange,
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

  // Fetch birthdays and unverified count - ALWAYS get full breakdown for the selected group
  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      // We don't pass status_id here so we always have the full context for percentages
      const data = await getDashboardStats({
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        team_id: selectedTeamId,
        date: format(selectedDate, "yyyy-MM-dd"),
        serviceTypes: selectedServiceTypes.join(","),
        min_age: selectedAgeRange.min,
        max_age: selectedAgeRange.max,
      });

      if (data) {
        setStats(data.stats || []);
        setTotalEmployees(data.total_employees || 0);
        setBirthdays(data.birthdays || []);
        setAgeDistribution(data.age_distribution || []);
        setAverageAge(data.average_age || 0);
        setHasArchiveAccess(data.has_archive_access || false);
      }
      setLoading(false);
    };

    fetchStatsData();
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedServiceTypes,
    selectedAgeRange,
    getDashboardStats,
    selectedDate,
  ]);

  // Derived stats for the chart (Client-side drilling)
  const chartStats = useMemo(() => {
    if (selectedStatusData) {
      return stats.filter((s) => s.status_id === selectedStatusData.id);
    }
    return stats;
  }, [stats, selectedStatusData]);

  // totalUnitCount: sum of all stats (= totalEmployees from server); used as baseline for % calcs
  const totalUnitCount = useMemo(() => {
    // Prefer server-provided total for accuracy, fallback to summing stats
    if (totalEmployees > 0) return totalEmployees;
    return stats.reduce((acc, curr) => acc + curr.count, 0);
  }, [stats, totalEmployees]);

  const kpiData = useMemo(() => {
    const total = totalUnitCount;
    const missing = stats.find((s) => s.status_name === "לא דווח")?.count || 0;
    const reported = total - missing;
    const reportedPct = total > 0 ? Math.round((reported / total) * 100) : 0;

    // "Available" (נוכחים/זמינים) dynamically pulls from the is_presence flag of the status
    const presentStatusIds = allStatusTypes
      .filter((s) => s.is_presence)   // <- now uses the DB flag we corrected
      .map((s) => s.id);

    const available = stats
      .filter(
        (s) => s.status_id !== null && presentStatusIds.includes(s.status_id),
      )
      .reduce((acc, curr) => acc + curr.count, 0);

    return {
      total,
      missing,
      reported,
      reportedPct,
      available: available || reported,
    };
  }, [totalUnitCount, stats, allStatusTypes]);

  const handleFilterChange = (
    type:
      | "department"
      | "section"
      | "team"
      | "status"
      | "serviceType"
      | "ageRange"
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
      setSelectedAgeRange({});
      setFilterOpen(false);
      return;
    }

    if (type === "ageRange") {
      if (!value || value === "all") {
        setSelectedAgeRange({});
      } else {
        const [min, max] = value
          .split("-")
          .map((v: string) => (v === "+" ? undefined : parseInt(v)));
        setSelectedAgeRange({
          min,
          max: max || (value.endsWith("+") ? undefined : min),
        });
        // Special case for ranges like 50+
        if (value === "50+") {
          setSelectedAgeRange({ min: 50 });
        } else if (value.includes("-")) {
          const parts = value.split("-");
          setSelectedAgeRange({
            min: parseInt(parts[0]),
            max: parseInt(parts[1]),
          });
        }
      }
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
      // Look up status in both active stats and all possible types
      const statusType = allStatusTypes.find((s) => s.id.toString() === value);
      const activeStatus = allStatuses.find(
        (s) => s.status_id.toString() === value,
      );

      if (statusType) {
        setSelectedStatusData({
          id: statusType.id,
          name: statusType.name,
          color: statusType.color || activeStatus?.color || "#94a3b8",
        });
      } else if (activeStatus) {
        setSelectedStatusData({
          id: activeStatus.status_id,
          name: activeStatus.status_name,
          color: activeStatus.color,
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

    if (selectedAgeRange.min || selectedAgeRange.max) {
      const ageLabel = selectedAgeRange.min
        ? selectedAgeRange.max
          ? `גילאי ${selectedAgeRange.min}-${selectedAgeRange.max}`
          : `גילאי ${selectedAgeRange.min}+`
        : "";
      if (ageLabel) title = `${ageLabel} | ${title}`;
    }

    if (
      title === "כלל היחידה" ||
      title === "כלל החוליה" ||
      title === "כלל המדור" ||
      title === "כלל המחלקה"
    )
      return `נתוני ${title}`;
    return title;
  }, [unitName, selectedStatusData, serviceTypeLabel, selectedAgeRange]);

  const chartDescription = useMemo(() => {
    const filters: string[] = [];
    if (selectedStatusData) filters.push(`בסטטוס ${selectedStatusData.name}`);
    if (serviceTypeLabel) filters.push(`ב - ${serviceTypeLabel}`);
    if (selectedAgeRange.min || selectedAgeRange.max) {
      filters.push(
        selectedAgeRange.max
          ? `בגילאי ${selectedAgeRange.min}-${selectedAgeRange.max}`
          : `בגילאי ${selectedAgeRange.min}+`,
      );
    }

    const filterText =
      filters.length > 0 ? `\nמציג שוטרים ${filters.join(" ו")}` : "";
    return `פירוט נוכחות וסטטיסטיקה עבור ${unitName}${filterText}`;
  }, [unitName, selectedStatusData, serviceTypeLabel, selectedAgeRange]);

  const activeFilterInfo = useMemo(() => {
    const filters = [
      !!selectedStatusData,
      selectedServiceTypes.length > 0,
      !!selectedAgeRange.min || !!selectedAgeRange.max,
    ];

    // For admins, any org filter is "active"
    if (user?.is_admin) {
      filters.push(!!selectedDeptId, !!selectedSectionId, !!selectedTeamId);
    } else {
      // For commanders, only count org filters if they go BEYOND their default view
      if (user?.commands_department_id) {
        filters.push(!!selectedSectionId, !!selectedTeamId);
      } else if (user?.commands_section_id) {
        filters.push(!!selectedTeamId);
      } else if (user?.commands_team_id) {
        // Team commanders are already at the lowest level
      } else {
        // Regular users/others
        filters.push(!!selectedDeptId, !!selectedSectionId, !!selectedTeamId);
      }
    }

    return {
      hasActive: filters.some(Boolean),
      count: filters.filter(Boolean).length
    };
  }, [
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
    user
  ]);

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
    <div
      className="w-full relative min-h-screen pb-10 bg-background"
      dir="rtl"
    >
      <div className="relative z-10 space-y-4 sm:space-y-6 pt-6 transition-all">
        {/* Header Section */}
        <PageHeader
          icon={LayoutDashboard}
          title="לוח בקרה"
          hideMobile={true}
          className="flex mb-0 px-0 pb-2 shrink-0 transition-all border-none"
          badge={
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-6 w-full lg:w-auto mt-2 lg:mt-0">
              {isOldDate && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-black px-3 py-1 rounded-lg">
                  {hasArchiveAccess ? "נתונים משוחזרים" : "נתוני ארכיון"}
                </Badge>
              )}
              {/* Hide double Date Selector on mobile */}
              <div className="hidden lg:flex">
                <DateHeader className="w-auto shadow-none" compact={true} />
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-2 lg:gap-4 w-full lg:w-auto overflow-x-auto no-scrollbar py-2">
                {/* Filters button - hidden on mobile since the chart has a filter button */}
                <div className="hidden lg:block lg:flex-none">
                  <DashboardFilters
                    structure={structure}
                    statuses={allStatuses}
                    allStatusTypes={allStatusTypes}
                    selectedDeptId={selectedDeptId}
                    selectedSectionId={selectedSectionId}
                    selectedTeamId={selectedTeamId}
                    selectedStatusId={selectedStatusData?.id?.toString()}
                    serviceTypes={serviceTypes}
                    selectedServiceTypes={selectedServiceTypes}
                    selectedAgeRange={selectedAgeRange}
                    onFilterChange={handleFilterChange}
                    canSelectDept={canSelectDept}
                    canSelectSection={canSelectSection}
                    canSelectTeam={canSelectTeam}
                    hasActiveFiltersExternal={activeFilterInfo.hasActive}
                    activeFilterCountExternal={activeFilterInfo.count}
                    user={user}
                    isMobile={false}
                  />
                </div>

                {/* Report Hub button */}
                {!user?.is_temp_commander && (
                  <div className="w-full lg:w-auto">
                    <ReportHub
                      className="w-full lg:w-auto h-10 rounded-xl border border-border/40 bg-card/40 backdrop-blur-xl text-primary hover:bg-primary/5 gap-2 font-black px-4 transition-all text-xs shadow-none"
                      onShareBirthdays={() => birthdaysRef.current?.share()}
                      initialViewMode={viewMode}
                      initialDate={selectedDate}
                      filters={{
                        department_id: selectedDeptId?.toString() || "",
                        section_id: selectedSectionId?.toString() || "",
                        team_id: selectedTeamId?.toString() || "",
                        serviceTypes: selectedServiceTypes,
                        unitName: unitName,
                        statusName: selectedStatusData?.name,
                        status_id: selectedStatusData?.id?.toString(),
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          }
        />

        {/* Content Area */}
        <div className="space-y-10 sm:space-y-14 transition-all mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Main Attendance Chart */}
            <div className="flex flex-col h-full min-h-[400px]">
              <EmployeesChart
                ref={snapshotRef}
                stats={chartStats}
                totalInUnit={totalUnitCount}
                availableCount={kpiData.available}
                reportedPct={kpiData.reportedPct}
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
                unitName={unitName}
                hasArchiveAccess={hasArchiveAccess}
                onRequestRestore={() => setRestoreDialogOpen(true)}
              />
            </div>

            {/* Right Sidebar: Birthdays & Age Distrib */}
            <div className="flex flex-col gap-4 sm:gap-6 h-full">
              <div className="flex flex-col flex-1 h-full">
                <BirthdaysCard ref={birthdaysRef} birthdays={birthdays} />
              </div>

              {ageDistribution && ageDistribution.length > 0 && (
                <div className="w-full">
                  <AgeDistributionChart
                    data={ageDistribution}
                    averageAge={averageAge}
                    onRangeSelect={(range) => handleFilterChange("ageRange", range)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Wider Comparison & Trend Charts - HIDDEN FOR TEMP COMMANDERS */}
          {!user?.is_temp_commander &&
            (showComparisonMatrix || showTrendGraph) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                {showComparisonMatrix && (
                  <div className="order-2 md:order-1 flex flex-col w-full">
                    <StatsComparisonCard
                      ref={comparisonRef}
                      data={comparisonStats}
                      loading={loadingExtras}
                      days={comparisonRange}
                      unitName={unitName}
                      subtitle={chartDescription}
                      selectedDate={selectedDate}
                    />
                  </div>
                )}
                {showTrendGraph && (
                  <div 
                    id="trend-section" 
                    className={cn(!showComparisonMatrix ? "md:col-span-2" : "", "order-1 md:order-2 flex flex-col w-full")}
                  >
                    <AttendanceTrendCard
                      ref={trendRef}
                      data={trendStats}
                      loading={loadingTrend}
                      range={trendRange}
                      unitName={unitName}
                      subtitle={chartDescription}
                      selectedDate={selectedDate}
                    />
                  </div>
                )}
              </div>
            )}


          {/* Middle Section: Status Details Table (Full Width) */}
          {!user?.is_temp_commander && (
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
          )}
        </div>

        <WhatsAppReportDialog
          open={whatsAppDialogOpen}
          onOpenChange={setWhatsAppDialogOpen}
          currentStats={stats}
          unitName={unitName}
          isFiltered={activeFilterInfo.hasActive}
        />

        <RestorationRequestDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          targetDate={selectedDate}
        />

        {/* Mobile Filter Dialog */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="p-0 border-none bg-transparent max-w-[340px] w-full mx-auto">
            <DashboardFilters
              structure={structure}
              statuses={allStatuses}
              allStatusTypes={allStatusTypes}
              selectedDeptId={selectedDeptId}
              selectedSectionId={selectedSectionId}
              selectedTeamId={selectedTeamId}
              selectedStatusId={selectedStatusData?.id?.toString()}
              serviceTypes={serviceTypes}
              selectedServiceTypes={selectedServiceTypes}
              selectedAgeRange={selectedAgeRange}
              onFilterChange={handleFilterChange}
              canSelectDept={canSelectDept}
              canSelectSection={canSelectSection}
              canSelectTeam={canSelectTeam}
              hasActiveFiltersExternal={activeFilterInfo.hasActive}
              activeFilterCountExternal={activeFilterInfo.count}
              user={user}
              isMobile={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div >
  );
}
