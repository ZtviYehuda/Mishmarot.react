import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import { User, MoreVertical } from "lucide-react";

interface EmployeeCardProps {
  employee: Employee;
  onViewDetails: (employee: Employee) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onViewDetails,
}) => {
  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.department_name && emp.section_name) return "ראש מדור";
      if (emp.department_name) return "ראש מחלקה";
      return "מפקד יחידה";
    }
    return "משרת";
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-slate-200 dark:border-slate-700 hover:border-[#0074ff]/30 dark:hover:border-[#0074ff]/50 bg-white dark:bg-slate-800/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0074ff] to-[#0060d5] flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight">
                {employee.first_name} {employee.last_name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {employee.personal_number}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-slate-400 hover:text-[#0074ff] hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={() => onViewDetails(employee)}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: employee.status_color || undefined }}
            />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {employee.status_name}
            </span>
          </div>

          {/* Role Badge */}
          <div>
            <Badge
              variant="outline"
              className={cn(
                "font-bold text-[10px] border-none px-2.5 py-1",
                employee.is_commander
                  ? "bg-blue-50 text-[#0074ff] dark:bg-[#0074ff]/10"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-700",
              )}
            >
              {getProfessionalTitle(employee)}
            </Badge>
          </div>

          {/* Organizational Info */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
            <div className="text-xs">
              <span className="text-slate-400 font-bold">מחלקה: </span>
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                {employee.department_name || "ללא מחלקה"}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-bold">מדור: </span>
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                {employee.section_name || "ללא מדור"}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-bold">צוות: </span>
              <span className="text-slate-600 dark:text-slate-300 font-bold">
                {employee.team_name || "ללא צוות"}
              </span>
            </div>
          </div>

          {/* Security Clearance */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">רמת סיווג:</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold",
                  employee.security_clearance
                    ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-slate-50 text-slate-400",
                )}
              >
                {employee.security_clearance ? "קיים" : "ללא"}
              </Badge>
            </div>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 border-slate-200 dark:border-slate-700 hover:bg-[#0074ff] hover:text-white hover:border-[#0074ff] transition-colors"
            onClick={() => onViewDetails(employee)}
          >
            <User className="w-3 h-3 ml-2" />
            צפה בפרטים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
