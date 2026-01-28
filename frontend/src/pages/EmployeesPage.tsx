import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function EmployeesPage() {
  const { employees, loading, fetchEmployees } = useEmployees();

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <PageHeader
        icon={Users}
        title="ניהול מצבת כוח אדם"
        subtitle="מערך ניהול וצפייה בנתוני השוטרים ביחידה"
        category="ניהול שוטרים"
        categoryLink="/employees"
        iconClassName="from-blue-50 to-blue-100 border-blue-200"
      />

      <EmployeeTable
        employees={employees}
        loading={loading}
        fetchEmployees={fetchEmployees}
      />
    </div>
  );
}
