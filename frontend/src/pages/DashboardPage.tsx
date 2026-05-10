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
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { StatCards } from "@/components/dashboard/StatCards";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgeDistributionChart } from "@/components/dashboard/AgeDistributionChart";
import { Button } from "@/components/ui/button";
import { ReportHub } from "@/components/dashboard/ReportHub";
import { RestorationRequestDialog } from "@/components/dashboard/RestorationRequestDialog";
import { WhatsAppBroadcastModal } from "@/components/employees/modals/WhatsAppBroadcastModal";
import { MessageSquare, Filter, Calendar } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { GlobalEventModal } from "@/components/employees/modals/GlobalEventModal";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  const { selectedDate, setSelectedDate } = useDateContext();

  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);

  // Auto-clear tutorial param and manage local state
  useEffect(() => {
    const tutorial = searchParams.get("tutorial");
    if (tutorial) {
      setActiveTutorial(tutorial);
      const timer = setTimeout(() => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("tutorial");
        setSearchParams(newParams, { replace: true });
        // We keep activeTutorial for a bit longer to ensure visibility
        setTimeout(() => setActiveTutorial(null), 1000);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // Refs for reports
  const snapshotRef = useRef<any>(null);
  const comparisonRef = useRef<any>(null);
  const {
    getStructure,
    getDashboardStats,
    getComparisonStats,
    getTrendStats,
    getStatusTypes,
    getServiceTypes,
  } = useEmployees();

  const [stats, setStats] = useState<any[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [allStatusTypes, setAllStatusTypes] = useState<any[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [structure, setStructure] = useState<Department[]>([]);

  // Filter Modal State
  const [filterOpen, setFilterOpen] = useState(false);

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [averageAge, setAverageAge] = useState(0);

  const [viewMode] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "weekly",
  );

  const [trendRange, setTrendRange] = useState<number>(30);

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
  const [whatsappBroadcastOpen, setWhatsappBroadcastOpen] = useState(false);
  const [globalEventOpen, setGlobalEventOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);


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
  const isOldDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  }, [selectedDate]);

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("dashboard_filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        if (filters.deptId !== undefined) setSelectedDeptId(filters.deptId);
        if (filters.sectionId !== undefined) setSelectedSectionId(filters.sectionId);
        if (filters.teamId !== undefined) setSelectedTeamId(filters.teamId);
        if (filters.statusData !== undefined) setSelectedStatusData(filters.statusData);
        if (filters.serviceTypes !== undefined) setSelectedServiceTypes(filters.serviceTypes);
        if (filters.ageRange !== undefined) setSelectedAgeRange(filters.ageRange);
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
      try {
        const [struct, stTypes, svTypes] = await Promise.all([
          getStructure(),
          getStatusTypes(),
          getServiceTypes(),
        ]);
        setStructure(struct);
        setAllStatusTypes(stTypes);
        setServiceTypes(svTypes);
      } catch (error) {
        console.error("DashboardPage init error", error);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, [getStructure, getStatusTypes, getServiceTypes]);

  // Fetch Comparison Stats
  useEffect(() => {
    const fetchComparison = async () => {
      setLoadingExtras(true);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      
      // We intentionally do NOT pass department_id, section_id, team_id here
      // so the card always shows the base "peer" list instead of drilling down
      // and replacing the clicked row with its children.
      const compData = await getComparisonStats(
        formattedDate,
        comparisonRange,
        {
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
    selectedStatusData?.id,
    selectedServiceTypes,
    selectedAgeRange,
  ]);

  // Fetch Trend Stats
  useEffect(() => {
    const fetchTrend = async () => {
      // Use today as reference for trend unless we are looking at older historical data
      // This prevents the chart from "sliding" when clicking dates within the current month
      const referenceDate = isOldDate ? selectedDate : new Date();
      const formattedDate = format(referenceDate, "yyyy-MM-dd");
      
      const trendData = await getTrendStats(trendRange, formattedDate, {
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        status_id: selectedStatusData?.id?.toString(),
        serviceTypes: selectedServiceTypes.join(","),
        min_age: selectedAgeRange.min,
        max_age: selectedAgeRange.max,
      });
      setTrendStats(trendData);
    };
    fetchTrend();
  }, [
    getTrendStats,
    isOldDate ? format(selectedDate, "yyyy-MM-dd") : "current",
    trendRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusData?.id,
    selectedServiceTypes,
    selectedAgeRange,
  ]);


  // Fetch birthdays and unverified count - ALWAYS get full breakdown for the selected group
  useEffect(() => {
    const fetchStatsData = async () => {
      try {
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
          // setBirthdays(data.birthdays || []);
          setAgeDistribution(data.age_distribution || []);
          setAverageAge(data.average_age || 0);
          // setHasArchiveAccess(data.has_archive_access || false);
        }
      } catch (error) {
        console.error("DashboardPage fetchStatsData error", error);
      }
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
    return stats;
  }, [stats]);

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
      setSelectedStatusId(null);
      setSelectedServiceTypes([]);
      setSelectedAgeRange({});
      setFilterOpen(false);
      return;
    }

    if (type === "ageRange") {
      // Logic to toggle: if clicking the same range, clear the filter
      const currentString = selectedAgeRange?.min
        ? selectedAgeRange.max
          ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
          : `${selectedAgeRange.min}+`
        : "all";

      if (value === currentString || value === "all") {
        setSelectedAgeRange({});
        return;
      }

      if (value === "50+") {
        setSelectedAgeRange({ min: 50 });
      } else if (value.includes("-")) {
        const parts = value.split("-");
        setSelectedAgeRange({
          min: parseInt(parts[0]),
          max: parseInt(parts[1]),
        });
      } else {
        setSelectedAgeRange({});
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
      // If clicking the same status, deselect it
      if (selectedStatusId === (value ? parseInt(value) : null)) {
        setSelectedStatusId(null);
        setSelectedStatusData(null);
        return;
      }

      // Look up status in both active stats and all possible types
      const statusType = allStatusTypes.find((s: any) => s.id.toString() === value?.toString());
      const activeStatus = stats.find(
        (s: any) => s.status_id?.toString() === value?.toString(),
      );

      if (statusType) {
        setSelectedStatusData({
          id: statusType.id,
          name: statusType.name,
          color: statusType.color || activeStatus?.color || "#94a3b8",
        });
        setSelectedStatusId(statusType.id);
      } else if (activeStatus) {
        setSelectedStatusData({
          id: activeStatus.status_id,
          name: activeStatus.status_name,
          color: activeStatus.color,
        });
        setSelectedStatusId(activeStatus.status_id);
      } else {
        setSelectedStatusData(null);
        setSelectedStatusId(null);
      }
    }
  };


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

  const activeFilterTags = useMemo(() => {
    const tags: string[] = [];
    if (selectedStatusData) {
      tags.push(selectedStatusData.name);
    }
    if (selectedServiceTypes.length > 0) {
      tags.push(...selectedServiceTypes);
    }
    if (selectedAgeRange.min || selectedAgeRange.max) {
      const ageText = selectedAgeRange.max
        ? `גילאי ${selectedAgeRange.min}-${selectedAgeRange.max}`
        : `גילאי ${selectedAgeRange.min}+`;
      tags.push(ageText);
    }
    
    // For admin, add org filters if selected
    if (user?.is_admin || user?.is_commander) {
        if (selectedTeamId && currentTeam) tags.push(currentTeam.name);
        else if (selectedSectionId && currentSection) tags.push(currentSection.name);
        else if (selectedDeptId && currentDept) tags.push(currentDept.name);
    }

    return tags;
  }, [
    selectedStatusData,
    selectedServiceTypes,
    selectedAgeRange,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    currentDept,
    currentSection,
    currentTeam,
    user,
  ]);

  const handleStatusClick = (
    statusId: number,
    statusName: string,
    statusColor: string,
  ) => {
    // Toggle behavior: if clicking the same status, deselect it.
    if (selectedStatusId === statusId) {
      setSelectedStatusId(null);
      setSelectedStatusData(null);
    } else {
      setSelectedStatusId(statusId);
      setSelectedStatusData({
        id: statusId,
        name: statusName,
        color: statusColor,
      });
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
      className="w-full relative min-h-screen pb-10"
      dir="rtl"
    >
      <div className="relative z-10 space-y-4 pt-6 pb-4 px-4 sm:px-6 max-w-full mx-auto transition-all">
        {/* New Header Section - Matching Screenshot */}
        <PageHeader
          icon={LayoutDashboard}
          title="לוח בקרה"
          subtitle={format(selectedDate, "EEEE, d MMMM yyyy", { locale: he })}
          className="hidden md:flex mb-0"
          badge={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterOpen(true)}
                className="lg:hidden h-9 w-9 p-0 rounded-xl bg-card/40 border border-border/40 text-primary"
              >
                <Filter className="w-3.5 h-3.5" />
              </Button>

              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-2">
                  <DashboardFilters
                    structure={structure}
                    statuses={allStatusTypes.map((s: any) => ({ status_id: s.id, status_name: s.name, color: s.color }))}
                    allStatusTypes={allStatusTypes}
                    selectedDeptId={selectedDeptId}
                    selectedSectionId={selectedSectionId}
                    selectedTeamId={selectedTeamId}
                    selectedStatusId={selectedStatusId?.toString()}
                    serviceTypes={serviceTypes}
                    selectedServiceTypes={selectedServiceTypes}
                    selectedAgeRange={selectedAgeRange}
                    onFilterChange={handleFilterChange}
                    canSelectDept={canSelectDept}
                    canSelectSection={canSelectSection}
                    canSelectTeam={canSelectTeam}
                    user={user}
                  />
                  
                  <ReportHub 
                    id="report-hub-card"
                    onShareBirthdays={() => setWhatsAppDialogOpen(true)}
                    filters={{
                      department_id: selectedDeptId,
                      section_id: selectedSectionId,
                      team_id: selectedTeamId,
                      serviceTypes: selectedServiceTypes,
                      unitName: unitName,
                      status_id: selectedStatusId?.toString()
                    }}
                    initialDate={selectedDate}
                  />
                </div>

                <Button
                  id="event-button"
                  variant="ghost"
                  onClick={() => setGlobalEventOpen(true)}
                  className={cn(
                    "h-9 rounded-xl flex-col gap-0.5 font-black transition-all px-2 sm:px-2.5 xl:px-3.5 text-primary hover:bg-primary/5 text-sm min-w-[60px] sm:min-w-[64px] py-1",
                    activeTutorial === "event" && "tutorial-highlight"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[8.5px] xl:text-[9.5px] leading-tight">אירוע</span>
                </Button>

                <Button
                  id="broadcast-button"
                  variant="ghost"
                  onClick={() => setWhatsappBroadcastOpen(true)}
                  className={cn(
                    "h-9 rounded-xl flex-col gap-0.5 font-black transition-all px-2 sm:px-2.5 xl:px-3.5 text-primary hover:bg-primary/5 text-sm min-w-[60px] sm:min-w-[64px] py-1",
                    activeTutorial === "broadcast" && "tutorial-highlight"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="text-[8.5px] xl:text-[9.5px] leading-tight text-center">רשימת תפוצה</span>
                </Button>
              </div>
            </div>
          }
        />

        {/* Mobile Quick Actions Bar - New Section */}
        <div className="grid grid-cols-4 gap-2 md:hidden mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
          <Button
            variant="ghost"
            onClick={() => setFilterOpen(true)}
            className="flex-col gap-1.5 h-20 rounded-2xl bg-card/40 border border-border/40 text-primary hover:bg-primary/5 active:scale-95 transition-all backdrop-blur-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Filter className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black">סינון</span>
          </Button>

          <ReportHub 
            id="report-hub-card-mobile"
            onShareBirthdays={() => setWhatsAppDialogOpen(true)}
            filters={{
              department_id: selectedDeptId,
              section_id: selectedSectionId,
              team_id: selectedTeamId,
              serviceTypes: selectedServiceTypes,
              unitName: unitName,
              status_id: selectedStatusId?.toString()
            }}
            initialDate={selectedDate}
            className="flex-col gap-1.5 h-20 w-full rounded-2xl bg-card/40 border border-border/40 text-primary hover:bg-primary/5 active:scale-95 transition-all backdrop-blur-xl px-0"
            // We'll update ReportHub to handle a simpler child if needed, but for now we pass className
          >
            {/* The ReportHub component uses its trigger button by default, so we pass styles via className */}
          </ReportHub>

          <Button
            id="mobile-event-button"
            variant="ghost"
            onClick={() => setGlobalEventOpen(true)}
            className={cn(
              "flex-col gap-1.5 h-20 rounded-2xl bg-card/40 border border-border/40 text-primary hover:bg-primary/5 active:scale-95 transition-all backdrop-blur-xl",
              activeTutorial === "event" && "tutorial-highlight"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black">אירוע</span>
          </Button>

          <Button
            id="mobile-broadcast-button"
            variant="ghost"
            onClick={() => setWhatsappBroadcastOpen(true)}
            className={cn(
              "flex-col gap-1.5 h-20 rounded-2xl bg-card/40 border border-border/40 text-primary hover:bg-primary/5 active:scale-95 transition-all backdrop-blur-xl",
              activeTutorial === "broadcast" && "tutorial-highlight"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black">תפוצה</span>
          </Button>
        </div>


        {/* Content Area */}
        <div className="space-y-5 transition-all mt-1 relative">

          {/* Stat Cards - New Redesigned Component */}
          <StatCards stats={stats} totalEmployees={totalEmployees} />

          {/* Middle Row - Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {/* Left/Main Area Chart - Trend */}
            <div className="md:col-span-2 xl:col-span-2">
              <AttendanceTrendCard 
                data={trendStats}
                loading={loadingExtras}
                range={trendRange}
                unitName={unitName}
                filterTags={activeFilterTags}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                onRangeChange={setTrendRange}
              />
            </div>

            {/* Middle/Secondary Donut Chart - Status Distribution */}
            <div className="md:col-span-1 xl:col-span-1">
              <EmployeesChart
                ref={snapshotRef}
                stats={chartStats}
                total={totalEmployees}
                onStatusClick={handleStatusClick}
                hasArchiveAccess={true}
                onRequestRestore={() => setRestoreDialogOpen(true)}
                unitName={unitName}
                selectedDate={selectedDate}
                selectedStatusId={selectedStatusId}
                filterTags={activeFilterTags}
                title="חלוקת סטטוסים"
              />
            </div>

            {/* Right/Third Chart - Age Distribution */}
            <div className="md:col-span-1 xl:col-span-1">
              <AgeDistributionChart
                data={ageDistribution}
                averageAge={averageAge}
                filterTags={activeFilterTags}
                onRangeSelect={(range) => handleFilterChange("ageRange", range)}
                selectedRange={
                  selectedAgeRange?.min
                    ? selectedAgeRange.max
                      ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
                      : `${selectedAgeRange.min}+`
                    : "all"
                }
              />
            </div>
          </div>

          {/* Bottom Row - Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Birthdays */}
             <BirthdaysCard 
                id="birthdays-card"
                birthdays={[]}
                loading={loadingExtras}
                unitName={unitName}
                className={cn(
                  activeTutorial === "birthdays" && "tutorial-highlight"
                )}
             />

             {/* Team Comparison */}
             <StatsComparisonCard
                ref={comparisonRef}
                data={comparisonStats}
                loading={loadingExtras}
                days={comparisonRange}
                unitName={unitName}
                selectedUnitId={
                  selectedTeamId ? parseInt(selectedTeamId) :
                  selectedSectionId ? parseInt(selectedSectionId) :
                  selectedDeptId ? parseInt(selectedDeptId) : null
                }
                onUnitClick={(unitId, level) => {
                  const isSelected = 
                    (level === 'department' && selectedDeptId === unitId.toString()) ||
                    (level === 'section' && selectedSectionId === unitId.toString()) ||
                    (level === 'team' && selectedTeamId === unitId.toString());

                  if (isSelected) {
                    handleFilterChange(level as any, ""); // Clear the filter
                  } else {
                    handleFilterChange(level as any, unitId.toString());
                  }
                }}
             />
          </div>

          {/* Status Details Table (Full Width) */}
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

        <WhatsAppBroadcastModal
          open={whatsappBroadcastOpen}
          onOpenChange={setWhatsappBroadcastOpen}
        />

        {/* Mobile Filter Dialog */}
        <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
          <DialogContent className="p-0 border-none bg-transparent max-w-[340px] w-full mx-auto">
            <DashboardFilters
              structure={structure}
              statuses={allStatusTypes.map((s: any) => ({ status_id: s.id, status_name: s.name, color: s.color }))}
              allStatusTypes={allStatusTypes}
              selectedDeptId={selectedDeptId}
              selectedSectionId={selectedSectionId}
              selectedTeamId={selectedTeamId}
              selectedStatusId={selectedStatusId?.toString()}
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
        <GlobalEventModal
          isOpen={globalEventOpen}
          onClose={() => setGlobalEventOpen(false)}
          statusTypes={allStatusTypes}
          structure={structure}
        />
      </div>
    </div>
  );
}

