import { useState, useEffect, useCallback } from "react";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { BirthdaysCard } from "@/components/dashboard/BirthdaysCard";
import { DashboardFilters } from "@/components/dashboard/DashboardFilters";
import { WhatsAppReportDialog } from "@/components/dashboard/WhatsAppReportDialog";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";

interface Team { id: number; name: string; section_id: number; }
interface Section { id: number; name: string; department_id: number; teams: Team[]; }
interface Department { id: number; name: string; sections: Section[]; }

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { getStructure, getDashboardStats } = useEmployees();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);

  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Initialize filters based on user permissions
  useEffect(() => {
    if (user && !user.is_admin) {
      if (user.commands_department_id) {
        setSelectedDeptId(user.commands_department_id.toString());
      } else if (user.commands_section_id) {
        // We need structure to find parent dept, but typically backend handles scoping.
        // For UI consistency we will try to set it once structure loads or via user props if available.
        // Backend returns "assigned_department_id" for everyone, and "commands_*" for commanders.
        // For a Section Commander, commands_section_id is set. assigned_department_id should be parent.
        if (user.assigned_department_id) setSelectedDeptId(user.assigned_department_id.toString());
        setSelectedSectionId(user.commands_section_id.toString());
      } else if (user.commands_team_id) {
        if (user.assigned_department_id) setSelectedDeptId(user.assigned_department_id.toString());
        if (user.assigned_section_id) setSelectedSectionId(user.assigned_section_id.toString());
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

  // Fetch Stats when filters change
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await getDashboardStats({
        department_id: selectedDeptId,
        section_id: selectedSectionId,
        team_id: selectedTeamId
      });

      if (data) {
        setStats(data.stats || []);
        setBirthdays(data.birthdays || []);
      }
      setLoading(false);
    };

    fetchStats();
  }, [selectedDeptId, selectedSectionId, selectedTeamId, getDashboardStats]);

  const handleFilterChange = (type: 'department' | 'section' | 'team' | 'reset', value?: string) => {
    if (type === 'reset') {
      // Reset only what allowed
      if (user?.is_admin) {
        setSelectedDeptId("");
        setSelectedSectionId("");
        setSelectedTeamId("");
      } else if (user?.commands_department_id) {
        setSelectedSectionId("");
        setSelectedTeamId("");
      }
      return;
    }

    if (type === 'department') {
      setSelectedDeptId(value || "");
      setSelectedSectionId("");
      setSelectedTeamId("");
    } else if (type === 'section') {
      setSelectedSectionId(value || "");
      setSelectedTeamId("");
    } else if (type === 'team') {
      setSelectedTeamId(value || "");
    }
  };

  // Determine which filters are locked
  const canSelectDept = !!user?.is_admin;
  const canSelectSection = !!user?.is_admin || (!!user?.commands_department_id);
  const canSelectTeam = !!user?.is_admin || (!!user?.commands_department_id) || (!!user?.commands_section_id);

  return (
    <div className="w-full h-full space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Chart - Takes 2 columns */}
        <div className="md:col-span-2">
          <EmployeesChart
            stats={stats}
            loading={loading}
            onOpenWhatsAppReport={() => setWhatsAppDialogOpen(true)}
            title={
              selectedTeamId ? "נתוני חולייה" :
                selectedSectionId ? "נתוני מדור" :
                  selectedDeptId ? "נתוני מחלקה" :
                    "כלל היחידה"
            }
            description={
              selectedTeamId ? "סינון לפי חולייה נבחרת" :
                selectedSectionId ? "סינון לפי מדור נבחר" :
                  selectedDeptId ? "סינון לפי מחלקה נבחרת" :
                    "תצוגה מלאה של כוח האדם"
            }
          />
          {/* Inline Drill Down Filters */}
          <DashboardFilters
            structure={structure}
            selectedDeptId={selectedDeptId}
            selectedSectionId={selectedSectionId}
            selectedTeamId={selectedTeamId}
            onFilterChange={handleFilterChange}
            canSelectDept={canSelectDept}
            canSelectSection={canSelectSection}
            canSelectTeam={canSelectTeam}
          />
        </div>

        {/* Birthdays Card - Takes 1 column */}
        <div className="md:col-span-1 h-full min-h-[400px]">
          <BirthdaysCard birthdays={birthdays} />
        </div>
      </div>

      {/* WhatsApp Report Dialog */}
      <WhatsAppReportDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
      />
    </div>
  );
}
