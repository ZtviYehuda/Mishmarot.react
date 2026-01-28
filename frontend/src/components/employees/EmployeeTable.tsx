import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Filter,
  User,
  Plus,
  MessageCircle,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import {
  FilterModal,
  WhatsAppReportDialog,
  StatusUpdateModal,
  BulkStatusUpdateModal,
} from "./modals";
import type { EmployeeFilters } from "./modals/FilterModal";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  onFilteredEmployeesChange?: (employees: Employee[]) => void;
  fetchEmployees?: (
    search?: string,
    dept_id?: number,
    include_inactive?: boolean,
  ) => Promise<void>;
}

export const EmployeeTable = ({
  employees,
  loading,
  fetchEmployees,
}: EmployeeTableProps) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [selectedEmployeeForStatus, setSelectedEmployeeForStatus] =
    useState<Employee | null>(null);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>({});
  const itemsPerPage = 10;

  const currentUserEmployee = employees.find((emp) => emp.id === user?.id);

  // Role Logic implementation base on user request
  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== "מטה") return "ראש חולייה";
      if (emp.section_name && emp.section_name !== "מטה") return "ראש מדור";
      if (emp.department_name && emp.department_name !== "מטה")
        return "ראש מחלקה";
      return "מפקד יחידה";
    }
    return "שוטר";
  };

  const filteredEmployees = employees.filter((emp) => {
    // Hide current user
    if (user && emp.id === user.id) return false;

    // Search filter
    const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
    const searchMatch =
      fullName.includes(searchTerm.toLowerCase()) ||
      emp.personal_number.includes(searchTerm);

    if (!searchMatch) return false;

    // Advanced filters
    if (activeFilters.statuses && activeFilters.statuses.length > 0) {
      if (!activeFilters.statuses.includes(emp.status_name)) return false;
    }

    if (activeFilters.departments && activeFilters.departments.length > 0) {
      if (
        !emp.department_name ||
        !activeFilters.departments.includes(emp.department_name)
      ) {
        return false;
      }
    }

    if (activeFilters.sections && activeFilters.sections.length > 0) {
      if (
        !emp.section_name ||
        !activeFilters.sections.includes(emp.section_name)
      ) {
        return false;
      }
    }

    if (activeFilters.teams && activeFilters.teams.length > 0) {
      if (!emp.team_name || !activeFilters.teams.includes(emp.team_name)) {
        return false;
      }
    }

    if (activeFilters.roles && activeFilters.roles.length > 0) {
      if (!emp.role_name || !activeFilters.roles.includes(emp.role_name)) {
        return false;
      }
    }

    if (activeFilters.isCommander) {
      if (!emp.is_commander) return false;
    }

    if (activeFilters.isAdmin) {
      if (!emp.is_admin) return false;
    }

    if (activeFilters.hasSecurityClearance) {
      if (emp.security_clearance === 0) return false;
    }

    if (activeFilters.hasPoliceRicense) {
      if (!emp.police_license) return false;
    }

    if (activeFilters.searchText) {
      const lowerSearch = activeFilters.searchText.toLowerCase();
      const matchesSearch =
        fullName.includes(lowerSearch) ||
        emp.personal_number.includes(lowerSearch);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleViewDetails = (employee: Employee) => {
    navigate(`/employees/${employee.id}`);
  };

  const handleOpenStatusModal = (employee: Employee) => {
    setSelectedEmployeeForStatus(employee);
    setStatusModalOpen(true);
  };

  const handleApplyFilters = (filters: EmployeeFilters) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page

    // Check if we need to fetch inactive employees
    if (fetchEmployees) {
      // If "showInactive" is true, we must fetch from backend with include_inactive=true
      // If "showInactive" is false (or undefined), we fetch standard list
      // Note: This relies on setFilters being called first or passed directly
      fetchEmployees(searchTerm, undefined, filters.showInactive);
    }
  };

  const isReportedToday =
    currentUserEmployee?.last_status_update &&
    new Date(currentUserEmployee.last_status_update).toDateString() ===
      new Date().toDateString();

  const updatedTodayCount = employees.filter(
    (emp) =>
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() ===
        new Date().toDateString(),
  ).length;
  const totalEmployeesCount = employees.length;
  const updateProgress =
    totalEmployeesCount > 0
      ? (updatedTodayCount / totalEmployeesCount) * 100
      : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Self-Report Status Indicator */}
        {isReportedToday && currentUserEmployee && (
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col text-right flex-1 min-w-0">
                <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-400">
                  דיווחת על עצמך!
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/70 truncate">
                  סטטוס: {currentUserEmployee.status_name} • עודכן ב-
                  {new Date(
                    currentUserEmployee.last_status_update!,
                  ).toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Unit Status Indicator */}
        <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0",
                updateProgress === 100
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-indigo-500 text-white shadow-indigo-500/20",
              )}
            >
              <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col text-right flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                  סטטוס דיווח יחידתי
                </span>
                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 whitespace-nowrap">
                  {updatedTodayCount}/{totalEmployeesCount} מדווחים
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-1000",
                    updateProgress === 100 ? "bg-emerald-500" : "bg-indigo-500",
                  )}
                  style={{ width: `${updateProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-white dark:bg-slate-800/50 p-3 sm:p-5 rounded-2xl shadow-sm">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש לפי שם או מספר אישי..."
            className="pr-10 h-10 sm:h-11 text-right border-slate-200 focus:ring-[#0074ff]/10 focus:border-[#0074ff] rounded-xl text-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 sm:h-10 text-xs sm:text-sm shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl",
              Object.keys(activeFilters).length > 0
                ? "text-[#0074ff] border-[#0074ff] dark:border-[#0074ff]"
                : "text-slate-600 dark:text-slate-300",
            )}
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            <span className="hidden sm:inline">סינון</span>
            <span className="sm:hidden">סנן</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1.5 text-xs font-semibold">
                ({Object.keys(activeFilters).length})
              </span>
            )}
          </Button>

          <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />

          {currentUserEmployee && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 sm:h-10 text-xs sm:text-sm shrink-0 border-blue-200 bg-blue-50/30 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-400 rounded-xl"
              onClick={() => handleOpenStatusModal(currentUserEmployee)}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
              <span className="hidden sm:inline">דיווח עצמי</span>
              <span className="sm:hidden">דיווח</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 text-xs sm:text-sm shrink-0 border-indigo-200 bg-indigo-50/30 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800 dark:text-indigo-400 rounded-xl"
            onClick={() => setBulkStatusModalOpen(true)}
          >
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            <span className="hidden sm:inline">עדכון יומי</span>
            <span className="sm:hidden">עדכן</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-9 sm:h-10 text-xs sm:text-sm shrink-0 bg-[#25D366] hover:bg-[#1fa857] text-white border-[#25D366] dark:border-[#25D366] rounded-xl"
            onClick={() => setWhatsappDialogOpen(true)}
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            <span className="hidden sm:inline">דוח וואטסאפ</span>
            <span className="sm:hidden">דוח</span>
          </Button>

          <Button
            className="h-9 sm:h-10 text-xs sm:text-sm shrink-0 bg-[#0074ff] hover:bg-[#0060d5] text-white shadow-md shadow-blue-500/20 rounded-xl sm:mr-auto"
            onClick={() => navigate("/employees/new")}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            הוספה
          </Button>
        </div>
      </div>

      {/* Main Table - Desktop View */}
      <div className="hidden lg:block bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50">
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-700">
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  שוטר
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  מספר אישי
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  טלפון
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  סוג שירות
                </TableHead>
                <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  סטטוס
                </TableHead>
                <TableHead className="text-center font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-slate-400"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-32 text-center text-slate-400"
                  >
                    לא נמצאו שוטרים התואמים את החיפוש והסינון
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={cn(
                      "group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700/50",
                      !emp.is_active &&
                        "bg-red-50/30 opacity-75 grayscale-[0.2] border-r-2 border-r-red-400",
                    )}
                  >
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-md transition-colors",
                            emp.is_active
                              ? "bg-gradient-to-br from-[#0074ff] to-[#0060d5] shadow-blue-500/20"
                              : "bg-slate-400 shadow-slate-400/20",
                          )}
                        >
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div className="flex flex-col text-right">
                          <span
                            className={cn(
                              "font-semibold text-sm transition-colors",
                              emp.is_active
                                ? "text-slate-800 dark:text-white"
                                : "text-slate-500",
                            )}
                          >
                            {emp.first_name} {emp.last_name}
                          </span>
                          {!emp.is_active && (
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight">
                              שוטר לא פעיל
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                      {emp.personal_number}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-xs text-slate-500">
                      {emp.phone_number || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-xs text-slate-500">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Badge
                        variant="outline"
                        className="font-medium text-[10px] border-none px-2.5 py-1 bg-slate-100 text-slate-500 dark:bg-slate-700"
                      >
                        {getProfessionalTitle(emp)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {emp.department_name || "מטה"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {emp.section_name && `מדור ${emp.section_name}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: emp.status_color || "#94a3b8",
                          }}
                        />
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                          {emp.status_name || "ללא סטטוס"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-[10px]"
                          onClick={() => handleViewDetails(emp)}
                        >
                          <User className="w-3.5 h-3.5 ml-1" />
                          פרופיל
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-[10px]"
                          onClick={() => handleOpenStatusModal(emp)}
                        >
                          <ClipboardList className="w-3.5 h-3.5 ml-1" />
                          סטטוס
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-medium text-slate-400 uppercase">
            מציג{" "}
            {filteredEmployees.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}
            -{Math.min(filteredEmployees.length, currentPage * itemsPerPage)}{" "}
            מתוך {filteredEmployees.length} שוטרים
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                    currentPage === i + 1
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:bg-slate-50",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-400">טוען נתונים...</p>
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-8 text-center">
            <p className="text-sm text-slate-400">
              לא נמצאו שוטרים התואמים את החיפוש והסינון
            </p>
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className={cn(
                "bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden",
                !emp.is_active &&
                  "bg-red-50/30 opacity-75 grayscale-[0.2] border-r-4 border-r-red-400",
              )}
            >
              <div className="p-4 space-y-3">
                {/* Header with Avatar and Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-md transition-colors",
                      emp.is_active
                        ? "bg-gradient-to-br from-[#0074ff] to-[#0060d5] shadow-blue-500/20"
                        : "bg-slate-400 shadow-slate-400/20",
                    )}
                  >
                    {emp.first_name[0]}
                    {emp.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <h3
                      className={cn(
                        "font-bold text-base leading-tight truncate",
                        emp.is_active
                          ? "text-slate-800 dark:text-white"
                          : "text-slate-500",
                      )}
                    >
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {emp.personal_number}
                    </p>
                    {!emp.is_active && (
                      <span className="text-[9px] text-red-500 font-bold uppercase tracking-tight">
                        שוטר לא פעיל
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className="font-medium text-[9px] border-none px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-700 shrink-0"
                  >
                    {getProfessionalTitle(emp)}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      טלפון
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 font-mono text-xs">
                      {emp.phone_number || "-"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      תאריך לידה
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      שיוך ארגוני
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-xs truncate block">
                      {emp.department_name || "מטה"}
                      {emp.section_name && ` • ${emp.section_name}`}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      סוג שירות
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                      {emp.service_type_name || "-"}
                    </span>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: emp.status_color || "#94a3b8",
                      }}
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                      {emp.status_name || "ללא סטטוס"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-[10px]"
                      onClick={() => handleViewDetails(emp)}
                    >
                      <User className="w-3.5 h-3.5 ml-1" />
                      פרופיל
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-[10px]"
                      onClick={() => handleOpenStatusModal(emp)}
                    >
                      <ClipboardList className="w-3.5 h-3.5 ml-1" />
                      סטטוס
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs font-medium text-slate-400 uppercase text-center mb-3">
            מציג{" "}
            {filteredEmployees.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}
            -{Math.min(filteredEmployees.length, currentPage * itemsPerPage)}{" "}
            מתוך {filteredEmployees.length} שוטרים
          </div>
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-lg"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2 overflow-x-auto max-w-[200px]">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-9 h-9 rounded-lg text-xs font-semibold transition-all shrink-0",
                    currentPage === i + 1
                      ? "bg-primary text-white"
                      : "text-slate-400 hover:bg-slate-50",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-lg"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApply={handleApplyFilters}
        employees={employees}
      />
      <WhatsAppReportDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        filteredEmployees={filteredEmployees}
      />
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        employee={selectedEmployeeForStatus}
        onSuccess={() => fetchEmployees && fetchEmployees()}
      />
      <BulkStatusUpdateModal
        open={bulkStatusModalOpen}
        onOpenChange={setBulkStatusModalOpen}
        employees={filteredEmployees}
        onSuccess={() => fetchEmployees && fetchEmployees()}
      />
    </div>
  );
};
