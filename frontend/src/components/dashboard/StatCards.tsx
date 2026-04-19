import { Card, CardContent } from "@/components/ui/card";
import { Users, HelpCircle, AlertCircle, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardsProps {
  stats: any[];
  totalEmployees: number;
}

export const StatCards = ({ stats, totalEmployees }: StatCardsProps) => {
  // Find specific stats
  const notReported = stats.find(s => s.status_name === "לא דווח")?.count || 0;
  
  // Unavailable keywords logic matching other components
  const unavailableKeywords = ["חופשה", "חולה", "מושעה", "גימל", "בלתי מורשה", "נפקד"];
  const unavailableCount = stats
    .filter(s => unavailableKeywords.some(kw => s.status_name?.includes(kw)))
    .reduce((acc, curr) => acc + curr.count, 0);

  // Operational availability = (Total - Missing - Unavailable) / Total
  const reportedCount = stats
    .filter(s => s.status_name !== "לא דווח")
    .reduce((acc, curr) => acc + curr.count, 0);
  
  const presentKeywords = ["נוכח", "משרד", "תגבור", "קורס"];
  const presentCount = stats
    .filter(s => presentKeywords.some(kw => s.status_name?.includes(kw)))
    .reduce((acc, curr) => acc + curr.count, 0);

  const availabilityPct = totalEmployees > 0 
    ? Math.round((presentCount / totalEmployees) * 100) 
    : 0;

  const cards = [
    {
      label: "לא דיווחו",
      value: notReported,
      icon: Search,
      color: "blue",
      tag: "היום",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      iconColor: "text-blue-500",
    },
    {
      label: "לא זמינים",
      value: unavailableCount,
      icon: AlertCircle,
      color: "amber",
      tag: "היום",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
    },
    {
      label: "זמינות מבצעית",
      value: `${availabilityPct}%`,
      subValue: `${presentCount} זמינים`,
      icon: TrendingUp,
      color: "emerald",
      tag: "היום",
      iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
      iconColor: "text-emerald-500",
    },
    {
      label: "סה\"כ שוטרים",
      value: totalEmployees,
      icon: Users,
      color: "indigo",
      tag: "היום",
      iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
      iconColor: "text-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className="group relative overflow-hidden border-none bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm transition-all rounded-[1rem] sm:rounded-[1.25rem]"
        >
          <CardContent className="p-3 sm:p-5">
            <div className="flex justify-between items-start">
              {/* Tag Top Left */}
              <div className={cn(
                "px-2 px-1.5 rounded-md text-[9px] font-black uppercase tracking-tight border",
                card.color === "blue" && "bg-blue-50/50 text-blue-600 border-blue-100",
                card.color === "amber" && "bg-amber-50/50 text-amber-600 border-amber-100",
                card.color === "emerald" && "bg-emerald-50/50 text-emerald-600 border-emerald-100",
                card.color === "indigo" && "bg-indigo-50/50 text-indigo-600 border-indigo-100",
              )}>
                {card.tag}
              </div>

              {/* Icon Top Right */}
              <div className={cn(
                "w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                card.iconBg,
                card.iconColor
              )}>
                <card.icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
              </div>
            </div>

            <div className="mt-2 sm:mt-4 text-center">
              <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white mb-0.5 sm:mb-1">
                {card.value}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-400">
                {card.label}
              </div>
              {card.subValue && (
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400/80 mt-0.5 sm:mt-1">
                   {card.subValue}
                </div>
              )}
            </div>
            
            {/* Subtle bottom decoration */}
            <div className={cn(
              "absolute bottom-0 left-0 w-full h-1 opacity-20",
              card.color === "blue" && "bg-blue-500",
              card.color === "amber" && "bg-amber-500",
              card.color === "emerald" && "bg-emerald-500",
              card.color === "indigo" && "bg-indigo-500",
            )} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

