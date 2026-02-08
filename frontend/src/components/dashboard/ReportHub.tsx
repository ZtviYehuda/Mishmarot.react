import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Download,
    BarChart2,
    TrendingUp,
    Users,
    Gift,
    ChevronLeft,
    Share2,
    Sparkles,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReportHubProps {
    onOpenWhatsAppReport: () => void;
    onShareTrend: () => void;
    onShareComparison: () => void;
    onShareBirthdays: () => void;
    className?: string;
}

export const ReportHub: React.FC<ReportHubProps> = ({
    onOpenWhatsAppReport,
    onShareTrend,
    onShareComparison,
    onShareBirthdays,
    className
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const downloadCard = async (id: string, fileName: string) => {
        const el = document.getElementById(id);
        if (!el) {
            toast.error("לא ניתן למצוא את הגרף להפקה");
            return;
        }

        const t = toast.loading("מעבד נתונים ומכין קובץ להורדה...");

        try {
            // Wait for any animations to settle
            await new Promise(resolve => setTimeout(resolve, 300));

            const dataUrl = await toPng(el, {
                backgroundColor: "white",
                pixelRatio: 3, // Higher quality for reports
                style: {
                    borderRadius: "0",
                },
                filter: (node) => {
                    if (node instanceof HTMLElement && (
                        node.classList.contains("no-export") ||
                        node.tagName === "BUTTON" ||
                        node.getAttribute("role") === "button"
                    )) {
                        return false;
                    }
                    return true;
                },
            });

            const link = document.createElement("a");
            link.download = `${fileName}-${new Date().toLocaleDateString('he-IL').replace(/\//g, '-')}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("הדוח הופק והורד בהצלחה", { id: t });
        } catch (err) {
            console.error("Download failed", err);
            toast.error("שגיאה בתהליך הפקת הדוח", { id: t });
        }
    };

    const ReportCard = ({
        icon: Icon,
        title,
        description,
        colorClass,
        onDownload,
        onWhatsApp,
        hasDownload = true
    }: {
        icon: any,
        title: string,
        description: string,
        colorClass: string,
        onDownload?: () => void,
        onWhatsApp: () => void,
        hasDownload?: boolean
    }) => (
        <div className="group relative bg-card/50 hover:bg-card border border-border/50 hover:border-primary/20 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] overflow-hidden">
            {/* Background Glow */}
            <div className={cn("absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full", colorClass)} />

            <div className="flex items-start gap-4 h-full">
                <div className={cn("p-3 rounded-2xl shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300", colorClass.replace('bg-', 'bg-').replace('text-', 'text-'))}>
                    <Icon className="w-6 h-6 border-none" />
                </div>

                <div className="flex-1 flex flex-col h-full min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm sm:text-base font-black text-foreground truncate">{title}</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                        {description}
                    </p>

                    <div className="mt-auto flex items-center gap-2">
                        {hasDownload && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onDownload}
                                className="h-9 px-3 rounded-xl gap-1.5 font-bold text-[11px] bg-muted/50 hover:bg-muted text-foreground transition-all flex-1"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden xs:inline">הורדה</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onWhatsApp}
                            className={cn(
                                "h-9 px-3 rounded-xl gap-1.5 font-bold text-[11px] transition-all",
                                hasDownload ? "flex-1" : "w-full",
                                "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                            )}
                        >
                            <FaWhatsapp className="w-4 h-4" />
                            <span>שיתוף</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-10 rounded-xl gap-2 font-black transition-all px-4 shrink-0 shadow-sm border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 active:scale-95",
                        className
                    )}
                >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">מרכז דוחות</span>
                    <Sparkles className="w-3 h-3 opacity-50 animate-pulse text-amber-500" />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none bg-background rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-300" showCloseButton={true}>
                {/* Header Section with Gradient */}
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 pb-4">
                    <DialogHeader className="text-right">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary rounded-2xl shadow-lg shadow-primary/20 rotate-3">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground">מרכז הפקת דוחות</DialogTitle>
                                <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                                    ייצוא נתונים, שיתוף סטטיסטיקות ודיווחים חיצוניים
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-2 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Attendance Snapshot */}
                        <ReportCard
                            icon={Users}
                            title="מצבת כוח אדם"
                            description="דוח ויזואלי מהיר של חלוקת השוטרים לפי סטטוס נוכחות נוכחי."
                            colorClass="bg-blue-500/10 text-blue-600"
                            onDownload={() => {
                                downloadCard("attendance-snapshot-card", "attendance");
                                setIsOpen(false);
                            }}
                            onWhatsApp={() => {
                                onOpenWhatsAppReport();
                                setIsOpen(false);
                            }}
                        />

                        {/* Trend Report */}
                        <ReportCard
                            icon={TrendingUp}
                            title="מגמות וזמינות"
                            description="ניתוח היסטורי של רמת הזמינות ביחידה לאורך זמן."
                            colorClass="bg-amber-500/10 text-amber-600"
                            onDownload={() => {
                                downloadCard("attendance-trend-card", "trend");
                                setIsOpen(false);
                            }}
                            onWhatsApp={() => {
                                onShareTrend();
                                setIsOpen(false);
                            }}
                        />

                        {/* Comparison Report */}
                        <ReportCard
                            icon={BarChart2}
                            title="השוואת תת-יחידות"
                            description="השוואה בין מחלקות, מדורים וחוליות ברמת הזמינות והנוכחות."
                            colorClass="bg-purple-500/10 text-purple-600"
                            onDownload={() => {
                                downloadCard("stats-comparison-card", "comparison");
                                setIsOpen(false);
                            }}
                            onWhatsApp={() => {
                                onShareComparison();
                                setIsOpen(false);
                            }}
                        />

                        {/* Birthdays */}
                        <ReportCard
                            icon={Gift}
                            title="ריכוז ימי הולדת"
                            description="רשימת כלל החוגגים בשבוע הקרוב מוכנה לשליחה מהירה."
                            colorClass="bg-rose-500/10 text-rose-600"
                            hasDownload={false}
                            onWhatsApp={() => {
                                onShareBirthdays();
                                setIsOpen(false);
                            }}
                        />
                    </div>

                    <div className="mt-8 p-4 bg-muted/30 border border-border/50 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Share2 className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-foreground">זקוק לדוח מותאם אישית?</p>
                                <p className="text-[10px] text-muted-foreground">פנה למנהל המערכת להגדרת תבניות נוספות</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold gap-1 rounded-lg">
                            מדריך הפקת דוחות
                            <ChevronLeft className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Modal Footer (Decorative/Empty space) */}
                <div className="h-4 bg-background" />
            </DialogContent>
        </Dialog>
    );
};

