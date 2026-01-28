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
        <div className="min-h-screen bg-background flex flex-col font-sans text-foreground" dir="rtl">
            {/* Official Top Bar */}
            <div className="w-full bg-primary h-1.5" />
            <header className="w-full bg-card border-b border-border py-3 px-6 md:px-12 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center border border-border">
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
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted-foreground/50">
                    <span>GOV.IL</span>
                    <ExternalLink className="w-3 h-3" />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Change Password Banner */}
                    <div className="bg-amber-500/10 border-r-4 border-amber-500 p-4 mb-6 flex items-start gap-3">
                        <KeyRound className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div className="text-sm leading-relaxed">
                            <span className="font-bold text-amber-700 text-base">חובה להחליף סיסמה.</span>
                            <p className="text-amber-600 font-medium">
                                זוהי התחברות ראשונית למערכת השוטר. למען אבטחת המידע, עליך לבחור סיסמה אישית חדשה שתשמש אותך בכניסות הבאות.
                            </p>
                        </div>
                    </div>

                    {/* Change Password Card */}
                    <div className="bg-card rounded-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="p-8">
                            <div className="mb-8">
                                <h1 className="text-2xl font-bold text-foreground mb-2 underline underline-offset-8 decoration-primary/20">
                                    קביעת סיסמה חדשה
                                </h1>
                                <p className="text-muted-foreground text-sm font-medium">
                                    שלום, <span className="text-primary font-bold">{user?.first_name} {user?.last_name}</span>. נא להזין סיסמה מאובטחת.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="new_password"
                                            className="text-sm font-bold text-foreground/80 mr-1"
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
                                                className="h-12 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md bg-muted/50"
                                                placeholder="הזן סיסמה חדשה (מינימום 6 תווים)"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="confirm_password"
                                            className="text-sm font-bold text-foreground/80 mr-1"
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
                                            className="h-12 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-md bg-muted/50"
                                            placeholder="הזן שוב את הסיסמה"
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>

                                {/* Password Strength Tips */}
                                <div className="bg-muted rounded-lg p-3 text-[11px] text-muted-foreground space-y-1">
                                    <p className="font-bold text-muted-foreground/70 uppercase tracking-tighter mb-1">המלצות לסיסמה חזקה:</p>
                                    <li className="list-none flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" /> שילוב של אותיות ומספרים
                                    </li>
                                    <li className="list-none flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/30" /> מינימום 6 תווים
                                    </li>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="flex items-center gap-3 bg-destructive/10 border-r-4 border-destructive p-4 text-sm text-destructive animate-in fade-in zoom-in-95 duration-200">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <span className="font-medium text-right">{error}</span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg rounded-md transition-all shadow-md active:transform active:scale-[0.98]"
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
                        <div className="bg-muted/50 border-t border-border p-6 text-center">
                            <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-widest mb-1">
                                אבטחת מידע
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed px-4">
                                הסיסמה החדשה תהיה בתוקף באופן מיידי ותשמש אותך בכל כניסה עתידית למערכת. נא לא לחשוף את הסיסמה לאף גורם אחר.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Page Footer */}
            <footer className="py-8 px-6 border-t border-border bg-card">
                <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground/40">
                        © {new Date().getFullYear()} מערכת סד"כ גובה • כל הזכויות שמורות
                    </div>
                    <p className="text-xs text-muted-foreground/30 font-medium">
                        גרסה 2.4.1 • סביבת ייצור מאובטחת
                    </p>
                </div>
            </footer>
        </div>
    );
}
