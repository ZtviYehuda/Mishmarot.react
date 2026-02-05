import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Users,
  Filter,
  Smartphone,
  CheckCircle2,
  Share2,
  Info,
  User
} from "lucide-react";
import type { Employee } from "@/types/employee.types";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredEmployees: Employee[];
}

export const WhatsAppReportDialog: React.FC<WhatsAppReportDialogProps> = ({
  open,
  onOpenChange,
  filteredEmployees,
}) => {
  const { user } = useAuthContext();
  const [sendOption, setSendOption] = useState<"current" | "custom">("current");
  const [customFilters, setCustomFilters] = useState({
    departments: [] as string[],
    sections: [] as string[],
    statuses: [] as string[],
    roles: [] as string[],
  });

  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [loading, setLoading] = useState(false);

  const uniqueValues = React.useMemo(() => {
    const departments = new Set<string>();
    const sections = new Set<string>();
    const statuses = new Set<string>();
    const roles = new Set<string>();

    filteredEmployees.forEach((emp) => {
      if (emp.department_name) departments.add(emp.department_name);
      if (emp.section_name) sections.add(emp.section_name);
      if (emp.status_name) statuses.add(emp.status_name);
      if (emp.role_name) roles.add(emp.role_name);
    });

    return {
      departments: Array.from(departments).sort(),
      sections: Array.from(sections).sort(),
      statuses: Array.from(statuses).sort(),
      roles: Array.from(roles).sort(),
    };
  }, [filteredEmployees]);

  const getEmployeesToReport = () => {
    if (sendOption === "current") return filteredEmployees;

    return filteredEmployees.filter((emp) => {
      if (customFilters.departments.length > 0 && !customFilters.departments.includes(emp.department_name || "")) return false;
      if (customFilters.sections.length > 0 && !customFilters.sections.includes(emp.section_name || "")) return false;
      if (customFilters.statuses.length > 0 && !customFilters.statuses.includes(emp.status_name || "Unknown")) return false;
      if (customFilters.roles.length > 0 && !customFilters.roles.includes(emp.role_name || "")) return false;
      return true;
    });
  };

  const handleToggleFilter = (type: keyof typeof customFilters, value: string) => {
    setCustomFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const generateReportText = (employees: Employee[]) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString("he-IL", { hour: '2-digit', minute: '2-digit' });

    let report = `📋 *דוח מצבת כוח אדם - ${dateStr}*\n`;
    report += `⏰ שעת דיווח: ${timeStr}\n`;
    report += `👥 סה"כ שוטרים: ${employees.length}\n\n`;

    const byStatus: Record<string, Employee[]> = {};
    employees.forEach((emp) => {
      const status = emp.status_name || "Unknown";
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(emp);
    });

    report += "*📊 פילוח לפי סטטוס:*\n";
    Object.entries(byStatus).forEach(([status, emps]) => {
      report += `• ${status}: ${emps.length}\n`;
    });

    report += "\n*📝 רשימה שמית:*\n";
    employees.forEach((emp) => {
      report += `• ${emp.first_name} ${emp.last_name} [${emp.status_name}]\n`;
    });

    report += `\n_הופק באמצעות מערכת משרות_ 🚀`;
    return report;
  };

  const handleSend = async () => {
    try {
      const emps = getEmployeesToReport();
      if (emps.length === 0) {
        toast.error("אנא בחר שוטרים להכללה בדוח");
        return;
      }

      setLoading(true);
      const reportText = generateReportText(emps);
      const encodedMessage = encodeURIComponent(reportText);

      try {
        await navigator.clipboard.writeText(reportText);
      } catch (err) {
        console.error("Failed to copy:", err);
      }

      if (phoneNumber.trim()) {
        let formattedPhone = phoneNumber.replace(/\D/g, "");
        if (!formattedPhone.startsWith("972") && !formattedPhone.startsWith("1")) {
          if (formattedPhone.startsWith("0")) formattedPhone = "972" + formattedPhone.substring(1);
          else formattedPhone = "972" + formattedPhone;
        }
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
        toast.success("פותח וואטסאפ עם הדוח...");
      } else {
        window.open("https://web.whatsapp.com", "_blank");
        toast.info("הדוח הועתק! וואטסאפ ווב נפתח.");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error("שגיאה ביצירת הדוח");
    } finally {
      setLoading(false);
    }
  };

  const employeesToReportCount = getEmployeesToReport().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[32px] border-none bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">

        <DialogHeader className="p-8 pb-4 text-right">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                דוח מצבה לוואטסאפ
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-slate-400">
                ייצוא נתוני נוכחות במבנה הודעה שיתופי
              </DialogDescription>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-800">
              <Share2 className="w-6 h-6" />
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-2 space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest block pr-1">סוג הדוח</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSendOption("current")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                  sendOption === "current"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-400 shadow-lg shadow-emerald-500/10"
                    : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Users className="w-6 h-6 mb-1" />
                <span className="text-xs font-black">כל השוטרים ({filteredEmployees.length})</span>
              </button>
              <button
                onClick={() => setSendOption("custom")}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center",
                  sendOption === "custom"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-400 shadow-lg shadow-indigo-500/10"
                    : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                <Filter className="w-6 h-6 mb-1" />
                <span className="text-xs font-black">סינון מותאם</span>
              </button>
            </div>
          </div>

          {sendOption === "custom" && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 animate-in fade-in slide-in-from-top-2 duration-300">
              {Object.entries(uniqueValues).map(([key, values]) => (
                values.length > 0 && (
                  <div key={key} className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pr-1">
                      {key === 'departments' ? 'מחלקות' : key === 'sections' ? 'מדורים' : key === 'statuses' ? 'סטטוסים' : 'תפקידים'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {values.map((v) => (
                        <button
                          key={v}
                          onClick={() => handleToggleFilter(key as any, v)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all",
                            customFilters[key as keyof typeof customFilters].includes(v)
                              ? "bg-slate-900 text-white dark:bg-indigo-600 shadow-md"
                              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest block pr-1">שליחה אל</Label>
            <div className="relative group">
              <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
              <Input
                placeholder="מספר טלפון (ריק = וואטסאפ ווב)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-12 pr-11 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/20"
              />
              {user?.phone_number && phoneNumber === user.phone_number && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-tight">
                  <User className="w-2.5 h-2.5" />
                  הטלפון שלי
                </div>
              )}
            </div>
            <div className="flex items-start gap-2 pr-1">
              <Info className="w-3 h-3 text-slate-300 mt-1" />
              <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                אם תשאיר ריק, המערכת תבצע העתקה ללוח ותפתח את וואטסאפ ווב להדבקה ידנית.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">סיכום הדוח</span>
                <span className="text-[10px] font-bold text-slate-400">{employeesToReportCount} שוטרים כלולים</span>
              </div>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5 opacity-40" />
            </div>
          </div>

          <div className="flex gap-3">
            <WhatsAppButton
              onClick={handleSend}
              isLoading={loading}
              disabled={employeesToReportCount === 0}
              label="שליחת דוח ל-WhatsApp"
              skipDirectLink={true}
              className="flex-1 h-12 rounded-2xl"
            />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-8 border-slate-200 dark:border-slate-800 rounded-2xl h-12 font-bold text-slate-500 hover:bg-white transition-all shadow-sm"
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
