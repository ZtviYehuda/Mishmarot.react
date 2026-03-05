import { useState } from "react";
import { format, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { getJewishHoliday, getHebrewDate } from "@/lib/hebrewDate";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateHeaderProps {
  className?: string;
}

export function DateHeader({ className }: DateHeaderProps) {
  const { selectedDate, setSelectedDate } = useDateContext();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleBackToToday = () => {
    setSelectedDate(new Date());
  };

  const { fullStr } = getHebrewDate(selectedDate);
  const hebrewDateStr = fullStr;

  // Check if it is current day
  const isCurrentDay = isToday(selectedDate);

  // Get Holiday
  const holiday = getJewishHoliday(selectedDate);

  return (
    <div
      className={cn(
   "flex flex-row items-stretch border rounded-xl lg:rounded-2xl overflow-hidden transition-all duration-300 h-full",
        !isCurrentDay
          ? "border-amber-400/50 bg-amber-50/80 dark:bg-amber-950/20"
          : "border-input bg-card",
        className,
      )}
    >
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-full py-1.5 px-3 lg:py-2 lg:px-5 rounded-none border-none hover:bg-muted/50 transition-all text-right items-end flex flex-col justify-center",
              !isCurrentDay &&
                "hover:bg-amber-100/50 dark:hover:bg-amber-900/30",
            )}
          >
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 lg:gap-3">
                <span
                  className={cn(
                    "text-[12px] lg:text-[15px] font-black tracking-tight",
                    !isCurrentDay
                      ? "text-amber-900 dark:text-amber-100"
                      : "text-foreground",
                  )}
                >
                  {format(selectedDate, "d בMMMM yyyy", { locale: he })}
                </span>
                <div
                  className={cn(
                    "w-px h-2.5 lg:h-3.5",
                    isCurrentDay
                      ? "bg-border"
                      : "bg-amber-400/50 dark:bg-amber-700",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] lg:text-xs font-bold font-serif opacity-80",
                    !isCurrentDay
                      ? "text-amber-800 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {hebrewDateStr}
                </span>
              </div>

              {/* Holiday or Status Line */}
              {holiday ? (
                <span className="text-[10px] font-black text-amber-600 mt-0.5">
                  🎉 {holiday}
                </span>
              ) : !isCurrentDay ? (
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-black text-amber-700/70 dark:text-amber-400/70 uppercase tracking-widest shrink-0">
                  <CalendarClock className="w-3 h-3" />
                  ניהול במצב היסטורי
                </div>
              ) : null}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
     className="w-auto p-0 border-none rounded-2xl overflow-hidden"
          align="end"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(date);
                setCalendarOpen(false);
              }
            }}
            initialFocus
            locale={he}
          />
        </PopoverContent>
      </Popover>

      {!isCurrentDay && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBackToToday();
          }}
          className="bg-amber-500 hover:bg-amber-600 text-white px-3 lg:px-4 flex items-center justify-center gap-1.5 lg:gap-2 transition-all active:scale-95 group relative border-r border-amber-400/30 shrink-0"
          title="חזור להיום"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CalendarClock className="w-4 h-4" />
          <span className="text-[11px] lg:text-[12px] font-black whitespace-nowrap">
            היום
          </span>
        </button>
      )}
    </div>
  );
}
