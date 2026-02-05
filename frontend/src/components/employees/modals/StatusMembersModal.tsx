import React, { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { User, Phone } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { Badge } from "@/components/ui/badge";

interface StatusMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    statusId: number | null;
    statusName: string;
    statusColor: string;
    date?: string;
}

export const StatusMembersModal: React.FC<StatusMembersModalProps> = ({
    open,
    onOpenChange,
    statusId,
    statusName,
    statusColor,
    date,
}) => {
    const { employees, fetchEmployees, loading } = useEmployees();

    useEffect(() => {
        if (open && statusId !== null && statusId !== undefined) {
            fetchEmployees(
                undefined, // search
                undefined, // dept_id
                undefined, // include_inactive
                statusId,
                undefined, // section_id
                undefined, // team_id
                date
            );
        }
    }, [open, statusId, date, fetchEmployees]);

    if (statusId === null || statusId === undefined) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0" dir="rtl">
                <DialogHeader className="p-6 pb-4 border-b border-border text-right">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full shadow-sm"
                            style={{ backgroundColor: statusColor }}
                        />
                        <DialogTitle className="text-xl font-black text-foreground">
                            שוטרים בסטטוס: {statusName}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-right mt-1 font-medium">
                        מציג {employees.length} שוטרים הנמצאים בסטטוס זה{date ? ` בתאריך ${date}` : ""}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
                            <p className="text-sm font-bold text-muted-foreground italic">טוען נתונים...</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-muted-foreground/30">
                            <User className="w-16 h-16 mb-2 opacity-10" />
                            <p className="font-bold text-lg">אין שוטרים בסטטוס זה</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border">
                                        <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">שוטר</th>
                                        <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">מספר אישי</th>
                                        <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">שיוך ארגוני</th>
                                        <th className="px-6 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest leading-none">טלפון</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-[10px] shadow-sm">
                                                        {emp.first_name[0]}{emp.last_name[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <EmployeeLink
                                                            employee={emp}
                                                            className="text-sm font-bold text-foreground group-hover:text-primary transition-colors"
                                                        />
                                                        {emp.is_commander && (
                                                            <span className="text-[9px] font-black text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-0.5">מפקד</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-muted-foreground">
                                                {emp.personal_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-foreground/80">{emp.department_name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-medium">
                                                        {emp.section_name} {emp.team_name && `• ${emp.team_name}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {emp.phone_number ? (
                                                    <a
                                                        href={`tel:${emp.phone_number}`}
                                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {emp.phone_number}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/30 font-medium italic">אין טלפון</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
                    <Badge variant="outline" className="text-[10px] font-bold bg-background text-muted-foreground border-border/50">
                        סה"כ רשומות: {employees.length}
                    </Badge>
                </div>
            </DialogContent>
        </Dialog>
    );
};
