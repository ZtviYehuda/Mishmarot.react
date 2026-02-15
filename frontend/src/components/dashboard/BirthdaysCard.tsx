import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, User, Sparkles, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { BirthdayGreetingsModal } from "./BirthdayGreetingsModal";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";

interface BirthdayEmployee {
  id: number;
  first_name: string;
  last_name: string;
  birth_date: string;
  phone_number?: string;
  day: number;
  month: number;
}

interface BirthdaysCardProps {
  birthdays: BirthdayEmployee[];
}

export const BirthdaysCard = forwardRef<any, BirthdaysCardProps>(
  ({ birthdays }, ref) => {
    const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);
    const [showScrollHint, setShowScrollHint] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      share: handleSendWhatsApp,
    }));

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      setShowScrollHint(scrollHeight - scrollTop - clientHeight > 20);
    };

    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    useEffect(() => {
      const checkScroll = () => {
        if (scrollRef.current) {
          const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
          setShowScrollHint(scrollHeight - scrollTop - clientHeight > 20);
        }
      };

      checkScroll();
      // Re-check after a short delay for content rendering
      const timer = setTimeout(checkScroll, 500);
      return () => clearTimeout(timer);
    }, [birthdays]);

    // Filter employees who have birthday TODAY
    const employeesToday = birthdays.filter((emp) => {
      const today = new Date();
      return emp.day === today.getDate() && emp.month === today.getMonth() + 1;
    });

    const handleSendWhatsApp = () => {
      if (!birthdays.length) return;

      const title = `ימי הולדת השבוע (${birthdays.length})`;
      const labels = [
        "ינואר",
        "פברואר",
        "מרץ",
        "אפריל",
        "מאי",
        "יוני",
        "יולי",
        "אוגוסט",
        "ספטמבר",
        "אוקטובר",
        "נובמבר",
        "דצמבר",
      ];

      const list = birthdays
        .map((emp) => {
          const dateStr = `${emp.day} ב${labels[emp.month - 1]}`;
          // הסרת מקפים ורווחים ממספר הטלפון
          const cleanPhone = emp.phone_number
            ? emp.phone_number.replace(/\D/g, "")
            : "";
          const phoneStr = cleanPhone ? ` (${cleanPhone})` : "";

          return `- ${emp.first_name} ${emp.last_name} | ${dateStr}${phoneStr}`;
        })
        .join("\n");

      const message = `*${title}*\n\n${list}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://api.whatsapp.com/send?text=${encodedMessage}`,
        "_blank",
      );
    };

    return (
      <>
        <Card
          id="birthdays-card"
          className="h-full flex flex-col overflow-hidden"
        >
          <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 mb-2">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg lg:text-xl font-black text-foreground mb-0.5 flex items-center gap-2">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  <span className="truncate">ימי הולדת</span>
                </CardTitle>
                <CardDescription className="font-bold text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
                  חוגגים השבוע
                </CardDescription>
              </div>
              {birthdays.length > 0 && (
                <WhatsAppButton
                  onClick={handleSendWhatsApp}
                  variant="outline"
                  className="h-8 w-8 p-0 rounded-lg border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  skipDirectLink={true}
                />
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative group/card">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto relative custom-scrollbar group/scroll bg-muted/10 max-h-[400px]"
            >
              {/* Soft fade effect at the bottom to indicate more items */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10 opacity-0 group-hover/scroll:opacity-100 transition-opacity" />

              <div className="pl-3 py-1">
                {" "}
                {/* Padding on the left for the scrollbar in RTL */}
                {/* Quick Action for Today's Birthdays */}
                {/* Quick Action for Greetings */}
                {birthdays.length > 0 && (
                  <div className="mb-4">
                    <Button
                      onClick={() => setIsGreetingsModalOpen(true)}
                      className={cn(
                        "w-full border rounded-xl h-12 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] group",
                        employeesToday.length > 0
                          ? "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                          : "bg-muted/50 hover:bg-muted text-muted-foreground border-border/50 hover:text-primary",
                      )}
                    >
                      <Sparkles
                        className={cn(
                          "w-4 h-4",
                          employeesToday.length > 0
                            ? "text-primary animate-pulse"
                            : "text-muted-foreground group-hover:text-primary transition-colors",
                        )}
                      />
                      <span className="text-xs font-black">
                        {employeesToday.length > 0
                          ? `שלח ברכות השבוע (${birthdays.length})`
                          : "שלח ברכות השבוע"}
                      </span>
                    </Button>
                  </div>
                )}
                <div className="space-y-2 pb-2">
                  {birthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <Calendar className="w-8 h-8 mb-2" />
                      <p className="text-xs font-bold">אין ימי הולדת השבוע</p>
                    </div>
                  ) : (
                    birthdays.map((employee) => {
                      const today = new Date();
                      const isToday =
                        employee.day === today.getDate() &&
                        employee.month === today.getMonth() + 1;

                      const labels = [
                        "ינואר",
                        "פברואר",
                        "מרץ",
                        "אפריל",
                        "מאי",
                        "יוני",
                        "יולי",
                        "אוגוסט",
                        "ספטמבר",
                        "אוקטובר",
                        "נובמבר",
                        "דצמבר",
                      ];
                      const dateStr = `${employee.day} ב${labels[employee.month - 1]}`;

                      return (
                        <div
                          key={employee.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl border transition-all hover:shadow-md",
                            isToday
                              ? "bg-primary/5 border-primary/20 shadow-sm"
                              : "bg-muted/30 border-border/40 hover:bg-muted/50",
                          )}
                        >
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2",
                              isToday
                                ? "bg-white border-primary text-primary shadow-inner"
                                : "bg-muted border-border/60 text-muted-foreground",
                            )}
                          >
                            <User className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <EmployeeLink
                              employee={employee.id}
                              name={`${employee.first_name} ${employee.last_name}`}
                              className={cn(
                                "text-sm font-black truncate block hover:text-primary transition-colors",
                                isToday ? "text-primary" : "text-foreground",
                              )}
                            />
                            <p className="text-[11px] font-bold text-muted-foreground">
                              {dateStr}
                            </p>
                          </div>
                          {isToday && (
                            <div className="shrink-0 bg-primary/20 text-primary p-1.5 rounded-lg animate-bounce">
                              <Gift className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Floating Scroll Indicator Icon - Fixed to the bottom of CardContent */}
            {showScrollHint && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-bounce bg-primary text-primary-foreground p-1.5 rounded-full shadow-xl border border-primary-foreground/20 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="גלול לסוף הרשימה"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </CardContent>
        </Card>

        <BirthdayGreetingsModal
          open={isGreetingsModalOpen}
          onOpenChange={setIsGreetingsModalOpen}
          weeklyBirthdays={birthdays}
        />
      </>
    );
  },
);
