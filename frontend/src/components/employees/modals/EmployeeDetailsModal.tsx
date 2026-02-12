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
  Building2,
  Contact,
  Cake,
  User,
  Mail,
  ExternalLink,
  ShieldCheck,
  Gift,
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
  className,
  noTruncate = false,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  className?: string;
  noTruncate?: boolean;
}) => (
  <div className={cn("flex flex-col gap-2 group/info", className)}>
    <span className="text-[10px] font-black text-muted-foreground dark:text-primary/60 uppercase tracking-[0.2em] flex items-center gap-2 group-hover/info:text-primary transition-colors">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
    <span
      className={cn(
        "text-base font-black text-foreground tracking-tight leading-tight",
        !noTruncate && "truncate",
        noTruncate && "break-all",
      )}
      title={typeof value === "string" ? value : undefined}
    >
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
      if (emp.commands_team_id || emp.team_name) return "מפקד חוליה";
      if (emp.commands_section_id || emp.section_name) return "ראש מדור";
      if (emp.commands_department_id || emp.department_name) return "ראש מחלקה";
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

  // Parse emergency contact
  const contactString = employee.emergency_contact || "";
  const contactParts = contactString.match(/^(.*) \((.*)\) - (.*)$/);

  let ecName = contactString;
  let ecRelation = "";
  let ecPhone = "";

  if (contactParts) {
    [, ecName, ecRelation, ecPhone] = contactParts;
  } else if (!contactString) {
    ecName = "";
  }

  // Check birthday
  const checkBirthday = () => {
    if (!employee.birth_date) return false;
    const today = new Date();
    const birthDate = new Date(employee.birth_date);
    return (
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate()
    );
  };

  const isBirthday = checkBirthday();
  const whatsappMessage = isBirthday
    ? `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! מאחלים לך הרבה אושר, בריאות והצלחה בכל!`
    : `היי ${employee.first_name}, `;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-3xl"
        dir="rtl"
      >
        <DialogHeader className="p-5 border-b border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent text-right relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -ml-16 -mt-16 pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-right relative z-10">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-primary-foreground rounded-[24px] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative w-20 h-20 rounded-[20px] bg-primary text-primary-foreground flex items-center justify-center text-3xl font-black shrink-0 shadow-xl border-2 border-card">
                {employee.first_name[0]}
                {employee.last_name[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full border-2 border-card bg-emerald-500 shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>

            {/* Title & Key Stats */}
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                <DialogTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter truncate leading-none flex items-center gap-2">
                  {employee.first_name} {employee.last_name}
                  {employee.is_commander && (
                    <ShieldCheck className="w-6 h-6 text-blue-500 dark:text-blue-400 drop-shadow-md" />
                  )}
                  {isBirthday && (
                    <Gift className="w-6 h-6 text-pink-500 dark:text-pink-400 drop-shadow-md animate-bounce" />
                  )}
                </DialogTitle>
                <Badge
                  variant="secondary"
                  className="bg-primary text-primary-foreground border-none font-black text-[10px] h-6 rounded-lg px-3 uppercase tracking-wider shadow-sm"
                >
                  {getProfessionalTitle(employee)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-muted-foreground">
                <div className="flex items-center gap-2 text-sm font-bold bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                  <Contact className="w-4 h-4 text-primary" />
                  <span className="tracking-widest">
                    מ"א {employee.personal_number}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
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

        <div className="p-5 pt-4 space-y-6 flex-1 overflow-hidden">
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            <InfoItem
              icon={Phone}
              label="טלפון"
              value={employee.phone_number}
              className="sm:col-span-1"
            />
            <InfoItem
              icon={Mail}
              label="אימייל"
              value={employee.email || "---"}
              className="sm:col-span-1"
              noTruncate
            />
            <div className="grid grid-cols-3 col-span-1 sm:col-span-2 gap-8">
              <InfoItem
                icon={MapPin}
                label="עיר מגורים"
                value={employee.city}
              />
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
            </div>
            {/* Emergency Contact */}
            <div className="col-span-1 sm:col-span-2">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 p-4 rounded-[22px] border-2 border-red-500/10 dark:border-rose-500/20 flex flex-col sm:flex-row gap-4 items-start sm:items-center group/contact overflow-hidden relative shadow-inner">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 blur-[80px] -mr-24 -mt-24 rounded-full pointer-events-none"></div>

                <div className="bg-red-500 dark:bg-rose-500 p-2.5 rounded-xl text-white shrink-0 mx-auto sm:mx-0 shadow-xl shadow-red-500/20 group-hover/contact:rotate-12 transition-all">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="relative flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4 w-full text-center sm:text-right">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-red-600 dark:text-rose-400 uppercase tracking-[0.2em] block opacity-80">
                      איש קשר לחירום
                    </span>
                    <span className="text-sm font-black text-foreground tracking-tight truncate">
                      {ecName || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-red-600 dark:text-rose-400 uppercase tracking-[0.2em] block opacity-80">
                      קרבה
                    </span>
                    <span className="text-sm font-black text-foreground tracking-tight truncate">
                      {ecRelation || "---"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] font-black text-red-600 dark:text-rose-400 uppercase tracking-[0.2em] block opacity-80">
                      טלפון
                    </span>
                    <span
                      className="text-sm font-black text-foreground tracking-tighter truncate"
                      dir="ltr"
                    >
                      {ecPhone || "---"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 w-full my-2" />

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
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-[20px] border border-primary/20 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all hover:bg-primary/10 dark:hover:bg-primary/20 group/item cursor-default">
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] transition-transform">
                      מחלקה
                    </p>
                    <p className="text-xs font-black text-center text-wrap break-words leading-tight tracking-tight">
                      {cleanUnitName(employee.department_name)}
                    </p>
                  </div>
                )}
                {employee.section_name && (
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-[20px] border border-primary/20 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all hover:bg-primary/10 dark:hover:bg-primary/20 group/item cursor-default">
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] transition-transform">
                      מדור
                    </p>
                    <p className="text-xs font-black text-center text-wrap break-words leading-tight tracking-tight">
                      {cleanUnitName(employee.section_name)}
                    </p>
                  </div>
                )}
                {employee.team_name && (
                  <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-[20px] border border-primary/20 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all hover:bg-primary/10 dark:hover:bg-primary/20 group/item cursor-default">
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] transition-transform">
                      צוות / חוליה
                    </p>
                    <p className="text-xs font-black text-center text-wrap break-words leading-tight tracking-tight">
                      {cleanUnitName(employee.team_name)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row gap-3">
          <Button
            variant="default"
            className="flex-1 gap-2 font-black shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl transition-transform active:scale-95 text-sm order-2 sm:order-1"
            onClick={() => {
              navigate(`/employees/${employee.id}`);
              onOpenChange(false);
            }}
          >
            <ExternalLink className="w-4 h-4" />
            צפייה בפרופיל
          </Button>

          <div className="flex-1 order-1 sm:order-2">
            {!employee.phone_number ? (
              <WhatsAppButton
                disabled
                label="אין טלפון"
                className="w-full h-11 rounded-xl bg-muted text-muted-foreground/50 cursor-not-allowed opacity-50 font-black text-sm"
              />
            ) : (
              <WhatsAppButton
                phoneNumber={employee.phone_number}
                message={whatsappMessage}
                title={isBirthday ? "שלח ברכת מזל טוב" : "וואטסאפ"}
                className={cn(
                  "w-full h-11 rounded-xl shadow-lg transition-all font-black text-sm gap-2 active:scale-95",
                  "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20",
                )}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
