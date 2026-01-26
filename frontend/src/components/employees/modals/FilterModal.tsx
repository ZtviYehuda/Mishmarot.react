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
  roles?: string[];
  isCommander?: boolean;
  isAdmin?: boolean;
  hasSecurityClearance?: boolean;
  hasPoliceRicense?: boolean;
  searchText?: string;
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
    roles: [],
    isCommander: false,
    isAdmin: false,
    hasSecurityClearance: false,
    hasPoliceRicense: false,
    searchText: "",
  });

  // Extract unique values from employees
  const uniqueValues = useMemo(() => {
    const statuses = new Set<string>();
    const departments = new Set<string>();
    const sections = new Set<string>();
    const roles = new Set<string>();

    employees.forEach((emp) => {
      if (emp.status_name) statuses.add(emp.status_name);
      if (emp.department_name) departments.add(emp.department_name);
      if (emp.section_name) sections.add(emp.section_name);
      if (emp.role_name) roles.add(emp.role_name);
    });

    return {
      statuses: Array.from(statuses).sort(),
      departments: Array.from(departments).sort(),
      sections: Array.from(sections).sort(),
      roles: Array.from(roles).sort(),
    };
  }, [employees]);

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
    }));
  };

  const handleSectionToggle = (section: string) => {
    setFilters((prev) => ({
      ...prev,
      sections: prev.sections?.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...(prev.sections || []), section],
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
      roles: filters.roles?.length ? filters.roles : undefined,
      isCommander: filters.isCommander || undefined,
      isAdmin: filters.isAdmin || undefined,
      hasSecurityClearance: filters.hasSecurityClearance || undefined,
      hasPoliceRicense: filters.hasPoliceRicense || undefined,
      searchText: filters.searchText || undefined,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({
      statuses: [],
      departments: [],
      sections: [],
      roles: [],
      isCommander: false,
      isAdmin: false,
      hasSecurityClearance: false,
      hasPoliceRicense: false,
      searchText: "",
    });
    onApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-semibold text-[#001e30] dark:text-white">
            סינון מתקדם
          </DialogTitle>
          <DialogDescription className="text-right">
            בחר את הפרמטרים לסינון המשרתים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pr-0">
          {/* Search Text */}
          <div className="space-y-2 text-right">
            <Label htmlFor="search" className="text-sm font-medium text-right">
              חיפוש טקסט
            </Label>
            <Input
              id="search"
              value={filters.searchText || ""}
              onChange={(e) =>
                setFilters({ ...filters, searchText: e.target.value })
              }
              placeholder="חיפוש לפי שם או מספר אישי"
              className="border-slate-200 focus:border-[#0074ff] text-right"
            />
          </div>

          {/* Status */}
          {uniqueValues.statuses.length > 0 && (
            <div className="space-y-3 text-right">
              <Label className="text-sm font-medium text-right">סטטוס</Label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueValues.statuses.map((status) => (
                  <div key={status} className="flex items-center gap-2 justify-end">
                    <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                      {status}
                    </label>
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses?.includes(status) || false}
                      onCheckedChange={() => handleStatusToggle(status)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department */}
          {uniqueValues.departments.length > 0 && (
            <div className="space-y-3 text-right">
              <Label className="text-sm font-medium text-right">מחלקה</Label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueValues.departments.map((dept) => (
                  <div key={dept} className="flex items-center gap-2 justify-end">
                    <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer">
                      {dept}
                    </label>
                    <Checkbox
                      id={`dept-${dept}`}
                      checked={filters.departments?.includes(dept) || false}
                      onCheckedChange={() => handleDepartmentToggle(dept)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section */}
          {uniqueValues.sections.length > 0 && (
            <div className="space-y-3 text-right">
              <Label className="text-sm font-medium text-right">מדור</Label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueValues.sections.map((section) => (
                  <div key={section} className="flex items-center gap-2 justify-end">
                    <label htmlFor={`section-${section}`} className="text-sm cursor-pointer">
                      {section}
                    </label>
                    <Checkbox
                      id={`section-${section}`}
                      checked={filters.sections?.includes(section) || false}
                      onCheckedChange={() => handleSectionToggle(section)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Role */}
          {uniqueValues.roles.length > 0 && (
            <div className="space-y-3 text-right">
              <Label className="text-sm font-medium text-right">תפקיד</Label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueValues.roles.map((role) => (
                  <div key={role} className="flex items-center gap-2 justify-end">
                    <label htmlFor={`role-${role}`} className="text-sm cursor-pointer">
                      {role}
                    </label>
                    <Checkbox
                      id={`role-${role}`}
                      checked={filters.roles?.includes(role) || false}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-3 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
            <Label className="text-sm font-medium text-right">הרשאות ודרגות</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-end">
                <label htmlFor="commander" className="text-sm cursor-pointer">
                  מפקד
                </label>
                <Checkbox
                  id="commander"
                  checked={filters.isCommander || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, isCommander: checked === true })
                  }
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <label htmlFor="admin" className="text-sm cursor-pointer">
                  מנהל מערכת
                </label>
                <Checkbox
                  id="admin"
                  checked={filters.isAdmin || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, isAdmin: checked === true })
                  }
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <label htmlFor="clearance" className="text-sm cursor-pointer">
                  בעל סודיות
                </label>
                <Checkbox
                  id="clearance"
                  checked={filters.hasSecurityClearance || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasSecurityClearance: checked === true })
                  }
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <label htmlFor="license" className="text-sm cursor-pointer">
                  רישיון משטרה
                </label>
                <Checkbox
                  id="license"
                  checked={filters.hasPoliceRicense || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, hasPoliceRicense: checked === true })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-slate-200"
          >
            איפוס
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-[#0074ff] hover:bg-[#0060d5] text-white"
          >
            החל סינון
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
