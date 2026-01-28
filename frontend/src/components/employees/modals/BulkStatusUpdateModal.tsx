import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    CheckCircle2,
    Search,
    User,
    AlertCircle,
    Calendar,
    ArrowRight
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BulkStatusUpdateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    onSuccess?: () => void;
}

interface UpdateState {
    status_id: number;
    status_name: string;
    color: string;
    isChanged: boolean;
    start_date?: string;
    end_date?: string;
}

export const BulkStatusUpdateModal: React.FC<BulkStatusUpdateModalProps> = ({
    open,
    onOpenChange,
    employees,
    onSuccess,
}) => {
    const { getStatusTypes, logBulkStatus } = useEmployees();
    const [statusTypes, setStatusTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Local state for temporary changes before submission
    const [bulkUpdates, setBulkUpdates] = useState<Record<number, UpdateState>>({});

    useEffect(() => {
        if (open) {
            const fetchTypes = async () => {
                setFetching(true);
                const types = await getStatusTypes();
                setStatusTypes(types);
                setFetching(false);
            };
            fetchTypes();

            // Initialize bulkUpdates with current statuses
            const initial: Record<number, UpdateState> = {};
            employees.forEach(emp => {
                if (emp.status_id) {
                    initial[emp.id] = {
                        status_id: emp.status_id,
                        status_name: emp.status_name || "ללא סטטוס",
                        color: emp.status_color || "#94a3b8",
                        isChanged: false,
                        start_date: new Date().toISOString().split('T')[0]
                    };
                }
            });
            setBulkUpdates(initial);
        }
    }, [open, getStatusTypes, employees]);

    const handleSubmit = async () => {
        setLoading(true);
        // We only send updates that were changed OR we send all? 
        // User said: "update the current statuses so the commander doesn't work hard... and if changed, change specifically".
        // It's probably better to send all shown in the list to "re-confirm" them for today.
        const updates = Object.entries(bulkUpdates).map(([empId, data]) => ({
            employee_id: parseInt(empId),
            status_type_id: data.status_id,
            start_date: data.isChanged ? data.start_date : undefined,
            end_date: data.isChanged ? data.end_date : undefined
        }));

        if (updates.length === 0) {
            toast.error("אין עדכונים לביצוע");
            setLoading(false);
            return;
        }

        const success = await logBulkStatus(updates);

        if (success) {
            toast.success("כלל הסטטוסים עודכנו בהצלחה");
            if (onSuccess) onSuccess();
            onOpenChange(false);
        }
        setLoading(false);
    };

    const handleUpdateIndividual = (empId: number, statusId: string) => {
        const type = statusTypes.find(t => t.id.toString() === statusId);
        const original = employees.find(e => e.id === empId);

        if (type) {
            setBulkUpdates(prev => ({
                ...prev,
                [empId]: {
                    ...prev[empId],
                    status_id: type.id,
                    status_name: type.name,
                    color: type.color,
                    isChanged: type.id !== original?.status_id
                }
            }));
        }
    };

    const handleDateChange = (empId: number, field: 'start_date' | 'end_date', value: string) => {
        setBulkUpdates(prev => ({
            ...prev,
            [empId]: { ...prev[empId], [field]: value }
        }));
    };

    const filteredList = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden rounded-[32px] border-none bg-card shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">

                <DialogHeader className="p-8 pb-4 text-right">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-black text-foreground mb-1">
                                עדכון נוכחות יומי
                            </DialogTitle>
                            <DialogDescription className="text-sm font-bold text-muted-foreground">
                                אשר או עדכן את הסטטוס הנוכחי עבור כלל השוטרים
                            </DialogDescription>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Calendar className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="relative mt-6">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <input
                            type="text"
                            placeholder="חיפוש מהיר ברשימה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pr-10 pl-4 bg-muted/50 border-input border rounded-2xl text-sm font-bold text-foreground focus:ring-2 focus:ring-ring/20 outline-none"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-2">
                    <div className="space-y-3">
                        {fetching ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <span className="text-xs font-bold text-muted-foreground">טוען נתונים...</span>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <AlertCircle className="w-8 h-8 opacity-20" />
                                <span className="text-sm font-bold">לא נמצאו שוטרים</span>
                            </div>
                        ) : (
                            filteredList.map((emp) => {
                                const current = bulkUpdates[emp.id];
                                return (
                                    <div
                                        key={emp.id}
                                        className={cn(
                                            "flex flex-col p-4 rounded-2xl transition-all border",
                                            current?.isChanged
                                                ? "bg-primary/5 border-primary/20"
                                                : "bg-muted/30 border-transparent hover:border-border"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-colors",
                                                    current?.isChanged ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground"
                                                )}>
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {emp.first_name} {emp.last_name}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground">
                                                        מחלקת {emp.department_name || 'כללי'} • {emp.personal_number}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="w-48">
                                                <Select
                                                    value={current?.status_id.toString()}
                                                    onValueChange={(val) => handleUpdateIndividual(emp.id, val)}
                                                >
                                                    <SelectTrigger className="h-10 text-right font-bold text-[11px] bg-card border-input rounded-xl" dir="rtl">
                                                        <SelectValue placeholder="בחר סטטוס" />
                                                    </SelectTrigger>
                                                    <SelectContent dir="rtl">
                                                        {statusTypes.map((type) => (
                                                            <SelectItem
                                                                key={type.id}
                                                                value={type.id.toString()}
                                                                className="text-right font-bold text-[11px]"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: type.color || "var(--muted-foreground)" }} />
                                                                    {type.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Optional Dates if status changed */}
                                        {current?.isChanged && (
                                            <div className="mt-4 pt-5 border-t border-primary/10 flex flex-wrap items-center gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                                                    <span className="text-[11px] font-black text-primary pr-1 uppercase tracking-wider">תאריך התחלה:</span>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/50" />
                                                        <input
                                                            type="date"
                                                            value={current.start_date}
                                                            onChange={(e) => handleDateChange(emp.id, 'start_date', e.target.value)}
                                                            className="w-full bg-card border-2 border-primary/10 rounded-xl h-12 text-sm font-black pl-10 pr-4 text-right focus:border-primary focus:ring-0 transition-all outline-none"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pt-6 hidden sm:block">
                                                    <ArrowRight className="w-5 h-5 text-muted-foreground/30" />
                                                </div>
                                                <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                                                    <span className="text-[11px] font-black text-primary pr-1 uppercase tracking-wider">תאריך סיום (אופציונלי):</span>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                                                        <input
                                                            type="date"
                                                            value={current.end_date || ""}
                                                            onChange={(e) => handleDateChange(emp.id, 'end_date', e.target.value)}
                                                            className="w-full bg-card border-2 border-primary/10 rounded-xl h-12 text-sm font-black pl-10 pr-4 text-right focus:border-primary focus:ring-0 transition-all placeholder:text-muted-foreground/30 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-8 bg-muted/40 flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2 shadow-sm">
                        <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-foreground/70 leading-relaxed">
                            אישור הפעולה יעדכן את הסטטוס עבור {Object.keys(bulkUpdates).length} שוטרים. סטטוסים שלא שונו יאושררו מחדש להיום, וסטטוסים ששונו ירשמו עם התאריכים שהוגדרו.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || Object.keys(bulkUpdates).length === 0}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-12 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-30 gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            אישור ושליחת כל הדיווחים
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-8 border-input bg-card rounded-2xl h-12 font-bold text-muted-foreground hover:bg-muted transition-all shadow-sm"
                        >
                            ביטול
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
