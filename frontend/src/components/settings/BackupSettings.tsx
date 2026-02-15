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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SectionCard
            icon={RefreshCw}
            title="גיבוי אוטומטי"
            badge={
              <div
                className={cn(
                  "flex items-center gap-2.5 px-4 py-1.5 rounded-full border shadow-lg text-[10px] font-black uppercase transition-all duration-500",
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
                  "flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-500",
                  backupConfig.enabled
                    ? "bg-primary/5 border-primary/20 shadow-2xl shadow-primary/5"
                    : "bg-background border-border/50",
                )}
              >
                <div className="flex items-start gap-5">
                  <div
                    className={cn(
                      "p-4 rounded-2xl transition-all duration-500",
                      backupConfig.enabled
                        ? "bg-primary/10 text-primary scale-110 shadow-lg"
                        : "bg-muted/40 text-muted-foreground",
                    )}
                  >
                    <Database className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-foreground tracking-tight">
                      הפעלת מנגנון גיבוי
                    </h4>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                      המערכת תבצע גיבוי אוטומטי של כל מסד הנתונים והקבצים ללא
                      צורך בהתערבות ידנית.
                    </p>
                  </div>
                </div>

                <Switch
                  checked={backupConfig.enabled}
                  onCheckedChange={(v) => updateBackupConfig("enabled", v)}
                  className="data-[state=checked]:bg-primary"
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[6, 12, 24].map((hours) => (
                    <button
                      key={hours}
                      onClick={() =>
                        updateBackupConfig("interval_hours", hours)
                      }
                      className={cn(
                        "group relative p-8 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:shadow-primary/5",
                        backupConfig.interval_hours === hours
                          ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 ring-4 ring-primary/5"
                          : "border-border/50 bg-background/50 hover:border-primary/20",
                      )}
                    >
                      <span
                        className={cn(
                          "text-5xl font-black font-mono transition-transform duration-500 group-hover:scale-110",
                          backupConfig.interval_hours === hours
                            ? "text-primary"
                            : "text-muted-foreground/40",
                        )}
                      >
                        {hours}
                      </span>
                      <span className="font-black text-[10px] uppercase text-muted-foreground">
                        שעות
                      </span>

                      {backupConfig.interval_hours === hours && (
                        <motion.div
                          layoutId="freq-check"
                          className="absolute top-4 right-4 text-primary"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40" />
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
                  className="h-14 rounded-2xl border-primary/20 bg-background font-black text-primary hover:bg-primary hover:text-white transition-all duration-500 group"
                >
                  {isServerBackingUp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 ml-3 group-hover:rotate-180 transition-transform duration-700" />
                      ביצוע גיבוי שרת
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="h-14 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/20 font-black hover:scale-[1.02] transition-all"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-5 h-5 ml-3" />
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
                className="w-full h-16 rounded-[2rem] bg-red-500 text-white shadow-2xl shadow-red-500/20 font-black hover:bg-red-600 transition-all flex flex-col gap-1 items-center justify-center group"
              >
                {isRestoring ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                      <span className="text-lg">בחר קובץ לשחזור</span>
                    </div>
                    <span className="text-[10px] opacity-70 font-medium">
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
