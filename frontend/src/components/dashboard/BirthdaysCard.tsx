import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, MessageCircle, User, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EmployeeLink } from "@/components/common/EmployeeLink";
import { useState } from "react";
import { BirthdayGreetingsModal } from "./BirthdayGreetingsModal";

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

export const BirthdaysCard = ({ birthdays }: BirthdaysCardProps) => {
  const [isGreetingsModalOpen, setIsGreetingsModalOpen] = useState(false);

  // Filter employees who have birthday TODAY
  const employeesToday = birthdays.filter((emp) => {
    const date = new Date(emp.birth_date);
    return (
      date.getDate() === new Date().getDate() &&
      date.getMonth() === new Date().getMonth()
    );
  });

  const handleSendWhatsApp = () => {
    if (!birthdays.length) return;

    const title = `🎂 ימי הולדת השבוע (${birthdays.length})`;
    const list = birthdays
      .map((emp) => {
        const date = new Date(emp.birth_date);
        const dateStr = format(date, "d בMMMM", { locale: he });
        // הסרת מקפים ורווחים ממספר הטלפון
        const cleanPhone = emp.phone_number ? emp.phone_number.replace(/\D/g, '') : "";
        const phoneStr = cleanPhone ? ` (${cleanPhone})` : "";

        return `• ${emp.first_name} ${emp.last_name} | ${dateStr}${phoneStr}`;
      })
      .join("\n");

    const message = `*${title}*\n\n${list}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, "_blank");
  };

  return (
    <>
      <Card className="border border-border shadow-sm bg-card h-full flex flex-col">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendWhatsApp}
                className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 h-8 px-3 rounded-full group"
                title="שתף רשימה בוואטסאפ"
              >
                <MessageCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-wider">שתף</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pr-1">
          {/* Quick Action for Today's Birthdays */}
          {employeesToday.length > 0 && (
            <div className="mb-4">
              <Button
                onClick={() => setIsGreetingsModalOpen(true)}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl h-12 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] group"
              >
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-black text-xs uppercase tracking-widest">
                  שלח ברכות היום ({employeesToday.length})
                </span>
              </Button>
            </div>
          )}

          {birthdays.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-muted-foreground text-center">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-20" />
              <p className="text-xs sm:text-sm font-medium">
                אין ימי הולדת השבוע
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 pb-2">
              {birthdays.map((emp, idx) => {
                const date = new Date(emp.birth_date);
                const isToday =
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth();

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all",
                      isToday
                        ? "bg-primary/5 border-primary/20 shadow-sm"
                        : "bg-muted/30 border-transparent hover:border-border",
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "bg-card text-muted-foreground border border-border/50",
                      )}
                    >
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <EmployeeLink
                        employee={emp.id}
                        name={`${emp.first_name} ${emp.last_name}`}
                        className={cn(
                          "text-xs sm:text-sm font-bold truncate",
                          isToday ? "text-primary" : "text-foreground",
                        )}
                      />
                      <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                        {format(date, "d בMMMM", { locale: he })}
                        {isToday && (
                          <span className="mr-2 font-black text-primary animate-pulse">
                            היום! 🎉
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <BirthdayGreetingsModal
        open={isGreetingsModalOpen}
        onOpenChange={setIsGreetingsModalOpen}
        employeesToday={employeesToday}
      />
    </>
  );
};
