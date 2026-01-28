import { useEffect, useState } from "react";
import api from "@/config/api.client";
import { Clock, User, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface StatusLog {
    id: number;
    status_name: string;
    status_color: string;
    start_datetime: string;
    end_datetime: string | null;
    note: string | null;
    reported_by_name: string | null;
}

interface StatusHistoryListProps {
    employeeId: number;
    className?: string;
    limit?: number;
}

export default function StatusHistoryList({ employeeId, className, limit }: StatusHistoryListProps) {
    const [history, setHistory] = useState<StatusLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (employeeId) {
            fetchHistory();
        }
    }, [employeeId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/attendance/history/${employeeId}`);
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return format(new Date(dateStr), "dd/MM/yy HH:mm", { locale: he });
    };

    const displayHistory = limit ? history.slice(0, limit) : history;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-xs font-bold">טוען היסטוריה...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold">לא נמצאה היסטוריית דיווחים</p>
            </div>
        );
    }

    return (
        <div className={cn("relative space-y-4", className)}>
            {/* Timeline Connector */}
            <div className="absolute top-0 bottom-0 right-[21px] w-0.5 bg-border/50" />

            {displayHistory.map((log, idx) => (
                <div key={log.id} className="relative pr-12 group">
                    {/* Timeline Dot */}
                    <div
                        className={cn(
                            "absolute right-4 top-4 w-3 h-3 rounded-full border-2 border-card z-10 transition-transform group-hover:scale-125",
                            idx === 0 ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-muted-foreground/30"
                        )}
                        style={idx === 0 ? {} : { backgroundColor: log.status_color }}
                    />

                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm group-hover:shadow-md transition-all group-hover:border-primary/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: log.status_color }}
                                />
                                <span className="text-sm font-black text-foreground">
                                    {log.status_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(log.start_datetime)}
                                </div>
                                {log.end_datetime && (
                                    <div className="text-[10px] font-bold text-muted-foreground/60">
                                        עד {formatDate(log.end_datetime)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {log.reported_by_name && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                                    <User className="w-3.5 h-3.5" />
                                    <span>דווח ע"י: {log.reported_by_name}</span>
                                </div>
                            )}
                            {log.note && (
                                <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground/80">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="truncate">הערה: {log.note}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
