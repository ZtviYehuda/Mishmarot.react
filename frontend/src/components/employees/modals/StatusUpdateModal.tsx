import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Calendar,
    ClipboardList,
    CheckCircle2,
    Clock,
    Sun,
    Activity,
    GraduationCap,
    Shield,
    Car,
    Plane,
    UserCheck,
    Briefcase,
    CalendarDays
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StatusUpdateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    onSuccess?: () => void;
}

const getStatusIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("נוכח") || n.includes("משרד") || n.includes("ביחידה")) return UserCheck;
    if (n.includes("חופשה") || n.includes("בית") || n.includes("חופש")) return Sun;
    if (n.includes("מחלה") || n.includes("גימל") || n.includes("ביקור רופא")) return Activity;
    if (n.includes("קורס") || n.includes("הדרכה")) return GraduationCap;
    if (n.includes("אבטחה") || n.includes("תורנות") || n.includes("שמירה")) return Shield;
    if (n.includes("חוץ") || n.includes("נסיעה") || n.includes("בתפקיד")) return Car;
    if (n.includes("חו\"ל") || n.includes("טיסה")) return Plane;
    return Briefcase;
};

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    open,
    onOpenChange,
    employee,
    onSuccess,
}) => {
    const { getStatusTypes, logStatus } = useEmployees();
    const [statusTypes, setStatusTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    const [formData, setFormData] = useState({
        status_type_id: "",
        start_date: "",
        end_date: "",
        note: "",
    });

    useEffect(() => {
        if (open) {
            const fetchTypes = async () => {
                setFetching(true);
                const types = await getStatusTypes();
                setStatusTypes(types);
                setFetching(false);
            };
            fetchTypes();

            const today = new Date().toISOString().split('T')[0];
            setFormData({
                status_type_id: "",
                start_date: today,
                end_date: "",
                note: "",
            });
        }
    }, [open, getStatusTypes]);

    const handleSubmit = async () => {
        if (!employee || !formData.status_type_id) {
            toast.error("אנא בחר סטטוס");
            return;
        }

        setLoading(true);
        const success = await logStatus({
            employee_id: employee.id,
            status_type_id: parseInt(formData.status_type_id),
            start_date: formData.start_date || undefined,
            end_date: formData.end_date || undefined,
            note: formData.note || undefined,
        });

        if (success) {
            toast.success("הסטטוס עודכן בהצלחה");
            if (onSuccess) onSuccess();
            onOpenChange(false);
        }
        setLoading(false);
    };

    if (!employee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px] p-0 overflow-hidden rounded-[32px] border-none bg-white dark:bg-slate-950 shadow-2xl" dir="rtl">

                {/* Header: Clean & Centered */}
                <div className="pt-8 pb-4 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 mx-auto flex items-center justify-center text-slate-400 mb-4 border border-slate-100 dark:border-slate-800">
                        <ClipboardList className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl font-black text-slate-900 dark:text-white mb-1">
                        עדכון סטטוס שוטר
                    </DialogTitle>
                    <DialogDescription className="text-sm font-bold text-slate-400">
                        {employee.first_name} {employee.last_name}
                    </DialogDescription>
                </div>

                <div className="px-6 pb-6 space-y-6">
                    {/* Compact Grid of Statuses */}
                    <div className="grid grid-cols-2 gap-2">
                        {fetching ? (
                            <div className="col-span-2 py-8 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
                            </div>
                        ) : (
                            statusTypes.map((type) => {
                                const Icon = getStatusIcon(type.name);
                                const isSelected = formData.status_type_id === type.id.toString();

                                return (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, status_type_id: type.id.toString() }))}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-right group",
                                            isSelected
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                                                : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                                            isSelected ? "bg-white/20" : "bg-white dark:bg-slate-800 shadow-sm"
                                        )}>
                                            <Icon className={cn("w-4 h-4", isSelected ? "text-white" : "text-slate-400 group-hover:text-blue-500")} />
                                        </div>
                                        <span className="text-[11px] font-black leading-tight flex-1">
                                            {type.name}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Inputs Area */}
                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-900">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-1">מתאריך</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="h-9 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-right pl-8 pr-3 text-[10px] font-black focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-1">עד תאריך</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300/50" />
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                                        className="h-9 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-right pl-8 pr-3 text-[10px] font-black focus:ring-2 focus:ring-blue-500/10"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pr-1">הערה אישית</Label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-300" />
                                <Input
                                    value={formData.note}
                                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    placeholder="הוסף הערה..."
                                    className="h-9 bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl text-right pl-8 pr-3 text-[10px] font-black focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm Action */}
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col gap-3">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !formData.status_type_id}
                        className="w-full bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-black rounded-[20px] h-12 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-30 gap-2 text-sm"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        עדכן סטטוס שוטר
                    </Button>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors pb-1"
                    >
                        ביטול
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
