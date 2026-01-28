import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!personalNumber.trim() || !password.trim()) {
      setError("יש למלא מספר אישי וסיסמה");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(personalNumber.trim(), password.trim());
      if (success) navigate("/", { replace: true });
    } catch (err) {
      setError("שגיאת התחברות. אנא ודא שהפרטים נכונים ונסה שוב.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground" dir="rtl">
      {/* Official Top Bar */}
      <div className="w-full bg-primary h-1.5" />
      <header className="w-full bg-card border-b border-border py-3 px-6 md:px-12 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center border border-input">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-xs font-bold text-primary uppercase tracking-wider leading-none">
              מדינת ישראל
            </div>
            <div className="text-sm font-black text-foreground tracking-tight">
              מערכת ניהול סד"כ ומשימות
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>GOV.IL</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Security Banner */}
          <div className="bg-accent/50 border-r-4 border-primary p-4 mb-6 flex items-start gap-3">
            <Lock className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm leading-relaxed">
              <span className="font-bold text-primary">כניסה מאובטחת.</span>
              <p className="text-muted-foreground">
                הגישה למערכת מיועדת למורשי גישה בלבד. כל הפעולות במערכת מנוטרות
                ומתועדות.
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-card-foreground mb-2">
                  הזדהות למערכת
                </h1>
                <p className="text-muted-foreground text-sm italic">
                  נא להזין פרטי משתמש להמשך
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Personal Number */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="personal_number"
                      className="text-sm font-bold text-foreground mr-1"
                    >
                      מספר אישי
                    </Label>
                    <Input
                      id="personal_number"
                      type="text"
                      autoComplete="username"
                      autoFocus
                      value={personalNumber}
                      onChange={(e) => {
                        setPersonalNumber(e.target.value.trim());
                        setError("");
                      }}
                      className="h-12 border-input focus:border-ring focus:ring-1 focus:ring-ring/20 rounded-md bg-muted/50"
                      placeholder="הזן מספר אישי"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-sm font-bold text-foreground mr-1"
                      >
                        סיסמה
                      </Label>
                      <button
                        type="button"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        שכחתי סיסמה
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="h-12 border-input focus:border-ring focus:ring-1 focus:ring-ring/20 rounded-md bg-muted/50"
                      placeholder="הזן סיסמה"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 bg-destructive/10 border-r-4 border-destructive p-4 text-sm text-destructive animate-in fade-in zoom-in-95 duration-200">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base rounded-md transition-all shadow-md active:transform active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        מאמת נתונים...
                      </span>
                    ) : (
                      "כניסה למערכת"
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Form Footer */}
            <div className="bg-muted/50 border-t border-border p-6 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                תמיכה טכנית
              </p>
              <p className="text-sm text-foreground">
                נתקלת בבעיה? פנה למרכז התמיכה בטלפון:{" "}
                <span className="font-bold whitespace-nowrap">*1234</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-8 px-6 border-t border-border bg-card">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              תנאי שימוש
            </a>
            <span className="w-1 h-1 bg-border rounded-full" />
            <a href="#" className="hover:text-primary transition-colors">
              הצהרת נגישות
            </a>
            <span className="w-1 h-1 bg-border rounded-full" />
            <a href="#" className="hover:text-primary transition-colors">
              מדיניות פרטיות
            </a>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} כל הזכויות שמורות ליחידת המחשוב • גרסה
            2.4.1
          </p>
        </div>
      </footer>
    </div>
  );
}
