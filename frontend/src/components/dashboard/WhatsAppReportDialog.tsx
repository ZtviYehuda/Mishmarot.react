import { useState, useMemo, useEffect } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import {
  ShieldAlert,
  Info,
  FilterX,
  Send,
  RefreshCw,
  ArrowLeft,
  LayoutDashboard,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStats: any[]; // The grouped stats from the dashboard
  unitName: string;
  isFiltered: boolean;
}

export const WhatsAppReportDialog = ({
  open,
  onOpenChange,
  currentStats,
  unitName,
  isFiltered,
}: WhatsAppReportDialogProps) => {
  const { getDashboardStats } = useEmployees();
  const { user } = useAuthContext();

  const [isFullMode, setIsFullMode] = useState(false);
  const [fullStats, setFullStats] = useState<any[] | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);

  // Reset mode when dialog opens
  useEffect(() => {
    if (open) {
      setIsFullMode(false);
    }
  }, [open]);

  // Fetch full stats if requested
  useEffect(() => {
    if (open && isFullMode && !fullStats) {
      const fetchFull = async () => {
        setLoadingFull(true);
        const data = await getDashboardStats({});
        if (data && data.stats) {
          setFullStats(data.stats);
        } else if (Array.isArray(data)) {
          setFullStats(data);
        }
        setLoadingFull(false);
      };
      fetchFull();
    }
  }, [open, isFullMode, fullStats, getDashboardStats]);

  const activeStats = isFullMode ? fullStats || [] : currentStats;
  const activeUnit = isFullMode ? "כלל היחידה" : unitName;

  const reportData = useMemo(() => {
    let total = 0;
    const sorted = [...activeStats].sort((a, b) => b.count - a.count);
    sorted.forEach((s) => (total += s.count));
    return { total, byStatus: sorted };
  }, [activeStats]);

  const generateWhatsAppMessage = () => {
    const commander = user ? `${user.first_name} ${user.last_name}` : "מפקד";
    let message = `📊 *דוח מצבת כוח אדם*\n`;
    message += `\n*מפקד/ת:* ${commander}\n`;
    message += `*תאריך:* ${new Date().toLocaleDateString("he-IL")}\n`;
    message += `*יחידה:* ${activeUnit}\n`;

    if (isFiltered && !isFullMode) {
      message += `_(תצוגה מסוננת)_\n`;
    }

    message += `\n*סך הכל שוטרים:* ${reportData.total}\n\n`;

    message += `*פילוח לפי סטטוס:*\n`;
    reportData.byStatus.forEach(({ status_name, count }) => {
      const percentage =
        reportData.total > 0 ? Math.round((count / reportData.total) * 100) : 0;
      message += `• ${status_name}: ${count} (${percentage}%)\n`;
    });

    return message;
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 border-none bg-card shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0 rotate-3">
              <Send className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1 text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight mb-1">
                שיתוף דוח נוכחות
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                ייצוא נתוני המצבה ושליחתם למפקדים בווטסאפ בצורה מאובטחת
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Status Selection / Mode Switcher */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-primary uppercase tracking-widest leading-none pr-1">
              בחר את היקף הנתונים לדוח:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setIsFullMode(false)}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-right group",
                  !isFullMode
                    ? "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    !isFullMode ? "bg-white/20 text-white" : "bg-background text-muted-foreground shadow-sm"
                  )}>
                    <FilterX className="w-4 h-4" />
                  </div>
                  {!isFullMode && <Check className="w-4 h-4 mr-auto opacity-50" />}
                </div>
                <span className="text-sm font-black block leading-tight">דוח מסונן</span>
                <span className={cn(
                  "text-[10px] font-bold block mt-1",
                  !isFullMode ? "text-primary-foreground/70" : "text-muted-foreground/60"
                )}>
                  ליחידה: {unitName}
                </span>
              </button>

              <button
                onClick={() => setIsFullMode(true)}
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all text-right group",
                  isFullMode
                    ? "bg-amber-600 border-amber-600 text-white shadow-xl shadow-amber-600/20"
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                    isFullMode ? "bg-white/20 text-white" : "bg-background text-muted-foreground shadow-sm"
                  )}>
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  {isFullMode && <Check className="w-4 h-4 mr-auto opacity-50" />}
                </div>
                <span className="text-sm font-black block leading-tight">דוח כללי</span>
                <span className={cn(
                  "text-[10px] font-bold block mt-1",
                  isFullMode ? "text-white/70" : "text-muted-foreground/60"
                )}>
                  כלל שוטרי היחידה
                </span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-none pr-1">
              תצוגה מקדימה להודעה הנשלחת:
            </h3>
            <div className="relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-2 rounded-tr-xl bg-muted z-10" />
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/50 text-[13px] font-bold text-foreground whitespace-pre-wrap leading-relaxed shadow-inner min-h-[160px] max-h-[280px] overflow-y-auto custom-scrollbar">
                {loadingFull ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest">טוען נתונים מלאים...</span>
                  </div>
                ) : (
                  generateWhatsAppMessage()
                )}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="flex items-start gap-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-[11px] text-blue-800 leading-normal font-black tracking-tight opacity-70">
              הדוח כולל פילוח סטטיסטי מספרי בלבד. שמות שוטרים, מספרי טלפון ופרטים אישיים רגישים אינם נשלחים בווטסאפ מטעמי אבטחת מידע ושמירה על פרטיות.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto px-8 h-12 font-black text-muted-foreground hover:text-foreground hover:bg-transparent rounded-2xl transition-all order-2 sm:order-1 text-xs uppercase tracking-widest gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            ביטול וחזרה
          </Button>

          <WhatsAppButton
            onClick={handleSendWhatsApp}
            skipDirectLink={true}
            text="שלח דוח כעת"
            className="w-full sm:w-auto h-14 px-10 rounded-2xl shadow-2xl shadow-green-500/20 order-1 sm:order-2 font-black text-base"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
