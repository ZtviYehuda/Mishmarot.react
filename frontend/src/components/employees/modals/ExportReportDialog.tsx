import { useState } from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Download, MessageCircle, FileSpreadsheet } from "lucide-react";
import apiClient from "@/config/api.client";
import { EMPLOYEES_EXPORT_ENDPOINT } from "@/config/employees.endpoints";
import { useDateContext } from "@/context/DateContext";
import { type DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { FilterModal, type EmployeeFilters } from "./FilterModal";
import { Filter } from "lucide-react";

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

  // Helper to generate WhatsApp text (simplified version of WhatsAppReportDialog logic)
  const generateWhatsAppText = () => {
    const dateStr = format(dailyDate, "dd/MM/yyyy");
    const total = employees.length;
    // Note: detailed stats logic matches the current view, but for a specific date
    // we would ideally need to fetch that date's stats if it's not the current view.
    // simpler to just output "Daily Report for [Date]" for now or use current view if date matches.

    let message = `📊 *דוח מצבת כוח אדם* - ${dateStr}\n`;
    message += `סה"כ שוטרים: ${total}\n`;
    // Add link or more info if needed
    return encodeURIComponent(message);
  };

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

      // Apply Filters to Export
      if (activeFilters.departments?.length)
        params.append("depts", activeFilters.departments.join(","));
      if (activeFilters.sections?.length)
        params.append("sects", activeFilters.sections.join(","));
      if (activeFilters.teams?.length)
        params.append("tms", activeFilters.teams.join(","));
      if (activeFilters.roles?.length)
        params.append("roles", activeFilters.roles.join(","));
      if (activeFilters.serviceTypes?.length)
        params.append("serviceTypes", activeFilters.serviceTypes.join(","));
      if (activeFilters.statuses?.length)
        params.append("statuses", activeFilters.statuses.join(","));
      if (activeFilters.isCommander) params.append("is_commander", "true");
      if (activeFilters.isAdmin) params.append("is_admin", "true");
      if (activeFilters.hasSecurityClearance)
        params.append("has_security_clearance", "true");
      if (activeFilters.hasPoliceRicense)
        params.append("has_police_license", "true");
      if (activeFilters.showInactive) params.append("include_inactive", "true");
      if (activeFilters.searchText)
        params.append("search", activeFilters.searchText);

      // We trigger download by window.open or recreating the fetch with blob
      // Using direct window open is easiest for download, but we need auth token usually.
      // apiClient handles auth. So we must use axios/fetch and create blob url.

      const response = await apiClient.get(
        `${EMPLOYEES_EXPORT_ENDPOINT}?${params.toString()}`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName =
        mode === "daily"
          ? `daily_report_${format(dailyDate, "dd-MM-yyyy")}.xlsx`
          : `range_report_${format(dateRange!.from!, "dd-MM")}_${format(dateRange!.to!, "dd-MM")}.xlsx`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (forWhatsApp) {
        toast.success("הקובץ הורד בהצלחה. כעת ניתן לצרף אותו בווטסאפ.");
        // Optionally open whatsapp web
        // window.open("https://web.whatsapp.com/", "_blank");
      } else {
        toast.success("הדוח הורד בהצלחה");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בהורדת הדוח");
    }
  };

  const handleWhatsAppText = () => {
    // Re-use logic or simplistic text
    // ideally we open the existing WhatsAppReportDialog but pre-set with date?
    // The existing dialog uses "current state".
    // For simplicity, let's just use a basic text here or link to the main dialog?
    // The user asked for "Send as text".
    // Let's generate a simple text here.
    const message = generateWhatsAppText();
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg" dir="rtl">
        <DialogHeader className="text-right sm:text-right gap-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-xl font-bold">
                ייצוא ודוחות
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground font-medium">
                בחר את סוג הדוח והפורמט הרצוי
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterModalOpen(true)}
              className={cn(
                "h-9 rounded-xl border-primary/20",
                Object.keys(activeFilters).length > 0 &&
                  "bg-primary/10 border-primary text-primary",
              )}
            >
              <Filter className="w-4 h-4 ml-2" />
              {Object.keys(activeFilters).length > 0
                ? `מסונן (${Object.keys(activeFilters).length})`
                : "סנן דוח"}
            </Button>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="daily"
          value={mode}
          onValueChange={(v) => setMode(v as "daily" | "range")}
          dir="rtl"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">דוח יומי</TabsTrigger>
            <TabsTrigger value="range">טווח תאריכים</TabsTrigger>
          </TabsList>

          <div className="py-4">
            <TabsContent value="daily" className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>בחר תאריך לדוח</Label>
                <div className="border rounded-md p-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={dailyDate}
                    onSelect={(d) => d && setDailyDate(d)}
                    locale={he}
                    initialFocus
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="range" className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>בחר טווח תאריכים</Label>
                <div className="border rounded-md p-2 flex justify-center">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={he}
                    initialFocus
                    numberOfMonths={1}
                  />
                </div>
                {dateRange?.from && dateRange?.to && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                    {format(dateRange.to, "dd/MM/yyyy")}
                  </p>
                )}
              </div>
            </TabsContent>
          </div>

          <div className="flex flex-col gap-3">
            {/* Action Buttons */}
            <Button
              onClick={() => handleDownload(false)}
              className="w-full justify-start gap-3 h-12 text-base"
            >
              <div className="bg-primary/20 p-1.5 rounded-full">
                <Download className="w-4 h-4 text-primary" />
              </div>
              הורד כקובץ Excel למחשב
            </Button>

            <Button
              onClick={() => handleDownload(true)}
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-base border-green-500/20 hover:bg-green-50 dark:hover:bg-green-900/10"
            >
              <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <span className="block text-green-700 dark:text-green-300 font-bold">
                  הורד Excel לשליחה בווטסאפ
                </span>
              </div>
            </Button>

            {mode === "daily" && (
              <Button
                onClick={handleWhatsAppText}
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-base border-green-500/20 hover:bg-green-50 dark:hover:bg-green-900/10"
              >
                <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                  <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-green-700 dark:text-green-300 font-bold">
                  שלח סיכום כטקסט בווטסאפ
                </span>
              </Button>
            )}
          </div>
        </Tabs>
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
