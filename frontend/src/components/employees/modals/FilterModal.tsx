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
  Users,
  Network
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: EmployeeFilters) => void;
  employees: Employee[];
}

export interface EmployeeFilters {
  statuses?: string[];
  departments?: string[];
  sections?: string[];
  teams?: string[];
  roles?: string[];
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
  const [filters, setFilters] = useState<EmployeeFilters>({
    statuses: [],
    departments: [],
    sections: [],
    teams: [],
    roles: [],
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
    const statuses = new Set<string>();
    const departments = new Map<string, Set<string>>();
    const sections = new Map<string, Set<string>>();
    const teams = new Set<string>();
    const roles = new Set<string>();

    employees.forEach((emp) => {
      if (emp.status_name) statuses.add(emp.status_name);
      if (emp.role_name) roles.add(emp.role_name);
      if (emp.team_name) teams.add(emp.team_name);

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
      statuses: Array.from(statuses).sort(),
      departments: new Map<string, string[]>(
        Array.from(departments.entries())
          .map(([dept, sects]) => [dept, Array.from(sects).sort()] as [string, string[]])
          .sort()
      ),
      sections: new Map<string, string[]>(
        Array.from(sections.entries())
          .map(([sect, tms]) => [sect, Array.from(tms).sort()] as [string, string[]])
          .sort()
      ),
      teams: Array.from(teams).sort(),
      roles: Array.from(roles).sort(),
    };
  }, [employees]);

  const toggleFilter = (type: keyof EmployeeFilters, value: any) => {
    setFilters((prev: any) => {
      if (Array.isArray(prev[type])) {
        const current = (prev[type] as string[]) || [];
        return {
          ...prev,
          [type]: current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value]
        };
      }
      return { ...prev, [type]: value };
    });
  };

  const handleApply = () => {
    onApply({
      statuses: filters.statuses?.length ? filters.statuses : undefined,
      departments: filters.departments?.length ? filters.departments : undefined,
      sections: filters.sections?.length ? filters.sections : undefined,
      teams: filters.teams?.length ? filters.teams : undefined,
      roles: filters.roles?.length ? filters.roles : undefined,
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
      statuses: [],
      departments: [],
      sections: [],
      teams: [],
      roles: [],
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

  const activeFiltersCount = Object.entries(filters).reduce((acc, [key, val]) => {
    if (Array.isArray(val)) return acc + val.length;
    if (typeof val === 'boolean' && val) return acc + 1;
    if (typeof val === 'string' && val.trim() !== '') return acc + 1;
    return acc;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[32px] border-none bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">

        <DialogHeader className="p-8 pb-4 text-right">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                סינון שוטרים מתקדם
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-400">
                התאם את התצוגה לפי פרמטרים ארגוניים ואישיים
              </DialogDescription>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#0074ff]/10 flex items-center justify-center text-[#0074ff] border border-[#0074ff]/20">
              <Filter className="w-6 h-6" />
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              placeholder="חיפוש חופשי לפי שם או מספר אישי..."
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              className="h-12 pr-11 pl-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#0074ff]/20"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">

          {/* Status Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">סטטוס נוכחות</Label>
              {filters.statuses?.length ? <span className="text-[10px] font-bold text-[#0074ff]">({filters.statuses.length} נבחרו)</span> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {hierarchyData.statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleFilter('statuses', status)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    filters.statuses?.includes(status)
                      ? "bg-[#0074ff] text-white shadow-lg shadow-blue-500/20"
                      : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                  )}
                >
                  {filters.statuses?.includes(status) && <Check className="w-3 h-3" />}
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full" />

          {/* Organizational Structure */}
          <div className="space-y-4">
            <button
              onClick={() => setExpandedSection(expandedSection === 'org' ? null : 'org')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">מבנה ארגוני</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSection === 'org' && "rotate-180")} />
            </button>

            {expandedSection === 'org' && (
              <div className="space-y-5 pr-11 animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
                {/* Departments */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 block mb-2">מחלקות</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(hierarchyData.departments.keys()).map((dept) => (
                      <button
                        key={dept}
                        onClick={() => toggleFilter('departments', dept)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                          filters.departments?.includes(dept)
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-indigo-200"
                        )}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Roles */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 block mb-2">תפקידים</Label>
                  <div className="flex flex-wrap gap-2">
                    {hierarchyData.roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => toggleFilter('roles', role)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all",
                          filters.roles?.includes(role)
                            ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                            : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:border-slate-300"
                        )}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800 w-full" />

          {/* Permissions & Badges */}
          <div className="space-y-4">
            <button
              onClick={() => setExpandedSection(expandedSection === 'security' ? null : 'security')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">הרשאות ומאפיינים</span>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedSection === 'security' && "rotate-180")} />
            </button>

            {expandedSection === 'security' && (
              <div className="grid grid-cols-2 gap-3 pr-11 animate-in fade-in slide-in-from-top-2 duration-300 pb-2">
                {[
                  { id: 'isCommander', label: 'מפקדים בלבד', color: 'blue' },
                  { id: 'isAdmin', label: 'מנהלי מערכת', color: 'indigo' },
                  { id: 'hasSecurityClearance', label: 'בעלי סיווג ביטחוני', color: 'emerald' },
                  { id: 'hasPoliceRicense', label: 'רישיון משטרה', color: 'slate' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleFilter(item.id as any, !filters[item.id as keyof EmployeeFilters])}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all text-right",
                      filters[item.id as keyof EmployeeFilters]
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border",
                      filters[item.id as keyof EmployeeFilters] ? "bg-white/20 border-white/30" : "border-slate-200"
                    )}>
                      {filters[item.id as keyof EmployeeFilters] && <Check className="w-3 h-3" />}
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
              onClick={() => toggleFilter('showInactive', !filters.showInactive)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                filters.showInactive
                  ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/10 dark:border-red-900/30"
                  : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  filters.showInactive ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                )}>
                  <UserMinus className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-black">הצג שוטרים שאינם פעילים</span>
                  <span className="text-[10px] font-bold opacity-60">כולל שוטרים בתהליך שחרור או מושבתים</span>
                </div>
              </div>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors p-1",
                filters.showInactive ? "bg-red-500" : "bg-slate-300 dark:bg-slate-700"
              )}>
                <div className={cn(
                  "w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
                  filters.showInactive ? "translate-x-0" : "-translate-x-5"
                )} />
              </div>
            </button>
          </div>

        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={handleApply}
              className="flex-1 bg-[#0074ff] hover:bg-[#0060d5] text-white font-black rounded-2xl h-12 shadow-xl shadow-blue-500/20 transition-all active:scale-95 gap-2 text-sm"
            >
              <Filter className="w-4 h-4" />
              החל סינון מתקדם
              {activeFiltersCount > 0 && <span className="mr-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{activeFiltersCount}</span>}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="px-8 border-slate-200 dark:border-slate-800 rounded-2xl h-12 font-bold text-slate-500 hover:bg-white transition-all shadow-sm gap-2"
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
