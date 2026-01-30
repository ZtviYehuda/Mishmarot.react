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
  Pencil,
  LogIn,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import { FilterModal } from "./modals";
import type { EmployeeFilters } from "./modals/FilterModal";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

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
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>({});
  const itemsPerPage = 10;

  // Role Logic implementation base on user request
  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.team_name && emp.team_name !== "מטה") return "מפקד חוליה";
      if (emp.section_name && emp.section_name !== "מטה") return "מפקד מדור";
      if (emp.department_name && emp.department_name !== "מטה")
        return "מפקד מחלקה";
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

    if (activeFilters.serviceTypes && activeFilters.serviceTypes.length > 0) {
      if (
        !emp.service_type_name ||
        !activeFilters.serviceTypes.includes(emp.service_type_name)
      ) {
        return false;
      }
    }

    if (activeFilters.statuses && activeFilters.statuses.length > 0) {
      if (
        !emp.status_name ||
        !activeFilters.statuses.includes(emp.status_name)
      ) {
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

  const handleImpersonate = async (targetId: number, name: string) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להתחבר כ-${name}?`)) return;

    try {
      const { data } = await apiClient.post("/auth/impersonate", {
        target_id: targetId,
      });
      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        toast.success(`התחברת בהצלחה כ-${name}`);
        // Force full reload to update Context and Reset App State
        window.location.href = "/";
      }
    } catch (e) {
      toast.error("שגיאה בהתחברות כמשתמש");
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-card p-3 sm:p-5 rounded-2xl shadow-sm border border-border">
        <div className="relative w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם או מספר אישי..."
            className="pr-10 h-10 sm:h-11 text-right border-input focus:ring-ring/20 focus:border-ring rounded-xl text-sm"
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
              "h-9 sm:h-10 text-xs sm:text-sm shrink-0 border-input hover:bg-muted rounded-xl",
              Object.keys(activeFilters).length > 0
                ? "text-primary border-primary"
                : "text-muted-foreground",
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

          <Button
            className="h-9 sm:h-10 text-xs sm:text-sm shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 rounded-xl sm:mr-auto"
            onClick={() => navigate("/employees/new")}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            הוספה
          </Button>
        </div>
      </div>

      {/* Main Table - Desktop View */}
      <div className="hidden lg:block bg-card rounded-2xl border border-border shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  שוטר
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  מספר אישי
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  טלפון
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  סוג שירות
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground uppercase tracking-tighter text-xs h-14 px-6">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : paginatedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    לא נמצאו שוטרים התואמים את החיפוש והסינון
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow
                    key={emp.id}
                    className={cn(
                      "group transition-all duration-200 hover:bg-muted/50 border-b border-border",
                      !emp.is_active &&
                      "bg-destructive/5 opacity-75 grayscale-[0.2] border-r-2 border-r-destructive",
                    )}
                  >
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground font-semibold text-xs shadow-md transition-colors",
                            emp.is_active
                              ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/20"
                              : "bg-muted text-muted-foreground shadow-sm",
                          )}
                        >
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <div className="flex flex-col text-right">
                          <EmployeeLink
                            employee={emp}
                            className={cn(
                              "font-semibold text-sm transition-colors",
                              emp.is_active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          {!emp.is_active && (
                            <Badge
                              variant="destructive"
                              className="w-fit h-4 text-[8px] px-1.5 font-black uppercase leading-none bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                            >
                              לא פעיל
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                      {emp.personal_number}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-xs text-muted-foreground">
                      {emp.phone_number || "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right text-xs text-muted-foreground">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <Badge
                        variant="outline"
                        className="font-medium text-[10px] border-none px-2.5 py-1 bg-muted text-muted-foreground"
                      >
                        {getProfessionalTitle(emp)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-semibold text-foreground">
                            {emp.department_name}
                          </span>
                          {((emp.section_name && emp.section_name !== "מטה") ||
                            (emp.team_name && emp.team_name !== "מטה")) && (
                              <span className="text-[10px] text-muted-foreground">
                                {emp.section_name &&
                                  emp.section_name !== "מטה" &&
                                  `מדור ${emp.section_name}`}
                                {emp.section_name &&
                                  emp.section_name !== "מטה" &&
                                  emp.team_name &&
                                  emp.team_name !== "מטה" &&
                                  " • "}
                                {emp.team_name &&
                                  emp.team_name !== "מטה" &&
                                  `חוליה ${emp.team_name}`}
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-xs font-medium text-muted-foreground">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {user?.is_admin &&
                          (emp.is_commander || emp.is_admin) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                              onClick={() =>
                                handleImpersonate(
                                  emp.id,
                                  `${emp.first_name} ${emp.last_name}`,
                                )
                              }
                              title="התחבר כמשתמש זה"
                            >
                              <LogIn className="w-3.5 h-3.5 ml-1" />
                              התחבר
                            </Button>
                          )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                          onClick={() => handleViewDetails(emp)}
                        >
                          <User className="w-3.5 h-3.5 ml-1" />
                          פרופיל
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                          onClick={() => navigate(`/employees/edit/${emp.id}`)}
                        >
                          <Pencil className="w-3.5 h-3.5 ml-1" />
                          עריכה
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
        <div className="p-5 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-xs font-medium text-muted-foreground uppercase">
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
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
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
          <div className="bg-card rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground">טוען נתונים...</p>
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">
              לא נמצאו שוטרים התואמים את החיפוש והסינון
            </p>
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className={cn(
                "bg-card rounded-2xl border border-border shadow-sm overflow-hidden",
                !emp.is_active &&
                "bg-destructive/5 opacity-75 grayscale-[0.2] border-r-4 border-r-destructive",
              )}
            >
              <div className="p-4 space-y-3">
                {/* Header with Avatar and Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md transition-colors",
                      emp.is_active
                        ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/20"
                        : "bg-muted text-muted-foreground shadow-sm",
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
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground font-mono">
                        {emp.personal_number}
                      </p>
                      {!emp.is_active && (
                        <Badge
                          variant="destructive"
                          className="h-3.5 text-[7px] px-1 font-black bg-destructive/10 text-destructive border-destructive/20"
                        >
                          לא פעיל
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="font-medium text-[9px] border-none px-2 py-0.5 bg-muted text-muted-foreground shrink-0"
                  >
                    {getProfessionalTitle(emp)}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      טלפון
                    </span>
                    <span className="font-medium text-foreground font-mono text-xs">
                      {emp.phone_number || "-"}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      תאריך לידה
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {emp.birth_date
                        ? new Date(emp.birth_date).toLocaleDateString("he-IL")
                        : "-"}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      שיוך ארגוני
                    </span>
                    <span className="font-medium text-foreground text-xs truncate block">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <>
                          {emp.department_name}
                          {((emp.section_name && emp.section_name !== "מטה") ||
                            (emp.team_name && emp.team_name !== "מטה")) && (
                              <>
                                {" • "}
                                {emp.section_name &&
                                  emp.section_name !== "מטה" &&
                                  `מדור ${emp.section_name}`}
                                {emp.section_name &&
                                  emp.section_name !== "מטה" &&
                                  emp.team_name &&
                                  emp.team_name !== "מטה" &&
                                  " • "}
                                {emp.team_name &&
                                  emp.team_name !== "מטה" &&
                                  `חוליה ${emp.team_name}`}
                              </>
                            )}
                        </>
                      ) : (
                        "-"
                      )}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-right">
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      סוג שירות
                    </span>
                    <span className="font-medium text-foreground text-xs">
                      {emp.service_type_name || "-"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    {user?.is_admin && (emp.is_commander || emp.is_admin) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                        onClick={() =>
                          handleImpersonate(
                            emp.id,
                            `${emp.first_name} ${emp.last_name}`,
                          )
                        }
                      >
                        <LogIn className="w-3.5 h-3.5 ml-1" />
                        התחבר
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                      onClick={() => handleViewDetails(emp)}
                    >
                      <User className="w-3.5 h-3.5 ml-1" />
                      פרופיל
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                      onClick={() => navigate(`/employees/edit/${emp.id}`)}
                    >
                      <Pencil className="w-3.5 h-3.5 ml-1" />
                      עריכה
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase text-center mb-3">
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
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted",
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
    </div>
  );
};
