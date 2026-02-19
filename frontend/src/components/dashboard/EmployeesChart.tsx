import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import { format } from "date-fns";

interface EmployeesChartProps {
  stats: {
    status_id: number;
    status_name: string;
    count: number;
    color: string;
  }[];
  loading?: boolean;
  onOpenWhatsAppReport?: () => void;
  onStatusClick?: (statusId: number, statusName: string, color: string) => void;
  onFilterClick?: () => void;
  title?: string;
  description?: string;
  selectedDate?: Date;
  hideExportControls?: boolean;
  unitName?: string;
}

export const EmployeesChart = forwardRef<any, EmployeesChartProps>(
  (
    {
      stats,
      loading = false,
      onOpenWhatsAppReport,
      onStatusClick,
      onFilterClick,
      title = "מצבת כוח אדם",
      description = "סטטוס נוכחות בזמן אמת",
      selectedDate = new Date(),
      hideExportControls = false,
      unitName = "כלל היחידה",
    },
    ref,
  ) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      download: handleDownload,
      share: handleWhatsAppShare,
    }));

    const handleDownload = async () => {
      if (!cardRef.current) return;

      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          backgroundColor: "white",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        const link = document.createElement("a");
        link.download = `attendance-snapshot-${format(selectedDate, "yyyy-MM-dd")}.png`;
        link.href = dataUrl;
        link.click();
        toast.success("גרף הורד בהצלחה");
      } catch (err) {
        console.error("Download failed", err);
        toast.error("שגיאה בהורדת הגרף");
      }
    };

    const handleWhatsAppShare = async () => {
      if (cardRef.current === null) return;

      try {
        const blob = await toBlob(cardRef.current, {
          cacheBust: true,
          backgroundColor: "#ffffff",
          onClone: (clonedNode: any) => {
            const dateEl = clonedNode.querySelector(".export-date-hidden");
            if (dateEl) {
              dateEl.style.position = "absolute";
              dateEl.style.top = "20px";
              dateEl.style.left = "20px";
              dateEl.style.opacity = "1";
              dateEl.style.zIndex = "50";
              dateEl.style.backgroundColor = "rgba(255, 255, 255, 0.95)";
              dateEl.style.padding = "4px 12px";
              dateEl.style.borderRadius = "8px";
              dateEl.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              dateEl.style.border = "1px solid #e2e8f0";
              dateEl.style.color = "#0f172a";
              dateEl.innerText = `תאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}`;
            }
            const hideEls = clonedNode.querySelectorAll(".export-hide");
            hideEls.forEach((el: any) => (el.style.display = "none"));
            const noExportEls = clonedNode.querySelectorAll(".no-export");
            noExportEls.forEach((el: any) => (el.style.display = "none"));
          },
        } as any);

        if (!blob) throw new Error("Failed to capture image");

        const titleText = `${title} - ${unitName}`;
        const message = `*${titleText}*\nתאריך הפקה: ${format(new Date(), "dd/MM/yyyy")}\nתאריך דוח: ${format(selectedDate, "dd/MM/yyyy")}\n\nסיכום: ${total} שוטרים ביחידה.`;

        const file = new File([blob], `attendance-snapshot.png`, {
          type: "image/png",
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: titleText,
              text: message,
            });
            toast.success("הדוח שותף בהצלחה");
            return;
          } catch (shareErr) {
            if ((shareErr as Error).name !== "AbortError") {
              console.warn("Web Share failed:", shareErr);
            } else {
              return;
            }
          }
        }

        try {
          const item = new ClipboardItem({ "image/png": blob });
          await navigator.clipboard.write([item]);
        } catch (clipErr) {
          console.warn("Clipboard copy failed", clipErr);
        }

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");

        toast.success("התמונה הועתקה! נא לבצע 'הדבק' (Ctrl+V) בווצאפ");
      } catch (err) {
        console.error("WhatsApp share failed", err);
        toast.error("שגיאה בהכנת הדוח ל-WhatsApp");
      }
    };

    // Process stats into chart data
    const { chartData, total } = useMemo(() => {
      if (!stats || stats.length === 0) return { chartData: [], total: 0 };

      const totalCount = stats.reduce((acc, curr) => acc + curr.count, 0);

      // Calculate percentages
      const percentagesArray = stats.map((item) =>
        totalCount > 0 ? (item.count / totalCount) * 100 : 0,
      );

      // Adjust for rounding errors - give the remainder to the largest percentage
      const rounded = percentagesArray.map((p) => Math.floor(p));
      const remainders = percentagesArray.map((p, i) => ({
        index: i,
        remainder: p - rounded[i],
      }));
      const totalRounded = rounded.reduce((a, b) => a + b, 0);
      const difference = 100 - totalRounded;

      // Add the difference to the items with largest remainders
      if (difference > 0) {
        remainders.sort((a, b) => b.remainder - a.remainder);
        for (let i = 0; i < difference; i++) {
          if (remainders[i]) {
            rounded[remainders[i].index]++;
          }
        }
      }

      const data = stats.map((item, index) => ({
        // Make sure we pass the ID
        id: item.status_id === null ? -1 : item.status_id, // Use -1 for "No Status" to allow clicking
        name: item.status_name || "לא דווח",
        value: item.count,
        fill: item.color || "#94a3b8",
        percentage: rounded[index],
      }));

      return { chartData: data, total: totalCount };
    }, [stats]);

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded  text-sm border border-border">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm">{data.value} שוטרים</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.percentage}% מהיחידה
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              לחץ לפירוט
            </p>
          </div>
        );
      }
      return null;
    };

    if (loading) {
      return (
        <Card className="overflow-hidden">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl font-black text-card-foreground mb-1">
              {title}
            </CardTitle>
            <CardDescription className="font-bold text-xs text-muted-foreground">
              טוען נתונים...
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card
        ref={cardRef}
        id="attendance-snapshot-card"
        className="flex flex-col overflow-hidden h-full relative"
      >
        <CardHeader className="pb-3 border-b border-border/40 mb-2">
          <div className="space-y-2">
            <div className="flex flex-row items-center justify-between gap-2">
              <div className="flex-1 min-w-0 text-right">
                <CardTitle className="text-base sm:text-xl font-black text-card-foreground leading-tight truncate">
                  {title}
                </CardTitle>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 no-export">
                {/* Filter Button (Mobile Only) */}
                {onFilterClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onFilterClick}
                    className="lg:hidden h-8 w-8 p-0 rounded-xl bg-background hover:bg-muted border-primary/20 text-primary"
                    title="סינון נתונים"
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                )}

                {/* Download Button - HIDDEN for Temp Commanders */}
                {!hideExportControls && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg transition-all"
                    onClick={handleDownload}
                    title="הורדה כתמונה"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {/* WhatsApp Button - HIDDEN for Temp Commanders */}
                {!hideExportControls && onOpenWhatsAppReport && (
                  <WhatsAppButton
                    onClick={onOpenWhatsAppReport}
                    variant="outline"
                    className="h-8 w-8 p-0 rounded-xl border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all  -500/10"
                    skipDirectLink={true}
                  />
                )}
              </div>
            </div>
            <CardDescription className="font-bold text-[10px] sm:text-xs text-muted-foreground whitespace-pre-line text-right leading-relaxed opacity-80">
              {description}
              {/* subtitle showing date if needed, but separate date field is better for export */}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 relative">
          {total === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">אין נתונים להצגה</p>
            </div>
          ) : (
            <div className="flex-1 w-full flex flex-col items-center min-h-0">
              <div
                className="relative w-full flex-1 min-h-[250px] sm:min-h-[300px]"
                style={{ direction: "ltr" }} // Recharts works better with LTR
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart
                    margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
                  >
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => {
                        const isMobile =
                          typeof window !== "undefined" &&
                          window.innerWidth < 640;
                        // Hide small segments labels on mobile to prevent overlapping
                        if (props.payload.percentage < (isMobile ? 8 : 5))
                          return null;

                        const RADIAN = Math.PI / 180;
                        const radiusOffset = isMobile ? 1.2 : 1.25;
                        const radius = props.outerRadius * radiusOffset;

                        const x =
                          props.cx +
                          radius * Math.cos(-props.midAngle * RADIAN);
                        const y =
                          props.cy +
                          radius * Math.sin(-props.midAngle * RADIAN);

                        return (
                          <g
                            className="cursor-pointer outline-none select-none transition-all duration-300"
                            onClick={() => {
                              if (onStatusClick && props.payload.id !== null) {
                                onStatusClick(
                                  props.payload.id,
                                  props.payload.name,
                                  props.payload.fill,
                                );
                              }
                            }}
                          >
                            <text
                              x={x}
                              y={y - (isMobile ? 10 : 14)}
                              fill="currentColor"
                              className="fill-muted-foreground/60"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={isMobile ? "9" : "11"}
                              fontWeight="800"
                            >
                              {props.payload.name}
                            </text>
                            <text
                              x={x}
                              y={y + (isMobile ? 2 : 1)}
                              fill="currentColor"
                              className="fill-foreground font-black"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={isMobile ? "11" : "13"}
                            >
                              {props.payload.value}
                            </text>
                            <text
                              x={x}
                              y={y + (isMobile ? 10 : 13)}
                              fill="currentColor"
                              className="fill-primary/50"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={isMobile ? "7" : "10"}
                              fontWeight="700"
                            >
                              {props.payload.percentage}%
                            </text>
                          </g>
                        );
                      }}
                      outerRadius={
                        typeof window !== "undefined" && window.innerWidth < 640
                          ? "65%"
                          : "70%"
                      }
                      innerRadius={
                        typeof window !== "undefined" && window.innerWidth < 640
                          ? "45%"
                          : "45%"
                      }
                      fill="#8884d8"
                      stroke="none"
                      strokeWidth={0}
                      dataKey="value"
                      paddingAngle={4}
                    >
                      {chartData.map((item, index) => (
                        <Cell
                          key={`cell-${item.id || index}`}
                          fill={item.fill}
                          stroke="none"
                          strokeWidth={0}
                          className="outline-none hover:opacity-90 transition-all cursor-pointer"
                          onClick={() => {
                            if (
                              onStatusClick &&
                              item.id !== undefined &&
                              item.id !== null
                            ) {
                              onStatusClick(item.id, item.name, item.fill);
                            }
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl sm:text-3xl font-black text-foreground drop-shadow-sm">
                    {total}
                  </div>
                  <div className="text-[10px] font-bold text-muted-foreground/80 mt-0.5 uppercase tracking-wider">
                    סך הכל
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="export-date-hidden absolute opacity-0 -z-50 left-0 top-0">
            תאריך דוח: {format(selectedDate, "dd/MM/yyyy")}
          </div>
        </CardContent>
      </Card>
    );
  },
);
