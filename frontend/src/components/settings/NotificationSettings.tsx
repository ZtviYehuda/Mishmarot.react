import {
  Check,
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    <div className="space-y-8 w-full max-w-[1920px] mx-auto pb-24 lg:pb-8">
      {/* Header Section with Gradient Background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-background to-background border border-primary/10 p-8 md:p-12 shadow-2xl shadow-primary/5"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Settings & Preferences
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
              מרכז ההתראות
            </h2>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl leading-relaxed">
              התאם אישית את אופן קבלת העדכונים וההתראות במערכת כדי להישאר תמיד
              בשליטה.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4 bg-background/50 backdrop-blur-xl border border-primary/10 px-6 py-4 rounded-[2rem] shadow-xl text-lg font-black"
          >
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
            </div>
            <span className="text-foreground">{activeCount} התראות פעילות</span>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Notifications Area */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <Card className="border-none bg-background/50 backdrop-blur-xl shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden border border-white/10">
            <CardHeader className="p-8 md:p-10 bg-gradient-to-br from-muted/20 to-transparent border-b border-border/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black tracking-tight">
                    התראות אישיות
                  </CardTitle>
                  <CardDescription className="text-lg font-medium mt-1">
                    נהל את ההתראות שחשובות לך
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/30">
                <NotificationItem
                  icon={<AlertCircle className="w-6 h-6 text-rose-500" />}
                  title="מחלה ממושכת"
                  description="קבל התראה כאשר שוטר נמצא בסטטוס מחלה מעל 4 ימים רצופים לצורך מעקב רווחה"
                  enabled={formData.notif_sick_leave}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_sick_leave: val })
                  }
                  index={0}
                />
                <NotificationItem
                  icon={<ArrowRightLeft className="w-6 h-6 text-blue-500" />}
                  title="בקשות העברה חדשות"
                  description="קבל עדכון מיידי כאשר מפקד אחר ביחידה מגיש בקשת העברה הממתינה לאישורך"
                  enabled={formData.notif_transfers}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_transfers: val })
                  }
                  index={1}
                />
                <NotificationItem
                  icon={<Users className="w-6 h-6 text-amber-500" />}
                  title="חוסר דיווח בוקר"
                  description="קבל התראה על שוטרים כפופים שתקופת הדיווח שלהם הסתיימה וטרם הוזן להם סטטוס"
                  enabled={formData.notif_morning_report}
                  onChange={(val) =>
                    setFormData({ ...formData, notif_morning_report: val })
                  }
                  index={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Admin Settings with Glass Effect */}
          {user?.is_admin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-none bg-destructive/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-destructive/10 shadow-2xl shadow-destructive/5">
                <CardHeader className="bg-destructive/10 p-8 border-b border-destructive/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-destructive/10 rounded-2xl text-destructive shadow-inner">
                        <Shield className="w-7 h-7" />
                      </div>
                      <CardTitle className="text-2xl font-black text-destructive tracking-tight">
                        ניהול מערכת
                      </CardTitle>
                    </div>
                    <Badge className="bg-destructive/20 text-destructive border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                      Admin Access
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 md:p-10">
                  <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
                    <div className="flex items-start gap-6">
                      <div className="p-5 bg-background shadow-2xl rounded-3xl shrink-0 border border-destructive/5 self-start md:self-center">
                        <Clock className="w-10 h-10 text-destructive animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-destructive leading-tight">
                          שעת יעד לדיווח בוקר
                        </h4>
                        <p className="text-muted-foreground text-lg font-medium leading-relaxed max-w-xl">
                          הגדר את השעה הרשמית שבה המערכת תסמן חוסר דיווח כחריג
                          ותייצר התראות למפקדים.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                      <div className="relative w-full sm:w-auto group">
                        <Input
                          type="time"
                          value={localDeadline}
                          onChange={(e) => setLocalDeadline(e.target.value)}
                          className="w-full sm:w-48 font-mono text-center text-2xl h-16 bg-background rounded-3xl border-2 border-border/50 group-hover:border-destructive/30 focus:border-destructive focus:ring-0 transition-all font-black tracking-widest"
                        />
                      </div>

                      <AnimatePresence mode="wait">
                        {hasChanges ? (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full sm:w-auto"
                          >
                            <Button
                              size="lg"
                              onClick={() =>
                                updateSystemSetting(
                                  "morning_report_deadline",
                                  localDeadline,
                                )
                              }
                              className="w-full h-16 rounded-3xl bg-destructive text-white hover:bg-destructive/90 shadow-xl shadow-destructive/20 font-black text-lg gap-3 px-8 transition-all active:scale-95"
                            >
                              <Save className="w-6 h-6" />
                              שמור שינוי
                            </Button>
                          </motion.div>
                        ) : (
                          <div className="w-full sm:w-auto px-8 py-4 bg-muted/20 rounded-3xl text-muted-foreground font-black text-center border border-border/50">
                            מעודכן
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Side Info Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <Card className="bg-gradient-to-b from-primary/5 to-background border-none shadow-2xl shadow-black/5 rounded-[2.5rem] h-full overflow-hidden border border-primary/5">
              <CardHeader className="p-8 md:p-10 border-b border-primary/10">
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  מרכז מידע
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <InfoFeature
                  title="תדירות עדכונים"
                  desc="ההתראות מוצגות בזמן אמת בלוח הבקרה, ובנוסף נשלח סיכום יומי למייל במידה והוגדר."
                />
                <InfoFeature
                  title="מקבלי התראות"
                  desc="התראות נשלחות רק למפקדים הרלוונטיים (חוליה, מדור, מחלקה) בהתאם למדרג הפיקודי."
                />
                <InfoFeature
                  title="הודעות דחופות"
                  desc="עדכוני אבטחה או הודעות מערכת קריטיות יישלחו תמיד, ללא קשר להגדרות ההתראות."
                />

                <div className="pt-8 mt-8 border-t border-primary/10">
                  <div className="p-6 bg-primary/10 rounded-3xl border border-primary/10">
                    <p className="text-primary font-bold text-sm leading-relaxed">
                      כל שינוי בהגדרות אלו נכנס לתוקף באופן מיידי עבור המשתמש
                      שלך.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="flex items-center justify-between p-8 md:p-10 hover:bg-primary/5 transition-all duration-300 group relative"
    >
      <div className="flex items-start gap-6 relative z-10">
        <div className="mt-1 p-4 bg-muted/40 rounded-[1.5rem] group-hover:bg-background group-hover:shadow-2xl group-hover:shadow-black/5 transition-all duration-500 scale-100 group-hover:scale-110">
          {icon}
        </div>
        <div className="space-y-2">
          <label className="text-xl font-black text-foreground cursor-pointer block group-hover:text-primary transition-colors tracking-tight">
            {title}
          </label>
          <p className="text-muted-foreground text-lg font-medium max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="relative z-10">
        <Switch
          checked={enabled}
          onCheckedChange={onChange}
          className="scale-150 ml-6 data-[state=checked]:bg-primary shadow-lg shadow-primary/20"
        />
      </div>

      {/* Hover Background Sparkle */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}

function InfoFeature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1.5 shrink-0">
        <motion.div
          whileHover={{ scale: 1.5 }}
          className="w-3 h-3 rounded-full bg-primary/40 group-hover:bg-primary transition-colors ring-4 ring-primary/5"
        />
      </div>
      <div className="space-y-1">
        <span className="font-black text-lg block text-foreground group-hover:text-primary transition-colors tracking-tight">
          {title}
        </span>
        <p className="text-muted-foreground text-base leading-relaxed font-medium">
          {desc}
        </p>
      </div>
    </div>
  );
}
