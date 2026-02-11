import {
  Database,
  RefreshCw,
  Loader2,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1920px] mx-auto pb-24 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Database className="w-8 h-8 text-primary" />
            </div>
            גיבוי ושחזור
          </h2>
          <p className="text-muted-foreground mt-2 text-lg font-medium max-w-2xl">
            נהל את גיבויי המערכת, בצע גיבוי ידני או שחזר מנקודת זמן קודמת
          </p>
        </div>

        <div className="flex items-center gap-3 bg-background border px-4 py-2.5 rounded-full shadow-sm text-base font-bold">
          <span
            className={`relative flex h-3 w-3 ${backupConfig.enabled ? "" : "grayscale opacity-50"}`}
          >
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backupConfig.enabled ? "bg-green-400" : "bg-gray-400"}`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${backupConfig.enabled ? "bg-green-500" : "bg-gray-500"}`}
            ></span>
          </span>
          {backupConfig.enabled ? "גיבוי אוטומטי פעיל" : "גיבוי אוטומטי כבוי"}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Settings Area (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Automatic Backup Configuration */}
          <Card className="border shadow-sm overflow-hidden h-fit">
            <CardHeader className="bg-muted/10 border-b pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <RefreshCw
                  className={`w-6 h-6 text-primary ${backupConfig.enabled ? "animate-spin-slow" : ""}`}
                />
                הגדרות גיבוי אוטומטי
              </CardTitle>
              <CardDescription className="text-base">
                המערכת תבצע גיבוי של כל הנתונים באופן עצמאי בהתאם לתדירות שתבחר
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border border-muted/30">
                <div className="space-y-1">
                  <span className="block font-bold text-lg text-foreground">
                    הפעל גיבוי אוטומטי
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">
                    מומלץ להשאיר דלוק למניעת אובדן מידע
                  </span>
                </div>
                <button
                  onClick={() =>
                    updateBackupConfig("enabled", !backupConfig.enabled)
                  }
                  className={`w-14 h-8 rounded-full relative transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${backupConfig.enabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted-foreground/30 hover:bg-muted-foreground/40"}`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-all duration-300 ${backupConfig.enabled ? "right-1" : "right-[calc(100%-28px)]"}`}
                  />
                </button>
              </div>

              <div
                className={`space-y-4 transition-all duration-300 ${!backupConfig.enabled ? "opacity-50 pointer-events-none grayscale" : ""}`}
              >
                <label className="text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  תדירות הגיבוי
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[6, 12, 24].map((hours) => (
                    <button
                      key={hours}
                      onClick={() =>
                        updateBackupConfig("interval_hours", hours)
                      }
                      className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.02]
                                    ${
                                      backupConfig.interval_hours === hours
                                        ? "border-primary bg-primary/5 text-primary shadow-md ring-1 ring-primary/20"
                                        : "border-border hover:border-primary/30 hover:bg-muted/30 bg-background"
                                    }
                                `}
                    >
                      <span className="text-3xl font-black">{hours}</span>
                      <span className="font-medium text-sm text-muted-foreground">
                        שעות
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions Area (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Manual Backup */}
          <Card className="bg-primary/5 border-primary/10 shadow-sm border-2 border-dashed">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <Download className="w-5 h-5 text-primary" />
                גיבוי ידני
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                צור נקודת שחזור מיידית ושמור אותה כקובץ במחשב שלך.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleServerBackupNow}
                  disabled={isServerBackingUp}
                  variant="outline"
                  className="w-full font-bold h-11 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary"
                >
                  {isServerBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "גיבוי שרת"
                  )}
                </Button>

                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="w-full font-bold h-11 shadow-lg shadow-primary/10"
                >
                  {isBackingUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "הורד קובץ"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Restore */}
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-destructive">
                <Upload className="w-5 h-5" />
                שחזור מערכת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-destructive/80">
                שחזור נתונים מקובץ גיבוי קיים. פעולה זו תדרוס את הנתונים
                הקיימים.
              </p>

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
                  variant="destructive"
                  className="w-full h-11 font-bold shadow-lg shadow-destructive/10"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      משחזר נתונים...
                    </>
                  ) : (
                    "בחר קובץ לשחזור"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
