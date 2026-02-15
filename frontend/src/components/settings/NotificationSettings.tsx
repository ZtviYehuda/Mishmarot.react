import {
  Clock,
  AlertCircle,
  Users,
  ArrowRightLeft,
  Bell,
  Shield,
  Info,
  Sparkles,
  Save,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-8">
        {/* RIGHT SIDE - Main Notifications */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SectionCard
            icon={Bell}
            title="התראות אישיות"
            badge={
              <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 px-4 py-1.5 rounded-full shadow-lg text-[10px] font-black uppercase">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="text-primary">{activeCount} פעילות</span>
              </div>
            }
          >
            <div className="space-y-6">
              <SwitchItem
                label="התראות מחלה ממושכת"
                desc="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים"
                checked={formData.notif_sick_leave}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_sick_leave: v })
                }
                icon={AlertCircle}
              />
              <SwitchItem
                label="בקשות העברה חדשות"
                desc="קבל עדכון כאשר מפקד מגיש בקשת העברה הממתינה לאישורך"
                checked={formData.notif_transfers}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_transfers: v })
                }
                icon={ArrowRightLeft}
              />
              <SwitchItem
                label="חוסר דיווח בוקר"
                desc="התראה על שוטרים כפופים שטרם הוזן להם סטטוס נוכחות"
                checked={formData.notif_morning_report}
                onChange={(v: boolean) =>
                  setFormData({ ...formData, notif_morning_report: v })
                }
                icon={Users}
              />
            </div>
          </SectionCard>

          {/* Admin Settings Section */}
          {user?.is_admin && (
            <SectionCard
              icon={Shield}
              title="הגדרות מערכת קריטיות"
              variant="danger"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 bg-destructive/[0.03] rounded-[2rem] border border-destructive/10">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-background rounded-2xl shadow-xl shadow-destructive/5 shrink-0 border border-destructive/10">
                    <Clock className="w-8 h-8 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-destructive tracking-tight">
                      שעת יעד לדיווח בוקר
                    </h4>
                    <p className="text-muted-foreground text-sm font-medium max-w-sm">
                      קביעת השעה הרשמית בה המערכת תתחיל להפיץ התראות על חוסר
                      דיווח בוקר.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative group flex-1 md:flex-none text-right">
                    <p className="text-[10px] font-black text-destructive/60 uppercase mb-1 mr-2">
                      שעת יעד
                    </p>
                    <Input
                      type="time"
                      value={localDeadline}
                      onChange={(e) => setLocalDeadline(e.target.value)}
                      className="w-full md:w-36 h-14 bg-background rounded-2xl border-destructive/20 font-black text-2xl text-center focus:ring-destructive/20 transition-all font-mono"
                    />
                  </div>

                  <AnimatePresence mode="wait">
                    {hasChanges && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 20 }}
                      >
                        <Button
                          onClick={() =>
                            updateSystemSetting(
                              "morning_report_deadline",
                              localDeadline,
                            )
                          }
                          className="h-14 px-8 rounded-2xl bg-destructive text-white hover:bg-destructive/90 shadow-2xl shadow-destructive/20 font-black"
                        >
                          <Save className="w-5 h-5 ml-2" />
                          עדכן
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* LEFT SIDE - Info & Tips */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <SectionCard icon={Info} title="מידע והנחיות">
            <div className="space-y-8 py-4">
              <InfoItemSimple
                title="תדירות עדכונים"
                desc="התראות המערכת נשלחות בזמן אמת ללוח הבקרה ולמייל האישי."
              />
              <InfoItemSimple
                title="מדרג פיקודי"
                desc="התראות נשלחות רק למפקדים הרלוונטיים בהתאם למדרג הארגוני."
              />
              <InfoItemSimple
                title="הודעות חירום"
                desc="עדכוני אבטחה וחירום יישלחו תמיד לכלל המשתמשים במערכת."
              />

              <div className="pt-8 border-t border-primary/5 text-center px-4">
                <div className="inline-flex p-4 bg-primary/5 rounded-3xl border border-primary/10 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                  אנחנו עובדים על הוספת התראות SMS וואטסאפ בגרסה הבאה של המערכת.
                  הישארו מעודכנים!
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Internal UI Components ---

function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 backdrop-blur-xl rounded-[2.5rem] border shadow-2xl shadow-primary/5 overflow-hidden",
        variant === "danger" ? "border-red-500/10" : "border-primary/10",
      )}
    >
      <div
        className={cn(
          "px-8 py-6 border-b flex items-center justify-between",
          variant === "danger"
            ? "bg-red-500/5 border-red-500/10"
            : "bg-primary/5 border-primary/10",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-2xl",
              variant === "danger"
                ? "bg-red-500/10 text-red-600"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3
            className={cn(
              "text-xl font-black tracking-tight",
              variant === "danger" ? "text-red-600" : "text-foreground",
            )}
          >
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-8">{children}</div>
    </motion.div>
  );
}

function SwitchItem({ label, desc, checked, onChange, icon: Icon }: any) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 group",
        checked
          ? "bg-primary/5 border-primary/20 shadow-xl shadow-primary/5"
          : "bg-background border-border/50 hover:border-primary/20",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-2xl transition-all duration-500",
            checked
              ? "bg-primary/10 text-primary scale-110"
              : "bg-muted/40 text-muted-foreground group-hover:bg-muted",
          )}
        >
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        <div className="space-y-1">
          <label className="font-black text-base tracking-tight cursor-pointer">
            {label}
          </label>
          <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-sm">
            {desc}
          </p>
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}

function InfoItemSimple({ title, desc }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0 group-hover:bg-primary transition-colors" />
      <div className="space-y-1">
        <h4 className="font-black text-sm tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-[11px] font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
