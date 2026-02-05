import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mail, ShieldCheck, Loader2, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500",
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
                  "p-4 rounded-2xl",
                  isDark
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-blue-50/50 text-blue-600",
                )}
              >
                <KeyRound className="w-8 h-8" />
              </div>
            </div>

            {!isSubmitted ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">איפוס סיסמה</h1>
                  <p className="text-muted-foreground text-sm">
                    הזן את הפרטים שלך ונשלח לך הוראות לאיפוס הסיסמה
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                      "שלח הוראות איפוס"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold mb-2">בדוק את המייל שלך</h2>
                <p className="text-muted-foreground mb-8 text-sm">
                  שלחנו הוראות לאיפוס הסיסמה לכתובת <strong>{email}</strong>. אם
                  לא קיבלת את המייל תוך מספר דקות, בדוק את תיקיית הספאם.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full h-12 rounded-xl"
                >
                  נסה שוב
                </Button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider"
              >
                חזרה לדף הכניסה
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
