import {
  ShieldCheck,
  ArrowRight,
  Eye,
  Database,
  Share2,
  UserRoundCheck,
  Server,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function PrivacyPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const policies = [
    {
      title: "איסוף מידע",
      content:
        "אנו אוספים מידע הנחוץ לניהול כוח האדם בלבד, כולל שם, מספר אישי, תפקיד, ונתוני נוכחות. המידע נאסף ישירות מהמשתמש או ממקורות מורשים בתוך הארגון.",
      icon: <Database className="w-5 h-5 text-blue-500" />,
    },
    {
      title: "שימוש במידע",
      content:
        "המידע משמש לשיבוץ משמרות, חישובי שכר, מעקב נוכחות מבצעי ושיפור יעילות העבודה ביחידה. אנו לא עושים שימוש במידע למטרות שיווקיות.",
      icon: <Eye className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: "אבטחת נתונים",
      content:
        "כל הנתונים מאוחסנים בשרתים מאובטחים העומדים בתקני האבטחה המחמירים ביותר של הארגון. הגישה לנתונים מוגבלת למשתמשים מורשים על בסיס 'צורך לדעת' בלבד.",
      icon: <Server className="w-5 h-5 text-cyan-500" />,
    },
    {
      title: "שיתוף עם צד שלישי",
      content:
        "מידע אישי אינו מועבר לצדדים שלישיים מחוץ לארגון, אלא אם כן נדרש הדבר על פי דין או לצורך ביצוע משימות מבצעיות מאושרות.",
      icon: <Share2 className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: "זכויות המשתמש",
      content:
        "לכל משתמש קיימת הזכות לעיין במידע האישי השמור עליו ולבקש תיקון במקרה של נתונים שגויים, בכפוף לנהלי הארגון.",
      icon: <UserRoundCheck className="w-5 h-5 text-rose-500" />,
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 border shadow-sm",
              isDark
                ? "bg-slate-900 border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-900",
            )}
          >
            <ShieldCheck className="w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl font-black mb-4 tracking-tight italic">
            מדיניות פרטיות
          </h1>
          <p className="text-muted-foreground text-lg italic">
            מחויבים לשמירה על המידע האישי שלך
          </p>
        </div>

        <div className="grid gap-6">
          {policies.map((policy, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-8 rounded-[2.5rem] border backdrop-blur-sm transition-all hover:border-blue-500/50",
                isDark
                  ? "bg-slate-900/50 border-white/10 shadow-lg"
                  : "bg-white border-slate-200 shadow-xl",
              )}
            >
              <div className="flex items-start gap-5">
                <div
                  className={cn(
                    "p-3 rounded-2xl shrink-0",
                    isDark ? "bg-slate-800" : "bg-slate-50",
                  )}
                >
                  {policy.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-3">{policy.title}</h2>
                  <p className="leading-relaxed text-muted-foreground">
                    {policy.content}
                  </p>
                </div>
              </div>
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
