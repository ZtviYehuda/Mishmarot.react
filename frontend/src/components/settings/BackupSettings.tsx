import {
  Database,
  RefreshCw,
  Loader2,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
      <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Automatic Backup Settings */}
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 pb-4 mb-4 gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`font-bold text-sm ${backupConfig.enabled ? "text-primary" : "text-muted-foreground"}`}
                >
                  {backupConfig.enabled
                    ? "גיבוי אוטומטי פעיל"
                    : "גיבוי אוטומטי כבוי"}
                </span>
                <div
                  className={`p-1.5 rounded-lg transition-colors ${backupConfig.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${backupConfig.enabled ? "animate-spin-slow" : ""}`}
                  />
                </div>
              </div>

              <Button
                onClick={handleServerBackupNow}
                disabled={isServerBackingUp}
                size="sm"
                variant="outline"
                className="h-8 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground gap-2"
              >
                {isServerBackingUp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                בצע גיבוי ידני
              </Button>
            </div>

            <div className="space-y-6">
              {/* Switch */}
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <span className="block font-bold text-sm text-foreground">
                    הפעל גיבוי אוטומטי
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    המערכת תבצע גיבוי באופן עצמאי ברקע
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() =>
                      updateBackupConfig("enabled", !backupConfig.enabled)
                    }
                    className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${backupConfig.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${backupConfig.enabled ? "right-1" : "right-[calc(100%-24px)]"}`}
                    />
                  </button>
                </div>
              </div>

              {/* Frequency Selector */}
              <div
                className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity duration-300 ${!backupConfig.enabled ? "opacity-50 pointer-events-none" : ""}`}
              >
                {[6, 12, 24].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => updateBackupConfig("interval_hours", hours)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all
                                ${
                                  backupConfig.interval_hours === hours
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-border hover:border-border/80 bg-background"
                                }
                            `}
                  >
                    <Clock className="w-5 h-5 opacity-80" />
                    <span className="font-bold text-xs">כל {hours} שעות</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Backup Section */}
            <div className="bg-card p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm flex flex-col justify-between h-full space-y-6">
              <div className="text-right space-y-1">
                <h4 className="text-base font-black text-foreground flex items-center gap-2">
                  <div className="p-1 bg-primary/10 rounded-lg">
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </div>
                  ייצוא לקובץ
                </h4>
                <p className="text-xs text-muted-foreground pr-8">
                  הורדה מיידית של קובץ הגיבוי למחשב האישי.
                </p>
              </div>
              <Button
                onClick={handleBackup}
                disabled={isBackingUp}
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-md shadow-primary/10 active:scale-95 transition-all text-sm"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                    מעבד...
                  </>
                ) : (
                  "הורד קובץ גיבוי"
                )}
              </Button>
            </div>

            {/* Restore Section */}
            <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full space-y-6">
              <div className="absolute top-0 right-0 w-1 h-full bg-destructive/10"></div>
              <div className="text-right space-y-1">
                <h4 className="text-base font-black text-foreground flex items-center gap-2">
                  <div className="p-1 bg-destructive/10 rounded-lg">
                    <Upload className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  שחזור מגיבוי
                </h4>
                <p className="text-xs text-muted-foreground pr-8">
                  דריסת נתונים ושחזור מקובץ.
                  <span className="text-destructive font-bold mr-1">
                    זהירות!
                  </span>
                </p>
              </div>

              <div className="w-full">
                <input
                  type="file"
                  id="restore-file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                />
                <Button
                  onClick={() =>
                    document.getElementById("restore-file")?.click()
                  }
                  disabled={isRestoring}
                  variant="outline"
                  className="w-full h-10 border-destructive/20 hover:bg-destructive/10 text-destructive rounded-xl font-bold active:scale-95 transition-all text-sm"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                      משחזר...
                    </>
                  ) : (
                    "בחר קובץ לשחזור"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
