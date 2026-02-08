import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
}: SecuritySettingsProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
      <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
        <div className="bg-muted/30 p-6 border-b border-border">
          <div className="flex items-center gap-4 text-right">
            <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">
                אבטחה ופרטיות
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                נהל את אמצעי האבטחה של חשבונך
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Password Change Column */}
            <div className="space-y-4 p-6 rounded-2xl border border-muted bg-muted/20 h-fit">
              <div className="text-right mb-2">
                <h5 className="text-base font-black text-foreground flex items-center gap-2 justify-end">
                  החלפת סיסמה
                  <KeyRound className="w-4 h-4 text-primary" />
                </h5>
                <p className="text-xs text-muted-foreground font-bold">
                  הגדר סיסמה חדשה לכניסה למערכת
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">
                    סיסמה חדשה
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="h-10 rounded-lg bg-background border-border font-bold pr-4 text-sm"
                      placeholder="לפחות 6 תווים"
                    />
                    <button
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
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">
                    אימות סיסמה
                  </Label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value,
                      })
                    }
                    className="h-10 rounded-lg bg-background border-border font-bold text-sm"
                    placeholder="הקלד שוב..."
                  />
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !passwordData.new_password}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "עדכן סיסמה"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Alerts Column */}
            <div className="space-y-4 flex flex-col">
              {user?.is_impersonated && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-right transition-colors">
                  <div className="p-2 rounded-lg bg-destructive/20 shrink-0">
                    <Lock className="w-4 h-4 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h4 className="text-sm font-black text-destructive text-right">
                        איפוס סיסמה למשתמש
                      </h4>
                      <p className="text-xs text-destructive/80 font-bold leading-relaxed text-right mt-1">
                        במצב התחזות באפשרותך לאפס את סיסמת המשתמש לתעודת הזהות
                        שלו.
                      </p>
                    </div>
                    <Button
                      onClick={handleResetImpersonatedPassword}
                      disabled={isResetting}
                      variant="destructive"
                      size="sm"
                      className="font-bold shadow-sm h-8 w-full"
                    >
                      {isResetting ? (
                        <Loader2 className="w-3 h-3 animate-spin ml-2" />
                      ) : (
                        <RefreshCw className="w-3 h-3 ml-2" />
                      )}
                      אפס לת.ז.
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-right">
                <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-black text-amber-700 text-right">
                    החלפת סיסמה תקופתית
                  </h4>
                  <p className="text-xs text-amber-700/80 font-bold mt-0.5">
                    חלפו 45 ימים מאז החלפת הסיסמה האחרונה.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-muted opacity-60">
                <div className="w-10 h-5 bg-muted-foreground/20 rounded-full relative p-1 cursor-not-allowed shrink-0">
                  <div className="w-3 h-3 bg-background rounded-full transition-all"></div>
                </div>
                <div className="text-right flex-1">
                  <h5 className="text-sm font-black text-foreground">
                    אימות דו-שלבי (2FA)
                  </h5>
                  <p className="text-xs text-muted-foreground font-bold">
                    פיצ'ר זה אינו פעיל כרגע בארגון
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
