import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Download,
  MessageCircle,
  FileSpreadsheet,
  Filter,
  Info,
} from "lucide-react";
import apiClient from "@/config/api.client";
import { EMPLOYEES_EXPORT_ENDPOINT } from "@/config/employees.endpoints";
import { useDateContext } from "@/context/DateContext";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";

import { FilterModal, type EmployeeFilters } from "./FilterModal";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportDialog({
  open,
  onOpenChange,
}: ExportReportDialogProps) {
  const { selectedDate } = useDateContext();
  const [mode, setMode] = useState<"daily" | "range">("daily");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<EmployeeFilters>({});

  // Daily State
  const [dailyDate, setDailyDate] = useState<Date>(selectedDate);

  // Range State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  const { employees } = useEmployees();

  const handleDownload = async (forWhatsApp = false) => {
    try {
      const params = new URLSearchParams();

      if (mode === "daily" && dailyDate) {
        params.append("date", format(dailyDate, "yyyy-MM-dd"));
      } else if (mode === "range" && dateRange?.from && dateRange?.to) {
        params.append("start_date", format(dateRange.from, "yyyy-MM-dd"));
        params.append("end_date", format(dateRange.to, "yyyy-MM-dd"));
      } else {
        toast.error("נא לבחור תאריך או טווח תאריכים");
        return;
      }

      if (activeFilters.departments?.length)
        params.append("depts", activeFilters.departments.join(","));
      if (activeFilters.sections?.length)
        params.append("sects", activeFilters.sections.join(","));
      if (activeFilters.teams?.length)
        params.append("tms", activeFilters.teams.join(","));
      if (activeFilters.serviceTypes?.length)
        params.append("serviceTypes", activeFilters.serviceTypes.join(","));
      if (activeFilters.statuses?.length)
        params.append("statuses", activeFilters.statuses.join(","));

      const response = await apiClient.get(
        `${EMPLOYEES_EXPORT_ENDPOINT}?${params.toString()}`,
        { responseType: "blob" },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName =
        mode === "daily"
          ? `דו״ח_נוכחות_${format(dailyDate, "dd-MM-yyyy")}.xlsx`
          : `דו״ח_נוכחות_${format(dateRange!.from!, "dd-MM")}_עד_${format(dateRange!.to!, "dd-MM")}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(
        forWhatsApp ? "הדו״ח הורד ומוכן לשיתוף" : "הדו״ח הורד בהצלחה",
      );
      if (!forWhatsApp) onOpenChange(false);
    } catch (error) {
      toast.error("שגיאה ביצירת הדו״ח");
    }
  };

  const handleWhatsAppText = () => {
    const dateStr = format(dailyDate, "dd/MM/yyyy");
    const msg = encodeURIComponent(
      `*דו״ח מצבת כוחות - ${dateStr}*\nסך הכל רשומים במערכת: ${employees.length}\nסטטוס: מעודכן לרגע זה.\nהדו״ח המלא מצורף כקובץ אקסל.`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[700px] p-0 overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 sm:rounded-[40px] border-none shadow-[0_32px_64px_rgba(0,0,0,0.15)]"
        dir="rtl"
      >
        {/* Header - Premium Minimalist */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-10 py-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/25">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                מרכז ייצוא נתונים
              </DialogTitle>
              <DialogDescription className="text-base font-medium text-slate-500 leading-relaxed">
                הפק והפץ דוחות נתונים ומצבת כוח אדם בפורמט Excel רשמי
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-10 py-10 space-y-12">
          {/* Step 1: Definition */}
          <div className="relative pr-8 border-r-2 border-slate-200 dark:border-slate-800 pb-2">
            <div className="absolute right-[-11px] top-0 w-5 h-5 rounded-full bg-primary border-4 border-[#F8FAFC] dark:border-slate-950" />
            <div className="space-y-6">
              <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                01. הגדרות בסיסיות
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <Tabs
                  value={mode}
                  onValueChange={(v: any) => setMode(v as any)}
                  className="flex-1"
                >
                  <TabsList className="bg-slate-200/50 dark:bg-slate-800/50 p-1.5 h-14 rounded-2xl w-full grid grid-cols-2">
                    <TabsTrigger
                      value="daily"
                      className="font-extrabold rounded-xl text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all"
                    >
                      דו״ח יומי
                    </TabsTrigger>
                    <TabsTrigger
                      value="range"
                      className="font-extrabold rounded-xl text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all"
                    >
                      טווח תאריכים
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  variant="outline"
                  onClick={() => setFilterModalOpen(true)}
                  className={cn(
                    "h-14 px-6 rounded-2xl font-black border-2 transition-all gap-3 text-sm",
                    Object.keys(activeFilters).length > 0
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "border-slate-200 dark:border-slate-800 hover:border-primary/20",
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span>
                    {Object.keys(activeFilters).length > 0
                      ? `סינון פעיל (${Object.keys(activeFilters).length})`
                      : "סינון יחידות..."}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Date Selector */}
          <div className="relative pr-8 border-r-2 border-slate-200 dark:border-slate-800">
            <div className="absolute right-[-11px] top-0 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-[#F8FAFC] dark:border-slate-950" />
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  02. בחירת מועד
                </h3>
                {mode === "range" && dateRange?.from && (
                  <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black border border-primary/20">
                    {format(dailyDate, "dd/MM")} -{" "}
                    {dateRange.to ? format(dateRange.to, "dd/MM") : "בחר סיום"}
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex justify-center">
                <Calendar
                  mode={mode === "daily" ? "single" : "range"}
                  selected={(mode === "daily" ? dailyDate : dateRange) as any}
                  onSelect={(v: any) =>
                    mode === "daily" ? setDailyDate(v) : setDateRange(v)
                  }
                  required={mode === "daily"}
                  locale={he}
                  className="p-0 pointer-events-auto"
                  classNames={{
                    caption:
                      "flex justify-center pt-1 relative items-center text-slate-900 dark:text-white mb-8",
                    caption_label: "text-xl font-black",
                    head_row: "flex w-full mb-4 px-1 justify-between",
                    head_cell:
                      "text-slate-400 rounded-md w-12 font-black text-[11px] uppercase text-center",
                    row: "flex w-full mt-3 justify-between px-1",
                    day: "h-12 w-12 p-0 font-bold transition-all rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-base",
                    day_selected:
                      "bg-primary text-white hover:bg-primary hover:text-white rounded-2xl shadow-xl shadow-primary/30 active:scale-95",
                    day_today:
                      "bg-slate-100 dark:bg-slate-800 text-primary font-black rounded-2xl border-2 border-primary/10",
                    day_outside:
                      "text-slate-300 dark:text-slate-700 opacity-40",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Step 3: Actions */}
          <div className="relative pr-8">
            <div className="absolute right-[-11px] top-0 w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 border-4 border-[#F8FAFC] dark:border-slate-950" />
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                03. ייצוא והפצה
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleDownload(false)}
                  className="h-[72px] rounded-[24px] bg-primary text-white shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] hover:bg-primary/90 font-black text-lg gap-4 group transition-all"
                >
                  <Download className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
                  הורדה ישירה למחשב
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(true)}
                    className="flex-1 h-[72px] rounded-[24px] border-emerald-600/20 bg-emerald-50/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-black text-sm gap-2 transition-all border-2"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    אקסל לוואטסאפ
                  </Button>
                  {mode === "daily" && (
                    <Button
                      variant="outline"
                      onClick={handleWhatsAppText}
                      className="flex-1 h-[72px] rounded-[24px] border-emerald-600/20 bg-emerald-50/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-black text-sm gap-2 transition-all border-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      סיכום טקסט
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Elegant Alert */}
          <div className="rounded-[28px] bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-amber-800">
                שים לב לדיווחים
              </p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-500 font-medium leading-relaxed">
                הנתונים משקפים את המצב הנוכחי במערכת בזמן אמת. מומלץ לוודא שכל
                יחידות המשנה סיימו את דיווחי הנוכחות לקבלת תוצאה מדויקת וסופית.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>

      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        onApply={setActiveFilters}
        employees={employees}
      />
    </Dialog>
  );
}
