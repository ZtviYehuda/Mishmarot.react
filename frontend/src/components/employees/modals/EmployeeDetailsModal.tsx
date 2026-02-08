import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types/employee.types";
import { cn, cleanUnitName } from "@/lib/utils";
import {
  Phone,
  MapPin,
  Calendar,
  Building2,
  Contact,
  Cake,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";

interface EmployeeDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

const InfoItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {label}
    </span>
    <span className="text-sm font-semibold text-foreground">
      {value || "---"}
    </span>
  </div>
);

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  const navigate = useNavigate();
  if (!employee) return null;

  const getProfessionalTitle = (emp: Employee) => {
    if (emp.is_admin && emp.is_commander) return "מנהל מערכת בכיר";
    if (emp.is_commander) {
      if (emp.department_name && emp.section_name) return "ראש מדור";
      if (emp.department_name) return "ראש מחלקה";
      return "מפקד יחידה";
    }
    return "שוטר";
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl"
        dir="rtl"
      >
        {/* Top Header Section */}
        <div className="p-4 sm:p-6 pb-4 border-b border-border/50 bg-muted/20">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-right">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-black shrink-0 shadow-inner">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>

            {/* Title & Key Stats */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-2 sm:mb-1">
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                  {employee.first_name} {employee.last_name}
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none font-bold text-[10px] h-5"
                >
                  {getProfessionalTitle(employee)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Contact className="w-3.5 h-3.5" />
                  <span>מ"א {employee.personal_number}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        employee.status_color || "var(--primary)",
                    }}
                  />
                  <span>{employee.status_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-4 sm:p-6 pt-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* Main Info Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4">
            <InfoItem
              icon={Phone}
              label="טלפון"
              value={employee.phone_number}
            />
            <InfoItem
              icon={Mail}
              label="אימייל"
              value={employee.email || "---"}
            />
            <InfoItem icon={MapPin} label="עיר מגורים" value={employee.city} />
            <InfoItem
              icon={User}
              label="גיל"
              value={
                employee.birth_date
                  ? `${calculateAge(employee.birth_date)}`
                  : null
              }
            />
            <InfoItem
              icon={Cake}
              label="תאריך לידה"
              value={
                employee.birth_date
                  ? new Date(employee.birth_date).toLocaleDateString("he-IL")
                  : null
              }
            />
            <InfoItem
              icon={Calendar}
              label="תאריך שיבוץ"
              value={
                employee.assignment_date
                  ? new Date(employee.assignment_date).toLocaleDateString(
                    "he-IL",
                  )
                  : null
              }
            />
            {/* Emergency Contact */}
            <div className="col-span-2 sm:col-span-3">
              {(() => {
                const contactString = employee.emergency_contact || "";
                const contactParts = contactString.match(
                  /^(.*) \((.*)\) - (.*)$/,
                );

                let name = contactString;
                let relation = "";
                let phone = "";

                if (contactParts) {
                  [, name, relation, phone] = contactParts;
                } else if (!contactString) {
                  name = "";
                }

                return (
                  <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="bg-red-100/50 p-2 rounded-lg text-red-500 shrink-0 mx-auto sm:mx-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-center sm:text-right">
                      <div>
                        <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-tight block">
                          איש קשר לחירום
                        </span>
                        <span className="text-sm font-bold text-foreground truncate block">
                          {name || "---"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-tight block">
                          קרבה
                        </span>
                        <span className="text-sm font-bold text-foreground truncate block">
                          {relation || "---"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-tight block">
                          טלפון
                        </span>
                        <span
                          className="text-sm font-bold text-foreground truncate block"
                          dir="ltr"
                        >
                          {phone || "---"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Organizational Block */}
          {(employee.department_name ||
            employee.section_name ||
            employee.team_name) && (
              <div>
                <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center justify-center sm:justify-start gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  מבנה ארגוני
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {employee.department_name && (
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        מחלקה
                      </p>
                      <p className="text-sm font-black text-center text-wrap break-words leading-tight">
                        {cleanUnitName(employee.department_name)}
                      </p>
                    </div>
                  )}
                  {employee.section_name && (
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        מדור
                      </p>
                      <p className="text-sm font-black text-center text-wrap break-words leading-tight">
                        {cleanUnitName(employee.section_name)}
                      </p>
                    </div>
                  )}
                  {employee.team_name && (
                    <div className="bg-muted/50 p-3 rounded-xl border border-border/40 flex flex-col items-center justify-center gap-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        צוות / חוליה
                      </p>
                      <p className="text-sm font-black text-center text-wrap break-words leading-tight">
                        {cleanUnitName(employee.team_name)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button
            variant="default"
            className="gap-2 font-bold shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground h-11 sm:h-10 px-6 rounded-xl w-full sm:flex-1"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onOpenChange(false);
            }}
          >
            <User className="w-4 h-4" />
            מעבר לפרופיל המלא
          </Button>

          {!employee.phone_number ? (
            <WhatsAppButton
              disabled
              label="אין מספר טלפון זמין"
              className="w-full sm:flex-1 bg-muted text-muted-foreground shadow-none"
            />
          ) : (
            (() => {
              const isBirthdayUpcoming = () => {
                if (!employee.birth_date) return false;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const birthDate = new Date(employee.birth_date);

                // Create current year birthday date
                const currentYearBirthday = new Date(
                  today.getFullYear(),
                  birthDate.getMonth(),
                  birthDate.getDate(),
                );

                // Create next year birthday for edge cases (end of year)
                const nextYearBirthday = new Date(
                  today.getFullYear() + 1,
                  birthDate.getMonth(),
                  birthDate.getDate(),
                );

                const isUpcoming = (date: Date) => {
                  const diffTime = date.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays >= 0 && diffDays <= 7;
                };

                return (
                  isUpcoming(currentYearBirthday) ||
                  isUpcoming(nextYearBirthday)
                );
              };

              const isBirthday = isBirthdayUpcoming();
              const message = isBirthday
                ? `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! 🎉 מאחלים לך הרבה אושר, בריאות והצלחה בכל! 🎂`
                : `היי ${employee.first_name}, `;

              return (
                <WhatsAppButton
                  phoneNumber={employee.phone_number}
                  message={message}
                  title={isBirthday ? "שלח ברכת יום הולדת" : "שלח הודעה"}
                  className={cn(
                    "w-12 h-12 rounded-full shadow-lg transition-transform",
                    isBirthday ? "bg-pink-600 hover:bg-pink-700 shadow-pink-500/20" : "shadow-emerald-500/20"
                  )}
                />
              );
            })()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
