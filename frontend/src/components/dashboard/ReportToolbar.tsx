import { useState } from "react";
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

interface FilterDateState {
    viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly';
    date: Date;
}

interface ReportToolbarProps {
    viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly';
    onViewModeChange: (mode: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
    date: Date;
    onDateChange: (date: Date) => void;
    maxDate?: Date;
}

export function ReportToolbar({
    viewMode,
    onViewModeChange,
    date,
    onDateChange,
    maxDate
}: ReportToolbarProps) {

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <span className="font-bold text-muted-foreground whitespace-nowrap">
                    תצוגת דוח:
                </span>
                <Tabs
                    value={viewMode}
                    onValueChange={(val) => onViewModeChange(val as any)}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid w-full grid-cols-4 sm:w-[400px]">
                        <TabsTrigger value="daily">יומי</TabsTrigger>
                        <TabsTrigger value="weekly">שבועי</TabsTrigger>
                        <TabsTrigger value="monthly">חודשי</TabsTrigger>
                        <TabsTrigger value="yearly">שנתי</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {viewMode !== 'yearly' && ( // For now, Yearly just shows current year implicitly or doesn't need picker if it's always "This Year"? Or user picks Year?
                    // If ViewMode is Yearly, maybe pick Year? But DatePicker usually picks Date.
                    // Let's assume Yearly is just Year View. Maybe add Year Picker later if needed.
                    // For now, hide Date Picker for Yearly (just shows "2024").
                    // actually, user might want to pick 2023.
                    // I'll add simple Year Select logic later if needed.
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-[240px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {viewMode === 'monthly'
                                    ? format(date, "MMMM yyyy", { locale: he })
                                    : format(date, "dd/MM/yyyy", { locale: he })}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            {viewMode === 'monthly' ? (
                                <MonthPicker current={date} onSelect={onDateChange} />
                            ) : (
                                <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(d) => d && onDateChange(d)}
                                    locale={he}
                                    initialFocus
                                    disabled={(d) => maxDate ? d > maxDate : false}
                                />
                            )}
                        </PopoverContent>
                    </Popover>
                )}
                {viewMode === 'yearly' && (
                    <div className="text-sm font-bold border px-3 py-2 rounded-md bg-muted/50">
                        {format(date, "yyyy")}
                    </div>
                )}
            </div>
        </div>
    );
}
