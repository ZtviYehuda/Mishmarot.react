import React, { useState, useMemo, useEffect } from "react";
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
  Users,
  Network,
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
    // If they aren't admin and don't have dept name, but have employees with depts, 
    // maybe they are a commander with scope.
    return depts;
  }, [hierarchyData, user]);

  const availableSections = useMemo(() => {
    let sects: string[] = [];

    // If something selected, show those
    if (filters.departments && filters.departments.length > 0) {
      filters.departments.forEach(d => {
        sects = [...sects, ...(hierarchyData.departments.get(d) || [])];
      });
    } else if (user?.is_admin) {
      // Show all if admin and nothing selected? Or maybe better to wait for dept?
      // User wants "chain", so if department commander, show their sections.
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
      filters.sections.forEach(s => {
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

  const activeFiltersCount = Object.entries(filters).reduce(
    (acc, [key, val]) => {
      if (Array.isArray(val)) return acc + val.length;
      if (typeof val === "boolean" && val) return acc + 1;
      if (typeof val === "string" && val.trim() !== "") return acc + 1;
      return acc;
    },
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden rounded-[32px] border border-border bg-card shadow-2xl flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        <DialogHeader className="p-8 pb-4 text-right">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black text-foreground mb-1">
                סינון שוטרים מתקדם
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground">
                התאם את התצוגה לפי פרמטרים ארגוניים ואישיים
              </DialogDescription>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Filter className="w-6 h-6" />
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              placeholder="חיפוש חופשי לפי שם או מספר אישי..."
              value={filters.searchText}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              className="h-12 pr-11 pl-4 bg-muted/50 border-input rounded-2xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
          {/* Organizational Structure */}
          <div className="space-y-4">
            <button
              onClick={() =>
                setExpandedSection(expandedSection === "org" ? null : "org")
              }
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-foreground">
                  מבנה ארגוני
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  expandedSection === "org" && "rotate-180",
                )}
              />
            </button>

            {expandedSection === "org" && (
              <div className="space-y-5 pr-11 animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
                {/* Departments - Only for Admins or if multiple depts exist */}
                {(user?.is_admin || availableDepts.length > 1) && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-2">
                      מחלקות
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableDepts.map((dept) => (
                        <button
                          key={dept}
                          onClick={() => toggleFilter("departments", dept)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                            filters.departments?.includes(dept)
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                              : "bg-muted/50 text-muted-foreground border border-border hover:border-indigo-200",
                          )}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                {availableSections.length > 0 && (availableSections.length > 1 || user?.is_admin) && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-2">
                      מדורים
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableSections.map((sect) => (
                        <button
                          key={sect}
                          onClick={() => toggleFilter("sections", sect)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                            filters.sections?.includes(sect)
                              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                              : "bg-muted/50 text-muted-foreground border border-border hover:border-blue-200",
                          )}
                        >
                          {sect}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Teams */}
                {availableTeams.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block mb-2">
                      חוליות
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTeams.map((team) => (
                        <button
                          key={team}
                          onClick={() => toggleFilter("teams", team)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                            filters.teams?.includes(team)
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                              : "bg-muted/50 text-muted-foreground border border-border hover:border-emerald-200",
                          )}
                        >
                          {team}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roles */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground block mb-2">
                    תפקידים
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {hierarchyData.roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => toggleFilter("roles", role)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                          filters.roles?.includes(role)
                            ? "bg-foreground text-background"
                            : "bg-muted/50 text-muted-foreground border border-border hover:border-border/80",
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Types (Rank) */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground block mb-2">
                    מעמד / סוג שירות
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {hierarchyData.serviceTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => toggleFilter("serviceTypes", type)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                          filters.serviceTypes?.includes(type)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-muted-foreground border border-border hover:border-border/80",
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Statuses */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground block mb-2">
                    סטטוס נוכחות נוכחי
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {hierarchyData.statuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleFilter("statuses", status)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                          filters.statuses?.includes(status)
                            ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            : "bg-muted/50 text-muted-foreground border border-border hover:border-emerald-200",
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-border w-full" />

          {/* Permissions & Badges */}
          <div className="space-y-4">
            <button
              onClick={() =>
                setExpandedSection(
                  expandedSection === "security" ? null : "security",
                )
              }
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-foreground">
                  הרשאות ומאפיינים
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  expandedSection === "security" && "rotate-180",
                )}
              />
            </button>

            {expandedSection === "security" && (
              <div className="grid grid-cols-2 gap-3 pr-11 animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
                {[
                  { id: "isCommander", label: "מפקדים בלבד", color: "blue" },
                  { id: "isAdmin", label: "מנהלי מערכת", color: "indigo" },
                  {
                    id: "hasSecurityClearance",
                    label: "בעלי סיווג ביטחוני",
                    color: "emerald",
                  },
                  {
                    id: "hasPoliceRicense",
                    label: "רישיון משטרה",
                    color: "slate",
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      toggleFilter(
                        item.id as any,
                        !filters[item.id as keyof EmployeeFilters],
                      )
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all text-right",
                      filters[item.id as keyof EmployeeFilters]
                        ? "bg-foreground border-foreground text-background"
                        : "bg-muted/30 border-border text-muted-foreground hover:border-border/80",
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center border",
                        filters[item.id as keyof EmployeeFilters]
                          ? "bg-background/20 border-background/30"
                          : "border-border",
                      )}
                    >
                      {filters[item.id as keyof EmployeeFilters] && (
                        <Check className="w-3 h-3" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold">{item.label}</span>
                  </button>
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
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                filters.showInactive
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    filters.showInactive
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <UserMinus className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-black">
                    הצג שוטרים שאינם פעילים
                  </span>
                  <span className="text-[10px] font-bold opacity-60">
                    כולל שוטרים בתהליך שחרור או מושבתים
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors p-1",
                  filters.showInactive
                    ? "bg-destructive"
                    : "bg-muted-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                    filters.showInactive ? "translate-x-0" : "-translate-x-5",
                  )}
                />
              </div>
            </button>
          </div>
        </div>

        <div className="p-8 bg-muted/30 border-t border-border flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={handleApply}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-12 shadow-xl shadow-primary/20 transition-all active:scale-95 gap-2 text-sm"
            >
              <Filter className="w-4 h-4" />
              החל סינון מתקדם
              {activeFiltersCount > 0 && (
                <span className="mr-1 bg-primary-foreground/20 px-2 py-0.5 rounded-full text-[10px]">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="px-8 border-border rounded-2xl h-12 font-bold text-muted-foreground hover:bg-muted transition-all shadow-sm gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              איפוס
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
