import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  Loader2,
  KeyRound,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

type Stage = "EMAIL" | "CODE" | "PASSWORD" | "SUCCESS";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>("EMAIL");
  const [email, setEmail] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const isDark = theme === "dark";

  // Stage 1: Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", {
        personal_number: personalNumber,
        email: email,
      });
      setStage("CODE");
      toast.success("קוד אימות נשלח למייל");
    } catch (error: any) {
      console.error("Failed to request password reset", error);
      toast.error(error.response?.data?.error || "שגיאה בשליחת המייל");
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/verify-code", {
        email: email,
        code: code,
      });
      setStage("PASSWORD");
      toast.success("הקוד אומת בהצלחה");
    } catch (error: any) {
      toast.error("קוד שגוי או פג תוקף");
    } finally {
      setIsLoading(false);
    }
  };

  // Stage 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password-with-code", {
        email: email,
        code: code,
        new_password: newPassword,
      });
      setStage("SUCCESS");
      setTimeout(() => navigate("/login"), 3000);
    } catch (error: any) {
      toast.error("שגיאה בשינוי הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "h-screen overflow-y-auto flex flex-col items-center justify-start py-12 md:py-20 p-4 relative transition-colors duration-500 custom-scrollbar",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800",
      )}
      dir="rtl"
    >
      {/* Background elements to match Login page */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          isDark
            ? "bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"
            : "bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]",
        )}
      />

      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div
          className={cn(
            "backdrop-blur-xl border rounded-[2rem] overflow-hidden transition-all duration-300",
            isDark
              ? "bg-slate-900/60 border-white/10 shadow-2xl"
              : "bg-white/70 border-white/50 shadow-xl",
          )}
        >
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div
                className={cn(
                  "p-4 rounded-2xl transition-colors",
                  isDark
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-50/50 text-blue-600",
                  stage === "SUCCESS" && "bg-green-500/10 text-green-500",
                )}
              >
                {stage === "SUCCESS" ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <KeyRound className="w-8 h-8" />
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {stage === "EMAIL" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">איפוס סיסמה</h1>
                    <p className="text-muted-foreground text-sm">
                      הזן את הפרטים שלך ונשלח לך קוד אימות למייל
                    </p>
                  </div>

                  <form onSubmit={handleSendEmail} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="personal_number">מספר אישי</Label>
                        <div className="relative">
                          <ShieldCheck className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="personal_number"
                            placeholder="מספר אישי"
                            className="pr-10 h-12 rounded-xl"
                            required
                            value={personalNumber}
                            onChange={(e) => setPersonalNumber(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">דואר אלקטרוני</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            className="pr-10 h-12 rounded-xl"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                      disabled={isLoading}
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

              {stage === "CODE" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">אימות זהות</h1>
                    <p className="text-muted-foreground text-sm">
                      שלחנו קוד למייל <strong>{email}</strong>
                      <br />
                      הזן אותו כאן להמשך התהליך
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div className="space-y-2 text-center">
                      <Label>קוד אימות (6 ספרות)</Label>
                      <div className="flex justify-center">
                        <Input
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="h-14 w-48 text-center text-2xl tracking-[0.5em] font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border-2 focus:border-blue-500 transition-all shadow-inner"
                          maxLength={6}
                          placeholder="000000"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl mt-4"
                      disabled={isLoading || code.length < 6}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "אמת קוד"
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setStage("EMAIL")}
                      className="w-full text-xs text-muted-foreground hover:text-foreground mt-4"
                    >
                      לא קיבלת? נסה לשלוח שוב
                    </button>
                  </form>
                </motion.div>
              )}

              {stage === "PASSWORD" && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">סיסמה חדשה</h1>
                    <p className="text-muted-foreground text-sm">
                      בחר סיסמה חדשה וחזקה לחשבונך.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">סיסמה חדשה</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="newPassword"
                          type="password"
                          className="pr-10 h-12 rounded-xl"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="הזן סיסמה (מינימום 6 תווים)"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "עדכן סיסמה והתחבר"
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {stage === "SUCCESS" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <h2 className="text-3xl font-bold mb-2 text-green-500">
                    הסיסמה עודכנה!
                  </h2>
                  <p className="text-muted-foreground mb-8 text-base">
                    הסיסמה שלך עודכנה בהצלחה.
                    <br />
                    מיד תועבר לדף ההתחברות...
                  </p>
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-muted-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            {stage === "EMAIL" && (
              <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
                <Link
                  to="/login"
                  className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
                >
                  חזרה לדף הכניסה
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
