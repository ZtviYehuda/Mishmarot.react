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
    <div className="w-full pb-24 lg:pb-0">
      <div className="space-y-6">
        {/* Auto Backup - Full Width */}
        <SectionCard
          icon={RefreshCw}
          title="גיבוי אוטומטי"
          badge={
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold transition-all",
                backupConfig.enabled
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-muted/50 text-muted-foreground border-border",
              )}
            >
              <div className="relative flex h-1.5 w-1.5">
                {backupConfig.enabled && (
                  <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping bg-emerald-400" />
                )}
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-1.5 w-1.5",
                    backupConfig.enabled ? "bg-emerald-500" : "bg-muted-foreground/50",
                  )}
                />
              </div>
              {backupConfig.enabled ? "פעיל" : "כבוי"}
            </div>
          }
        >
          <div className="space-y-5">
            {/* Toggle Row */}
            <div
              className={cn(
                "flex items-center justify-between p-3 sm:p-4 rounded-xl border transition-all",
                backupConfig.enabled
                  ? "bg-primary/5 border-primary/10"
                  : "bg-background border-border/40",
              )}
            >
              <div className="flex items-center gap-3">
                <Database className={cn("w-5 h-5 transition-colors", backupConfig.enabled ? "text-primary" : "text-muted-foreground")} />
                <div>
                  <h4 className="text-sm font-black text-foreground tracking-tight">
                    הפעלת מנגנון גיבוי
                  </h4>
                  <p className="text-muted-foreground text-[10px] sm:text-xs font-medium leading-relaxed">
                    המערכת תבצע גיבוי אוטומטי של כל מסד הנתונים והקבצים ללא התערבות ידנית
                  </p>
                </div>
              </div>
              <Switch
                checked={backupConfig.enabled}
                onCheckedChange={(v) => updateBackupConfig("enabled", v)}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Frequency Selector */}
            <div
              className={cn(
                "space-y-3 transition-all",
                !backupConfig.enabled && "opacity-40 grayscale pointer-events-none",
              )}
            >
              <div className="flex items-center gap-2 px-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <h4 className="font-black text-xs tracking-tight text-foreground">
                  תדירות גיבוי
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { days: 1, label: "יומי", sub: "כל 24 שעות" },
                  { days: 7, label: "שבועי", sub: "כל 7 ימים" },
                ].map(({ days, label, sub }) => (
                  <button
                    key={days}
                    onClick={() => updateBackupConfig("interval_days", days)}
                    className={cn(
                      "relative p-3 sm:p-4 rounded-xl border flex items-center gap-3 transition-all text-right",
                      backupConfig.interval_days === days
                        ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                        : "border-border/40 bg-background/50 hover:border-border",
                    )}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0 transition-colors",
                      backupConfig.interval_days === days ? "bg-primary" : "bg-muted-foreground/20"
                    )} />
                    <div>
                      <span className={cn(
                        "text-sm font-black block",
                        backupConfig.interval_days === days ? "text-primary" : "text-muted-foreground/60",
                      )}>
                        {label}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                        {sub}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Manual Backup & Restore - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SectionCard icon={Download} title="גיבוי ידני">
            <div className="space-y-4">
              <p className="text-muted-foreground text-[11px] sm:text-xs font-medium leading-relaxed">
                יצירת גיבוי מיידי. מומלץ לפני שינויים משמעותיים.
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={handleServerBackupNow}
                  disabled={isServerBackingUp}
                  variant="outline"
                  className="h-10 rounded-xl border-border/40 bg-background font-bold text-xs text-primary hover:bg-primary hover:text-white transition-all group"
                >
                  {isServerBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 ml-2 group-hover:rotate-180 transition-transform" />
                      ביצוע גיבוי שרת
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="h-10 rounded-xl bg-primary text-white font-bold text-xs transition-all"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 ml-2" />
                      הורדת קובץ גיבוי
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Upload} title="שחזור נתונים" variant="danger">
            <div className="space-y-4">
              <p className="text-[10px] sm:text-[11px] text-red-600/70 font-bold leading-relaxed">
                ⚠️ שחזור ידרוס את כל הנתונים הקיימים. פעולה זו בלתי הפיכה.
              </p>
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
                className="w-full h-10 rounded-xl bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-all"
              >
                {isRestoring ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 ml-2" />
                    בחר קובץ לשחזור
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
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", variant === "danger" ? "text-red-500" : "text-primary")} />
          <h3 className={cn("text-sm font-black tracking-tight", variant === "danger" ? "text-red-500" : "text-foreground")}>
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl rounded-[2rem] border p-4 sm:p-6 overflow-hidden h-full",
        variant === "danger" ? "border-red-500/20 bg-red-500/5" : "border-border/40"
      )}>
        {children}
      </div>
    </div>
  );
}

