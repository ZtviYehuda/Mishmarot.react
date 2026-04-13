import React, { useMemo, useTransition } from "react";
import { format, subDays, addDays, isSameDay, differenceInCalendarDays } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, ChevronLeft, RotateCcw, Calendar as CalendarIcon } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const DateHeader: React.FC<{ className?: string; compact?: boolean }> = ({ className, compact }) => {
  const { selectedDate, setSelectedDate } = useDateContext();
  const [isPending, startTransition] = useTransition();

  const handlePrevDay = () => startTransition(() => setSelectedDate(subDays(selectedDate, 1)));
  const handleNextDay = () => startTransition(() => setSelectedDate(addDays(selectedDate, 1)));
  const handleToday = () => startTransition(() => setSelectedDate(new Date()));

  const isToday = useMemo(() => isSameDay(selectedDate, new Date()), [selectedDate]);

  const relativeDayInfo = useMemo(() => {
    if (isToday) return null;
    const diff = differenceInCalendarDays(selectedDate, new Date());
    return diff < 0
      ? { label: "עבר", isPast: true }
      : { label: "עתיד", isPast: false };
  }, [selectedDate, isToday]);

  return (
    <div className={cn("relative group flex items-center shrink-0", className)}>
      <div className={cn("flex-1 flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 rounded-xl h-10 shadow-none relative overflow-visible", compact ? "px-0" : "px-1")}>
        {/* Next Day (Right Arrow in RTL) */}
        {!compact && (
          <button
            onClick={handleNextDay}
            className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 shrink-0 border-l border-border/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Date Display with Calendar Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all flex-1 min-w-0 px-3 sm:px-4 h-full",
                isPending && "opacity-50 grayscale-[0.5] scale-95"
              )}
            >
              <span className="hidden sm:block text-[9px] font-black text-primary/60 uppercase tracking-[0.1em] leading-none mb-0.5">
                {format(selectedDate, "EEEE", { locale: he })}
              </span>
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="hidden sm:block w-3 h-3 text-primary/40 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-primary tabular-nums leading-none whitespace-nowrap tracking-tight sm:tracking-normal">
                  {format(selectedDate, "d/M/yy")}
                </span>

                {/* היום */}
                {isToday && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20" title="היום">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="hidden sm:block text-[8px] font-black text-emerald-600 uppercase">היום</span>
                  </div>
                )}

                {/* עבר / עתיד */}
                {relativeDayInfo && (
                  <div
                    className={cn(
                      "flex items-center gap-1 px-1.5 py-0.5 rounded-full border",
                      relativeDayInfo.isPast
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-violet-500/10 border-violet-500/20"
                    )}
                    title={relativeDayInfo.label}
                  >
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        relativeDayInfo.isPast ? "bg-amber-500" : "bg-violet-500"
                      )}
                    />
                    <span
                      className={cn(
                        "hidden sm:block text-[8px] font-black uppercase",
                        relativeDayInfo.isPast ? "text-amber-600" : "text-violet-600"
                      )}
                    >
                      {relativeDayInfo.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border-border/40" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && startTransition(() => setSelectedDate(date))}
              initialFocus
              locale={he}
              className="rounded-2xl border-none"
            />
          </PopoverContent>
        </Popover>

        {/* Previous Day (Left Arrow in RTL) */}
        {!compact && (
          <button
            onClick={handlePrevDay}
            className="w-10 h-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 shrink-0 border-r border-border/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Today Toggle - FLOATING STYLE */}
      {!isToday && (
        <button
          onClick={handleToday}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center border-2 border-background transition-all hover:scale-110 active:scale-90 z-20 group-hover:-translate-y-1"
          title="חזרה להיום"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
