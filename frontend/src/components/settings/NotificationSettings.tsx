import { Bell, ShieldCheck, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
      <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
        <div className="bg-muted/30 p-6 border-b border-border">
          <div className="flex items-center gap-4 text-right">
            <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">
                התראות ודיווחים
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                הגדר מה ומתי ברצונך לקבל עדכונים מהמערכת
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NotifSetting
              title="התראת מחלה ממושכת"
              description="קבל התראה כאשר שוטר נמצא בסטטוס 'מחלה' מעל ל-4 ימים רצופים"
              enabled={formData.notif_sick_leave}
              onChange={(val: boolean) =>
                setFormData({ ...formData, notif_sick_leave: val })
              }
            />
            <NotifSetting
              title="בקשות העברה חדשות"
              description="קבל התראה כאשר שוטר מגיש בקשת העברה הממתינה לאישור המפקד"
              enabled={formData.notif_transfers}
              onChange={(val: boolean) =>
                setFormData({ ...formData, notif_transfers: val })
              }
            />
            <NotifSetting
              title="אי-דיווח בוקר ביחידה"
              description="קבל התראה כאשר ישנם שוטרים ביחידתך שטרם הוזן להם סטטוס להיום"
              enabled={formData.notif_morning_report}
              onChange={(val: boolean) =>
                setFormData({ ...formData, notif_morning_report: val })
              }
            />
          </div>

          {user?.is_admin && (
            <div className="pt-6 border-t border-border">
              <div className="mb-4">
                <h4 className="text-sm font-black text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-2">
                  הגדרות מערכת (מנהלים)
                  <ShieldCheck className="w-3.5 h-3.5" />
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NotifSetting
                  title="התראות דיווח בסופ״ש"
                  description="שלח התראות על אי-דיווח בוקר גם בימי שישי ושבת"
                  enabled={systemSettings.alerts_weekend_enabled === true}
                  onChange={(val: boolean) =>
                    updateSystemSetting("alerts_weekend_enabled", val)
                  }
                />

                <div className="flex flex-col gap-3 p-5 rounded-2xl border-2 border-border bg-card hover:border-border/80 transition-all">
                  <div className="flex justify-between items-center">
                    <Input
                      type="time"
                      value={systemSettings.morning_report_deadline || "09:00"}
                      onChange={(e) =>
                        updateSystemSetting(
                          "morning_report_deadline",
                          e.target.value,
                        )
                      }
                      className="w-28 h-10 text-center font-bold bg-muted/50 border-border/60 ltr rounded-lg focus:ring-primary/20"
                    />
                    <Label className="text-base font-black text-foreground text-right">
                      שעת יעד לדיווח
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold leading-relaxed text-right">
                    קבע את שעת הגג לדיווח נוכחות יומי. תזכורת אוטומטית תישלח
                    למפקדים 15 דקות לפני הזמן שהוגדר.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotifSetting({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      className={`
      flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group
      ${enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card hover:border-border/80"}
    `}
      onClick={() => onChange(!enabled)}
    >
      <div className="text-right">
        <h5
          className={`text-base font-black transition-colors ${enabled ? "text-primary" : "text-foreground"}`}
        >
          {title}
        </h5>
        <p className="text-sm text-muted-foreground font-bold leading-tight mt-0.5">
          {description}
        </p>
      </div>

      <div
        className={`
        w-14 h-7 rounded-full relative p-1 transition-colors duration-300 flex-shrink-0
        ${enabled ? "bg-primary" : "bg-muted-foreground/20"}
      `}
      >
        <div
          className={`
          w-5 h-5 bg-background rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center
          ${enabled ? "-translate-x-7" : "translate-x-0"}
        `}
        >
          {enabled ? (
            <Check className="w-3 h-3 text-primary" />
          ) : (
            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
