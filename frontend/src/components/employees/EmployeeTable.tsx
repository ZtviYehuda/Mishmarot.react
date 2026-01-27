import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Search, ChevronRight, ChevronLeft, Filter, User, Plus, MessageCircle } from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import {
  FilterModal,
  WhatsAppReportDialog,
} from "./modals";
import type { EmployeeFilters } from "./modals/FilterModal";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  onFilteredEmployeesChange?: (employees: Employee[]) => void;
  fetchEmployees?: (search?: string, dept_id?: number, include_inactive?: boolean) => Promise<void>;
}

export const EmployeeTable = ({ employees, loading, fetchEmployees }: EmployeeTableProps) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>({});
  const itemsPerPage = 10;

  // Role Logic implementation base on user request
  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== 'מטה') return "ראש חולייה";
      if (emp.section_name && emp.section_name !== 'מטה') return "ראש מדור";
      if (emp.department_name && emp.department_name !== 'מטה') return "ראש מחלקה";
      return "מפקד יחידה";
    }
    return "משרת";
  };

  const filteredEmployees = employees.filter((emp) => {
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
      if (!emp.department_name || !activeFilters.departments.includes(emp.department_name)) {
        return false;
      }
    }

    if (activeFilters.sections && activeFilters.sections.length > 0) {
      if (!emp.section_name || !activeFilters.sections.includes(emp.section_name)) {
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

  const handleEditEmployee = (employee: Employee) => {
    navigate(`/employees/edit/${employee.id}`);
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

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800/50 p-5 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש לפי שם או מספר אישי..."
            className="pr-10 h-10 text-right border-slate-200 focus:ring-[#0074ff]/10 focus:border-[#0074ff]"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-10 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
              Object.keys(activeFilters).length > 0
                ? "text-[#0074ff] border-[#0074ff] dark:border-[#0074ff]"
                : "text-slate-600 dark:text-slate-300",
            )}
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter className="w-4 h-4 ml-2" />
            סינון מתקדם
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-2 text-xs font-semibold">
                ({Object.keys(activeFilters).length})
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 bg-[#25D366] hover:bg-[#1fa857] text-white border-[#25D366] dark:border-[#25D366]"
            onClick={() => setWhatsappDialogOpen(true)}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            דוח לוואטסאפ
          </Button>
          <Button
            className="h-10 bg-[#0074ff] hover:bg-[#0060d5] text-white shadow-md shadow-blue-500/20"
            onClick={() => navigate("/employees/new")}
          >
            <Plus className="w-4 h-4 ml-2" />
            הוספת משרת חדש
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50">
            <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-700">
              <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                משרת
              </TableHead>
              <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6">
                מספר אישי
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
              <TableHead className="text-right font-semibold text-[#001e30] dark:text-white uppercase tracking-tighter text-xs h-14 px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-right text-slate-400"
                >
                  טוען נתונים...
                </TableCell>
              </TableRow>
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-right text-slate-400"
                >
                  לא נמצאו משרתים התואמים את החיפוש והסינון
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp) => (
                <TableRow
                  key={emp.id}
                  className={cn(
                    "group transition-all duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700/50",
                    !emp.is_active && "bg-red-50/30 opacity-75 grayscale-[0.2] border-r-2 border-r-red-400"
                  )}
                >
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs shadow-md transition-colors",
                        emp.is_active
                          ? "bg-gradient-to-br from-[#0074ff] to-[#0060d5] shadow-blue-500/20"
                          : "bg-slate-400 shadow-slate-400/20"
                      )}>
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className={cn(
                          "font-semibold text-sm transition-colors",
                          emp.is_active ? "text-slate-800 dark:text-white" : "text-slate-500"
                        )}>
                          {emp.first_name} {emp.last_name}
                        </span>
                        {!emp.is_active && (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-tight">
                            משרת לא פעיל
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium">
                          Clearance: {emp.security_clearance}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {emp.personal_number}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium text-[10px] border-none px-2.5 py-1",
                        emp.is_active
                          ? (emp.is_commander ? "bg-blue-50 text-[#0074ff] dark:bg-[#0074ff]/10" : "bg-slate-100 text-slate-500 dark:bg-slate-700")
                          : "bg-red-50 text-red-600 dark:bg-red-900/20"
                      )}
                    >
                      {getProfessionalTitle(emp)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {emp.department_name && emp.department_name !== 'מטה' ? emp.department_name : "ללא מחלקה"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {(emp.section_name && emp.section_name !== 'מטה') ? emp.section_name : "ללא מדור"} •{" "}
                        {(emp.team_name && emp.team_name !== 'מטה') ? emp.team_name : "ללא חולייה"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {emp.service_type_name || "לא הוגדר"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <div
                        className={cn("w-2 h-2 rounded-full shadow-sm", !emp.is_active && "bg-red-500")}
                        style={emp.is_active ? { backgroundColor: emp.status_color } : {}}
                      />
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        emp.is_active ? "text-slate-600 dark:text-slate-400" : "text-red-500 font-bold"
                      )}>
                        {emp.is_active ? emp.status_name : "לא פעיל"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-slate-400 hover:text-[#0074ff] hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => handleViewDetails(emp)}
                        title="צפה בפרטים"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-9 h-9 text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        onClick={() => handleEditEmployee(emp)}
                        title="ערוך"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-5 bg-gradient-to-r from-slate-50/50 to-transparent border-t border-slate-200 dark:border-slate-700 dark:from-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-widest text-right">
            מציג{" "}
            {Math.min(
              filteredEmployees.length,
              (currentPage - 1) * itemsPerPage + 1,
            )}
            -{Math.min(filteredEmployees.length, currentPage * itemsPerPage)} מתוך{" "}
            {filteredEmployees.length} משרתים
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1.5 px-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-semibold transition-all",
                    currentPage === i + 1
                      ? "bg-[#0074ff] text-white shadow-md shadow-blue-500/20"
                      : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300",
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
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

      {/* Modals */}
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
    </div>
  );
};
