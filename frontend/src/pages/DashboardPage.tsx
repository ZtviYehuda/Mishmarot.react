import { useState, useEffect } from "react";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { WhatsAppReportDialog } from "@/components/dashboard/WhatsAppReportDialog";
import { DashboardStatusTable } from "@/components/dashboard/DashboardStatusTable";
import { StatsComparisonCard } from "@/components/dashboard/StatsComparisonCard";
import { AttendanceTrendCard } from "@/components/dashboard/AttendanceTrendCard";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar"; // Added
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { PageHeader } from "@/components/layout/PageHeader";
import { LayoutDashboard } from "lucide-react";
import { format } from "date-fns"; // Added

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
  const { getStructure, getDashboardStats, getComparisonStats, getTrendStats } =
    useEmployees();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [allStatuses, setAllStatuses] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);

  // Date State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // New Stats
  const [comparisonStats, setComparisonStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedStatusData, setSelectedStatusData] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);

  // Initialize filters based on user permissions
  useEffect(() => {
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
  }, [user]);

  // Fetch Structure
  useEffect(() => {
    const fetchStruct = async () => {
      const data = await getStructure();
      if (data) setStructure(data);
    };
    fetchStruct();
  }, [getStructure]);

  // Fetch Extra Stats
  useEffect(() => {
    const fetchExtras = async () => {
      setLoadingExtras(true);
      const [compData, trendData] = await Promise.all([
        getComparisonStats(),
        getTrendStats(7),
      ]);
      setComparisonStats(compData);
      setTrendStats(trendData);
      setLoadingExtras(false);
    };
    fetchExtras();
  }, [getComparisonStats, getTrendStats]);

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
    getDashboardStats,
    selectedDate,
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
    getDashboardStats,
    selectedDate,
  ]);

  const handleFilterChange = (
    type: "department" | "section" | "team" | "status" | "reset",
    value?: string,
  ) => {
    if (type === "reset") {
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
      return;
    }

    if (type === "department") {
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

  const currentDept = structure.find((d) => d.id.toString() === selectedDeptId);
  const currentSection = currentDept?.sections.find(
    (s) => s.id.toString() === selectedSectionId,
  );
  const currentTeam = currentSection?.teams.find(
    (t) => t.id.toString() === selectedTeamId,
  );

  const chartTitle = currentTeam
    ? `נתוני חולייה - ${currentTeam.name}`
    : currentSection
      ? `נתוני מדור - ${currentSection.name}`
      : currentDept
        ? `נתוני מחלקה - ${currentDept.name}`
        : "כלל היחידה";

  const chartDescription = currentTeam
    ? `פירוט נוכחות לחוליית ${currentTeam.name}`
    : currentSection
      ? `פירוט נוכחות למדור ${currentSection.name}`
      : currentDept
        ? `פירוט נוכחות למחלקת ${currentDept.name}`
        : "תצוגה מלאה של כלל השוטרים ביחידה";

  const handleStatusClick = (
    statusId: number,
    statusName: string,
    color: string,
  ) => {
    setSelectedStatusData({ id: statusId, name: statusName, color });
    const tableElement = document.getElementById("status-details-table");
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <DashboardCalendar
            selectedDate={selectedDate}
            onSelectDate={(d) => d && setSelectedDate(d)}
          />
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Chart - Takes 2 columns on desktop */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          <EmployeesChart
            stats={stats}
            loading={loading}
            onOpenWhatsAppReport={() => setWhatsAppDialogOpen(true)}
            onStatusClick={handleStatusClick}
            title={chartTitle}
            description={chartDescription}
          />

          {/* New Widgets Row - Only show if user is admin or commander */}
          {(user?.is_admin ||
            user?.commands_department_id ||
            user?.commands_section_id) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsComparisonCard
                data={comparisonStats}
                loading={loadingExtras}
              />
              <AttendanceTrendCard data={trendStats} loading={loadingExtras} />
            </div>
          )}

          {/* Inline Drill Down Filters */}
          <DashboardFilters
            structure={structure}
            statuses={allStatuses}
            selectedDeptId={selectedDeptId}
            selectedSectionId={selectedSectionId}
            selectedTeamId={selectedTeamId}
            selectedStatusId={selectedStatusData?.id?.toString()}
            onFilterChange={handleFilterChange}
            canSelectDept={canSelectDept}
            canSelectSection={canSelectSection}
            canSelectTeam={canSelectTeam}
          />

          <div id="status-details-table">
            <DashboardStatusTable
              statusId={selectedStatusData?.id || null}
              statusName={selectedStatusData?.name || ""}
              statusColor={selectedStatusData?.color || ""}
              departmentId={selectedDeptId}
              sectionId={selectedSectionId}
              teamId={selectedTeamId}
            />
          </div>
        </div>

        {/* Birthdays Card - Takes 1 column */}
        <div className="xl:col-span-1 h-full min-h-[300px] sm:min-h-[400px]">
          <BirthdaysCard birthdays={birthdays} />
        </div>
      </div>

      <WhatsAppReportDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
      />
    </div>
  );
}
