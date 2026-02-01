import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/types/employee.types";
import { cn } from "@/lib/utils";
import {
  Phone,
  MapPin,
  Calendar,
  Building2,
  Contact,
  Cake,
  User,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button, buttonVariants } from "@/components/ui/button";

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

  const InfoItem = ({ icon: Icon, label, value }: any) => (
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl"
        dir="rtl"
      >
        {/* Top Header Section */}
        <div className="p-8 pb-6 border-b border-border/50 bg-muted/20">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl font-black shrink-0 shadow-inner">
              {employee.first_name[0]}
              {employee.last_name[0]}
            </div>

            {/* Title & Key Stats */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-black text-foreground tracking-tight truncate">
                  {employee.first_name} {employee.last_name}
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary border-none font-bold text-[10px] h-5"
                >
                  {getProfessionalTitle(employee)}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
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
        <div className="p-8 pt-6 space-y-8">
          {/* Main Info Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <InfoItem
              icon={Phone}
              label="טלפון"
              value={employee.phone_number}
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
          </div>

          <div className="h-px bg-border/50 w-full" />

          {/* Organizational Block */}
          {(employee.department_name ||
            employee.section_name ||
            employee.team_name) && (
            <div>
              <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                מבנה ארגוני
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {employee.department_name && (
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/40">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                      מחלקה
                    </p>
                    <p className="text-sm font-bold truncate">
                      {employee.department_name}
                    </p>
                  </div>
                )}
                {employee.section_name && (
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/40">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                      מדור
                    </p>
                    <p className="text-sm font-bold truncate">
                      {employee.section_name}
                    </p>
                  </div>
                )}
                {employee.team_name && (
                  <div className="bg-muted/50 p-3 rounded-xl border border-border/40">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">
                      צוות / חוליה
                    </p>
                    <p className="text-sm font-bold truncate">
                      {employee.team_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-muted/30 border-t flex justify-end">
          {!employee.phone_number ? (
            <Button
              variant="outline"
              disabled
              className="gap-2 font-bold text-muted-foreground border-dashed h-10 px-6 rounded-xl opacity-70 cursor-not-allowed"
            >
              <FaWhatsapp className="w-5 h-5 opacity-50" />
              אין מספר טלפון זמין
            </Button>
          ) : (
            <Button
              asChild
              variant="outline"
              className="gap-2 font-bold text-[#25D366] hover:text-[#128C7E] hover:bg-[#25D366]/10 border-[#25D366]/20 h-10 px-6 rounded-xl transition-all shadow-sm"
            >
              <a
                href={`https://wa.me/${(() => {
                  let phone = employee.phone_number.replace(/\D/g, "");
                  if (phone.startsWith("0")) phone = "972" + phone.slice(1);
                  else if (phone.length === 9) phone = "972" + phone;
                  return phone;
                })()}?text=${encodeURIComponent(
                  `היי ${employee.first_name}, המון מזל טוב ליום הולדתך! 🎉 מאחלים לך הרבה אושר, בריאות והצלחה בכל! 🎂`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp className="w-5 h-5" />
                שלח ברכת יום הולדת
              </a>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
