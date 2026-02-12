import {
  Check,
  Clock,
  AlertCircle,
  Users,
  ArrowRightLeft,
  Bell,
  Shield,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface NotificationSettingsProps {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  systemSettings: any;
  updateSystemSetting: (key: string, value: any) => void;
}

export function NotificationSettings({
  user,
  formData,
  setFormData,
  systemSettings,
  updateSystemSetting,
}: NotificationSettingsProps) {
  const [localDeadline, setLocalDeadline] = useState(
    systemSettings.morning_report_deadline || "09:00",
  );

  useEffect(() => {
    if (systemSettings.morning_report_deadline) {
      setLocalDeadline(systemSettings.morning_report_deadline);
    }
  }, [systemSettings.morning_report_deadline]);

  const hasChanges = localDeadline !== systemSettings.morning_report_deadline;

  // Calculate active notifications
  const activeCount = [
    formData.notif_sick_leave,
    formData.notif_transfers,
    formData.notif_morning_report,
  ].filter(Boolean).length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1920px] mx-auto pb-24 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            מרכז ההתראות
          </h2>
          <p className="text-muted-foreground mt-2 text-lg font-medium max-w-2xl">
            נהל את אופן קבלת ההתראות והעדכונים במערכת
          </p>
        </div>

        <div className="flex items-center gap-3 bg-background border px-4 py-2.5 rounded-full shadow-sm text-base font-bold">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          {activeCount} התראות פעילות
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Notifications Area (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Bell className="w-6 h-6 text-primary" />
                התראות אישיות
              </CardTitle>
              <CardDescription className="text-base">
                בחר אילו עדכונים ברצונך לקבל למייל ולמערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <NotificationItem
                  icon={<AlertCircle className="w-6 h-6 text-rose-500" />}
                  title="מחלה ממושכת"
                  description="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים"
                  enabled={formData.notif_sick_leave}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_sick_leave: val })
                  }
                />
                <NotificationItem
                  icon={<ArrowRightLeft className="w-6 h-6 text-blue-500" />}
                  title="בקשות העברה חדשות"
                  description="קבל התראה כאשר מפקד מגיש בקשת העברה הממתינה לאישורך"
                  enabled={formData.notif_transfers}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_transfers: val })
                  }
                />
                <NotificationItem
                  icon={<Users className="w-6 h-6 text-amber-500" />}
                  title="אי-דיווח בוקר ביחידה"
                  description="קבל התראה כאשר ישנם שוטרים ביחידתך שטרם הוזן להם סטטוס להיום"
                  enabled={formData.notif_morning_report}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_morning_report: val })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings */}
          {user?.is_admin && (
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden">
              <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-6">
                <CardTitle className="flex items-center gap-3 text-xl text-destructive font-bold">
                  <Shield className="w-6 h-6" />
                  הגדרות מערכת (מנהלים בלבד)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-background/80 rounded-2xl shrink-0 shadow-sm border border-destructive/10">
                      <Clock className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-destructive">
                        שעת יעד לדיווח בוקר
                      </h4>
                      <p className="text-base text-destructive/80 max-w-xl leading-relaxed">
                        הגדר את השעה שבה המערכת תסמן חוסר דיווח כחריג ותשלח
                        התראות למפקדים באופן אוטומטי.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-background p-3 rounded-xl border shadow-sm">
                    <Input
                      type="time"
                      value={localDeadline}
                      onChange={(e) => setLocalDeadline(e.target.value)}
                      className="w-40 font-mono text-center text-lg h-12 border-0 focus-visible:ring-0 bg-transparent font-bold tracking-widest"
                    />
                    <div className="h-8 w-px bg-border mx-2" />
                    <Button
                      size="lg"
                      disabled={!hasChanges}
                      onClick={() =>
                        updateSystemSetting(
                          "morning_report_deadline",
                          localDeadline,
                        )
                      }
                      className={
                        hasChanges
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-md font-bold"
                          : "font-medium"
                      }
                      variant={hasChanges ? "default" : "ghost"}
                    >
                      {hasChanges ? <Check className="w-5 h-5 ml-2" /> : null}
                      {hasChanges ? "שמור שינוי" : "אין שינוי"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Info Panel (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="bg-primary/5 border-primary/10 shadow-sm h-full">
            <CardHeader className="pb-6 border-b bg-primary/5">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                מידע חשוב
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-base">
              <div className="flex gap-4 p-4 bg-background/50 rounded-xl border border-primary/10">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <span className="font-bold block text-foreground mb-1">
                    תדירות עדכונים
                  </span>
                  <p className="text-muted-foreground">
                    ההתראות נשלחות בזמן אמת למערכת, ופעם ביום כסיכום למייל.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-background/50 rounded-xl border border-primary/10">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <span className="font-bold block text-foreground mb-1">
                    מקבלי התראות
                  </span>
                  <p className="text-muted-foreground">
                    התראות על שוטרים כפופים נשלחות למפקד הישיר ולרמ"ד, בהתאם
                    להגדרות.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-background/50 rounded-xl border border-primary/10">
                <div className="mt-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <span className="font-bold block text-foreground mb-1">
                    התראות מערכת
                  </span>
                  <p className="text-muted-foreground">
                    הודעות מערכת קריטיות (כגון שגיאות שרת) יישלחו תמיד, ללא תלות
                    בהגדרות אלו.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NotificationItem({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors group">
      <div className="flex items-start gap-5">
        <div className="mt-1 p-3 bg-muted/50 rounded-xl group-hover:bg-background group-hover:shadow-sm transition-all duration-300">
          {icon}
        </div>
        <div className="space-y-1.5">
          <label className="text-lg font-bold text-foreground cursor-pointer block group-hover:text-primary transition-colors">
            {title}
          </label>
          <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={onChange}
        className="scale-125 ml-4 data-[state=checked]:bg-primary"
      />
    </div>
  );
}
