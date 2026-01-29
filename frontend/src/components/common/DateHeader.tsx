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
    <div className={cn("flex flex-row items-center gap-2", className)}>
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-auto py-2 px-4 rounded-xl border-input bg-background hover:bg-muted/50 transition-all shadow-sm",
              !isCurrentDay &&
                "border-amber-300 bg-amber-50 hover:bg-amber-100/80 text-amber-900",
            )}
          >
            <div className="flex flex-col items-end text-right">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "text-base font-bold",
                    !isCurrentDay && "text-amber-900",
                  )}
                >
                  {format(selectedDate, "d בMMMM yyyy", { locale: he })}
                </span>
                <div
                  className={cn(
                    "w-px h-3.5",
                    isCurrentDay ? "bg-border" : "bg-amber-300",
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium text-muted-foreground font-serif",
                    !isCurrentDay && "text-amber-800/80",
                  )}
                >
                  {hebrewDateStr}
                </span>
              </div>

              {/* Holiday or Status Line */}
              {holiday ? (
                <span className="text-[10px] font-bold text-amber-600 mt-0.5">
                  🎉 {holiday}
                </span>
              ) : !isCurrentDay ? (
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold text-amber-700">
                  <CalendarClock className="w-3 h-3" />
                  נמצא במצב היסטורי
                </div>
              ) : null}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
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
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-xs font-bold text-amber-700 hover:text-amber-800 hover:bg-amber-100/50 rounded-xl"
          onClick={handleBackToToday}
        >
          <CalendarClock className="w-3.5 h-3.5 ml-2" />
          חזור להיום
        </Button>
      )}
    </div>
  );
}
