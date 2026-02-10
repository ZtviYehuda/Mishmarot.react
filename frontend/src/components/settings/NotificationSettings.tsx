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
  Mail,
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            מרכז ההתראות
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium mr-12 md:mr-0">
            נהל את אופן קבלת ההתראות והעדכונים במערכת
          </p>
        </div>

        <div className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full shadow-sm text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          {activeCount} התראות פעילות
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notifications Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="w-5 h-5 text-primary" />
                התראות אישיות
              </CardTitle>
              <CardDescription>
                בחר אילו עדכונים ברצונך לקבל למייל ולמערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                <NotificationItem
                  icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
                  title="מחלה ממושכת"
                  description="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים"
                  enabled={formData.notif_sick_leave}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_sick_leave: val })
                  }
                />
                <NotificationItem
                  icon={<ArrowRightLeft className="w-5 h-5 text-blue-500" />}
                  title="בקשות העברה חדשות"
                  description="קבל התראה כאשר מפקד מגיש בקשת העברה הממתינה לאישורך"
                  enabled={formData.notif_transfers}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_transfers: val })
                  }
                />
                <NotificationItem
                  icon={<Users className="w-5 h-5 text-amber-500" />}
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
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm overflow-hidden mt-8">
              <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                  <Shield className="w-5 h-5" />
                  הגדרות מערכת (מנהלים בלבד)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-background/50 rounded-xl shrink-0">
                      <Clock className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h4 className="font-bold text-destructive">
                        שעת יעד לדיווח בוקר
                      </h4>
                      <p className="text-sm text-destructive/80 mt-1 max-w-md leading-relaxed">
                        הגדר את השעה שבה המערכת תסמן חוסר דיווח כחריג ותשלח
                        התראות למפקדים באופן אוטומטי.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-background p-2 rounded-lg border shadow-sm">
                    <Input
                      type="time"
                      value={localDeadline}
                      onChange={(e) => setLocalDeadline(e.target.value)}
                      className="w-32 font-mono text-center h-9 border-0 focus-visible:ring-0 bg-transparent"
                    />
                    <div className="h-6 w-px bg-border mx-1" />
                    <Button
                      size="sm"
                      disabled={!hasChanges}
                      onClick={() =>
                        updateSystemSetting(
                          "morning_report_deadline",
                          localDeadline,
                        )
                      }
                      className={
                        hasChanges
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-sm h-8"
                          : "h-8"
                      }
                      variant={hasChanges ? "default" : "ghost"}
                    >
                      {hasChanges ? <Check className="w-4 h-4 ml-1" /> : null}
                      {hasChanges ? "שמור שינוי" : "אין שינוי"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side Info Panel */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                מידע חשוב
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-background/50 p-4 rounded-xl text-xs text-muted-foreground leading-relaxed flex gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1 text-primary">
                    לאן נשלחות ההתראות?
                  </span>
                  ההתראות נשלחות בזמן אמת לכתובת המייל המוגדרת בפרופיל האישי
                  שלך, וכן מופיעות במרכז העדכונים במערכת.
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
    <div className="flex items-start gap-4 p-5 hover:bg-muted/30 transition-colors group">
      <div
        className={`mt-1 p-2 rounded-lg transition-colors ${enabled ? "bg-primary/10" : "bg-muted"}`}
      >
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4
            className={`font-bold text-sm ${enabled ? "text-foreground" : "text-muted-foreground"}`}
          >
            {title}
          </h4>
          <Switch checked={enabled} onCheckedChange={onChange} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[90%]">
          {description}
        </p>
      </div>
    </div>
  );
}
