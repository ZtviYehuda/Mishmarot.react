import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Loader2,
  AlertTriangle,
  History,
  HelpCircle,
  CheckCircle2,
  Shield,
  Activity,
  Laptop2,
  Clock,
  ShieldAlert,
  Monitor,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action_type: string;
  description: string;
  created_at: string;
  ip_address: string;
  metadata: any;
  reason?: string; // For suspicious logs
  target_name?: string;
}
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SecuritySettingsProps {
  user: any;
  passwordData: any;
  setPasswordData: (data: any) => void;
  showPasswords: boolean;
  setShowPasswords: (show: boolean) => void;
  isChangingPassword: boolean;
  handleChangePassword: () => void;
  isResetting: boolean;
  handleResetImpersonatedPassword: () => void;
  onForgotPassword: () => void;
  handleConfirmCurrentPassword: () => Promise<void>;
}

export function SecuritySettings({
  user,
  passwordData,
  setPasswordData,
  showPasswords,
  setShowPasswords,
  isChangingPassword,
  handleChangePassword,
  isResetting,
  handleResetImpersonatedPassword,
  onForgotPassword,
  handleConfirmCurrentPassword,
}: SecuritySettingsProps) {
  // Calculate days since last password change
  const daysSinceChange = user?.last_password_change
    ? Math.floor(
        (new Date().getTime() - new Date(user.last_password_change).getTime()) /
          (1000 * 3600 * 24),
      )
    : 0;

  // Activity Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allActivity, setAllActivity] = useState<AuditLog[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "all" | "suspicious">("my");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const [myRes, allRes, suspRes] = await Promise.all([
          apiClient.get("/audit/my-activity"),
          user?.is_admin || user?.is_commander
            ? apiClient.get("/audit/all-activity")
            : Promise.resolve({ data: [] }),
          user?.is_admin
            ? apiClient.get("/audit/suspicious")
            : Promise.resolve({ data: [] }),
        ]);

        setAuditLogs(myRes.data);
        setAllActivity(allRes.data);
        setSuspiciousActivity(suspRes.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [user]);

  const displayedLogs =
    activeTab === "my"
      ? auditLogs
      : activeTab === "all"
        ? allActivity
        : suspiciousActivity;

  const shouldShowAlert = daysSinceChange > 180;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1920px] mx-auto pb-24 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            אבטחה ופרטיות
          </h2>
          <p className="text-muted-foreground mt-2 text-lg font-medium max-w-2xl">
            נהל את הגדרות האבטחה, הסיסמאות והגישה לחשבונך
          </p>
        </div>
      </div>

      {/* Alerts Area */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {user?.is_impersonated && (
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 rounded-full bg-destructive/10 shrink-0">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-destructive text-lg">
                    מצב התחזות פעיל
                  </h4>
                  <p className="text-sm text-destructive/80 leading-relaxed">
                    אתה מחובר כמשתמש אחר. באפשרותך לאפס את הסיסמה לתעודת הזהות
                    המקורית.
                  </p>
                  <Button
                    onClick={handleResetImpersonatedPassword}
                    disabled={isResetting}
                    variant="destructive"
                    size="sm"
                    className="mt-2 text-sm font-bold"
                  >
                    {isResetting && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    אפס סיסמה לת.ז.
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {shouldShowAlert && (
            <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 rounded-full bg-amber-500/10 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-amber-700 text-lg">
                    נדרשת החלפת סיסמה
                  </h4>
                  <p className="text-sm text-amber-700/80 leading-relaxed">
                    חלפו {daysSinceChange} ימים מאז השינוי האחרון. מומלץ להחליף
                    סיסמה כל 180 יום לשמירה על אבטחת החשבון.
                  </p>
                  <Button
                    onClick={() => handleConfirmCurrentPassword()}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-sm font-bold border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
                  >
                    דלג הפעם
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* Main Password Change Card (8 Columns) */}
        <Card className="col-span-12 lg:col-span-8 border shadow-sm overflow-hidden h-fit">
          <CardHeader className="bg-muted/10 border-b pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <KeyRound className="w-6 h-6 text-primary" />
              שינוי סיסמה
            </CardTitle>
            <CardDescription className="text-base">
              בחר סיסמה חזקה הכוללת לפחות 6 תווים
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Old Password */}
            <div className="space-y-3 max-w-md">
              <div className="flex items-center justify-between">
                <Label htmlFor="current-password" className="text-base">
                  סיסמה נוכחית
                </Label>
                <button
                  onClick={onForgotPassword}
                  className="text-sm font-medium text-primary hover:underline focus:outline-none"
                >
                  שכחתי סיסמה
                </button>
              </div>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords ? "text" : "password"}
                  value={passwordData.old_password || ""}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      old_password: e.target.value,
                    })
                  }
                  className="pl-12 h-12 text-lg bg-muted/20 focus:bg-background transition-all"
                  placeholder="הזן את הסיסמה הנוכחית שלך..."
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* New Password */}
              <div className="space-y-3">
                <Label htmlFor="new-password" className="text-base">
                  סיסמה חדשה
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        new_password: e.target.value,
                      })
                    }
                    className="pl-12 h-12 text-lg bg-muted/20 focus:bg-background transition-all"
                    placeholder="הזן סיסמה חדשה..."
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                </div>

                {/* Strength Indicator (Basic) */}
                <div className="flex gap-1 h-1 mt-2">
                  <div
                    className={`flex-1 rounded-full transition-colors duration-500 ${passwordData.new_password.length > 0 ? (passwordData.new_password.length < 6 ? "bg-red-500" : "bg-green-500") : "bg-muted"}`}
                  ></div>
                  <div
                    className={`flex-1 rounded-full transition-colors duration-500 ${passwordData.new_password.length > 6 ? "bg-green-500" : "bg-muted"}`}
                  ></div>
                  <div
                    className={`flex-1 rounded-full transition-colors duration-500 ${passwordData.new_password.length > 8 ? "bg-green-500" : "bg-muted"}`}
                  ></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-base">
                  אימות סיסמה חדשה
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className={`pl-12 h-12 text-lg bg-muted/20 focus:bg-background transition-all ${
                      passwordData.confirm_password &&
                      passwordData.new_password !==
                        passwordData.confirm_password
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    placeholder="חזור על הסיסמה החדשה..."
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                </div>
                {passwordData.confirm_password &&
                  passwordData.new_password !==
                    passwordData.confirm_password && (
                    <p className="text-xs text-destructive font-bold animate-in fade-in slide-in-from-top-1">
                      הסיסמאות אינן תואמות
                    </p>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    הסתר תווים
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    הצג תווים
                  </>
                )}
              </button>

              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                size="lg"
                className="min-w-[180px] font-bold shadow-lg shadow-primary/20"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    מבצע שינוי...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 ml-2" />
                    שמור סיסמה חדשה
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Side Info Panel (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="bg-primary/5 border-primary/10 shadow-sm h-full">
            <CardHeader className="pb-6 border-b bg-primary/5">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <HelpCircle className="w-6 h-6 text-primary" />
                הנחיות אבטחה
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-4">
                <div className="p-3 bg-background rounded-full border border-primary/10 h-fit shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">אורך סיסמה</h4>
                  <p className="text-muted-foreground text-sm">
                    הסיסמה חייבת להכיל לפחות 6 תווים.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-background rounded-full border border-primary/10 h-fit shrink-0">
                  <History className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    תדירות החלפה
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    מומלץ להחליף סיסמה אחת ל-180 יום.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-background rounded-full border border-primary/10 h-fit shrink-0">
                  <Shield className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-1">
                    אבטחת חשבון
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    אין לשתף את הסיסמה עם אף גורם אחר.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Log Section (Full Width 12 Columns) */}
        <Card className="col-span-12 border shadow-sm overflow-hidden mt-8">
          <CardHeader className="bg-muted/10 border-b pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-3 text-xl font-bold">
                  <Activity className="w-6 h-6 text-primary" />
                  {activeTab === "my"
                    ? "פעילות אישית בחשבון"
                    : activeTab === "all"
                      ? "יומן אירועים מערכתי"
                      : "מרכז ניטור חריגות בטיחות"}
                </CardTitle>
                <CardDescription className="text-base font-medium">
                  {activeTab === "my"
                    ? "תיעוד פעולות שבוצעו בחשבונך"
                    : activeTab === "all"
                      ? "סקירת פעולות של כלל המשתמשים במערכת"
                      : "זיהוי וניתוח אוטומטי של פעילות חשודה"}
                </CardDescription>
              </div>

              <div className="flex bg-muted p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("my")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "my" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  הפעילות שלי
                </button>
                {(user?.is_admin || user?.is_commander) && (
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "all" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    כלל המערכת
                  </button>
                )}
                {user?.is_admin && (
                  <button
                    onClick={() => setActiveTab("suspicious")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "suspicious" ? "bg-background text-destructive shadow-sm" : "text-muted-foreground hover:text-destructive/80"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {suspiciousActivity.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      )}
                      פעילות חשודה
                    </div>
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLogs ? (
              <div className="p-12 flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="font-medium animate-pulse">
                  טוען יומני פעילות...
                </p>
              </div>
            ) : displayedLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <div className="p-4 bg-primary/5 rounded-full ring-8 ring-primary/5">
                  <ShieldCheck className="w-10 h-10 text-primary/40" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  אין נתונים להצגה
                </p>
                <p className="max-w-md mx-auto">
                  לא נמצאו רשומות רלוונטיות עבור הסינון שבחרת בתקופה האחרונה.
                </p>
              </div>
            ) : (
              <>
                {activeTab === "suspicious" && (
                  <div className="p-4 bg-destructive/5 border-b border-destructive/10 flex items-start gap-3">
                    <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-destructive text-sm">
                        ניטור אנומליות ואבטחה
                      </h5>
                      <p className="text-xs text-destructive/70 mt-0.5 leading-relaxed">
                        המערכת מזהה אוטומטית פעילויות חריגות כגון ניסיונות פריצה
                        בתדירות גבוהה, החלפת כתובות IP מהירה של אותו משתמש, או
                        פעולות קריטיות המבוצעות בשעות חריגות.
                      </p>
                    </div>
                  </div>
                )}
                <div className="divide-y border-t lg:border-t-0">
                  {displayedLogs.map((log, idx) => (
                    <div
                      key={`${log.id}-${idx}`}
                      className={`p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-all duration-200 group ${log.reason ? "bg-destructive/5" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                            log.reason
                              ? "bg-destructive/10 text-destructive shadow-sm shadow-destructive/10"
                              : log.action_type === "LOGIN"
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                : log.action_type.includes("PASSWORD")
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                  : log.action_type.includes("IMPERSONATION")
                                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                    : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {log.reason ? (
                            <ShieldAlert className="w-6 h-6" />
                          ) : log.action_type === "LOGIN" ? (
                            <Laptop2 className="w-6 h-6" />
                          ) : log.action_type.includes("PASSWORD") ? (
                            <KeyRound className="w-6 h-6" />
                          ) : log.action_type.includes("IMPERSONATION") ? (
                            <Eye className="w-6 h-6" />
                          ) : (
                            <Activity className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`font-bold text-lg leading-none ${log.reason ? "text-destructive" : "text-foreground"}`}
                            >
                              {log.reason ||
                                (() => {
                                  switch (log.action_type) {
                                    case "LOGIN":
                                      return "התחברות מוצלחת";
                                    case "FAILED_LOGIN":
                                      return "ניסיון התחברות שנכשל";
                                    case "PASSWORD_CHANGE":
                                      return "שינוי סיסמה";
                                    case "PASSWORD_CONFIRM":
                                      return "הארכת תוקף סיסמה";
                                    case "STATUS_UPDATE":
                                      return "עדכון סטטוס נוכחות";
                                    case "BULK_STATUS_UPDATE":
                                      return "עדכון סטטוס קבוצתי";
                                    case "REPORT_STATUS":
                                      return "דיווח נוכחות";
                                    case "IMPERSONATION_START":
                                      return "תחילת מצב התחזות";
                                    case "IMPERSONATION_STOP":
                                      return "סיום מצב התחזות";
                                    case "EMPLOYEE_CREATE":
                                      return "יצירת שוטר חדש";
                                    case "EMPLOYEE_UPDATE":
                                      return "עדכון פרטי שוטר";
                                    case "EMPLOYEE_DELETE":
                                      return "מחיקת שוטר מהמערכת";
                                    case "PROFILE_UPDATE":
                                      return "עדכון פרופיל אישי";
                                    default:
                                      return log.action_type;
                                  }
                                })()}
                            </h4>
                            {log.user_name && activeTab !== "my" && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  בוצע ע"י:
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${log.reason ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary border border-primary/10"}`}
                                >
                                  {log.user_name}
                                </span>
                              </div>
                            )}
                            {log.target_name && (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  עבור:
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-muted text-foreground border border-border">
                                  {log.target_name}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                            {log.description}
                          </p>

                          {/* Metadata / Changes Preview */}
                          {log.metadata &&
                            Object.keys(log.metadata).length > 0 && (
                              <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">
                                  פירוט השינויים / מידע נוסף:
                                </p>
                                <div className="flex flex-wrap gap-2 text-[11px]">
                                  {Object.entries(log.metadata).map(
                                    ([key, value]) => {
                                      if (
                                        key === "browser" ||
                                        key === "updates"
                                      )
                                        return null;
                                      if (value === null || value === undefined)
                                        return null;
                                      return (
                                        <div
                                          key={key}
                                          className="flex items-center gap-1 bg-background px-1.5 py-0.5 rounded border shadow-sm"
                                        >
                                          <span className="font-bold text-primary">
                                            {key}:
                                          </span>
                                          <span className="text-foreground truncate max-w-[150px]">
                                            {String(value)}
                                          </span>
                                        </div>
                                      );
                                    },
                                  )}
                                  {log.metadata.updates &&
                                    Array.isArray(log.metadata.updates) && (
                                      <div className="w-full text-xs text-muted-foreground mt-1 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                                        בוצע עדכון ל-
                                        {log.metadata.updates.length} רשומות
                                        במקביל
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}
                          <div className="flex items-center gap-4 mt-2">
                            {log.ip_address && (
                              <div className="flex items-center gap-1.5 text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground select-all">
                                <Shield className="w-3 h-3" />
                                IP: {log.ip_address}
                              </div>
                            )}
                            {log.metadata?.browser && (
                              <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Monitor className="w-3 h-3" />
                                {log.metadata.browser}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 md:pl-2">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          {format(
                            new Date(log.created_at || new Date()),
                            "HH:mm:ss",
                          )}
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {format(
                              new Date(log.created_at || new Date()),
                              "dd/MM/yyyy",
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {format(
                              new Date(log.created_at || new Date()),
                              "EEEE",
                              { locale: he },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
