import React, { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles, 
  History, 
  ExternalLink,
  ChevronRight,
  Map,
  Lightbulb,
  Square,
  RefreshCw,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import { TourGuideOverlay } from "./TourGuideOverlay";
import type { TourStep } from "./TourGuideOverlay";

const TOUR_STEPS: TourStep[] = [
  // --- DASHBOARD PAGE ---
  {
    id: 'stats',
    selector: '#stats-grid',
    path: '/',
    title: 'לוח בקרה - נתונים מהירים',
    content: 'כאן מופיע סיכום המצב הנוכחי: כמה שוטרים לא דיווחו, כמה לא זמינים ומה אחוז הזמינות המבצעית שלכם ברגע זה.',
  },
  {
    id: 'attendance_trend',
    selector: '#attendance-chart',
    path: '/',
    title: 'גרף מגמת נוכחות',
    content: 'הגרף הזה מראה לכם את רמת הזמינות לאורך זמן. תוכלו לעבור בין תצוגה שבועית לחודשית ולראות אם יש שיפור.',
  },
  {
    id: 'birthdays',
    selector: '#birthdays-card',
    path: '/',
    title: 'ימי הולדת השבוע',
    content: 'מרכז החגיגות! כאן תוכלו לראות מי חוגג, לשלוח לו ברכה אישית בוואטסאפ או לראות את הפרופיל שלו.',
  },
  {
    id: 'report_hub',
    selector: '#report-hub-card',
    path: '/',
    title: 'מרכז הפקת דוחות',
    content: 'החלק האהוב על המפקדים. מכאן מוציאים את כל דוחות ה-PDF והתמונות לווטסאפ של היחידה בלחיצת כפתור.',
  },
  {
    id: 'broadcast',
    selector: '#broadcast-button',
    path: '/',
    title: 'רשימת תפוצה',
    content: 'צריכים להודיע משהו לכולם? הכפתור הזה מאפשר לשלוח הודעה מרוכזת לכל השוטרים שמופיעים בדף.',
  },
  
  // --- NAVIGATION ---
  {
    id: 'nav_attendance',
    selector: '[href="/attendance"]',
    path: '/',
    title: 'מעבר ליומן נוכחות',
    content: 'עכשיו בואו נצלול פנימה לתוך ניהול הנוכחות היומי שלכם.',
  },

  // --- ATTENDANCE PAGE ---
  {
    id: 'attendance_header',
    selector: '#attendance-header',
    path: '/attendance',
    title: 'ניהול נוכחות יומי',
    content: 'כאן מתבצעת העבודה האמיתית. תוכלו לסנן לפי מדור או צוות ולראות בדיוק מי נמצא איפה.',
  },
  {
    id: 'attendance_filters',
    selector: '#status-filters',
    path: '/attendance',
    title: 'מסנני סטטוס',
    content: 'רוצים לראות רק את מי שבחופשה או רק את מי שבמשרד? מכאן שולטים על התצוגה.',
  },
  {
    id: 'attendance_table',
    selector: '#attendance-table',
    path: '/attendance',
    title: 'טבלת השוטרים',
    content: 'כאן מופיעים כל השוטרים. לחיצה על כל שורה תאפשר לכם לעדכן סטטוס, להוסיף הערה או לצפות בהיסטוריה.',
  },

  // --- NAVIGATION ---
  {
    id: 'nav_employees',
    selector: '[href="/employees"]',
    path: '/attendance',
    title: 'מאגר כוח אדם',
    content: 'בואו נעבור למקום שבו מנהלים את כל השוטרים והעובדים ביחידה.',
  },

  // --- EMPLOYEES PAGE ---
  {
    id: 'employees_search',
    selector: '#employees-search-container',
    path: '/employees',
    title: 'חיפוש שוטרים',
    content: 'מחפשים מישהו ספציפי? פשוט תתחילו להקליד שם או מספר אישי.',
  },
  {
    id: 'add_employee_btn',
    selector: '#add-employee-button',
    path: '/employees',
    title: 'קליטת עובד חדש',
    content: 'הצטרף מישהו חדש ליחידה? דרך הכפתור הזה מקימים אותו במערכת תוך שניות.',
  }
];

export function GlobalAiSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuthContext();
  
  const [isOpen, setIsOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Use persistent state for tour
  const [currentTourIndex, setCurrentTourIndex] = useState<number>(() => {
    const saved = localStorage.getItem('active_tour_index');
    return saved ? parseInt(saved, 10) : -1;
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync tour index to localStorage
  useEffect(() => {
    if (currentTourIndex >= 0) {
      localStorage.setItem('active_tour_index', currentTourIndex.toString());
    } else {
      localStorage.removeItem('active_tour_index');
    }
  }, [currentTourIndex]);

  // Handle cross-page tour logic when page loads
  useEffect(() => {
    if (currentTourIndex >= 0) {
      const currentStep = TOUR_STEPS[currentTourIndex];
      if (currentStep && location.pathname !== currentStep.path) {
        // We are on the wrong page for this step, likely due to refresh or manual nav
        // If we want the tour to be strictly sequential, we might want to navigate back or adjust
        // But for now, we just ensure the spotlight stays active if the element appears
      }
    }
  }, [location.pathname, currentTourIndex]);

  const handleResetChat = () => {
    setMessages([]);
    setCurrentTourIndex(-1);
    setChatInput("");
    localStorage.removeItem('active_tour_index');
    toast.info("השיחה והסיור אופסו");
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: chatInput, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      let aiReply = "";
      const q = userMsg.text.toLowerCase();

      if (q.includes("עצור") || q.includes("תפסיק") || q.includes("stop") || q.includes("בטל")) {
        handleResetChat();
        return;
      }

      if (q.includes("סיור") || q.includes("איך עובד") || q.includes("תסביר")) {
        aiReply = "מצוין! אני מתחיל סיור מודרך. אני אסגור את חלון הצ'אט כדי שלא יפריע ותוכל לעקוב אחרי הזרקור. תוכל לעצור בכל שלב עם הריבוע האדום.";
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiReply, isBot: true }]);
        
        setTimeout(() => {
          setIsOpen(false);
          const firstStep = TOUR_STEPS[0];
          if (location.pathname !== firstStep.path) {
            navigate(firstStep.path);
          }
          setCurrentTourIndex(0);
        }, 1500);
        return;
      } else {
        aiReply = "אני כאן לעזור. תוכל לבקש ממני 'תעשה לי סיור' כדי להכיר את כל היכולות של המערכת.";
      }

      const botMsg: Message = { id: (Date.now() + 1).toString(), text: aiReply, isBot: true };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  const handleNextStep = () => {
    const nextIdx = currentTourIndex + 1;
    if (nextIdx < TOUR_STEPS.length) {
      const nextStep = TOUR_STEPS[nextIdx];
      
      // Update state first to show potential loading state if we want, 
      // but here we navigate first if needed
      if (location.pathname !== nextStep.path) {
        navigate(nextStep.path);
        // Wait for navigation and potential page load
        setTimeout(() => {
          setCurrentTourIndex(nextIdx);
        }, 300);
      } else {
        setCurrentTourIndex(nextIdx);
      }
    } else {
      setCurrentTourIndex(-1);
      setIsOpen(true);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "מקווה שהסיור היה מועיל! יש משהו נוסף שתרצה לדעת?", isBot: true }]);
      localStorage.removeItem('active_tour_index');
    }
  };

  const handlePrevStep = () => {
    const prevIdx = currentTourIndex - 1;
    if (prevIdx >= 0) {
      const prevStep = TOUR_STEPS[prevIdx];
      if (location.pathname !== prevStep.path) {
        navigate(prevStep.path);
        setTimeout(() => setCurrentTourIndex(prevIdx), 300);
      } else {
        setCurrentTourIndex(prevIdx);
      }
    }
  };

  return (
    <>
      <TourGuideOverlay 
        steps={TOUR_STEPS}
        currentStepIndex={currentTourIndex}
        isActive={currentTourIndex >= 0}
        onNext={handleNextStep}
        onPrev={handlePrevStep}
        onClose={() => {
            setCurrentTourIndex(-1);
            setIsOpen(true);
            localStorage.removeItem('active_tour_index');
        }}
      />

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl z-[100] flex items-center justify-center",
          (isOpen || currentTourIndex >= 0) && "hidden"
        )}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      {/* Floating STOP Button during Tour */}
      <AnimatePresence>
        {currentTourIndex >= 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={handleResetChat}
            className="fixed bottom-6 right-6 h-12 px-6 rounded-2xl bg-rose-600 text-white shadow-2xl z-[10000] flex items-center gap-3 font-black text-xs uppercase tracking-widest active:scale-95"
          >
            <Square className="w-4 h-4 fill-current" />
            עצור סיור
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 w-[350px] sm:w-[380px] h-[580px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[200] flex flex-col border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-xs uppercase tracking-tighter leading-none">תמיכת AI</h3>
                  <p className="text-[9px] font-bold opacity-70 mt-1">Smart Guidance</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetChat}
                  title="אפס שיחה"
                  className="hover:bg-rose-500/80 p-2 rounded-xl transition-all text-white/80 hover:text-white"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar bg-slate-50/50 dark:bg-slate-800/30">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40 py-10">
                  <Map className="w-12 h-12 text-blue-600 animate-pulse" />
                  <div>
                    <p className="text-sm font-black text-slate-900">ברוך הבא!</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">אני המדריך הדיגיטלי שלך.<br/>בוא נכיר את המערכת צעד אחר צעד.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-2xl border-blue-200 text-blue-600 font-black text-[11px] gap-2 h-10 px-6 bg-white shadow-sm"
                    onClick={() => {
                      setChatInput("תעשה לי סיור מודרך");
                      handleSend();
                    }}
                  >
                    התחל סיור מודרך
                  </Button>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.isBot ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-4 rounded-[1.5rem] text-[12px] font-bold leading-relaxed shadow-sm",
                    msg.isBot 
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ml-8 rounded-tl-none border border-slate-100" 
                      : "bg-blue-600 text-white mr-8 rounded-tr-none text-left"
                  )}
                >
                  {msg.text}
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-5 border-t border-border bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="שאל אותי משהו..."
                  className="flex-grow bg-transparent border-none text-xs font-bold px-3 focus:ring-0"
                />
                <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
