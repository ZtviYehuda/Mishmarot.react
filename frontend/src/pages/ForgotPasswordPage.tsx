import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  ArrowRight,
  Mail,
  Fingerprint,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/auth.endpoints";
import { toast } from "sonner";

type Step = "request" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [step, setStep] = useState<Step>("request");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form Data
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_FORGOT_PASSWORD_ENDPOINT,
        {
                    email: email,
        },
      );

      if (data.success) {
        toast.success("קוד אימות נשלח לאימייל שלך");
        setStep("verify");
      } else {
        setError(data.error || "אירעה שגיאה בשליחת הקוד");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "שגיאת שרת. נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_VERIFY_CODE_ENDPOINT,
        {
          email,
          code,
        },
      );

      if (data.success) {
        setStep("reset");
      } else {
        setError(data.error || "קוד שגוי או פג תוקף");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "אימות הקוד נכשל");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    if (newPassword.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const { data } = await apiClient.post(
        endpoints.AUTH_RESET_PASSWORD_WITH_CODE_ENDPOINT,
        {
          email,
                    code,
          new_password: newPassword,
        },
      );

      if (data.success) {
        toast.success("הסיסמה עודכנה בהצלחה");
        setStep("success");
      } else {
        setError(data.error || "עדכון הסיסמה נכשל");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "שגיאה בעדכון הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
      )}
      dir="rtl"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div
          className={cn(
            "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-colors duration-500",
            isDark ? "bg-blue-600/30" : "bg-blue-400/20",
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-colors duration-500",
            isDark ? "bg-indigo-600/30" : "bg-indigo-400/20",
          )}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Card
          className={cn(
     "border-none overflow-hidden rounded-[2.5rem] backdrop-blur-xl transition-all duration-500",
            isDark
              ? "bg-slate-900/80 ring-1 ring-white/10"
              : "bg-white/90 ring-1 ring-black/5",
          )}
        >
          <div className="p-8 md:p-10">
            <AnimatePresence mode="wait">
              {/* STEP 1: REQUEST */}
              {step === "request" && (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-6">
                      <Fingerprint className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">שכחתי סיסמה</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      הזן פרטים לאימות וקבלת קוד אימות למייל
                    </p>
                  </div>

                  <form onSubmit={handleRequestCode} className="space-y-4">

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">
                        אימייל
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 pr-10 rounded-xl bg-background/50 focus:bg-background transition-all"
                          placeholder="example@unit.gov.il"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 transition-all active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "שלח קוד אימות"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 2: VERIFY */}
              {step === "verify" && (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">אימות קוד</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      הזן את הקוד שנשלח לכתובת: <br />
                      <span className="font-bold text-foreground">{email}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1 text-center block">
                        קוד אימות (6 ספרות)
                      </Label>
                      <Input
                        required
                        maxLength={6}
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, ""))
                        }
                        className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl bg-background/50 focus:bg-background"
                        placeholder="000000"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "המשך להחלפת סיסמה"
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setStep("request")}
                      className="w-full text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      לא קיבלת קוד? שלח שוב
                    </button>
                  </form>
                </motion.div>
              )}

              {/* STEP 3: RESET */}
              {step === "reset" && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black mb-2">החלפת סיסמה</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                      בחר סיסמה חדשה ומאובטחת למשתמש שלך
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">
                        סיסמה חדשה
                      </Label>
                      <Input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-12 rounded-xl bg-background/50 focus:bg-background font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground mr-1">
                        אימות סיסמה
                      </Label>
                      <Input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-xl bg-background/50 focus:bg-background font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 rounded-xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "עדכן סיסמה"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black mb-2">בוצע בהצלחה!</h1>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed px-4">
                      הסיסמה שלך עודכנה במערכת. כעת תוכל להיכנס עם הפרטים
                      החדשים.
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate("/login")}
                    className="w-full h-12 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-500 transition-all"
                  >
                    כניסה למערכת
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {step !== "success" && (
          <button
            onClick={() => navigate("/login")}
            className="mt-8 flex items-center justify-center gap-2 w-full text-xs font-black text-muted-foreground hover:text-foreground transition-all group"
          >
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            חזרה למסך הכניסה
          </button>
        )}
      </motion.div>
    </div>
  );
}
