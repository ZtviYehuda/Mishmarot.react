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
    <div className="w-full space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3 bg-muted/40 p-2 rounded-2xl border border-border/50">
      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(val) => onViewModeChange(val as any)}
        className="w-full sm:w-auto"
      >
        <TabsList className="flex items-center w-full sm:w-auto h-auto p-1 gap-1 bg-background border border-border/60 rounded-xl overflow-x-auto no-scrollbar">
          {[
            { id: "daily", label: "יומי" },
            { id: "weekly", label: "שבועי" },
            { id: "monthly", label: "חודשי" },
            { id: "yearly", label: "שנתי" },
            { id: "custom", label: "טווח תאריכים" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex-1 sm:flex-none min-w-[70px] rounded-lg px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Date Picker Area */}
      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
        {viewMode !== "yearly" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto min-w-[240px] justify-between text-right font-normal h-11 bg-background border-border/60 hover:bg-muted/50 rounded-xl transition-all shadow-sm"
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarIcon className="h-4 w-4 text-primary shrink-0" />
                  {viewMode === "monthly" ? (
                    format(date, "MMMM yyyy", { locale: he })
                  ) : viewMode === "custom" ? (
                    dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} -{" "}
                          {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      "בחר טווח תאריכים"
                    )
                  ) : (
                    format(date, "dd/MM/yyyy", { locale: he })
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 rounded-xl shadow-xl border-border/60"
              align="end"
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
          <div className="w-full sm:w-auto min-w-[140px] flex items-center justify-center gap-2 text-sm font-bold border border-border/60 px-4 py-3 rounded-xl bg-background/50 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>שנת {format(date, "yyyy")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
