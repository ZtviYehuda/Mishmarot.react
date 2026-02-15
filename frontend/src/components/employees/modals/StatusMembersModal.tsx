import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { User, Phone, Users, ArrowLeft } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatusMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusId: number | null;
  statusName: string;
  statusColor: string;
  date?: string;
}

export const StatusMembersModal: React.FC<StatusMembersModalProps> = ({
  open,
  onOpenChange,
  statusId,
  statusName,
  statusColor,
  date,
}) => {
  const { employees, fetchEmployees, loading } = useEmployees();

  useEffect(() => {
    if (open && statusId !== null && statusId !== undefined) {
      fetchEmployees(
        undefined, // search
        undefined, // dept_id
        undefined, // include_inactive
        statusId,
        undefined, // section_id
        undefined, // team_id
        date,
      );
    }
  }, [open, statusId, date, fetchEmployees]);

  if (statusId === null || statusId === undefined) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 border-none bg-card shadow-2xl rounded-3xl"
        dir="rtl"
      >
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3 shrink-0"
              style={{
                backgroundColor: statusColor,
                boxShadow: `0 8px 16px -4px ${statusColor}40`,
              }}
            >
              <Users className="w-7 h-7" />
            </div>
            <div className="flex flex-col text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                שוטרים בסטטוס: {statusName}
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic mt-0.5">
                מציג {employees.length} שוטרים הנמצאים בסטטוס זה
                {date ? ` נכון לתאריך ${date}` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {loading ? (
            <div className="py-24 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                שולף נתוני נוכחות...
              </p>
            </div>
          ) : employees.length === 0 ? (
            <div className="py-24 flex flex-col items-center text-muted-foreground/30 gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center">
                <User className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-black text-lg uppercase tracking-tight">
                אין שוטרים המשויכים לסטטוס זה כעת
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/50">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border/50">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      שוטר / מ"א
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                      שיוך ארגוני
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none text-left">
                      דרכי התקשרות
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/20 transition-all group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center text-primary font-black text-[10px] shadow-sm group-hover:scale-110 transition-transform">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <div className="flex flex-col">
                            <EmployeeLink
                              employee={emp}
                              className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-1"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground/60 font-mono tracking-widest">
                                {emp.personal_number}
                              </span>
                              {emp.is_commander && (
                                <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-1.5 h-4 hover:bg-primary/20">
                                  מפקד
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-black text-foreground/80 leading-tight">
                            {emp.department_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-bold opacity-60">
                            {emp.section_name}{" "}
                            {emp.team_name && `• ${emp.team_name}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-left">
                        {emp.phone_number ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 rounded-lg hover:bg-primary hover:text-white transition-all gap-2 text-xs font-black px-3"
                          >
                            <a href={`tel:${emp.phone_number}`}>
                              <Phone className="w-3.5 h-3.5" />
                              {emp.phone_number}
                            </a>
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30 font-black italic uppercase tracking-widest pl-4">
                            אין טלפון
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-6 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              סה"כ רשומות מוצגות:
            </span>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-none text-xs font-black px-2.5 h-6 rounded-full"
            >
              {employees.length}
            </Badge>
          </div>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-10 text-[10px] font-black text-muted-foreground hover:text-foreground hover:bg-background transition-all uppercase tracking-widest gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            סגור חלון
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
