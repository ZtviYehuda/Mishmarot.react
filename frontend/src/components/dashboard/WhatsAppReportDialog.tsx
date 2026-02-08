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
import { ShieldAlert, Info, FilterX, Send, RefreshCw } from "lucide-react";

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
      <DialogContent className="w-[95dvw] sm:max-w-md p-0 gap-0 overflow-hidden flex flex-col rounded-2xl border-none shadow-2xl animate-in zoom-in-95 duration-200">
        <DialogHeader
          className="p-6 pb-4 border-b bg-primary/5 text-right"
          dir="rtl"
        >
          <DialogTitle className="text-xl font-black text-primary flex items-center justify-start gap-2">
            <Send className="w-5 h-5" />
            שליחת דוח בווטסאפ
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            סקירת נתוני המצבה לשיתוף מהיר עם מפקדים
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Status Badge & Mode Switcher */}
          <div className="flex flex-col gap-3">
            <div
              className={`flex items-center justify-between p-3 rounded-xl border ${isFullMode ? "bg-orange-50/50 border-orange-100" : "bg-primary/5 border-primary/10"}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${isFullMode ? "bg-orange-100 text-orange-600" : "bg-primary/10 text-primary"}`}
                >
                  {isFullMode ? (
                    <RefreshCw className="w-4 h-4 animate-spin-slow" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col text-right" dir="rtl">
                  <span className="text-xs font-black uppercase tracking-tight opacity-60">
                    היקף הדוח
                  </span>
                  <span
                    className={`text-sm font-black ${isFullMode ? "text-orange-700" : "text-primary"}`}
                  >
                    {isFullMode
                      ? "כלל היחידה (ללא סינונים)"
                      : `מסונן: ${unitName}`}
                  </span>
                </div>
              </div>

              {isFiltered && (
                <Button
                  variant={isFullMode ? "outline" : "secondary"}
                  size="sm"
                  className="h-8 text-[10px] font-black rounded-lg gap-1.5"
                  onClick={() => setIsFullMode(!isFullMode)}
                >
                  {isFullMode ? (
                    <>
                      <FilterX className="w-3 h-3" />
                      חזור למסונן
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" />
                      דוח כלל היחידה
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-3" dir="rtl">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mr-1">
              תצוגה מקדימה להודעה
            </Label>
            <div className="relative group">
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-xs font-medium text-foreground whitespace-pre-wrap leading-relaxed min-h-[120px] max-h-[220px] overflow-y-auto custom-scrollbar shadow-inner text-right">
                {loadingFull ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-bold">טוען נתוני יחידה מלאים...</span>
                  </div>
                ) : (
                  generateWhatsAppMessage()
                )}
              </div>
            </div>
          </div>

          <div
            className="flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100"
            dir="rtl"
          >
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-normal font-medium">
              הדוח כולל פילוח סטטיסטי בלבד. שמות שוטרים ופרטים אישיים אינם
              נשלחים בווטסאפ מטעמי ביטחון מידע.
            </p>
          </div>
        </div>

        <div className="p-5 bg-muted/20 border-t flex flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl font-bold h-12 order-2 sm:order-1"
          >
            ביטול
          </Button>
          <WhatsAppButton
            onClick={handleSendWhatsApp}
            label="שליחה ב-WhatsApp"
            skipDirectLink={true}
            className="flex-[2] rounded-xl font-bold h-12 shadow-lg shadow-green-500/10 order-1 sm:order-2"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
