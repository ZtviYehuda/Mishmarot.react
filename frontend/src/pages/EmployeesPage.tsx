import { useEffect } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function EmployeesPage() {
  const { user } = useAuthContext();
  const { employees, loading, fetchEmployees } = useEmployees();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const unitTypeLabel = user?.commands_team_id
    ? "חוליה"
    : user?.commands_section_id
      ? "מדור"
      : user?.commands_department_id
        ? "מחלקה"
        : "יחידה";

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <PageHeader
        icon={Users}
        title="ניהול מצבת כוח אדם"
        subtitle={`מערך ניהול וצפייה בנתוני השוטרים ב${unitTypeLabel}`}
        category="ניהול שוטרים"
        categoryLink="/employees"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      <EmployeeTable
        employees={employees}
        loading={loading}
        fetchEmployees={fetchEmployees}
      />
    </div>
  );
}
