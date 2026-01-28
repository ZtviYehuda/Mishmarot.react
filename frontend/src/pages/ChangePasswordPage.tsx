import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    AlertCircle,
    ShieldCheck,
    CheckCircle2,
    ExternalLink,
    KeyRound
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
        <div className="min-h-screen bg-[#f3f6f9] flex flex-col font-sans text-[#2c3e50]" dir="rtl">
            {/* Official Top Bar */}
            <div className="w-full bg-[#003d7e] h-1.5" />
            <header className="w-full bg-white border-b border-slate-200 py-3 px-6 md:px-12 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <ShieldCheck className="w-6 h-6 text-[#003d7e]" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-[#003d7e] uppercase tracking-wider leading-none">
                            מדינת ישראל
                        </div>
                        <div className="text-sm font-black text-slate-800 tracking-tight">
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
            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Change Password Banner */}
                    <div className="bg-amber-50 border-r-4 border-amber-500 p-4 mb-6 flex items-start gap-3">
                        <KeyRound className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm leading-relaxed">
                            <span className="font-bold text-amber-700 text-base">חובה להחליף סיסמה.</span>
                            <p className="text-amber-600 font-medium">
                                זוהי התחברות ראשונית למערכת השוטר. למען אבטחת המידע, עליך לבחור סיסמה אישית חדשה שתשמש אותך בכניסות הבאות.
                            </p>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="p-8">
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2 underline underline-offset-8 decoration-blue-500/20">
                                    קביעת סיסמה חדשה
                                </h1>
                                <p className="text-slate-500 text-sm font-medium">
                                    שלום, <span className="text-[#003d7e] font-bold">{user?.first_name} {user?.last_name}</span>. נא להזין סיסמה מאובטחת.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="new_password"
                                            className="text-sm font-bold text-slate-700 mr-1"
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
                                                className="h-12 border-slate-300 focus:border-[#003d7e] focus:ring-1 focus:ring-[#003d7e]/20 rounded-md bg-slate-50/50"
                                                placeholder="הזן סיסמה חדשה (מינימום 6 תווים)"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="confirm_password"
                                            className="text-sm font-bold text-slate-700 mr-1"
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
                                            className="h-12 border-slate-300 focus:border-[#003d7e] focus:ring-1 focus:ring-[#003d7e]/20 rounded-md bg-slate-50/50"
                                            placeholder="הזן שוב את הסיסמה"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Password Strength Tips */}
                                <div className="bg-slate-50 rounded-lg p-3 text-[11px] text-slate-500 space-y-1">
                                    <p className="font-bold text-slate-400 uppercase tracking-tighter mb-1">המלצות לסיסמה חזקה:</p>
                                    <li className="list-none flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" /> שילוב של אותיות ומספרים
                                    </li>
                                    <li className="list-none flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-slate-300" /> מינימום 6 תווים
                                    </li>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-3 bg-red-50 border-r-4 border-red-500 p-4 text-sm text-red-700 animate-in fade-in zoom-in-95 duration-200">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <span className="font-medium text-right">{error}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 bg-[#003d7e] hover:bg-[#002a56] text-white font-black text-lg rounded-md transition-all shadow-md active:transform active:scale-[0.98]"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                מעדכן סיסמה...
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5" />
                                                שמור וסיים
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Form Footer */}
                        <div className="bg-slate-50 border-t border-slate-100 p-6 text-center">
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">
                                אבטחת מידע
                            </p>
                            <p className="text-xs text-slate-500 leading-relaxed px-4">
                                הסיסמה החדשה תהיה בתוקף באופן מיידי ותשמש אותך בכל כניסה עתידית למערכת. נא לא לחשוף את הסיסמה לאף גורם אחר.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Page Footer */}
            <footer className="py-8 px-6 border-t border-slate-200 bg-white">
                <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        © {new Date().getFullYear()} מערכת סד"כ גובה • כל הזכויות שמורות
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                        גרסה 2.4.1 • סביבת ייצור מאובטחת
                    </p>
                </div>
            </footer>
        </div>
    );
}
