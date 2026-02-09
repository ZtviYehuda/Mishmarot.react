import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Filter,
  RotateCcw,
  Check,
  Search,
  ChevronDown,
  Layers,
  ShieldCheck,
  UserMinus,
  CheckCircle2,
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: EmployeeFilters) => void;
  employees: Employee[];
}

export interface EmployeeFilters {
  departments?: string[];
  sections?: string[];
  teams?: string[];
  roles?: string[];
  serviceTypes?: string[];
  statuses?: string[];
  isCommander?: boolean;
  isAdmin?: boolean;
  hasSecurityClearance?: boolean;
  hasPoliceRicense?: boolean;
  searchText?: string;
  showInactive?: boolean;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  onApply,
  employees,
}) => {
  const { user } = useAuthContext();
  const [filters, setFilters] = useState<EmployeeFilters>({
    departments: [],
    sections: [],
    teams: [],
    roles: [],
    serviceTypes: [],
    statuses: [],
    isCommander: false,
    isAdmin: false,
    hasSecurityClearance: false,
    hasPoliceRicense: false,
    searchText: "",
    showInactive: false,
  });

  const [expandedSection, setExpandedSection] = useState<string | null>("org");

  // Extract unique values and build hierarchy
  const hierarchyData = useMemo(() => {
    const departments = new Map<string, Set<string>>();
    const sections = new Map<string, Set<string>>();
    const teams = new Set<string>();
    const roles = new Set<string>();
    const srvTypes = new Set<string>();
    const currStatuses = new Set<string>();

    employees.forEach((emp) => {
      if (emp.role_name) roles.add(emp.role_name);
      if (emp.team_name) teams.add(emp.team_name);
      if (emp.service_type_name) srvTypes.add(emp.service_type_name);
      if (emp.status_name) currStatuses.add(emp.status_name);

      if (emp.department_name) {
        if (!departments.has(emp.department_name)) {
          departments.set(emp.department_name, new Set());
        }
        if (emp.section_name) {
          departments.get(emp.department_name)?.add(emp.section_name);
        }
      }

      if (emp.section_name) {
        if (!sections.has(emp.section_name)) {
          sections.set(emp.section_name, new Set());
        }
        if (emp.team_name) {
          sections.get(emp.section_name)?.add(emp.team_name);
        }
      }
    });

    return {
      departments: new Map<string, string[]>(
        Array.from(departments.entries())
          .map(
            ([dept, sects]) =>
              [dept, Array.from(sects).sort()] as [string, string[]],
          )
          .sort(),
      ),
      sections: new Map<string, string[]>(
        Array.from(sections.entries())
          .map(
            ([sect, tms]) =>
              [sect, Array.from(tms).sort()] as [string, string[]],
          )
          .sort(),
      ),
      teams: Array.from(teams).sort(),
      roles: Array.from(roles).sort(),
      serviceTypes: Array.from(srvTypes).sort(),
      statuses: Array.from(currStatuses).sort(),
    };
  }, [employees]);

  const toggleFilter = (type: keyof EmployeeFilters, value: any) => {
    setFilters((prev: any) => {
      if (Array.isArray(prev[type])) {
        const current = (prev[type] as string[]) || [];
        const isSelected = current.includes(value);
        let next = isSelected
          ? current.filter((v) => v !== value)
          : [...current, value];

        // Hierarchical cleanup
        if (type === "departments") {
          return { ...prev, departments: next, sections: [], teams: [] };
        }
        if (type === "sections") {
          return { ...prev, sections: next, teams: [] };
        }

        return {
          ...prev,
          [type]: next,
        };
      }
      return { ...prev, [type]: value };
    });
  };

  // Filter labels based on user role
  const availableDepts = useMemo(() => {
    const depts = Array.from(hierarchyData.departments.keys());
    if (user?.is_admin) return depts;
    if (user?.department_name) return [user.department_name];
    return depts;
  }, [hierarchyData, user]);

  const availableSections = useMemo(() => {
    let sects: string[] = [];

    if (filters.departments && filters.departments.length > 0) {
      filters.departments.forEach((d) => {
        sects = [...sects, ...(hierarchyData.departments.get(d) || [])];
      });
    } else if (user?.is_admin) {
      if (user.department_name) {
        sects = hierarchyData.departments.get(user.department_name) || [];
      }
    } else if (user?.department_name) {
      sects = hierarchyData.departments.get(user.department_name) || [];
    } else if (user?.section_name) {
      sects = [user.section_name];
    }

    if (user?.section_name && !user?.is_admin) {
      return [user.section_name];
    }

    return Array.from(new Set(sects)).sort();
  }, [filters.departments, hierarchyData, user]);

  const availableTeams = useMemo(() => {
    let tms: string[] = [];
    if (filters.sections && filters.sections.length > 0) {
      filters.sections.forEach((s) => {
        tms = [...tms, ...(hierarchyData.sections.get(s) || [])];
      });
    } else if (user?.section_name && !user?.is_admin) {
      tms = hierarchyData.sections.get(user.section_name) || [];
    }
    return Array.from(new Set(tms)).sort();
  }, [filters.sections, hierarchyData, user]);

  const handleApply = () => {
    onApply({
      departments: filters.departments?.length
        ? filters.departments
        : undefined,
      sections: filters.sections?.length ? filters.sections : undefined,
      teams: filters.teams?.length ? filters.teams : undefined,
      roles: filters.roles?.length ? filters.roles : undefined,
      serviceTypes: filters.serviceTypes?.length
        ? filters.serviceTypes
        : undefined,
      statuses: filters.statuses?.length ? filters.statuses : undefined,
      isCommander: filters.isCommander || undefined,
      isAdmin: filters.isAdmin || undefined,
      hasSecurityClearance: filters.hasSecurityClearance || undefined,
      hasPoliceRicense: filters.hasPoliceRicense || undefined,
      searchText: filters.searchText || undefined,
      showInactive: filters.showInactive || undefined,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      departments: [],
      sections: [],
      teams: [],
      roles: [],
      serviceTypes: [],
      statuses: [],
      isCommander: false,
      isAdmin: false,
      hasSecurityClearance: false,
      hasPoliceRicense: false,
      searchText: "",
      showInactive: false,
    });
    onApply({});
    onOpenChange(false);
  };

  const activeFiltersCount = Object.entries(filters).reduce((acc, [_, val]) => {
    if (Array.isArray(val)) return acc + val.length;
    if (typeof val === "boolean" && val) return acc + 1;
    if (typeof val === "string" && val.trim() !== "") return acc + 1;
    return acc;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 border-none bg-card shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground mb-1 tracking-tight">
                סינון שוטרים מתקדם
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic tracking-tight">
                התאם את התצוגה המבוקשת לפי מדרג ארגוני, סוג שירות או מאפיינים אישיים
              </DialogDescription>
            </div>
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner shrink-0 scale-110 sm:scale-100">
              <Filter className="w-8 h-8" />
            </div>
          </div>

          <div className="relative mt-8 group">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/40 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="חיפוש חופשי (שם, מנ'א, תפקיד)..."
              value={filters.searchText}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              className="h-12 pr-12 pl-4 bg-background border-border/50 rounded-2xl text-sm font-black text-foreground focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-8 space-y-10 custom-scrollbar">
          {/* Organizational Structure */}
          <div className="space-y-6">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "org" ? null : "org")
              }
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shadow-sm">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-base font-black text-foreground leading-none">
                    מבנה ומדרג ארגוני
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
                    מחלקות, מדורים וחוליות
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full border border-border/50 flex items-center justify-center transition-all",
                expandedSection === "org" ? "bg-muted text-foreground" : "text-muted-foreground"
              )}>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    expandedSection === "org" && "rotate-180",
                  )}
                />
              </div>
            </button>

            {expandedSection === "org" && (
              <div className="space-y-6 pr-2 sm:pr-14 animate-in fade-in slide-in-from-top-4 duration-500 pb-4">
                {/* Departments */}
                {(user?.is_admin || availableDepts.length > 1) && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-indigo-600/70 uppercase tracking-widest flex items-center gap-2">
                      מחלקות
                      <div className="h-px bg-indigo-100 flex-1 opacity-50" />
                    </Label>
                    <div className="flex flex-wrap gap-2.5">
                      {availableDepts.map((dept) => (
                        <Button
                          key={dept}
                          variant="ghost"
                          onClick={() => toggleFilter("departments", dept)}
                          className={cn(
                            "h-9 px-4 rounded-xl text-xs font-black transition-all border",
                            filters.departments?.includes(dept)
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white"
                              : "bg-background text-muted-foreground border-border/50 hover:bg-muted hover:border-indigo-300 hover:text-indigo-600",
                          )}
                        >
                          {dept}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {availableSections.length > 0 &&
                  (availableSections.length > 1 || user?.is_admin) && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black text-blue-600/70 uppercase tracking-widest flex items-center gap-2">
                        מדורים
                        <div className="h-px bg-blue-100 flex-1 opacity-50" />
                      </Label>
                      <div className="flex flex-wrap gap-2.5">
                        {availableSections.map((sect) => (
                          <Button
                            key={sect}
                            variant="ghost"
                            onClick={() => toggleFilter("sections", sect)}
                            className={cn(
                              "h-9 px-4 rounded-xl text-xs font-black transition-all border",
                              filters.sections?.includes(sect)
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:text-white"
                                : "bg-background text-muted-foreground border-border/50 hover:bg-muted hover:border-blue-300 hover:text-blue-600",
                            )}
                          >
                            {sect}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Teams */}
                {availableTeams.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-emerald-600/70 uppercase tracking-widest flex items-center gap-2">
                      חוליות / צוותים
                      <div className="h-px bg-emerald-100 flex-1 opacity-50" />
                    </Label>
                    <div className="flex flex-wrap gap-2.5">
                      {availableTeams.map((team) => (
                        <Button
                          key={team}
                          variant="ghost"
                          onClick={() => toggleFilter("teams", team)}
                          className={cn(
                            "h-9 px-4 rounded-xl text-xs font-black transition-all border",
                            filters.teams?.includes(team)
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:text-white"
                              : "bg-background text-muted-foreground border-border/50 hover:bg-muted hover:border-emerald-300 hover:text-emerald-600",
                          )}
                        >
                          {team}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                  {/* Roles */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      תפקידים נבחרים
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {hierarchyData.roles.map((role) => (
                        <Button
                          key={role}
                          variant="outline"
                          onClick={() => toggleFilter("roles", role)}
                          className={cn(
                            "h-8 px-3 rounded-lg text-[11px] font-black transition-all",
                            filters.roles?.includes(role)
                              ? "bg-foreground text-background border-foreground"
                              : "bg-muted/30 text-muted-foreground border-border/50 hover:border-muted-foreground/30",
                          )}
                        >
                          {role}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Service Types */}
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      סוג שירות / מעמד
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {hierarchyData.serviceTypes.map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          onClick={() => toggleFilter("serviceTypes", type)}
                          className={cn(
                            "h-8 px-3 rounded-lg text-[11px] font-black transition-all",
                            filters.serviceTypes?.includes(type)
                              ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/10"
                              : "bg-muted/30 text-muted-foreground border-border/50 hover:border-primary/30",
                          )}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border/40 w-full" />

          {/* Permissions & Security */}
          <div className="space-y-6">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "security" ? null : "security",
                )
              }
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-base font-black text-foreground leading-none">
                    הרשאות ומאפיינים
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest mt-1">
                    דיווח, פיקוד וניהול
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-8 h-8 rounded-full border border-border/50 flex items-center justify-center transition-all",
                expandedSection === "security" ? "bg-muted text-foreground" : "text-muted-foreground"
              )}>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    expandedSection === "security" && "rotate-180",
                  )}
                />
              </div>
            </button>

            {expandedSection === "security" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2 sm:pr-14 animate-in fade-in slide-in-from-top-4 duration-500 pb-4">
                {[
                  { id: "isCommander", label: "מפקדים בלבד", icon: ShieldCheck },
                  { id: "isAdmin", label: "מנהלי מערכת", icon: CheckCircle2 },
                  { id: "hasSecurityClearance", label: "בעלי סיווג ביטחוני", icon: CheckCircle2 },
                  { id: "hasPoliceRicense", label: "רישיון נהיגה משטרתי", icon: CheckCircle2 },
                ].map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() =>
                      toggleFilter(
                        item.id as any,
                        !filters[item.id as keyof EmployeeFilters],
                      )
                    }
                    className={cn(
                      "flex items-center justify-start gap-4 p-5 h-auto rounded-2xl border-2 transition-all text-right",
                      filters[item.id as keyof EmployeeFilters]
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/20"
                        : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:border-border/50",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                        filters[item.id as keyof EmployeeFilters]
                          ? "bg-white/20 border-white/30"
                          : "bg-background border-border/50",
                      )}
                    >
                      {filters[item.id as keyof EmployeeFilters] && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-black tracking-tight">{item.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Toggle */}
          <div className="pt-2">
            <button
              onClick={() =>
                toggleFilter("showInactive", !filters.showInactive)
              }
              className={cn(
                "w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all group",
                filters.showInactive
                  ? "bg-red-500/5 border-red-500/20 text-red-600 shadow-xl shadow-red-500/5"
                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:border-border/30",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    filters.showInactive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                      : "bg-background text-muted-foreground group-hover:text-foreground shadow-sm",
                  )}
                >
                  <UserMinus className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black tracking-tight">
                    הצגת שוטרים שאינם פעילים
                  </span>
                  <span className="text-[10px] font-black opacity-60 uppercase tracking-widest mt-0.5">
                    כולל שוטרים בתהליך שחרור או מושבתים באופן זמני
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors p-1",
                  filters.showInactive
                    ? "bg-red-600"
                    : "bg-muted-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "w-3 h-3 bg-white rounded-full transition-all duration-300 shadow-sm",
                    filters.showInactive ? "translate-x-0" : "-translate-x-5",
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row gap-4 items-center">
          <Button
            onClick={handleApply}
            className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-14 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] gap-3 text-base"
          >
            <Filter className="w-5 h-5" />
            החל את הגדרות הסינון
            {activeFiltersCount > 0 && (
              <span className="bg-primary-foreground/20 px-2.5 py-0.5 rounded-full text-[11px] font-black mr-1">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="w-full sm:w-auto px-8 rounded-2xl h-14 font-black text-muted-foreground hover:text-foreground hover:bg-muted transition-all gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4 opacity-70" />
            איפוס הגדרות
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
