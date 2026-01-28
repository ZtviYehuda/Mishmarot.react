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
    AlertCircle
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

interface BulkStatusUpdateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    onSuccess?: () => void;
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
    const [bulkUpdates, setBulkUpdates] = useState<Record<number, { status_id: number; status_name: string; color: string }>>({});

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
            const initial: Record<number, { status_id: number; status_name: string; color: string }> = {};
            employees.forEach(emp => {
                if (emp.status_id) {
                    initial[emp.id] = {
                        status_id: emp.status_id,
                        status_name: emp.status_name || "ללא סטטוס",
                        color: emp.status_color || "#94a3b8"
                    };
                }
            });
            setBulkUpdates(initial);
        }
    }, [open, getStatusTypes, employees]);

    const handleSubmit = async () => {
        setLoading(true);
        const updates = Object.entries(bulkUpdates).map(([empId, data]) => ({
            employee_id: parseInt(empId),
            status_type_id: data.status_id
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
        if (type) {
            setBulkUpdates(prev => ({
                ...prev,
                [empId]: { status_id: type.id, status_name: type.name, color: type.color }
            }));
        }
    };

    const filteredList = employees.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[32px] border-none bg-white dark:bg-slate-950 shadow-2xl flex flex-col max-h-[90vh]" dir="rtl">

                <DialogHeader className="p-8 pb-4 text-right">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                                עדכון נוכחות יומי
                            </DialogTitle>
                            <DialogDescription className="text-sm font-bold text-slate-400">
                                אשר או עדכן את הסטטוס הנוכחי עבור כלל המשרתים
                            </DialogDescription>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="relative mt-6">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input
                            type="text"
                            placeholder="חיפוש מהיר ברשימה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-11 pr-10 pl-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-8 py-2">
                    <div className="space-y-2">
                        {fetching ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="text-xs font-bold text-slate-400">טוען נתונים...</span>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                                <AlertCircle className="w-8 h-8 opacity-20" />
                                <span className="text-sm font-bold">לא נמצאו משרתים</span>
                            </div>
                        ) : (
                            filteredList.map((emp) => {
                                const current = bulkUpdates[emp.id];
                                return (
                                    <div
                                        key={emp.id}
                                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    {emp.first_name} {emp.last_name}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    מחלקת {emp.department_name || 'כללי'} • {emp.personal_number}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="w-48">
                                            <Select
                                                value={current?.status_id.toString()}
                                                onValueChange={(val) => handleUpdateIndividual(emp.id, val)}
                                            >
                                                <SelectTrigger className="h-9 text-right font-bold text-[11px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" dir="rtl">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: current?.color || '#94a3b8' }}
                                                        />
                                                        <SelectValue placeholder="בחר סטטוס" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent dir="rtl">
                                                    {statusTypes.map((type) => (
                                                        <SelectItem
                                                            key={type.id}
                                                            value={type.id.toString()}
                                                            className="text-right font-bold text-[11px]"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                                                                {type.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/20 mb-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 leading-relaxed">
                            שימת לב: אישור הפעולה יעדכן את הסטטוס היומי עבור {Object.keys(bulkUpdates).length} משרתים ברשימה. הסטטוסים ירשמו עם תאריך ושעת הדיווח הנוכחיים.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || Object.keys(bulkUpdates).length === 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl h-12 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-30 gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            אישור ושליחת כל הדיווחים
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="px-8 border-slate-200 dark:border-slate-800 rounded-2xl h-12 font-bold text-slate-500 hover:bg-white transition-all"
                        >
                            ביטול
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
