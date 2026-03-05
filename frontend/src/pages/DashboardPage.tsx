import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn, cleanUnitName } from "@/lib/utils";
import { AgeDistributionChart } from "@/components/dashboard/AgeDistributionChart";

import { ReportHub } from "@/components/dashboard/ReportHub";

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

    // "Available" (נוכחים/זמינים) should include anyone whose status is a child of "Present" or "Office"
    // For simplicity, we look for names like "נוכח", "זמין", "משרד", or child names we know.
    // Better yet, we can check if the status ID corresponds to a status whose parent is "Present" or "Office".
    const presentStatusIds = allStatusTypes
      .filter((s) => {
        const name = s.name.toLowerCase();
        // Check if it's a top-level present status or a child of Office/Present
        if (
          name.includes("נוכח") ||
          name.includes("זמין") ||
          name.includes("משרד")
        )
          return true;

        // Find parent
        const parent = allStatusTypes.find((p) => p.id === s.parent_status_id);
        if (parent) {
          const pName = parent.name.toLowerCase();
          if (
            pName.includes("נוכח") ||
            pName.includes("זמין") ||
            pName.includes("משרד")
          )
            return true;
        }
        return false;
      })
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

  const hasActiveFilters =
    !!selectedDeptId ||
    !!selectedSectionId ||
    !!selectedTeamId ||
    !!selectedStatusData ||
    selectedServiceTypes.length > 0 ||
    !!selectedAgeRange.min ||
    !!selectedAgeRange.max;

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

  const handleKPIClick = (
    type: "total" | "reported" | "available" | "missing",
  ) => {
    switch (type) {
      case "total":
        setSelectedStatusData(null);
        break;
      case "missing":
        handleStatusClick(-1, "לא דווח", "#f43f5e");
        break;
      case "available":
        // Filter by common presence statuses - or just clear if ambiguous
        // For now, let's reset to show all or maybe a specific "presence" set if we had one
        setSelectedStatusData(null);
        break;
      case "reported": {
        // Scroll to trend
        const trendEl = document.getElementById("trend-section");
        if (trendEl) trendEl.scrollIntoView({ behavior: "smooth" });
        break;
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
    <div
      className="w-full relative min-h-screen px-4 md:px-8 pb-10 bg-background"
      dir="rtl"
    >
      <div className="relative z-10 space-y-4 sm:space-y-6 pt-2 transition-all">
        {/* Header Section */}
        <PageHeader
          icon={LayoutDashboard}
          title="לוח בקרה"
          subtitle="נתוני נוכחות וסטטיסטיקה"
          category="מערכת משמרות"
          categoryLink="/"
          className="hidden sm:flex mb-0 px-4 md:px-10 pb-2 shrink-0 transition-all"
          badge={
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <DateHeader className="w-full sm:w-auto flex-1" />
              {!user?.is_temp_commander && (
                <ReportHub
                  className="w-full sm:w-auto h-auto min-h-[44px] sm:min-h-0 rounded-xl border border-primary/10 bg-white text-primary hover:bg-primary/5 gap-2 font-black px-4 transition-all flex items-center justify-center shadow-sm"
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

        {/* Mobile Simplified Header */}
        <div className="sm:hidden flex flex-col px-6 pt-2 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                לוח בקרה
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {unitName}
              </p>
            </div>
            <DateHeader className="scale-90 origin-left" />
          </div>

          {!user?.is_temp_commander && (
            <ReportHub
              className="w-full h-12 rounded-2xl border border-primary/10 bg-white dark:bg-slate-900 text-primary hover:bg-primary/5 gap-2 font-black px-4 transition-all flex items-center justify-center shadow-lg shadow-primary/5"
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

        {/* Content Area */}
        <div className="space-y-10 sm:space-y-14">
          {/* Top Section: Filters */}
          <div className="hidden lg:block mb-2">
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
            />
          </div>

          {/* Global KPI Summary Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-2"
          >
            {/* Total KPI */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => handleKPIClick("total")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-visible group cursor-pointer transition-shadow hover:shadow-xl hover:shadow-primary/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-500 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                  סה"כ תקן
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-foreground tracking-tight">
                  {kpiData.total}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold mt-1">
                  לחץ להצגת הכל
                </span>
              </div>
            </motion.div>

            {/* Reported % KPI */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => handleKPIClick("reported")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-visible group cursor-pointer transition-shadow hover:shadow-xl hover:shadow-indigo-500/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                  אחוז דיווח
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-indigo-600 tracking-tight">
                  {kpiData.reportedPct}%
                </span>
                <div className="w-full h-1.5 bg-indigo-50 dark:bg-indigo-950 mt-3 rounded-full overflow-visible">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${kpiData.reportedPct}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>
            </motion.div>

            {/* Available KPI */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => handleKPIClick("available")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-visible group cursor-pointer transition-shadow hover:shadow-xl hover:shadow-emerald-500/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                  זמינים במצבה
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-emerald-600 tracking-tight">
                  {kpiData.available}
                </span>
                <div className="w-8 h-1 bg-emerald-200 dark:bg-emerald-800 mt-2 rounded-full" />
              </div>
            </motion.div>

            {/* Missing/Not Reported KPI */}
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => handleKPIClick("missing")}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex flex-col justify-between relative overflow-visible group cursor-pointer transition-shadow hover:shadow-xl hover:shadow-amber-500/5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-[10px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">
                  עוד לא דיווחו
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-amber-600 tracking-tight">
                  {kpiData.missing}
                </span>
                <span className="text-[10px] text-amber-700 font-bold mt-1">
                  לחץ להצגת רשימה
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Main Attendance Chart */}
            <div className="flex flex-col h-full min-h-[400px]">
              <EmployeesChart
                ref={snapshotRef}
                stats={chartStats}
                totalInUnit={totalUnitCount}
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
              />
            </div>

            {/* Right Sidebar: Birthdays & Age Distrib */}
            <div className="flex flex-col gap-4 sm:gap-6 h-full">
              <div className="hidden lg:flex flex-col flex-1 h-full">
                <BirthdaysCard ref={birthdaysRef} birthdays={birthdays} />
              </div>

              {ageDistribution && ageDistribution.length > 0 && (
                <div className="w-full">
                  <AgeDistributionChart
                    data={ageDistribution}
                    averageAge={averageAge}
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
                  <div id="trend-section">
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
                  </div>
                )}
              </div>
            )}

          {/* Mobile/Tablet Only: Birthdays (Below the main charts) */}
          <div className="lg:hidden">
            <BirthdaysCard ref={birthdaysRef} birthdays={birthdays} />
          </div>

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
          isFiltered={hasActiveFilters}
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
              isMobile={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
