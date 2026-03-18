import {
  Database,
  RefreshCw,
  Loader2,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackupSettingsProps {
  backupConfig: any;
  updateBackupConfig: (key: string, value: any) => void;
  isServerBackingUp: boolean;
  handleServerBackupNow: () => void;
  isBackingUp: boolean;
  handleBackup: () => void;
  isRestoring: boolean;
  handleRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BackupSettings({
  backupConfig,
  updateBackupConfig,
  isServerBackingUp,
  handleServerBackupNow,
  isBackingUp,
  handleBackup,
  isRestoring,
  handleRestore,
}: BackupSettingsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SectionCard
            icon={RefreshCw}
            title="גיבוי אוטומטי"
            badge={
              <div
                className={cn(
                  "flex items-center gap-2.5 px-4 py-1.5 rounded-full border  text-[10px] font-black uppercase transition-all duration-500",
                  backupConfig.enabled
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-muted/50 text-muted-foreground border-border",
                )}
              >
                <div className="relative flex h-2 w-2">
                  <span
                    className={cn(
                      "absolute inline-flex h-full w-full rounded-full opacity-75",
                      backupConfig.enabled
                        ? "animate-ping bg-emerald-400"
                        : "bg-muted-foreground/30",
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-2 w-2",
                      backupConfig.enabled
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/50",
                    )}
                  />
                </div>
                {backupConfig.enabled ? "פעיל ומוגן" : "כבוי - לא מומלץ"}
              </div>
            }
          >
            <div className="space-y-10">
              <div
                className={cn(
                  "flex items-center justify-between p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border transition-all duration-500",
                  backupConfig.enabled
                    ? "bg-primary/5 border-border/40  "
                    : "bg-background border-border/40",
                )}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div
                    className={cn(
                      "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-500",
                      backupConfig.enabled
                        ? "bg-primary/10 text-primary scale-110 "
                        : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <Database className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <h4 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                      הפעלת מנגנון גיבוי
                    </h4>
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
                      המערכת תבצע גיבוי אוטומטי של כל מסד הנתונים והקבצים ללא
                      צורך בהתערבות ידנית.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={backupConfig.enabled}
                  onCheckedChange={(v) => updateBackupConfig("enabled", v)}
                  className="data-[state=checked]:bg-primary scale-90 sm:scale-100"
                />
              </div>

              <div
                className={cn(
                  "space-y-6 transition-all duration-700",
                  !backupConfig.enabled &&
                    "opacity-40 grayscale pointer-events-none scale-[0.98]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="font-black text-base tracking-tight">
                    תדירות גיבוי מתוזמן
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { days: 1, label: "יומי", sub: "גיבוי אוטומטי", icon: "📅" },
                    { days: 7, label: "שבועי", sub: "גיבוי מרווח", icon: "🗓️" },
                  ].map(({ days, label, sub, icon }) => (
                    <button
                      key={days}
                      onClick={() =>
                        updateBackupConfig("interval_days", days)
                      }
                      className={cn(
                        "group relative p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border-2 flex flex-col items-center gap-2 sm:gap-3 transition-all duration-500 hover:scale-[1.03]",
                        backupConfig.interval_days === days
                          ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                          : "border-border/40 bg-background/50 hover:border-border/40",
                      )}
                    >
                      <span className="text-3xl sm:text-4xl">{icon}</span>
                      <span
                        className={cn(
                          "text-xl sm:text-3xl font-black font-mono transition-transform duration-500 group-hover:scale-110",
                          backupConfig.interval_days === days
                            ? "text-primary"
                            : "text-muted-foreground/40",
                        )}
                      >
                        {label}
                      </span>
                      <span className="font-black text-[9px] sm:text-[10px] uppercase text-muted-foreground text-center">
                        {sub}
                      </span>

                      {backupConfig.interval_days === days && (
                        <motion.div
                          layoutId="freq-check"
                          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-primary"
                        >
                          <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar Actions Area */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <SectionCard icon={Download} title="גיבוי ידני">
            <div className="space-y-6 py-2">
              <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                יצירת נקודת שחזור מיידית. מומלץ לבצע לפני שינויים משמעותיים
                במערכת.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  onClick={handleServerBackupNow}
                  disabled={isServerBackingUp}
                  variant="outline"
                  className="h-12 sm:h-14 rounded-xl sm:rounded-2xl border-border/40 bg-background font-black text-primary hover:bg-primary hover:text-white transition-all duration-500 group"
                >
                  {isServerBackingUp ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 group-hover:rotate-180 transition-transform duration-700" />
                      ביצוע גיבוי שרת
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-primary text-white   font-black hover:scale-[1.02] transition-all"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                      הורדת קובץ גיבוי
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Upload} title="שחזור נתונים" variant="danger">
            <div className="space-y-6 py-2">
              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl mb-4">
                <p className="text-red-600/80 text-[11px] font-black leading-relaxed flex gap-2">
                  <span className="shrink-0 text-lg">⚠️</span>
                  אזהרה: שחזור ידרוס את כל הנתונים הקיימים במערכת ולא ניתן יהיה
                  לבטל פעולה זו.
                </p>
              </div>

              <input
                type="file"
                id="restore-file"
                accept=".json"
                className="hidden"
                onChange={handleRestore}
              />

              <Button
                onClick={() => document.getElementById("restore-file")?.click()}
                disabled={isRestoring}
                className="w-full h-14 sm:h-16 rounded-xl sm:rounded-[2rem] bg-red-500 text-white  -500/20 font-black hover:bg-red-600 transition-all flex flex-col gap-0.5 sm:gap-1 items-center justify-center group"
              >
                {isRestoring ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-y-1 transition-transform" />
                      <span className="text-base sm:text-lg">
                        בחר קובץ לשחזור
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] opacity-70 font-medium">
                      תומך בקבצי JSON בלבד
                    </span>
                  </>
                )}
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Internal UI Components ---

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
        "bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border overflow-hidden",
        variant === "danger" ? "border-red-500/10" : "border-border/40",
      )}
    >
      <div
        className={cn(
          "px-5 py-4 sm:px-8 sm:py-6 border-b flex items-center justify-between",
          variant === "danger"
            ? "bg-red-500/5 border-red-500/10"
            : "bg-primary/5 border-border/40",
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              "p-2 sm:p-2.5 rounded-xl sm:rounded-2xl",
              variant === "danger"
                ? "bg-red-500/10 text-red-600"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3
            className={cn(
              "text-lg sm:text-xl font-black tracking-tight",
              variant === "danger" ? "text-red-600" : "text-foreground",
            )}
          >
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </motion.div>
  );
}
