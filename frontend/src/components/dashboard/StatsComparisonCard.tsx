import { useRef, forwardRef, useImperativeHandle } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { format } from "date-fns";

interface ComparisonStat {
  unit_id: number;
  unit_name: string;
  total_count: number;
  present_count: number;
  absent_count: number;
  unknown_count: number;
  level: string;
}

interface StatsComparisonCardProps {
  data: ComparisonStat[];
  loading?: boolean;
  days: number;
  onDaysChange: (days: number) => void;
  className?: string;
  onShare?: () => void;
  unitName?: string;
  subtitle?: string;
}

export const StatsComparisonCard = forwardRef<any, StatsComparisonCardProps>(
  (
    {
      data,
      loading,
      days,
      onDaysChange,
      className,
      unitName = "כלל היחידה",
      subtitle,
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const handleDownload = async () => {
      if (cardRef.current === null) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.download = `unit-comparison-${days}-days.png`;
        link.href = dataUrl;
        link.click();
        toast.success("הגרף יוצא כתמונה בהצלחה");
      } catch (err) {
        console.error("Failed to download image", err);
        toast.error("שגיאה בייצוא הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;

      try {
        // 1. Capture Image as Blob
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
        });

        if (!blob) throw new Error("Failed to capture image");

        const rangeText = days === 1 ? "יומית" : days === 7 ? "שבועית" : "חודשית";
        const statsSummary = data && data.length > 0
          ? `\n📊 *סיכום:* ${data.length} יחידות מוצגות.`
          : "";
        const filterText = subtitle ? `\n🔍 *סינון:* ${subtitle}` : "";
        const title = `דוח השוואת כוח אדם (${rangeText}) - ${unitName}`;
        const message = `*${title}*\nתאריך: ${format(new Date(), "dd/MM/yyyy")}${filterText}${statsSummary}`;

        // 2. Try Web Share API (Mobile/Modern OS/App Support)
        const file = new File([blob], `comparison-${days}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: title,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return; // Shared!
          } catch (shareErr) {
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return; // User cancelled
            }
          }
        }

        // 3. FALLBACK: Copy to Clipboard + WhatsApp Link
        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed", clipErr);
        }

        // Trigger a backup download
        const dataUrl = await toPng(cardRef.current, { backgroundColor: "#ffffff" });
        const link = document.createElement("a");
        link.download = `השוואת_כוחות_${format(new Date(), "dd-MM-yyyy")}.png`;
        link.href = dataUrl;
        link.click();

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    if (loading) {
      return (
        <Card className={cn("h-full", className)}>
          <CardHeader>
            <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
            <CardDescription className="animate-pulse bg-muted h-4 w-48 rounded mt-2"></CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card
        ref={cardRef}
        id="stats-comparison-card"
        className={cn("h-full border shadow-sm flex flex-col bg-card", className)}
      >
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">השוואת כוח אדם</CardTitle>
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-right" dir="rtl">
                    <p className="font-bold mb-1">כיצד מחושב?</p>
                    <ul className="text-xs space-y-1 list-disc list-inside">
                      <li>
                        <span className="font-semibold">נוכחים:</span> משרד, קורס,
                        תגבור
                      </li>
                      <li>
                        <span className="font-semibold">לא נוכחים:</span> חופשה,
                        מחלה, חו"ל
                      </li>
                      <li>
                        <span className="font-semibold">תקן:</span> ממוצע שוטרים
                        פעילים בתקופה
                      </li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              <span className="font-bold text-foreground">{unitName}</span>
              {subtitle && (
                <>
                  {" "}
                  | <span>{subtitle}</span>
                </>
              )}
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {days === 1
                  ? `תמונת מצב יומית להיום`
                  : `ממוצע נוכחים - ${days === 7 ? "שבועית" : days === 30 ? "חודשית" : "שנתית"}`}
              </div>
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 no-export">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all"
              onClick={handleDownload}
              title="הורדה כתמונה"
            >
              <Download className="h-4 w-4" />
            </Button>

            <WhatsAppButton
              onClick={handleWhatsAppShare}
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
              skipDirectLink={true}
            />

            <Select
              value={days.toString()}
              onValueChange={(val) => onDaysChange(parseInt(val))}
            >
              <SelectTrigger className="h-8 w-[90px] text-[11px] font-bold rounded-lg bg-background border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">יומי</SelectItem>
                <SelectItem value="7">שבועי</SelectItem>
                <SelectItem value="30">חודשי</SelectItem>
                <SelectItem value="365">שנתי</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 flex-1 overflow-auto">
          {data.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              אין נתונים להשוואה
            </p>
          ) : (
            data.map((item) => {
              const availability =
                item.total_count > 0
                  ? Math.round((item.present_count / item.total_count) * 100)
                  : 0;

              // Context color based on availability
              let progressColor = "bg-green-500";
              if (availability < 50) progressColor = "bg-red-500";
              else if (availability < 75) progressColor = "bg-yellow-500";

              return (
                <div key={item.unit_id} className="space-y-2">
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span
                      className="font-semibold text-foreground truncate flex-1 min-w-0 ml-2"
                      title={item.unit_name}
                    >
                      {item.unit_name}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {Math.round(item.present_count)} נוכחים
                      </span>
                      <span>/</span>
                      <span className="font-medium">
                        {Math.round(item.total_count)} תקן
                      </span>
                      <span
                        className={cn(
                          "ml-1 font-bold",
                          availability < 50
                            ? "text-red-500 dark:text-red-400"
                            : availability < 75
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        ({availability}%)
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={availability}
                    className="h-2"
                    indicatorClassName={progressColor}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    );
  });
