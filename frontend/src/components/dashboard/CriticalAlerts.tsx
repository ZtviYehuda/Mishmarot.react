import React, { useState } from "react";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { SickLeaveDetailsDialog } from "@/components/dashboard/SickLeaveDetailsDialog";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CriticalAlertsProps {
  onOpenBulkUpdate?: (missingIds: number[]) => void;
}

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({
  onOpenBulkUpdate,
}) => {
  const { alerts, refreshAlerts } = useNotifications();
  const { cancelDelegation } = useEmployees();
  const [sickEmployees, setSickEmployees] = useState<any[]>([]);
  const [showSickModal, setShowSickModal] = useState(false);

  // Filter for danger alerts OR delegation alerts
  const criticalAlerts = alerts.filter(
    (a) =>
      a.type === "danger" ||
      a.id === "command-delegated" ||
      a.id === "active-temp-commander",
  );

  const handleCancelDelegation = async () => {
    const ok = await cancelDelegation();
    if (ok) {
      toast.success("סמכויות הפיקוד הוחזרו אליך בהצלחה");
      refreshAlerts();
    } else {
      toast.error("ביטול ההאצלה נכשל");
    }
  };

  if (criticalAlerts.length === 0) return null;

  return (
    <>
      <div className="space-y-3 mb-6">
        {criticalAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "relative overflow-hidden group rounded-[1.5rem] border backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 transition-all duration-500 shadow-xl shadow-black/5",
              alert.type === "danger"
                ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                : alert.type === "warning" || alert.id === "command-delegated"
                  ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                  : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10",
            )}
            dir="rtl"
          >
            {/* Decorative background element */}
            <div
              className={cn(
                "absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700",
                alert.type === "danger"
                  ? "bg-red-500/10"
                  : alert.type === "warning" || alert.id === "command-delegated"
                    ? "bg-amber-500/10"
                    : "bg-blue-500/10",
              )}
            />

            <div
              className={cn(
                "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 shadow-inner",
                alert.type === "danger"
                  ? "bg-red-500/10 border-red-500/20 text-red-600"
                  : alert.type === "warning" || alert.id === "command-delegated"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-600",
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-6 h-6 animate-pulse",
                  alert.type === "info" && "animate-none",
                )}
              />
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3
                  className={cn(
                    "text-sm font-black uppercase tracking-wide",
                    alert.type === "danger"
                      ? "text-red-700 dark:text-red-400"
                      : alert.type === "warning" ||
                          alert.id === "command-delegated"
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-blue-700 dark:text-blue-400",
                  )}
                >
                  {alert.title}
                </h3>
                <div
                  className={cn(
                    "flex h-1.5 w-1.5 rounded-full animate-ping",
                    alert.type === "danger"
                      ? "bg-red-500"
                      : alert.type === "warning" ||
                          alert.id === "command-delegated"
                        ? "bg-amber-500"
                        : "bg-blue-500",
                  )}
                />
              </div>
              <p
                className={cn(
                  "text-xs font-bold leading-relaxed",
                  alert.type === "danger"
                    ? "text-red-600/80"
                    : alert.type === "warning" ||
                        alert.id === "command-delegated"
                      ? "text-amber-600/80"
                      : "text-blue-600/80",
                )}
              >
                {alert.description}
              </p>
            </div>

            {alert.data?.is_delegation ? (
              <button
                onClick={handleCancelDelegation}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-amber-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 group/btn active:scale-95"
              >
                ביטול האצלה
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-[-4px] transition-transform" />
              </button>
            ) : alert.id === "active-temp-commander" ? (
              <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                הרשאה פעילה
              </div>
            ) : alert.data?.sick_employees ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSickEmployees(alert.data.sick_employees);
                  setShowSickModal(true);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn active:scale-95"
              >
                פרטים נוספים
                <Info className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
              </button>
            ) : alert.data?.missing_ids && onOpenBulkUpdate ? (
              <button
                onClick={() => onOpenBulkUpdate(alert.data.missing_ids)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn active:scale-95"
              >
                עדכון עכשיו
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-[-4px] transition-transform" />
              </button>
            ) : (
              <Link
                to={alert.link}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn active:scale-95"
              >
                עדכון עכשיו
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-[-4px] transition-transform" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <SickLeaveDetailsDialog
        open={showSickModal}
        onOpenChange={setShowSickModal}
        employees={sickEmployees}
      />
    </>
  );
};
