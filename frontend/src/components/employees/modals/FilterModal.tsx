import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";
import type { Employee } from "@/types/employee.types";

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

  const [expandedSections, setExpandedSections] = useState({
    departments: false,
    sections: false,
    teams: false,
  });

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

      // Build department -> sections hierarchy
      if (emp.department_name) {
        if (!departments.has(emp.department_name)) {
          departments.set(emp.department_name, new Set());
        }
        if (emp.section_name) {
          departments.get(emp.department_name)?.add(emp.section_name);
        }
      }

      // Build section -> teams hierarchy
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

  // Get available sections for selected departments
  const availableSections = useMemo(() => {
    if (!filters.departments?.length) return [];
    const sectionsSet = new Set<string>();
    filters.departments.forEach((dept) => {
      hierarchyData.departments.get(dept)?.forEach((sect) => {
        sectionsSet.add(sect);
      });
    });
    return Array.from(sectionsSet).sort();
  }, [filters.departments, hierarchyData.departments]);

  // Get available teams for selected sections
  const availableTeams = useMemo(() => {
    if (!filters.sections?.length) return [];
    const teamsSet = new Set<string>();
    filters.sections.forEach((sect) => {
      hierarchyData.sections.get(sect)?.forEach((team) => {
        teamsSet.add(team);
      });
    });
    return Array.from(teamsSet).sort();
  }, [filters.sections, hierarchyData.sections]);

  const handleStatusToggle = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses?.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...(prev.statuses || []), status],
    }));
  };

  const handleDepartmentToggle = (dept: string) => {
    setFilters((prev) => ({
      ...prev,
      departments: prev.departments?.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...(prev.departments || []), dept],
      // Reset sections and teams when departments change
      sections: [],
      teams: [],
    }));
  };

  const handleSectionToggle = (section: string) => {
    setFilters((prev) => ({
      ...prev,
      sections: prev.sections?.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...(prev.sections || []), section],
      // Reset teams when sections change
      teams: [],
    }));
  };

  const handleTeamToggle = (team: string) => {
    setFilters((prev) => ({
      ...prev,
      teams: prev.teams?.includes(team)
        ? prev.teams.filter((t) => t !== team)
        : [...(prev.teams || []), team],
    }));
  };

  const handleRoleToggle = (role: string) => {
    setFilters((prev) => ({
      ...prev,
      roles: prev.roles?.includes(role)
        ? prev.roles.filter((r) => r !== role)
        : [...(prev.roles || []), role],
    }));
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
    setExpandedSections({
      departments: false,
      sections: false,
      teams: false,
    });
    onApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-semibold text-[#001e30] dark:text-white">
            סינון מתקדם
          </DialogTitle>
          <DialogDescription className="text-right text-slate-600 dark:text-slate-300">
            בחר את הפרמטרים לסינון המשרתים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Text */}
          <div className="space-y-2 text-right">
            <Label htmlFor="search" className="text-sm font-medium text-right block">
              חיפוש טקסט
            </Label>
            <Input
              id="search"
              value={filters.searchText || ""}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              placeholder="חיפוש לפי שם או מספר אישי"
              className="border-slate-200 dark:border-slate-700 focus:border-[#0074ff] text-right"
              dir="rtl"
            />
          </div>

          {/* Status */}
          {hierarchyData.statuses.length > 0 && (
            <div className="space-y-3 text-right">
              <Label className="text-sm font-semibold text-right block text-[#001e30] dark:text-white">
                סטטוס
              </Label>
              <div className="grid grid-cols-2 gap-3 pr-2">
                {hierarchyData.statuses.map((status) => (
                  <div key={status} className="flex items-center gap-2 justify-start">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses?.includes(status) || false}
                      onCheckedChange={() => handleStatusToggle(status)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                      {status}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department - Collapsible */}
          {Array.from(hierarchyData.departments.keys()).length > 0 && (
            <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, departments: !prev.departments }))}
                className="flex items-center gap-2 justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-right text-[#001e30] dark:text-white">
                  מחלקה
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedSections.departments ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedSections.departments && (
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {Array.from(hierarchyData.departments.keys()).map((dept) => (
                    <div key={dept} className="flex items-center gap-2 justify-start">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={filters.departments?.includes(dept) || false}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section - Collapsible (only shows if departments selected) */}
          {filters.departments?.length! > 0 && availableSections.length > 0 && (
            <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, sections: !prev.sections }))}
                className="flex items-center gap-2 justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-right text-[#001e30] dark:text-white">
                  מדור
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedSections.sections ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedSections.sections && (
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {availableSections.map((section) => (
                    <div key={section} className="flex items-center gap-2 justify-start">
                      <Checkbox
                        id={`section-${section}`}
                        checked={filters.sections?.includes(section) || false}
                        onCheckedChange={() => handleSectionToggle(section)}
                      />
                      <label htmlFor={`section-${section}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        {section}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Teams - Collapsible (only shows if sections selected) */}
          {filters.sections?.length! > 0 && availableTeams.length > 0 && (
            <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                onClick={() => setExpandedSections(prev => ({ ...prev, teams: !prev.teams }))}
                className="flex items-center gap-2 justify-between w-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <span className="text-sm font-semibold text-right text-[#001e30] dark:text-white">
                  צוות
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${expandedSections.teams ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedSections.teams && (
                <div className="grid grid-cols-2 gap-3 pr-4">
                  {availableTeams.map((team) => (
                    <div key={team} className="flex items-center gap-2 justify-start">
                      <Checkbox
                        id={`team-${team}`}
                        checked={filters.teams?.includes(team) || false}
                        onCheckedChange={() => handleTeamToggle(team)}
                      />
                      <label htmlFor={`team-${team}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                        {team}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Role */}
          {hierarchyData.roles.length > 0 && (
            <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
              <Label className="text-sm font-semibold text-right block text-[#001e30] dark:text-white">
                תפקיד
              </Label>
              <div className="grid grid-cols-2 gap-3 pr-2">
                {hierarchyData.roles.map((role) => (
                  <div key={role} className="flex items-center gap-2 justify-start">
                    <Checkbox
                      id={`role-${role}`}
                      checked={filters.roles?.includes(role) || false}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <label htmlFor={`role-${role}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
            <Label className="text-sm font-semibold text-right block text-[#001e30] dark:text-white">
              הרשאות ודרגות
            </Label>
            <div className="space-y-2 pr-2">
              <div className="flex items-center gap-2 justify-start">
                <Checkbox
                  id="commander"
                  checked={filters.isCommander || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, isCommander: checked === true })
                  }
                />
                <label htmlFor="commander" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  מפקד
                </label>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <Checkbox
                  id="admin"
                  checked={filters.isAdmin || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, isAdmin: checked === true })
                  }
                />
                <label htmlFor="admin" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  מנהל מערכת
                </label>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <Checkbox
                  id="clearance"
                  checked={filters.hasSecurityClearance || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasSecurityClearance: checked === true })
                  }
                />
                <label htmlFor="clearance" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  בעל סודיות
                </label>
              </div>
              <div className="flex items-center gap-2 justify-start">
                <Checkbox
                  id="license"
                  checked={filters.hasPoliceRicense || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasPoliceRicense: checked === true })
                  }
                />
                <label htmlFor="license" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                  רישיון משטרה
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-start border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
              <Checkbox
                id="inactive"
                checked={filters.showInactive || false}
                onCheckedChange={(checked) =>
                  setFilters({ ...filters, showInactive: checked === true })
                }
                className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
              />
              <label htmlFor="inactive" className="text-sm cursor-pointer text-slate-700 dark:text-slate-300 font-bold text-red-500">
                הצג משרתים לא פעילים
              </label>
            </div>
          </div>
        </div>


        <DialogFooter className="gap-2 sm:gap-0 mt-6 flex-row-reverse">
          <Button
            type="button"
            onClick={handleApply}
            className="bg-[#0074ff] hover:bg-[#0060d5] text-white"
          >
            החל סינון
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-slate-200 dark:border-slate-700"
          >
            איפוס
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
};
