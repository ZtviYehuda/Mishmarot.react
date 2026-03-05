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
import { Card } from "@/components/ui/card";
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
import { cn, cleanUnitName } from "@/lib/utils";
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
      if (!emp.security_clearance) return false;
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
    if (user?.is_temp_commander && employee.is_commander) {
      toast.error("אין לך הרשאה לצפות בפרופיל של מפקד");
      return;
    }
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
        // Save current admin token if not already saved
        const currentToken = localStorage.getItem("token");
        if (currentToken && !localStorage.getItem("admin_token")) {
          localStorage.setItem("admin_token", currentToken);
        }

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
    <div className="space-y-3 sm:space-y-5">
      {/* Search & Filter Bar */}
      <Card className="flex flex-col gap-2 p-3 sm:p-5">
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

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 sm:h-10 text-xs sm:text-sm border-input hover:bg-muted rounded-xl w-full sm:w-auto justify-center",
              Object.keys(activeFilters).length > 0
                ? "text-primary border-primary"
                : "text-muted-foreground",
            )}
            onClick={() => setFilterModalOpen(true)}
          >
            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
            <span>סינון</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="ml-1.5 text-xs font-semibold">
                ({Object.keys(activeFilters).length})
              </span>
            )}
          </Button>

          {!user?.is_temp_commander && (
            <Button
              className="h-9 sm:h-10 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground   rounded-xl w-full sm:w-auto justify-center sm:mr-auto"
              onClick={() => navigate("/employees/new")}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
              הוספה
            </Button>
          )}
        </div>
      </Card>

      {/* Main Table - Desktop View */}
      <Card className="hidden lg:block overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/30 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  שוטר
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  מספר אישי
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  טלפון
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  תאריך לידה
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  תפקיד/סמכות
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
                  מעמד
                </TableHead>
                <TableHead className="text-center font-black text-muted-foreground uppercase text-[10px] h-16 px-6 tracking-widest">
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
                      "group/row transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-900/40 border-b border-border/40",
                      !emp.is_active &&
                        "bg-destructive/[0.02] opacity-80 grayscale-[0.2] border-r-4 border-r-destructive",
                      emp.is_active &&
                        "border-r-4 border-r-transparent hover:border-r-primary",
                    )}
                  >
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm group-hover/row:scale-110 transition-all duration-500",
                              emp.is_active
                                ? "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-400 border border-border/50"
                                : "bg-muted text-muted-foreground ",
                            )}
                          >
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          {emp.is_active && (
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500"/>
                          )}
                        </div>
                        <div className="flex flex-col text-right min-w-0">
                          <EmployeeLink
                            employee={emp}
                            className={cn(
                              "text-base font-black truncate tracking-tight group-hover/row:text-primary transition-colors",
                              emp.is_active
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          />
                          {!emp.is_active ? (
                            <Badge
                              variant="destructive"
                              className="w-fit h-4 text-[8px] px-1.5 font-black uppercase leading-none bg-destructive/10 text-destructive border-destructive/20 mt-1"
                            >
                              לא פעיל
                            </Badge>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-black text-muted-foreground/50 tracking-[0.1em]">
                                #{emp.personal_number}
                              </span>
                            </div>
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
                    <TableCell className="px-6 py-5 text-right">
                      {emp.department_name && emp.department_name !== "מטה" ? (
                        <div className="flex flex-col text-right">
                          <span className="text-[11px] font-black text-foreground">
                            {cleanUnitName(emp.department_name)}
                          </span>
                          {((emp.section_name && emp.section_name !== "מטה") ||
                            (emp.team_name && emp.team_name !== "מטה")) && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-black text-primary/60 truncate bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                                {emp.team_name && emp.team_name !== "מטה"
                                  ? cleanUnitName(emp.team_name)
                                  : cleanUnitName(emp.section_name || "")}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-muted-foreground/30">
                          מטה / ללא שיוך
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-xs font-medium text-muted-foreground">
                        {emp.service_type_name || "-"}
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {((user?.is_admin &&
                          (emp.is_commander || emp.is_admin)) ||
                          (user?.is_commander &&
                            !user?.is_admin &&
                            !user?.is_temp_commander &&
                            user?.active_delegate_id === emp.id)) && (
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
                        {!user?.is_temp_commander && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                            onClick={() => handleViewDetails(emp)}
                          >
                            <User className="w-3.5 h-3.5 ml-1" />
                            פרופיל
                          </Button>
                        )}
                        {!user?.is_temp_commander && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg text-[10px]"
                            onClick={() =>
                              navigate(`/employees/edit/${emp.id}`)
                            }
                          >
                            <Pencil className="w-3.5 h-3.5 ml-1" />
                            עריכה
                          </Button>
                        )}
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
      </Card>

      {/* Mobile Row View (Kodkod Style) */}
      <div className="lg:hidden space-y-1.5 px-2">
        {loading ? (
          <div className="bg-card rounded-2xl p-8 text-center border border-border/40">
            <p className="text-sm font-black text-muted-foreground animate-pulse">
              טוען מצבת כוח אדם...
            </p>
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="bg-card rounded-2xl p-10 text-center border border-border/40">
            <p className="text-sm font-black text-muted-foreground">
              לא נמצאו שוטרים
            </p>
          </div>
        ) : (
          paginatedEmployees.map((emp) => (
            <div
              key={emp.id}
              className={cn(
       "bg-white dark:bg-slate-900 rounded-2xl border border-border/60 active:scale-[0.98] transition-all overflow-hidden",
                !emp.is_active && "bg-destructive/[0.02] grayscale-[0.3]",
              )}
              onClick={() => handleViewDetails(emp)}
            >
              <div className="p-3.5 flex items-center gap-4">
                {/* Right Side: Avatar */}
                <div className="shrink-0 relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-black text-sm",
                      emp.is_active
                        ? "bg-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {emp.first_name[0]}
                    {emp.last_name[0]}
                  </div>
                  {emp.is_active && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  )}
                </div>

                {/* Center: Info */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-black text-sm text-foreground truncate">
                      {emp.first_name} {emp.last_name}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground/60">
                      {emp.personal_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {emp.status_name || "לא הוזן"}
                    </span>
                  </div>
                </div>

                {/* Left Side: Actions */}
                <div
                  className="flex items-center gap-4 no-export"
                  onClick={(e) => e.stopPropagation()}
                >
                  {emp.phone_number && (
                    <a
                      href={`tel:${emp.phone_number}`}
                      className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-primary transition-colors"
                    >
                      <div className="relative">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h2.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                    </a>
                  )}
                  <button className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-primary transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                  <div className="w-px h-6 bg-border/40 mx-1" />
                  <ChevronLeft className="w-4 h-4 text-muted-foreground/40" />
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
