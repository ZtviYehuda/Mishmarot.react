import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { user, changePassword } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("יש למלא את כל השדות");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (newPassword.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);

    try {
      const success = await changePassword(newPassword);
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("שגיאה בעדכון הסיסמה. נסה שוב מאוחר יותר.");
      }
    } catch (err) {
      setError("שגיאה בעדכון הסיסמה. נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen overflow-y-auto bg-background flex flex-col font-sans text-foreground custom-scrollbar"
      dir="rtl"
    >
      {/* Official Top Bar */}
      <div className="w-full bg-primary h-1.5" />
      <header className="w-full bg-card border-b border-border py-2 px-6 md:px-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border border-border">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider leading-none">
              מדינת ישראל
            </div>
            <div className="text-xs font-black text-foreground tracking-tight">
              מערכת ניהול סד"כ ומשימות
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-start py-6 px-4 md:px-8">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Change Password Banner */}
          <div className="bg-amber-500/10 border-r-4 border-amber-500 p-3 mb-4 flex items-start gap-3">
            <KeyRound className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm leading-tight">
              <span className="font-bold text-amber-700">
                חובה להחליף סיסמה
              </span>
              <p className="text-amber-600/80 text-xs mt-0.5">
                זוהי התחברות ראשונית. למען אבטחת המידע, עליך לבחור סיסמה אישית
                חדשה.
              </p>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-card rounded-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="p-6">
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-foreground mb-1">
                  קביעת סיסמה חדשה
                </h1>
                <p className="text-muted-foreground text-xs">
                  שלום,{" "}
                  <span className="text-primary font-bold">
                    {user?.first_name} {user?.last_name}
                  </span>
                  . נא להזין סיסמה מאובטחת.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  {/* New Password */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="new_password"
                      className="text-xs font-bold text-foreground/80 mr-1"
                    >
                      סיסמה חדשה
                    </Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type="password"
                        autoFocus
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        className="h-11 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md bg-muted/50"
                        placeholder="הזן סיסמה חדשה (מינימום 6 תווים)"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <Label
                      htmlFor="confirm_password"
                      className="text-xs font-bold text-foreground/80 mr-1"
                    >
                      אימות סיסמה
                    </Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      className="h-11 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md bg-muted/50"
                      placeholder="הזן שוב את הסיסמה"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Strength Tips */}
                <div className="bg-muted rounded-lg p-2.5 text-[10px] text-muted-foreground space-y-0.5">
                  <p className="font-bold text-muted-foreground/70 uppercase tracking-tighter mb-0.5">
                    המלצות לסיסמה חזקה:
                  </p>
                  <li className="list-none flex items-center gap-1.5 leading-none">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />{" "}
                    שילוב של אותיות ומספרים
                  </li>
                  <li className="list-none flex items-center gap-1.5 leading-none">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />{" "}
                    מינימום 6 תווים
                  </li>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 bg-destructive/10 border-r-2 border-destructive p-2.5 text-xs text-destructive animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-right">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base rounded-md transition-all shadow-md active:transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        מעדכן סיסמה...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        שמור וסיים
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Form Footer */}
            <div className="bg-muted/50 border-t border-border p-4 text-center">
              <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-0.5">
                אבטחת מידע
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight px-4">
                הסיסמה החדשה תהיה בתוקף באופן מיידי ותשמש אותך בכל כניסה עתידית
                למערכת. נא לא לחשוף את הסיסמה לאף גורם אחר.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-3 px-6 border-t border-border bg-card">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40">
            © {new Date().getFullYear()} מערכת סד"כ גובה
          </div>
          <p className="text-[10px] text-muted-foreground/30 font-medium">
            גרסה 2.4.1
          </p>
        </div>
      </footer>
    </div>
  );
}
