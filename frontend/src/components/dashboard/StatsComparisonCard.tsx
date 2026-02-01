import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
}

export function StatsComparisonCard({
  data,
  loading,
}: StatsComparisonCardProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg animate-pulse bg-muted h-6 w-32 rounded"></CardTitle>
          <CardDescription className="animate-pulse bg-muted h-4 w-48 rounded mt-2"></CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="h-full border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
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
                    <span className="font-semibold">תקן:</span> סה"כ שוטרים
                    פעילים ביחידה
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          תמונת מצב נוכחות לפי{" "}
          {data[0]?.level === "department"
            ? "מחלקות"
            : data[0]?.level === "section"
              ? "מדורים"
              : "יחידות"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                    <span className="text-green-600 font-medium">
                      {item.present_count} נוכחים
                    </span>
                    <span>/</span>
                    <span className="font-medium">{item.total_count} תקן</span>
                    <span
                      className={cn(
                        "ml-1 font-bold",
                        availability < 50
                          ? "text-red-500"
                          : availability < 75
                            ? "text-yellow-600"
                            : "text-green-600",
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
}
