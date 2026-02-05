import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LifeBuoy,
  Mail,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

export default function SupportPage() {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    full_name: "",
    personal_number: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post("/api/support/tickets", formData);
      setIsSuccess(true);
      toast.success("פנייתך התקבלה בהצלחה", {
        description: "נציג תמיכה יחזור אליך בהקדם.",
      });
      setFormData({
        full_name: "",
        personal_number: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("שגיאה בשליחת פנייה", {
        description: "אנא נסה שוב מאוחר יותר או פנה במייל.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <div
      className={cn(
        "min-h-screen py-12 px-4 relative overflow-hidden transition-colors duration-500",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800",
      )}
      dir="rtl"
    >
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
              isDark
                ? "bg-blue-500/20 text-blue-400"
                : "bg-blue-100 text-blue-600",
            )}
          >
            <LifeBuoy className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black mb-3 italic">מרכז התמיכה</h1>
          <p className="text-muted-foreground text-lg">
            צוות התמיכה זמין עבורך לכל שאלה טכנית
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-6 rounded-3xl border text-center transition-all mb-8",
            isDark
              ? "bg-slate-900/50 border-white/10"
              : "bg-white border-slate-200",
          )}
        >
          <Mail className="w-6 h-6 mx-auto mb-3 text-indigo-500" />
          <h3 className="font-bold mb-1">פנייה בדואר אלקטרוני</h3>
          <p className="text-sm text-muted-foreground mb-1">
            מענה תוך יום עסקים אחד
          </p>
          <p className="font-bold text-blue-500">support@mishmarot.gov</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-8 rounded-[2.5rem] border backdrop-blur-md",
            isDark
              ? "bg-slate-900/60 border-white/10 shadow-2xl"
              : "bg-white border-slate-200 shadow-xl",
          )}
        >
          {isSuccess ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold mb-3">תודה לך!</h2>
              <p className="text-muted-foreground mb-8">
                פנייתך התקבלה במערכת ומספרה הוא #
                {Math.floor(Math.random() * 90000) + 10000}.
                <br />
                צוות התמיכה יטפל בפנייה בהקדם.
              </p>
              <Button
                onClick={() => setIsSuccess(false)}
                variant="outline"
                className="rounded-xl"
              >
                שלח פנייה נוספת
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Send className="w-6 h-6 text-blue-500" />
                פתיחת קריאת שירות
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-right">
                    <Label htmlFor="full_name">שם מלא</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="ישראל ישראלי"
                      className="rounded-xl h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2 text-right">
                    <Label htmlFor="personal_number">מספר אישי</Label>
                    <Input
                      id="personal_number"
                      value={formData.personal_number}
                      onChange={handleChange}
                      placeholder="1234567"
                      className="rounded-xl h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="subject">נושא הפנייה</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="במה נוכל לעזור?"
                    className="rounded-xl h-12"
                    required
                  />
                </div>
                <div className="space-y-2 text-right">
                  <Label htmlFor="message">פירוט הפנייה</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="תאר את הבעיה או השאלה שלך..."
                    className="min-h-[150px] rounded-xl"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "שלח פנייה לצוות התמיכה"
                  )}
                </Button>
              </form>
            </>
          )}
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors uppercase tracking-wider group"
          >
            חזרה לדף הכניסה
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
