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
    className="max-w-[650px] p-0 overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 sm:rounded-[32px] border-none max-h-[85vh] flex flex-col"
        dir="rtl"
      >
        {/* Header - Premium Minimalist */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-6 shrink-0">
          <div className="flex items-center gap-5">
      <div className="w-14 h-14 rounded-[20px] bg-primary flex items-center justify-center text-white">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                מרכז ייצוא נתונים
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500">
                הפקת דוחות נתונים באקסל
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Section 1: Settings */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              01. הגדרות וסינון
            </h3>
            <div className="flex gap-3">
              <Tabs
                value={mode}
                onValueChange={(v: any) => setMode(v as any)}
                className="flex-1"
              >
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 h-10 rounded-xl w-full grid grid-cols-2">
                  <TabsTrigger
                    value="daily"
          className="font-bold rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]: transition-all"
                  >
                    יומי
                  </TabsTrigger>
                  <TabsTrigger
                    value="range"
          className="font-bold rounded-lg text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]: transition-all"
                  >
                    טווח
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                onClick={() => setFilterModalOpen(true)}
                className={cn(
                  "h-10 px-4 rounded-xl font-bold border-2 transition-all gap-2 text-xs shrink-0",
                  Object.keys(activeFilters).length > 0
          ?"bg-primary/5 border-primary text-primary"
                    : "border-slate-200 dark:border-slate-800 hover:border-primary/20",
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {Object.keys(activeFilters).length > 0
                    ? `(${Object.keys(activeFilters).length})`
                    : "סינון"}
                </span>
              </Button>
            </div>
          </div>

          {/* Section 2: Calendar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                02. בחירת מועד
              </h3>
              {mode === "range" && dateRange?.from && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {format(dateRange.from, "dd/MM")} -{" "}
                  {dateRange.to ? format(dateRange.to, "dd/MM") : "..."}
                </span>
              )}
            </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex justify-center w-full mx-auto max-w-[350px]">
              <Calendar
                mode={mode === "daily" ? "single" : "range"}
                selected={(mode === "daily" ? dailyDate : dateRange) as any}
                onSelect={(v: any) =>
                  mode === "daily" ? setDailyDate(v) : setDateRange(v)
                }
                required={mode === "daily"}
                locale={he}
                className="p-0 pointer-events-auto w-full"
                classNames={{
                  months:
                    "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 text-center w-full",
                  month: "space-y-4 w-full",
                  caption:
                    "flex justify-center pt-1 relative items-center mb-2",
                  caption_label:
                    "text-sm font-black text-slate-900 dark:text-white",
                  nav: "space-x-1 flex items-center bg-slate-50 dark:bg-slate-800 rounded-lg p-1",
                  nav_button:
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all",
                  nav_button_previous: "absolute right-1",
                  nav_button_next: "absolute left-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full mb-2 justify-between",
                  head_cell:
                    "text-slate-400 rounded-md w-9 font-black text-[10px] uppercase text-center flex-1",
                  row: "flex w-full mt-1 justify-between",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-50 dark:[&:has([aria-selected])]:bg-slate-800 flex-1",
                  day: "h-9 w-full p-0 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-xs text-slate-900 dark:text-slate-100 transition-colors",
                  day_selected:
         "bg-primary text-white hover:bg-primary hover:text-white",
                  day_today:
                    "bg-slate-50 dark:bg-slate-800 text-primary font-black border border-primary/20",
                  day_outside: "text-slate-300 opacity-40",
                  day_range_middle:
                    "aria-selected:bg-primary/10 aria-selected:text-primary rounded-none",
                  day_range_start: "rounded-l-lg rounded-r-none",
                  day_range_end: "rounded-r-lg rounded-l-none",
                }}
              />
            </div>
          </div>

          {/* Section 3: Actions */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => handleDownload(false)}
        className="col-span-2 h-12 rounded-xl bg-primary text-white  hover:bg-primary/90 font-black text-sm gap-2"
              >
                <Download className="w-4 h-4" />
                הורדת קובץ אקסל
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDownload(true)}
                className="h-10 rounded-xl border-emerald-600/20 bg-emerald-50/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs gap-2"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                אקסל לוואטסאפ
              </Button>

              {mode === "daily" ? (
                <Button
                  variant="outline"
                  onClick={handleWhatsAppText}
                  className="h-10 rounded-xl border-emerald-600/20 bg-emerald-50/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-xs gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  סיכום טקסט
                </Button>
              ) : (
                <div className="hidden" />
              )}
            </div>

            {/* Alert */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                הנתונים משקפים את המצב הנוכחי במערכת. וודא שכל הדיווחים הושלמו
                לפני הייצוא.
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
