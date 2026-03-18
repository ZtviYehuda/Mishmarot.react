import React, { useMemo, useTransition } from "react";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, ChevronLeft, RefreshCw, Calendar as CalendarIcon } from "lucide-react";
import { useDateContext } from "@/context/DateContext";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-1 flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/40 rounded-xl overflow-hidden h-10 shadow-none", compact ? "px-0" : "px-1")}>
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
                {isToday && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20" title="היום">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="hidden sm:block text-[8px] font-black text-emerald-600 uppercase">היום</span>
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

      {/* Quick Today Toggle */}
      <AnimatePresence>
        {!isToday && (
          <motion.button
            initial={{ opacity: 0, width: 0, x: 20 }}
            animate={{ opacity: 1, width: 36, x: 0 }}
            exit={{ opacity: 0, width: 0, x: 20 }}
            onClick={handleToday}
            className="h-9 w-9 flex items-center justify-center bg-primary text-primary-foreground rounded-xl transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
