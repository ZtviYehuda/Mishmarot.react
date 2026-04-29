import {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { BirthdayGreetingsModal } from "./BirthdayGreetingsModal";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { useEmployeeContext } from "@/context/EmployeeContext";

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
  selectedDate?: Date;
}

const MONTH_LABELS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export const BirthdaysCard = forwardRef<any, BirthdaysCardProps>(
  ({ birthdays, selectedDate }, ref) => {
    const { openProfile } = useEmployeeContext();
    const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      share: handleSendWhatsApp,
    }));

    const referenceDate = selectedDate || new Date();

    const handleSendWhatsApp = () => {
      if (!birthdays.length) return;

      const title = `ימי הולדת השבוע (${birthdays.length})`;
      const list = birthdays
        .map((emp) => {
          const dateStr = `${emp.day} ב${MONTH_LABELS[emp.month - 1]}`;
          const cleanPhone = emp.phone_number ? emp.phone_number.replace(/\D/g, "") : "";
          const phoneStr = cleanPhone ? ` (${cleanPhone})` : "";
          return `- ${emp.first_name} ${emp.last_name} | ${dateStr}${phoneStr}`;
        })
        .join("\n");

      const message = `*${title}*\n\n${list}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
    };

    return (
      <>
        <Card
          id="birthdays-card"
          className="bg-card/60 backdrop-blur-2xl text-card-foreground rounded-[1.5rem] border border-primary/10 flex flex-col overflow-hidden h-full relative"
        >
          <CardHeader className="px-6 py-4 border-b border-border/40">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-black text-foreground mb-0.5">
                    ימי הולדת
                  </CardTitle>
                  <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    חוגגים השבוע
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {birthdays.length > 0 && (
                  <>
                    <Button
                      onClick={() => setIsGreetingsModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex h-9 rounded-xl gap-2 font-black text-xs border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>שליחת ברכה</span>
                    </Button>
                    <WhatsAppButton
                      onClick={handleSendWhatsApp}
                      variant="outline"
                      className="h-9 w-9 p-0 rounded-xl border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all"
                      skipDirectLink={true}
                    />
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0 relative">
            <div
              ref={scrollRef}
              className="flex-1 overflow-x-auto overflow-y-hidden no-scrollbar relative scroll-smooth"
            >
              {birthdays.length === 0 ? (
                <div className="flex flex-col items-center justify-center w-full py-12 opacity-40">
                  <Calendar className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="text-sm font-bold">אין ימי הולדת השבוע</p>
                </div>
              ) : (
                <div className="flex gap-4 px-5 py-5 h-full">
                  {birthdays.map((employee) => {
                    const isToday =
                      employee.day === referenceDate.getDate() &&
                      employee.month === referenceDate.getMonth() + 1;

                    const initials = `${employee.first_name[0]}${employee.last_name[0]}`;

                    return (
                      <div
                        key={employee.id}
                        onClick={() => openProfile(employee.id)}
                        className="shrink-0 flex flex-col items-center gap-2 cursor-pointer group/bday w-[72px] transition-all"
                      >
                        {/* Avatar Circle */}
                        <div className="relative">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-full flex items-center justify-center text-base font-black transition-all group-hover/bday:scale-110",
                              isToday
                                ? "bg-amber-400 text-white shadow-lg shadow-amber-400/40 ring-2 ring-amber-300 ring-offset-2"
                                : "bg-primary/10 text-primary group-hover/bday:bg-primary/20"
                            )}
                          >
                            {initials}
                          </div>
                          {/* Date badge on avatar */}
                          <div
                            className={cn(
                              "absolute -bottom-1 -left-1 rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none",
                              isToday
                                ? "bg-amber-500 text-white"
                                : "bg-card border border-border text-muted-foreground"
                            )}
                          >
                            {employee.day}/{employee.month}
                          </div>
                          {isToday && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-md animate-bounce z-10">
                              <Sparkles className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        {/* Name below avatar */}
                        <p
                          className={cn(
                            "text-[10px] font-bold text-center leading-tight w-full truncate",
                            isToday ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400 group-hover/bday:text-primary"
                          )}
                        >
                          {employee.first_name}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
