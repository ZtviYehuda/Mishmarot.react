import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LockedUser {
  personal_number: string;
  first_name: string;
  last_name: string;
}

export default function LoginPage() {
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockedUser, setLockedUser] = useState<LockedUser | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthContext();

  useEffect(() => {
    const savedLockedUser = localStorage.getItem("locked_user");
    if (savedLockedUser) {
      try {
        const user = JSON.parse(savedLockedUser);
        setLockedUser(user);
        setPersonalNumber(user.personal_number);
      } catch (e) {
        console.error("Failed to parse locked user", e);
        localStorage.removeItem("locked_user");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!personalNumber.trim() || !password.trim()) {
      setError("יש למלא מספר אישי וסיסמה");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(personalNumber.trim(), password.trim());
      if (success) {
        // Clear locked user on successful login if it matches (optional, but good practice to refresh)
        // Actually we likely want to keep it for next time, but if they logged in successfully,
        // the AuthProvider will handle the session.
        // We don't strictly *need* to clear it here, but typically "Remember Me" logic handles persistence.
        navigate("/", { replace: true });
      } else {
        setError("הסיסמה שגויה. אנא נסה שוב.");
      }
    } catch (err) {
      setError("שגיאת מערכת. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("locked_user");
    setLockedUser(null);
    setPersonalNumber("");
    setPassword("");
    setError("");
  };

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800"
      dir="rtl"
    >
      {/* Official Top Bar */}
      <div className="w-full bg-indigo-600 h-1.5" />
      <header className="w-full bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex items-center justify-between shadow-sm/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex flex-col">
            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-wider leading-none mb-1">
              מדינת ישראל
            </div>
            <div className="text-sm font-black text-slate-900 tracking-tight leading-none">
              מערכת ניהול סד"כ ומשימות
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-400">
          <span>GOV.IL</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
          {/* Security Banner */}
          {!lockedUser && (
            <div className="bg-white border-r-4 border-indigo-500 p-4 mb-6 flex items-start gap-3 rounded-lg shadow-sm border border-slate-100">
              <Lock className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div className="text-sm leading-relaxed">
                <span className="font-bold text-slate-800 block mb-1">
                  התחברות מאובטחת
                </span>
                <p className="text-slate-500 text-xs">
                  הגישה למערכת מיועדת למורשי גישה בלבד. הפעולות מנוטרות ומתועדות
                  בהתאם לנהלי אבטחת מידע.
                </p>
              </div>
            </div>
          )}

          {/* Login/Locked Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8">
              {lockedUser ? (
                /* LOCKED USER VIEW */
                <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-24 h-24 rounded-full bg-indigo-100 mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg text-indigo-600 font-black text-3xl">
                    {lockedUser.first_name[0]}
                    {lockedUser.last_name[0]}
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-1">
                    שלום, {lockedUser.first_name}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium mb-8">
                    הזן סיסמה כדי לחזור לעבוד
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-right">
                      <Label
                        htmlFor="password"
                        className="text-xs font-bold text-slate-500 mr-1"
                      >
                        סיסמה
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        autoFocus
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl bg-slate-50 transition-all font-sans text-lg tracking-widest"
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-lg text-sm font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "כניסה למערכת"
                      )}
                    </Button>
                  </form>

                  <button
                    onClick={handleSwitchUser}
                    className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <LogOut className="w-4 h-4" />
                    התחבר כמשתמש אחר
                  </button>
                </div>
              ) : (
                /* REGULAR LOGIN VIEW */
                <>
                  <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black text-slate-800 mb-2">
                      הזדהות למערכת
                    </h1>
                    <p className="text-slate-500 text-sm">
                      נא להזין פרטי משתמש אישיים בצורה מאובטחת
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Personal Number */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="personal_number"
                          className="text-xs font-bold text-slate-600 mr-1"
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
                          className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl bg-slate-50 transition-all"
                          placeholder="מספר אישי..."
                          disabled={isLoading}
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="password"
                            className="text-xs font-bold text-slate-600 mr-1"
                          >
                            סיסמה
                          </Label>
                          <button
                            type="button"
                            className="text-[10px] font-bold text-indigo-600 hover:underline"
                          >
                            שכחתי סיסמה?
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
                          className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl bg-slate-50 transition-all font-sans"
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 p-4 rounded-xl text-sm text-rose-600 font-bold animate-in fade-in zoom-in-95 duration-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            מאמת פרטים...
                          </span>
                        ) : (
                          "כניסה מאובטחת"
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Form Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-5 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                תמיכה וסיוע טכני
              </p>
              <p className="text-xs font-bold text-slate-600">
                נתקלת בבעיה? חייג למוקד התמיכה:{" "}
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ml-1 text-sm">
                  *1234
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="py-6 px-6 border-t border-slate-200 bg-white">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">
              תנאי שימוש
            </a>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="#" className="hover:text-indigo-600 transition-colors">
              הצהרת נגישות
            </a>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href="#" className="hover:text-indigo-600 transition-colors">
              מדיניות פרטיות
            </a>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">
            © {new Date().getFullYear()} כל הזכויות שמורות ליחידת המחשוב •
            v2.4.2
          </p>
        </div>
      </footer>
    </div>
  );
}
