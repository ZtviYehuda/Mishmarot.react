import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ExternalLink,
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
    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-70">
      <Icon className="w-3 h-3" />
      {label}
    </span>
    <span className="text-sm font-bold text-foreground">
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
        className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-3xl"
        dir="rtl"
      >
        <DialogHeader className="p-6 border-b border-border/50 bg-muted/20 text-right">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-right">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-[28px] bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shrink-0 shadow-lg shadow-primary/20">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>

            {/* Title & Key Stats */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-2 sm:mb-1">
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                  {employee.first_name} {employee.last_name}
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none font-black text-[10px] h-5 rounded-full px-2.5"
                >
                  {getProfessionalTitle(employee)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-muted-foreground/60">
                <div className="flex items-center gap-1.5 text-xs font-black">
                  <Contact className="w-3.5 h-3.5" />
                  <span>מ"א {employee.personal_number}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-black">
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
        </DialogHeader>

        <div className="p-6 pt-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* Main Info Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-8 gap-x-6">
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
                  <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="bg-red-500/10 p-2.5 rounded-xl text-red-600 shrink-0 mx-auto sm:mx-0 shadow-sm">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-center sm:text-right">
                      <div>
                        <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest mb-1 block">
                          איש קשר לחירום
                        </span>
                        <span className="text-sm font-black text-foreground truncate block">
                          {name || "---"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest mb-1 block">
                          קרבה
                        </span>
                        <span className="text-sm font-black text-foreground truncate block">
                          {relation || "---"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest mb-1 block">
                          טלפון
                        </span>
                        <span
                          className="text-sm font-black text-foreground truncate block"
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

          <div className="h-px bg-border/40 w-full" />

          {/* Organizational Block */}
          {(employee.department_name ||
            employee.section_name ||
            employee.team_name) && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2 opacity-80">
                  <Building2 className="w-4 h-4" />
                  ניהול ומבנה ארגוני
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {employee.department_name && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-1.5 shadow-sm">
                      <p className="text-[9px] font-black text-muted-foreground uppercase opacity-70">
                        מחלקה
                      </p>
                      <p className="text-sm font-black text-center text-wrap break-words leading-tight">
                        {cleanUnitName(employee.department_name)}
                      </p>
                    </div>
                  )}
                  {employee.section_name && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-1.5 shadow-sm">
                      <p className="text-[9px] font-black text-muted-foreground uppercase opacity-70">
                        מדור
                      </p>
                      <p className="text-sm font-black text-center text-wrap break-words leading-tight">
                        {cleanUnitName(employee.section_name)}
                      </p>
                    </div>
                  )}
                  {employee.team_name && (
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/30 flex flex-col items-center justify-center gap-1.5 shadow-sm">
                      <p className="text-[9px] font-black text-muted-foreground uppercase opacity-70">
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
        <div className="p-6 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            variant="default"
            className="gap-2.5 font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-2xl w-full sm:w-auto transition-transform active:scale-95"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onOpenChange(false);
            }}
          >
            <ExternalLink className="w-4 h-4" />
            צפייה בפרופיל מלא
          </Button>

          <div className="w-full sm:w-auto">
            {!employee.phone_number ? (
              <WhatsAppButton
                disabled
                label="אין מספר טלפון"
                className="w-full h-12 rounded-2xl bg-muted text-muted-foreground/50 cursor-not-allowed opacity-50"
              />
            ) : (
              (() => {
                const checkBirthday = () => {
                  if (!employee.birth_date) return false;
                  const today = new Date();
                  const birthDate = new Date(employee.birth_date);
                  return today.getMonth() === birthDate.getMonth() && today.getDate() === birthDate.getDate();
                };

                const isBirthday = checkBirthday();
                const message = isBirthday
                  ? `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! 🎉 מאחלים לך הרבה אושר, בריאות והצלחה בכל! 🎂`
                  : `היי ${employee.first_name}, `;

                return (
                  <WhatsAppButton
                    phoneNumber={employee.phone_number}
                    message={message}
                    title={isBirthday ? "שלח ברכת מזל טוב" : "וואטסאפ"}
                    className={cn(
                      "h-12 px-8 rounded-2xl shadow-lg transition-all font-black text-xs gap-2.5 active:scale-95",
                      isBirthday
                        ? "bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                    )}
                  />
                );
              })()
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
