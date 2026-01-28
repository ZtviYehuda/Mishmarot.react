import { useEffect } from "react";
import { User, Phone, X } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatusListProps {
    statusId: number | null;
    statusName: string;
    statusColor: string;
    onClose: () => void;
}

export const DashboardStatusList = ({
    statusId,
    statusName,
    statusColor,
    onClose,
}: DashboardStatusListProps) => {
    const { employees, fetchEmployees, loading } = useEmployees();

    useEffect(() => {
        if (statusId !== null && statusId !== undefined) {
            fetchEmployees(undefined, undefined, undefined, statusId);
        }
    }, [statusId, fetchEmployees]);

    if (statusId === null || statusId === undefined) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 pointer-events-none flex justify-center">
            <Card className="w-full max-w-5xl pointer-events-auto border border-slate-200 dark:border-slate-800 shadow-[0_-8px_40px_rgba(0,0,0,0.12)] bg-white dark:bg-slate-900 animate-in slide-in-from-bottom duration-300 rounded-t-2xl overflow-hidden max-h-[60vh] flex flex-col">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-border/50 shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: statusColor }}
                            />
                            <CardTitle className="text-xl font-black text-[#001e30] dark:text-white">
                                {statusName}
                            </CardTitle>
                            <span className="text-xs font-black text-slate-400 mr-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                                {employees.length} רשומות
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 h-8 font-bold border-slate-100 dark:border-slate-800"
                        >
                            <X className="w-4 h-4 ml-1.5" />
                            סגור תצוגה
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center p-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-4 border-slate-100 border-t-[#0074ff] rounded-full animate-spin" />
                                <p className="text-sm font-bold text-slate-400">טוען רשימה...</p>
                            </div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-300">
                            <User className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-base font-bold">אין משרתים בסטטוס זה</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30 dark:bg-slate-900/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                                {employees.map((emp) => (
                                    <div
                                        key={emp.id}
                                        className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start gap-4 hover:border-[#0074ff]/30 hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-[#eff6ff] dark:bg-slate-700 flex items-center justify-center text-[#0074ff] font-black text-xs shrink-0 shadow-sm">
                                            {emp.first_name[0]}{emp.last_name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-[#001e30] dark:text-white truncate">
                                                {emp.first_name} {emp.last_name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 font-mono uppercase tracking-tight">
                                                {emp.personal_number}
                                            </p>
                                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-600/50">
                                                    {emp.department_name}
                                                </span>
                                                {emp.phone_number && (
                                                    <a
                                                        href={`tel:${emp.phone_number}`}
                                                        className="text-[10px] font-bold text-[#0074ff] hover:scale-105 transition-transform flex items-center gap-1.5 bg-[#eff6ff] dark:bg-[#0074ff]/10 px-2 py-0.5 rounded"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        {emp.phone_number}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
