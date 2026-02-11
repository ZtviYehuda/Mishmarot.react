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
} from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface AuditLog {
  id: number;
  action_type: string;
  description: string;
  created_at: string;
  ip_address: string;
  metadata: any;
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
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get("/audit/my-activity");
        setAuditLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []);

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
          <CardHeader className="bg-muted/10 border-b pb-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <Activity className="w-6 h-6 text-primary" />
              פעילות אחרונה בחשבון
            </CardTitle>
            <CardDescription className="text-base">
              תיעוד פעולות שבוצעו בחשבון שלך (כניסות, שינויי סיסמה, דיווחים)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLogs ? (
              <div className="p-8 flex justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  לא נמצאה פעילות חשודה
                </p>
                <p>לא נרשמו פעולות חריגות בחשבון זה בתקופה האחרונה.</p>
              </div>
            ) : (
              <div className="divide-y">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2.5 rounded-lg shrink-0 mt-1 md:mt-0 ${
                          log.action_type.includes("LOGIN")
                            ? "bg-blue-100 text-blue-600"
                            : log.action_type.includes("PASSWORD")
                              ? "bg-amber-100 text-amber-600"
                              : log.action_type.includes("IMPERSONATION")
                                ? "bg-purple-100 text-purple-600"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.action_type.includes("LOGIN") ? (
                          <Laptop2 className="w-5 h-5" />
                        ) : log.action_type.includes("PASSWORD") ? (
                          <KeyRound className="w-5 h-5" />
                        ) : log.action_type.includes("IMPERSONATION") ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <Activity className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-base">
                          {log.action_type === "LOGIN"
                            ? "התחברות למערכת"
                            : log.action_type === "PASSWORD_CHANGE"
                              ? "שינוי סיסמה"
                              : log.action_type === "STATUS_UPDATE"
                                ? "עדכון סטטוס נוכחות"
                                : log.description}
                        </h4>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {log.description}
                        </p>
                        {log.ip_address && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground/80">
                            <ShieldAlert className="w-3 h-3" />
                            <span>IP: {log.ip_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left md:text-right shrink-0 min-w-[140px]">
                      <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-foreground">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}
                      </div>
                      <span className="text-xs text-muted-foreground block mt-1">
                        {format(new Date(log.created_at), "EEEE", {
                          locale: he,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
