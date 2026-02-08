import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Calendar, User, Clock, ClipboardCheck } from "lucide-react";

interface SickEmployee {
    id: number;
    first_name: string;
    last_name: string;
    days_sick: number;
    start_date: string | null;
}

interface SickLeaveDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: SickEmployee[];
}

export const SickLeaveDetailsDialog: React.FC<SickLeaveDetailsDialogProps> = ({
    open,
    onOpenChange,
    employees,
}) => {
    const navigate = useNavigate();

    const handleNavigate = (id: number) => {
        onOpenChange(false);
        navigate(`/employees/${id}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-white/20 shadow-2xl p-0 overflow-hidden gap-0 rounded-3xl" dir="rtl">
                <DialogHeader className="p-6 bg-gradient-to-br from-red-50 to-orange-50/50 border-b border-red-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <DialogTitle className="text-xl font-black text-red-950">
                            מחלה ממושכת
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-red-900/70 font-medium mr-1.5">
                        רשימת שוטרים הנמצאים במחלה מעל 4 ימים
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-6 bg-background/50 custom-scrollbar">
                    <div className="space-y-3">
                        {employees.map((emp) => (
                            <div
                                key={emp.id}
                                className="group relative overflow-hidden bg-card border border-border/60 hover:border-red-200 hover:shadow-md hover:shadow-red-500/5 transition-all rounded-2xl p-4 flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-12 w-12 shrink-0 rounded-full border-2 border-background shadow-sm ring-2 ring-red-50 flex items-center justify-center bg-red-50 text-red-700 font-bold overflow-hidden text-sm">
                                        {emp.first_name?.[0]}
                                        {emp.last_name?.[0]}
                                    </div>
                                    <div className="min-w-0 leading-tight">
                                        <h4 className="font-bold text-foreground truncate text-sm sm:text-base">
                                            {emp.first_name} {emp.last_name}
                                        </h4>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground font-medium mt-1">
                                            <div className="flex items-center gap-1.5 text-red-600/80 bg-red-50 px-2 py-0.5 rounded-md w-fit">
                                                <Clock className="w-3 h-3" />
                                                <span>{emp.days_sick} ימים במחלה</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-80">
                                                <Calendar className="w-3 h-3" />
                                                <span>
                                                    מ-
                                                    {emp.start_date
                                                        ? format(new Date(emp.start_date), "dd/MM/yyyy")
                                                        : "לא ידוע"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-7 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider shadow-sm hover:shadow transition-all bg-red-600 hover:bg-red-700 text-white"
                                        onClick={() => {
                                            onOpenChange(false);
                                            navigate('/attendance', {
                                                state: {
                                                    openBulkModal: true,
                                                    // Passing missingIds will trigger the modal on AttendancePage
                                                    // and filter only this employee if logic allows, 
                                                    // or generally open bulk update.
                                                    // Based on AttendancePage line 99: setAlertContext({ missing_ids: location.state.missingIds })
                                                    // line 250: employeesForModal filters by missing_ids
                                                    missingIds: [emp.id]
                                                }
                                            });
                                        }}
                                    >
                                        עדכון
                                        <ClipboardCheck className="w-3 h-3 mr-1.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-3 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-muted text-muted-foreground border border-transparent hover:border-border"
                                        onClick={() => handleNavigate(emp.id)}
                                    >
                                        פרופיל
                                        <User className="w-3 h-3 mr-1.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {employees.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>אין נתונים להצגה</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-muted/30 border-t border-border/50 text-center">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto min-w-[120px] rounded-xl font-bold"
                    >
                        סגור
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
