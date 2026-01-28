import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Employee } from "@/types/employee.types";
import { History } from "lucide-react";
import StatusHistoryList from "../StatusHistoryList";

interface StatusHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
}

export default function StatusHistoryModal({
    open,
    onOpenChange,
    employee,
}: StatusHistoryModalProps) {
    if (!employee) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-border shadow-2xl" dir="rtl">
                <DialogHeader className="p-6 border-b border-border bg-card">
                    <DialogTitle className="flex items-center gap-3 text-xl font-black text-foreground">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                            <History className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-right">
                            <span>היסטוריית סטטוסים</span>
                            <span className="text-xs font-bold text-muted-foreground mt-0.5">
                                {employee.first_name} {employee.last_name} | {employee.personal_number}
                            </span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-muted/20">
                    <StatusHistoryList employeeId={employee.id} />
                </div>
            </DialogContent>
        </Dialog>
    );
}
