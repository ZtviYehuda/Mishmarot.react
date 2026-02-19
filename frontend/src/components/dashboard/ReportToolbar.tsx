import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MonthPicker } from "@/components/common/MonthPicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

interface ReportToolbarProps {
  viewMode: "daily" | "weekly" | "monthly" | "yearly" | "custom";
  onViewModeChange: (
    mode: "daily" | "weekly" | "monthly" | "yearly" | "custom",
  ) => void;
  date: Date;
  onDateChange: (date: Date) => void;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  maxDate?: Date;
}

export function ReportToolbar({
  viewMode,
  onViewModeChange,
  date,
  onDateChange,
  dateRange,
  onDateRangeChange,
  maxDate,
}: ReportToolbarProps) {
  return (
    <div className="w-full flex flex-col items-stretch gap-3 bg-muted/30 p-1.5 rounded-2xl border border-border/40">
      <div className="flex items-center gap-2 w-full">
        {/* View Mode Tabs - Flexible & Scrollable */}
        <Tabs
          value={viewMode}
          onValueChange={(val) => onViewModeChange(val as any)}
          className="flex-1 min-w-0"
        >
          <TabsList
            dir="rtl"
            className="flex items-center w-full h-10 p-1 gap-1 bg-background border border-border/60 rounded-xl overflow-x-auto no-scrollbar scroll-smooth"
          >
            {[
              { id: "daily", label: "יומי" },
              { id: "weekly", label: "שבועי" },
              { id: "monthly", label: "חודשי" },
              { id: "yearly", label: "שנתי" },
              { id: "custom", label: "טווח" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-300"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Date Picker Area - Fixed Width on the side */}
        <div className="shrink-0">
          {viewMode !== "yearly" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-3 bg-background border-border/60 hover:bg-muted/50 rounded-xl transition-all gap-2 text-xs font-bold shadow-sm"
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[90px] hidden xs:inline">
                    {viewMode === "monthly" ? (
                      format(date, "MMMM yy", { locale: he })
                    ) : viewMode === "custom" && dateRange?.from ? (
                      <>
                        {format(dateRange.from, "dd/MM")}
                        {dateRange.to
                          ? ` - ${format(dateRange.to, "dd/MM")}`
                          : ""}
                      </>
                    ) : (
                      format(date, "dd/MM/yy")
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 rounded-xl border-border/60 shadow-2xl"
                align="center"
              >
                {viewMode === "monthly" ? (
                  <MonthPicker current={date} onSelect={onDateChange} />
                ) : viewMode === "custom" ? (
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    locale={he}
                    initialFocus
                    numberOfMonths={2}
                    disabled={(d) => (maxDate ? d > maxDate : false)}
                    className="p-3 bg-background rounded-xl"
                  />
                ) : (
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && onDateChange(d)}
                    locale={he}
                    initialFocus
                    disabled={(d) => (maxDate ? d > maxDate : false)}
                    className="p-3 bg-background rounded-xl"
                  />
                )}
              </PopoverContent>
            </Popover>
          )}
          {viewMode === "yearly" && (
            <div className="w-full sm:w-auto min-w-[120px] sm:min-w-[140px] flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-border/60 px-4 py-2.5 sm:py-3 rounded-xl bg-background/50 shrink-0">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>שנת {format(date, "yyyy")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
