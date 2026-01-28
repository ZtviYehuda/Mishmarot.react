import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BirthdayEmployee {
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
  const handleSendWhatsApp = () => {
    if (!birthdays.length) return;

    const title = `🎂 ימי הולדת השבוע (${birthdays.length})`;
    const list = birthdays
      .map((emp) => {
        const date = new Date(emp.birth_date);
        const dateStr = format(date, "d בMMMM", { locale: he });
        const phoneStr = emp.phone_number ? ` (${emp.phone_number})` : "";
        return `• ${emp.first_name} ${emp.last_name}${phoneStr} - ${dateStr}`;
      })
      .join("\n");

    const message = `*${title}*\n\n${list}`;
    const encodedMessage = encodeURIComponent(message);

    // If we have the current user's phone, we could try to target them,
    // but usually wa.me with text just opens the app to select a contact.
    // If the user wants to send TO THEMSELVES, they usually have a "Me" chat.
    // We'll just open the share dialog.
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  return (
    <Card className="border border-border shadow-sm bg-card h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg lg:text-xl font-black text-card-foreground mb-1 flex items-center gap-2">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              <span className="truncate">ימי הולדת</span>
            </CardTitle>
            <CardDescription className="font-bold text-[11px] sm:text-xs text-muted-foreground">
              חוגגים השבוע
            </CardDescription>
          </div>
          {birthdays.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendWhatsApp}
              className="gap-1.5 sm:gap-2 text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10 h-8 sm:h-9 shrink-0"
              title="שלח לרשימה בוואטסאפ"
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs font-bold hidden sm:inline">שתף</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-1">
        {birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-muted-foreground text-center">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-20" />
            <p className="text-xs sm:text-sm font-medium">
              אין ימי הולדת השבוע
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {birthdays.map((emp, idx) => {
              const date = new Date(emp.birth_date);
              const isToday =
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth();

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-colors",
                    isToday
                      ? "bg-primary/10 border-primary/20"
                      : "bg-muted/50 border-input",
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0",
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground",
                    )}
                  >
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate",
                        isToday
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    >
                      {emp.first_name} {emp.last_name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground font-medium truncate">
                      {format(date, "d בMMMM", { locale: he })}
                      {isToday && (
                        <span className="mr-2 font-black text-primary">
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
  );
};
