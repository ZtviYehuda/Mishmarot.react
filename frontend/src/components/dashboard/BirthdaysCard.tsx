import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Gift, MessageCircle, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BirthdayEmployee {
    first_name: string;
    last_name: string;
    birth_date: string;
    day: number;
    month: number;
}

interface BirthdaysCardProps {
    birthdays: BirthdayEmployee[];
    currentUserPhone?: string;
}

export const BirthdaysCard = ({ birthdays, currentUserPhone }: BirthdaysCardProps) => {
    const handleSendWhatsApp = () => {
        if (!birthdays.length) return;

        const currentYear = new Date().getFullYear();
        const title = `🎂 ימי הולדת השבוע (${birthdays.length})`;
        const list = birthdays
            .map((emp) => {
                const date = new Date(emp.birth_date);
                const dateStr = format(date, "d בMMMM", { locale: he });
                return `• ${emp.first_name} ${emp.last_name} - ${dateStr}`;
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
        <Card className="border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-card dark:border-border h-full flex flex-col">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-black text-[#001e30] dark:text-white mb-1 flex items-center gap-2">
                            <Gift className="w-5 h-5 text-pink-500" />
                            ימי הולדת
                        </CardTitle>
                        <CardDescription className="font-bold text-xs text-slate-400">
                            חוגגים השבוע
                        </CardDescription>
                    </div>
                    {birthdays.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSendWhatsApp}
                            className="gap-2 text-[#25D366] border-[#25D366] hover:bg-[#25D366]/10"
                            title="שלח לרשימה בוואטסאפ"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs font-bold">שתף</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-1">
                {birthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-center">
                        <Calendar className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">אין ימי הולדת השבוע</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {birthdays.map((emp, idx) => {
                            const date = new Date(emp.birth_date);
                            const isToday =
                                date.getDate() === new Date().getDate() &&
                                date.getMonth() === new Date().getMonth();

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                                        isToday
                                            ? "bg-pink-50 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800"
                                            : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700"
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                                        isToday ? "bg-pink-500 text-white" : "bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                    )}>
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-bold", isToday ? "text-pink-700 dark:text-pink-300" : "text-slate-700 dark:text-slate-200")}>
                                            {emp.first_name} {emp.last_name}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {format(date, "d בMMMM", { locale: he })}
                                            {isToday && <span className="mr-2 font-black text-pink-500">היום! 🎉</span>}
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
