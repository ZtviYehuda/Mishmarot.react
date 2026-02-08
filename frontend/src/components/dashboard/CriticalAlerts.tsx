import React, { useState } from "react";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { SickLeaveDetailsDialog } from "@/components/dashboard/SickLeaveDetailsDialog";

interface CriticalAlertsProps {
  onOpenBulkUpdate?: (missingIds: number[]) => void;
}

export const CriticalAlerts: React.FC<CriticalAlertsProps> = ({
  onOpenBulkUpdate,
}) => {
  const { alerts } = useNotifications();
  const [sickEmployees, setSickEmployees] = useState<any[]>([]);
  const [showSickModal, setShowSickModal] = useState(false);

  // Filter for danger alerts (like missing reports)
  const criticalAlerts = alerts.filter((a) => a.type === "danger");

  if (criticalAlerts.length === 0) return null;

  return (
    <>
      <div className="space-y-3 mb-6">
        {criticalAlerts.map((alert) => (
          <div
            key={alert.id}
            className="relative overflow-hidden group rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 transition-all hover:bg-red-500/10"
            dir="rtl"
          >
            {/* Decorative background element */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="flex-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wide">
                  {alert.title}
                </h3>
                <div className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              </div>
              <p className="text-xs font-bold text-red-600/80 leading-relaxed">
                {alert.description}
              </p>
            </div>

            {alert.data?.sick_employees ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSickEmployees(alert.data.sick_employees);
                  setShowSickModal(true);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn"
              >
                פרטים נוספים
                <Info className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
              </button>
            ) : alert.data?.missing_ids && onOpenBulkUpdate ? (
              <button
                onClick={() => onOpenBulkUpdate(alert.data.missing_ids)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn"
              >
                עדכון עכשיו
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-[-4px] transition-transform" />
              </button>
            ) : (
              <Link
                to={alert.link}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 group/btn"
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
