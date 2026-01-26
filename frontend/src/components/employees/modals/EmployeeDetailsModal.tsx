import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Building2,
  Users,
  Award,
} from "lucide-react";

interface EmployeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  if (!employee) return null;

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-semibold text-[#001e30] dark:text-white flex items-center gap-3 flex-row-reverse">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0074ff] to-[#0060d5] flex items-center justify-center text-white font-semibold text-lg">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>
            <div className="text-right">
              <div>{employee.first_name} {employee.last_name}</div>
              <div className="text-sm font-normal text-slate-400 mt-1">
                מספר אישי: {employee.personal_number}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-right">
            פרטים מלאים של המשרת
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex-row-reverse text-right">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: employee.status_color }}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {employee.status_name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "ml-auto font-medium text-xs border-none px-3 py-1",
                employee.is_commander
                  ? "bg-blue-50 text-[#0074ff] dark:bg-[#0074ff]/10"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800",
              )}
            >
              {getProfessionalTitle(employee)}
            </Badge>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex-row-reverse">
                <User className="w-4 h-4" />
                פרטים אישיים
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between flex-row-reverse">
                  <span className="text-slate-400">מספר אישי:</span>
                  <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                    {employee.personal_number}
                  </span>
                </div>
                {employee.phone_number && (
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      טלפון:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {employee.phone_number}
                    </span>
                  </div>
                )}
                {employee.city && (
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      עיר:
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {employee.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-right">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 flex-row-reverse">
                <Calendar className="w-4 h-4" />
                תאריכים
              </div>
              <div className="space-y-2 text-sm">
                {employee.birth_date && (
                  <div className="flex justify-between flex-row-reverse">
                    <span className="text-slate-400">תאריך לידה:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(employee.birth_date).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}
                {employee.enlistment_date && (
                  <div className="flex justify-between flex-row-reverse">
                    <span className="text-slate-400">תאריך גיוס:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(employee.enlistment_date).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}
                {employee.discharge_date && (
                  <div className="flex justify-between flex-row-reverse">
                    <span className="text-slate-400">תאריך שחרור:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(employee.discharge_date).toLocaleDateString("he-IL")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Organizational Information */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-right">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex-row-reverse">
              <Building2 className="w-4 h-4" />
              שיוך ארגוני
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex-row-reverse">
                <Building2 className="w-4 h-4 text-[#0074ff]" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium uppercase">
                    מחלקה
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.department_name || "ללא מחלקה"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex-row-reverse">
                <Users className="w-4 h-4 text-[#0074ff]" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium uppercase">
                    מדור
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.section_name || "ללא מדור"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 flex-row-reverse">
                <Award className="w-4 h-4 text-[#0074ff]" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium uppercase">
                    צוות
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {employee.team_name || "ללא צוות"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 text-right">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex-row-reverse">
              <Shield className="w-4 h-4" />
              אבטחה והרשאות
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-slate-400 text-sm">רמת סיווג:</span>
                <Badge variant="outline" className="font-medium">
                  {employee.security_clearance}
                </Badge>
              </div>
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-slate-400 text-sm">רישיון משטרה:</span>
                <Badge
                  variant={employee.police_license ? "default" : "outline"}
                  className="font-medium"
                >
                  {employee.police_license ? "כן" : "לא"}
                </Badge>
              </div>
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-slate-400 text-sm">מנהל מערכת:</span>
                <Badge
                  variant={employee.is_admin ? "default" : "outline"}
                  className="font-medium"
                >
                  {employee.is_admin ? "כן" : "לא"}
                </Badge>
              </div>
              <div className="flex justify-between items-center flex-row-reverse">
                <span className="text-slate-400 text-sm">מפקד:</span>
                <Badge
                  variant={employee.is_commander ? "default" : "outline"}
                  className="font-medium"
                >
                  {employee.is_commander ? "כן" : "לא"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
