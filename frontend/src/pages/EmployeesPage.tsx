import React from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { Users, ChevronRight } from "lucide-react";

export default function EmployeesPage() {
  const { employees, loading, fetchEmployees } = useEmployees();

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">
          <span>Core Hub</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0074ff]">Personnel Management</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-right flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-blue-200 dark:border-blue-900/30 flex items-center justify-center dark:from-slate-800 dark:to-slate-800/50 shadow-sm">
              <Users className="w-7 h-7 text-[#0074ff]" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-semibold text-[#001e30] dark:text-white tracking-tight leading-none mb-1.5">
                ניהול מצבת כוח אדם
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-none">
                מערך ניהול וצפייה בנתוני המשרתים ביחידה
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <EmployeeTable
        employees={employees}
        loading={loading}
        fetchEmployees={fetchEmployees}
      />
    </div>
  );
}
