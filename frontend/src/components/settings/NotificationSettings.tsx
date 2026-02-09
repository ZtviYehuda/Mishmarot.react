import {
  Check,
  Clock,
  AlertCircle,
  Users,
  ArrowRightLeft,
  Bell,
  Shield,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  CompactCard,
  DashboardGrid,
} from "@/components/forms/EmployeeFormComponents";

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
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 pb-24">
      <DashboardGrid>
        {/* Sidebar - Summary */}
        <div className="hidden xl:block xl:col-span-3 sticky top-24 space-y-4">
          <CompactCard className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center mx-auto shadow-sm mb-3">
                <Bell className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg">מרכז ההתראות</h3>
              <p className="text-sm text-muted-foreground mt-1">
                נהל את אופן קבלת ההתראות במערכת
              </p>

              <div className="mt-6 inline-flex items-center justify-center gap-2 bg-background border border-border px-4 py-2 rounded-full shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium">
                  {activeCount} התראות פעילות
                </span>
              </div>
            </div>
          </CompactCard>

          <div className="bg-card rounded-lg border border-border/60 shadow-sm p-4 text-sm space-y-3">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                ההתראות נשלחות בזמן אמת לכתובת המייל המוגדרת בפרופיל האישי שלך.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-1 xl:col-span-9 space-y-6">
          <CompactCard
            title={
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" /> התראות אישיות
              </span>
            }
            action={
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                הגדרות שלי
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingItem
                icon={<AlertCircle className="w-4 h-4" />}
                title="מחלה ממושכת"
                description="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים"
                enabled={formData.notif_sick_leave}
                onChange={(val) =>
                  setFormData({ ...formData, notif_sick_leave: val })
                }
              />

              <SettingItem
                icon={<ArrowRightLeft className="w-4 h-4" />}
                title="בקשות העברה חדשות"
                description="קבל התראה כאשר מפקד מגיש בקשת העברה הממתינה לאישורך"
                enabled={formData.notif_transfers}
                onChange={(val) =>
                  setFormData({ ...formData, notif_transfers: val })
                }
              />

              <SettingItem
                icon={<Users className="w-4 h-4" />}
                title="אי-דיווח בוקר ביחידה"
                description="קבל התראה כאשר ישנם שוטרים ביחידתך שטרם הוזן להם סטטוס להיום"
                enabled={formData.notif_morning_report}
                onChange={(val) =>
                  setFormData({ ...formData, notif_morning_report: val })
                }
              />
            </div>
          </CompactCard>

          {/* Admin Settings */}
          {user?.is_admin && (
            <CompactCard
              title={
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-destructive" /> הגדרות מערכת
                </span>
              }
              action={
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                  מנהלים בלבד
                </span>
              }
              className="border-destructive/20"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2 lg:col-span-1">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-destructive/10 text-destructive">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        שעת יעד לדיווח בוקר
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        הגדר את השעה שבה המערכת תסמן חוסר דיווח כחריג ותשלח
                        התראות למפקדים.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-end gap-3 md:col-span-2 lg:col-span-1 justify-end">
                  <div className="w-32">
                    <Input
                      type="time"
                      value={localDeadline}
                      onChange={(e) => setLocalDeadline(e.target.value)}
                      className="font-mono text-center"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!hasChanges}
                    onClick={() => {
                      updateSystemSetting(
                        "morning_report_deadline",
                        localDeadline,
                      );
                    }}
                    className={
                      hasChanges
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : ""
                    }
                  >
                    <Check className="w-4 h-4 ml-2" />
                    שמור
                  </Button>
                </div>
              </div>

              {hasChanges && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded border border-amber-200 w-fit mr-auto">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>יש שינויים שלא נשמרו</span>
                </div>
              )}
            </CompactCard>
          )}
        </div>
      </DashboardGrid>
    </div>
  );
}

function SettingItem({
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
    <div
      className={`
            relative overflow-hidden rounded-lg border p-4 transition-all duration-200 cursor-pointer
            ${
              enabled
                ? "bg-primary/5 border-primary/20 shadow-sm"
                : "bg-card border-border hover:bg-muted/30 hover:border-border/80"
            }
        `}
      onClick={() => onChange(!enabled)}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            p-2 rounded-md transition-colors
            ${enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        `}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3
                className={`text-sm font-semibold ${enabled ? "text-primary" : "text-foreground"}`}
              >
                {title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            </div>

            <div
              className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                enabled ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
