import {
  FileText,
  ArrowRight,
  ShieldCheck,
  Scale,
  Clock,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function TermsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const sections = [
    {
      title: "1. תנאי שימוש כלליים",
      content:
        "השימוש במערכת 'Mishmarot' מיועד אך ורק למטרות ניהול כוח אדם, שיבוץ משמרות ומעקב נוכחות מבצעי. כל שימוש אחר במערכת או בנתוניה ללא אישור מפורש הינו אסור בהחלט.",
      icon: <FileText className="w-5 h-5 text-blue-500" />,
    },
    {
      title: "2. אבטחת מידע וסודיות",
      content:
        "ידוע למשתמש כי המידע המוזן למערכת כולל נתונים רגישים על כוח אדם ושיבוצים מבצעיים. המשתמש מתחייב לשמור על סודיות פרטי הגישה שלו וחל איסור מוחלט על העברת פרטי המשתמש לצד שלישי.",
      icon: <Lock className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: "3. אחריות המשתמש",
      content:
        "המשתמש אחראי לדיוק הנתונים המוזנים על ידו למערכת. במקרה של זיהוי טעויות או פעילות חשודה, על המשתמש לדווח על כך באופן מיידי למרכז התמיכה או לקצין האבטחה הרלוונטי.",
      icon: <ShieldCheck className="w-5 h-5 text-cyan-500" />,
    },
    {
      title: "4. שינויים במערכת ובתנאי השימוש",
      content:
        "המנהלת שומרת לעצמה את הזכות לעדכן את המערכת ואת תנאי השימוש מעת לעת. הודעה על שינויים מהותיים תפורסם במסך הכניסה למערכת.",
      icon: <Clock className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: "5. סמכות שיפוט",
      content:
        "על תנאי שימוש אלה יחולו חוקי מדינת ישראל בלבד. כל מחלוקת הנוגעת לשימוש במערכת תידון בבתי המשפט המוסמכים במחוז תל אביב.",
      icon: <Scale className="w-5 h-5 text-rose-500" />,
    },
  ];

  return (
    <div
      className={cn(
        "min-h-screen py-16 px-4 relative overflow-hidden transition-colors duration-500",
        isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800",
      )}
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black mb-4 tracking-tight italic">
            תנאי שימוש
          </h1>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-8 rounded-[2.5rem] border backdrop-blur-sm transition-all hover:shadow-lg",
                isDark
                  ? "bg-slate-900/50 border-white/10"
                  : "bg-white border-slate-200 shadow-sm",
              )}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                {section.icon}
                {section.title}
              </h2>
              <p className="leading-relaxed text-muted-foreground">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center pt-8 border-t border-slate-200/50 dark:border-slate-800/50">
          <Link
            to="/login"
            className="text-sm font-bold text-blue-500 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            חזרה לדף הכניסה
          </Link>
        </div>
      </div>
    </div>
  );
}
