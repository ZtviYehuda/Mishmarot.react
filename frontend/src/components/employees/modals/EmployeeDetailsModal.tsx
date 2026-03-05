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
  type,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  className?: string;
  noTruncate?: boolean;
  type?: "phone" | "email";
}) => {
  if (!value || value === "---") return null;

  const content = (
    <span
      className={cn(
        "text-base font-black text-foreground tracking-tight leading-tight transition-colors",
        !noTruncate && "truncate",
        noTruncate && "break-all",
        type && "text-primary hover:text-primary/80",
      )}
      title={typeof value === "string" ? value : undefined}
    >
      {value}
    </span>
  );

  return (
    <div className={cn("flex flex-col gap-2 group/info", className)}>
      <span className="text-[10px] font-black text-muted-foreground dark:text-primary/60 uppercase tracking-[0.2em] flex items-center gap-2 group-hover/info:text-primary transition-colors">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      {type === "phone" && typeof value === "string" ? (
        <a href={`tel:${value}`} className="block">
          {content}
        </a>
      ) : type === "email" && typeof value === "string" ? (
        <a href={`mailto:${value}`} className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
};

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
        className="max-w-xl p-0 overflow-hidden border border-border bg-card  rounded-[2.5rem]"
        dir="rtl"
      >
        <DialogHeader className="p-8 pb-6 border-b border-border/40 bg-gradient-to-br from-background via-background to-primary/5 text-right relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -ml-16 -mt-16" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mb-12" />

          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 text-center sm:text-right relative z-10">
            {/* Avatar with Integrated Status */}
            <div className="relative shrink-0">
              <div
                className="relative w-24 h-24 rounded-[2rem] bg-muted flex items-center justify-center text-4xl font-black  border-2 border-background ring-1 ring-border"
                style={{ color: employee.status_color || "inherit" }}
              >
                {employee.first_name[0]}
                {employee.last_name[0]}

                {/* Status Dot */}
                <div
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-4 border-background  flex items-center justify-center ring-1 ring-border"
                  style={{
                    backgroundColor: employee.status_color || "var(--primary)",
                  }}
                  title={employee.status_name || "סטטוס שוטר"}
                />
              </div>
            </div>

            {/* Name & Quick Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 justify-center sm:justify-start">
                <DialogTitle className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2">
                  {employee.first_name} {employee.last_name}
                  {isBirthday && (
                    <Gift className="w-6 h-6 text-pink-500 drop- animate-bounce" />
                  )}
                </DialogTitle>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] h-6 rounded-full px-3 uppercase tracking-wider"
                  >
                    {getProfessionalTitle(employee)}
                  </Badge>
                  {employee.is_commander && (
                    <div className="p-1 px-2 bg-blue-500/10 text-blue-600 rounded-full border border-blue-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-muted-foreground/80">
                <div className="flex items-center gap-2 text-sm font-black bg-muted/40 px-3 py-1 rounded-lg border border-border/30">
                  <span className="text-[10px] opacity-50 font-bold uppercase tracking-widest pl-1 border-l border-border/50 ml-1">
                    מ"א
                  </span>
                  <span className="tracking-widest font-mono">
                    {employee.personal_number}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm font-black bg-muted/40 px-3 py-1 rounded-lg border border-border/30">
                  <span className="text-[10px] opacity-50 font-bold uppercase tracking-widest pl-1 border-l border-border/50 ml-1">
                    סטטוס
                  </span>
                  <span>{employee.status_name}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 pt-6 space-y-8 flex-1 overflow-hidden">
          {/* Main Info Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
            <InfoItem
              icon={Phone}
              label="טלפון"
              value={employee.phone_number}
              className="sm:col-span-1"
              type="phone"
            />
            <InfoItem
              icon={Mail}
              label="אימייל"
              value={employee.email}
              className="sm:col-span-1"
              noTruncate
              type="email"
            />
            <div className="grid grid-cols-3 col-span-1 sm:col-span-2 gap-8">
              <InfoItem icon={MapPin} label="עיר" value={employee.city} />
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
            {employee.emergency_contact && (
              <div className="col-span-1 sm:col-span-2">
                <div className="bg-muted/30 p-5 rounded-3xl border border-border/50 flex flex-col sm:flex-row gap-5 items-start sm:items-center overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 transition-all group-hover:bg-primary/10" />

                  <div className="bg-muted text-muted-foreground p-3 rounded-2xl shrink-0 mx-auto sm:mx-0 relative z-10 ">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="relative flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 w-full text-center sm:text-right z-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block">
                        איש קשר לחירום
                      </span>
                      <span className="text-sm font-black text-foreground truncate">
                        {ecName}
                      </span>
                    </div>
                    {ecRelation && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block">
                          קרבה
                        </span>
                        <span className="text-sm font-black text-foreground truncate">
                          {ecRelation}
                        </span>
                      </div>
                    )}
                    {ecPhone && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block">
                          טלפון
                        </span>
                        <a
                          href={`tel:${ecPhone}`}
                          className="text-base font-black text-primary truncate hover:text-primary/80 transition-colors"
                          dir="ltr"
                        >
                          {ecPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Organizational Block */}
          {(employee.department_name ||
            employee.section_name ||
            employee.team_name) && (
            <div className="space-y-5">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-center sm:justify-start gap-2 opacity-70">
                <Building2 className="w-4 h-4 text-primary" />
                ניהול ומבנה ארגוני
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {employee.department_name && (
                  <div className="bg-muted/20 p-4 rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-1.5  hover:border-primary/20 transition-colors group">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      מחלקה
                    </p>
                    <p className="text-sm font-black text-center text-foreground leading-tight group-hover:text-primary transition-colors">
                      {cleanUnitName(employee.department_name)}
                    </p>
                  </div>
                )}
                {employee.section_name && (
                  <div className="bg-muted/20 p-4 rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-1.5  hover:border-primary/20 transition-colors group">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      מדור
                    </p>
                    <p className="text-sm font-black text-center text-foreground leading-tight group-hover:text-primary transition-colors">
                      {cleanUnitName(employee.section_name)}
                    </p>
                  </div>
                )}
                {employee.team_name && (
                  <div className="bg-muted/20 p-4 rounded-3xl border border-border/40 flex flex-col items-center justify-center gap-1.5  hover:border-primary/20 transition-colors group">
                    <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">
                      צוות / חוליה
                    </p>
                    <p className="text-sm font-black text-center text-foreground leading-tight group-hover:text-primary transition-colors">
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
            className="flex-1 gap-2 font-black   bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl transition-transform active:scale-95 text-sm order-2 sm:order-1"
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
                  "w-full h-11 rounded-xl  transition-all font-black text-sm gap-2 active:scale-95",
                  "bg-emerald-600 hover:bg-emerald-700 text-white -500/20",
                )}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
