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
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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

  const shouldShowAlert = daysSinceChange > 180;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            אבטחה ופרטיות
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium mr-12 md:mr-0">
            נהל את הגדרות האבטחה, הסיסמאות והגישה לחשבונך
          </p>
        </div>
      </div>

      {/* Alerts Area */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {user?.is_impersonated && (
            <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2 rounded-full bg-destructive/10 shrink-0">
                  <Lock className="w-5 h-5 text-destructive" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-destructive">
                    מצב התחזות פעיל
                  </h4>
                  <p className="text-xs text-destructive/80 leading-relaxed">
                    אתה מחובר כמשתמש אחר. באפשרותך לאפס את הסיסמה לתעודת הזהות
                    המקורית.
                  </p>
                  <Button
                    onClick={handleResetImpersonatedPassword}
                    disabled={isResetting}
                    variant="destructive"
                    size="sm"
                    className="mt-2 h-8 text-xs font-bold w-fit"
                  >
                    {isResetting && (
                      <Loader2 className="w-3 h-3 ml-2 animate-spin" />
                    )}
                    אפס סיסמה לת.ז.
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {shouldShowAlert && (
            <Card className="border-amber-500/30 bg-amber-500/5 shadow-sm">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="p-2 rounded-full bg-amber-500/10 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-amber-700">
                    נדרשת החלפת סיסמה
                  </h4>
                  <p className="text-xs text-amber-700/80 leading-relaxed">
                    חלפו {daysSinceChange} ימים מאז השינוי האחרון. מומלץ להחליף
                    סיסמה כל 180 יום לשמירה על אבטחת החשבון.
                  </p>
                  <Button
                    onClick={() => handleConfirmCurrentPassword()}
                    variant="outline"
                    size="sm"
                    className="mt-2 h-8 text-xs font-bold border-amber-500/30 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 w-fit"
                  >
                    דלג הפעם
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Password Change Card */}
        <Card className="lg:col-span-2 border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="w-5 h-5 text-primary" />
              שינוי סיסמה
            </CardTitle>
            <CardDescription>
              בחר סיסמה חזקה הכוללת לפחות 6 תווים
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Old Password */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="current-password">סיסמה נוכחית</Label>
                <button
                  onClick={onForgotPassword}
                  className="text-xs font-medium text-primary hover:underline focus:outline-none"
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
                  className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                  placeholder="הזן את הסיסמה הנוכחית שלך..."
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              </div>
            </div>

            <div className="h-px bg-border/50" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">סיסמה חדשה</Label>
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
                    className="pl-10 h-11 bg-muted/20 focus:bg-background transition-all"
                    placeholder="לפחות 6 תווים"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                  >
                    {showPasswords ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">אימות סיסמה חדשה</Label>
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
                  className="h-11 bg-muted/20 focus:bg-background transition-all"
                  placeholder="הזן שוב את הסיסמה החדשה"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={
                  isChangingPassword ||
                  !passwordData.new_password ||
                  !passwordData.old_password
                }
                className="w-full md:w-auto min-w-[160px] font-bold h-11 shadow-lg shadow-primary/20"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מעדכן...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    עדכן סיסמה
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Side Info Panel */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                סטטוס אבטחה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-primary/10">
                <span className="text-muted-foreground">שינוי אחרון</span>
                <span className="font-mono font-bold">
                  {daysSinceChange} ימים
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-primary/10">
                <span className="text-muted-foreground">חוזק סיסמה</span>
                <Badge
                  variant="outline"
                  className="bg-background font-normal border-green-200 text-green-700"
                >
                  תקין
                </Badge>
              </div>
              <div className="bg-background/50 p-3 rounded-lg text-xs text-muted-foreground leading-relaxed">
                <span className="font-bold block mb-1 text-primary">
                  טיפ לאבטחה:
                </span>
                השתמש בסיסמה ייחודית המשלבת אותיות, מספרים וסימנים מיוחדים.
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-6">
                אין פעילות חשודה בחשבון זה
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
