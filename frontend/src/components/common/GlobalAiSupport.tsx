import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Send, 
  Sparkles, 
  History, 
  ExternalLink,
  Square,
  Minus,
  CalendarDays,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TourGuideOverlay } from "./TourGuideOverlay";
import type { TourStep } from "./TourGuideOverlay";
import { useChat } from "@/context/ChatContext";

const TOUR_STEPS: TourStep[] = [
  // --- DASHBOARD PAGE ---
  { id: 'stats', selector: '#stats-grid', path: '/', title: 'לוח בקרה - נתונים מהירים', content: 'כאן מופיע סיכום המצב הנוכחי: כמה שוטרים לא דיווחו, כמה לא זמינים ומה אחוז הזמינות המבצעית שלכם ברגע זה.' },
  { id: 'birthdays', selector: '#birthdays-card', path: '/', title: 'ימי הולדת השבוע', content: 'מרכז החגיגות! כאן תוכלו לראות מי חוגג, לשלוח לו ברכה אישית בוואטסאפ או לראות את הפרופיל שלו.' },
  { id: 'report_hub', selector: '#report-hub-card, #report-hub-card-mobile', path: '/', title: 'מרכז הפקת דוחות', content: 'החלק האהוב על המפקדים. מכאן מוציאים את כל דוחות ה-PDF והתמונות לווטסאפ של היחידה בלחיצת כפור.' },
  { id: 'report_hub_inside', selector: '#report-hub-content', path: '/?tutorial=report-hub-inside', title: 'רשימת הדוחות המהירה', content: 'הכל נגיש בצורה מהירה ונוחה. אפשר לשתף ישירות לוואטסאפ או להוריד כקובץ מכל שורה.' },
  
  // --- ATTENDANCE PAGE ---
  { id: 'attendance_header', selector: '#attendance-header', path: '/attendance', title: 'ניהול נוכחות יומי', content: 'כאן מתבצעת העבודה האמיתית. תוכלו לסנן לפי מדור או צוות ולראות בדיוק מי נמצא איפה.' },
  { id: 'attendance_table', selector: '#attendance-table, #attendance-table-mobile', path: '/attendance', title: 'רשימת השוטרים', content: 'כאן מופיעים כל השוטרים. אפשר לעדכן נוכחות לכל אחד בנפרד או לבחור כמה ביחד לעדכון מרוכז.' },

  // --- ROSTER / SHIFTS PAGE ---
  { id: 'roster_grid', selector: '#roster-page-container', path: '/roster', title: 'סידור עבודה ומשמרות', content: 'זה הלב של תכנון היחידה. כאן בונים את סידור העבודה לשבוע הקרוב, משבצים משמרות וקובעים תגבורים.' },

  // --- EMPLOYEES PAGE ---
  { id: 'employees_search', selector: '#employees-search-container', path: '/employees', title: 'חיפוש שוטרים', content: 'מחפשים מישהו ספציפי? פשוט תתחילו להקליד שם או מספר אישי.' },
  { id: 'add_employee_btn', selector: '#add-employee-button', path: '/employees', title: 'קליטת עובד חדש', content: 'הצטרף מישהו חדש ליחידה? דרך הכפתור הזה מקימים אותו במערכת תוך שניות.' },

  // --- CHAT & STATUS ---
  { id: 'system_status', selector: '#system-status-dot', path: '/', title: 'סטטוס פעילות המערכת', content: 'כאן מופיע חיווי ירוק קבוע המציין שהחיבור לשרת פעיל ומאובטח. לחיצה עליו תציג פרטים על זמן הכניסה האחרון שלך.' },
  { id: 'chat_toggle', selector: '#chat-toggle-btn', path: '/', title: 'צ\'אט פנימי והודעות', content: 'הכלי המושלם לתקשורת פנימית מהירה! לחיצה על כפתור זה תפתח את מרכז ההודעות והצ\'אט עם כל השוטרים והמפקדים ביחידה.' },
  { id: 'chat_status_step', selector: '#chat-status-avatar-btn', path: '/', title: 'עדכון סטטוס אישי בצ\'אט', content: 'לחיצה על כפתור האווטאר שלך עם ראשי התיבות בתוך הצ\'אט תפתח תפריט מהיר שבו תוכל להגדיר אם אתה מחובר, עסוק, לא נמצא, או לכתוב סטטוס מותאם אישית!' },

  // --- SETTINGS PAGES ---
  { id: 'appearance_palette', selector: '#color-palette-container', path: '/settings?tab=appearance', title: 'בחירת צבע אקצנט', content: 'לחצו על כל צבע במניפה כדי לשנות את הצבע המרכזי של המערכת (כפתורים, לינקים וגרפים) באופן מיידי.' },
  { id: 'settings_security', selector: '#security-tab', path: '/settings?tab=security', title: 'אבטחה וסיסמה', content: 'צריכים להחליף סיסמה? זה המקום. מומלץ להחליף סיסמה פעם בכמה חודשים לשמירה על אבטחת החשבון.' }
];

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  action?: { label: string; stepId: string; };
  suggestions?: { label: string; stepId: string; }[];
}

// Higher Intelligence Knowledge Base with Weighting Logic
const KNOWLEDGE_BASE = [
  { 
    id: 'roster', 
    title: 'סידור עבודה ומשמרות', 
    keywords: ['משמרת', 'משמרות', 'סידור', 'לו"ז', 'לוז', 'תכנון', 'שבוע הבא', 'שיבוץ', 'סידור עבודה', 'רוסטר', 'שבתות', 'לילות', 'בקרים', 'תורנות', 'שיבוצים'], 
    context: ['עבודה', 'מתי', 'איפה', 'איך', 'לוח', 'זמנים'], 
    description: 'את סידור העבודה והמשמרות לשבוע הקרוב מנהלים בדף ה"רוסטר". שם תוכל לשבץ עובדים לכל יום בשבוע.', 
    stepId: 'roster_grid' 
  },
  { 
    id: 'add_employee', 
    title: 'הוספת עובד חדש', 
    keywords: ['להוסיף', 'חדש', 'קליטה', 'להקים', 'רישום', 'הוספה', 'נוסיף', 'לשים', 'עוד', 'מינוי', 'גיוס', 'מצטרף', 'פרופיל'], 
    context: ['עובד', 'שוטר', 'עובדים', 'מישהו', 'אדם', 'איש'], 
    description: 'כדי להוסיף עובד חדש ליחידה, עליך לעבור לדף ניהול עובדים וללחוץ על כפתור הוספה (סימן הפלוס).', 
    stepId: 'add_employee_btn' 
  },
  { 
    id: 'attendance', 
    title: 'דיווח נוכחות', 
    keywords: ['נוכחות', 'לדווח', 'סטטוס', 'יומן', 'איפה', 'זמינות', 'חופש', 'מחלה', 'משרד', 'דיווח', 'איפה כולם', 'נמצאים', 'נוכחים', 'חסרים', 'לא הגיעו', 'נפקדים'], 
    context: ['שוטר', 'עובד', 'מצב', 'רשימה'], 
    description: 'ניהול הנוכחות היומי מתבצע בדף היומן. שם מעדכנים מי נמצא ביחידה ברגע זה.', 
    stepId: 'attendance_header' 
  },
  { 
    id: 'reports', 
    title: 'הפקת דוחות', 
    keywords: ['דוח', 'דוחות', 'PDF', 'להפיק', 'לשלוח', 'תמונה', 'וואטסאפ', 'ייצוא', 'סטטיסטיקה', 'סיכום', 'נתונים', 'גרפים', 'קובץ'], 
    context: ['נתונים', 'להוציא', 'הדפסה', 'פרסום'], 
    description: 'את כל הדוחות היחידתיים ניתן להפיק מתוך "מרכז הדוחות" בלוח הבקרה הראשי.', 
    stepId: 'report_hub' 
  },
  {
    id: 'appearance', 
    title: 'עיצוב וצבעים', 
    keywords: ['צבע', 'מראה', 'עיצוב', 'Theme', 'אקצנט', 'צבעים', 'לילה', 'יפה', 'גופן', 'פונט', 'אישי', 'התאמה', 'כהה', 'בהיר'], 
    context: ['מערכת', 'שינוי', 'נראות'], 
    description: 'ניתן לשנות את צבעי המערכת ואת ערכת הנושא דרך דף ההגדרות בלשונית "מראה ותצוגה".', 
    stepId: 'appearance_palette' 
  },
  { 
    id: 'filters_modern', 
    title: 'סינון נתונים מתקדם', 
    keywords: [
      'לסנן', 'סינון', 'פילטר', 'חיפוש מתקדם', 'לפי גיל', 'גילאים', 'טווח גיל', 
      'מעמד', 'קבע', 'שחם', 'מתנדב', 'סטטוסים', 'מחלקה', 'מדור', 'צוות', 
      'נקה הכל', 'החל סינון', 'איך מסננים', 'איפה הפילטר', 'חיפוש שוטרים', 
      'רשימה לפי', 'קבוצה', 'סיווג', 'שירות', 'סדיר', 'מילואים', 'אזרחים', 'פנסיונרים'
    ], 
    context: ['מערכת', 'נתונים', 'חיפוש', 'מיון'], 
    description: 'מערכת הסינון החדשה מאפשרת לך לדייק את הנתונים המוצגים לפי מגוון קטגוריות. ניתן לסנן לפי יחידה ארגונית, סטטוס דיווח, מעמד השירות וטווח גילאים. חשוב לזכור ללחוץ על כפתור "החל סינון" בסיום הבחירה.', 
    stepId: 'dashboard_filters' 
  },
  { 
    id: 'age_slider', 
    title: 'סינון לפי גיל', 
    keywords: [
      'גיל', 'גילאים', 'בן כמה', 'צעירים', 'מבוגרים', 'טווח', 'סליידר', 'גלילה', 
      'שנים', 'נולדו', 'תאריך לידה', 'ילידי', 'בוגרים', 'נוער', 'מתחת לגיל', 'מעל לגיל'
    ], 
    context: ['חיפוש', 'סינון', 'מידע'], 
    description: 'הוספנו סליידר גילאים חדש בלשונית "גילאים" שבתוך מסך הסינון. ניתן לגרור את שני הקצוות כדי לקבוע טווח גילאים מדויק (למשל: 18 עד 25) ולראות רק את השוטרים המתאימים.', 
    stepId: 'dashboard_filters' 
  },
  { 
    id: 'apply_logic', 
    title: 'החלת הסינון', 
    keywords: ['לא מתעדכן', 'לא עובד', 'לא משתנה', 'איך מאשרים', 'אישור', 'החלה', 'עדכון', 'למה זה לא זז', 'לחצתי וכלום לא קרה'], 
    context: ['סינון', 'באג', 'שאלה'], 
    description: 'במערכת החדשה, הנתונים מתעדכנים רק לאחר לחיצה על כפתור "החל סינון" בתחתית מסך הסינון. זה מאפשר לך לבחור כמה קטגוריות יחד בצורה מרוכזת ומהירה.', 
    stepId: 'dashboard_filters' 
  },
  {
    id: 'full_tour',
    title: 'סיור מודרך במערכת',
    keywords: ['סיור', 'הדרכה', 'מה יש', 'איך עובד', 'להכיר', 'סיבוב', 'הסבר', 'תראה לי', 'מה עושים', 'מה האתר', 'מה המערכת', 'איך משתמשים', 'חדש', 'עזרה', 'Help', 'מדריך', 'הסברים', 'איפה מה'],
    context: ['מערכת', 'התחלה', 'כללי', 'הבנה'],
    description: 'אשמח לעשות לך סיור מודרך! נראה את לוח הבקרה, ניהול הנוכחות, סידור העבודה וניהול העובדים.',
    stepId: 'full_tour' // Managed by handleAction
  }
];

export function GlobalAiSupport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isChatOpen, openChat } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai_support_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSingleStep, setIsSingleStep] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [currentTourIndex, setCurrentTourIndex] = useState<number>(() => {
    const saved = localStorage.getItem('active_tour_index');
    return saved ? parseInt(saved, 10) : -1;
  });
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (messages.length > 0) localStorage.setItem('ai_support_messages', JSON.stringify(messages));
  }, [messages]);

  const handleResetChat = () => {
    setMessages([]);
    setCurrentTourIndex(-1);
    setIsSingleStep(false);
    localStorage.removeItem('active_tour_index');
    localStorage.removeItem('ai_support_messages');
    toast.info("השיחה אופסה");
  };

  // Auto open/close chat sidebar during guided tour if a step requires it
  useEffect(() => {
    if (currentTourIndex >= 0 && !isSingleStep) {
      const step = TOUR_STEPS[currentTourIndex];
      if (step?.id === 'chat_status_step') {
        if (!isChatOpen) {
          openChat(null as any);
        }
      }
    }
  }, [currentTourIndex, isSingleStep, isChatOpen, openChat]);

  // --- SMART MATCHING ENGINE 2.0 ---
  // Auto-navigate during tour if step is on a different page or tab
  useEffect(() => {
    if (currentTourIndex >= 0 && !isSingleStep) {
      const step = TOUR_STEPS[currentTourIndex];
      if (step) {
        const needsNav = step.path.includes('?') 
          ? (location.pathname + location.search) !== step.path
          : location.pathname !== step.path;
        
        if (needsNav) {
          navigate(step.path);
        }
      }
    }
  }, [currentTourIndex, isSingleStep, location.pathname, location.search, navigate]);

  const findMatches = (input: string) => {
    const text = input.toLowerCase().trim();
    if (!text) return [];

    // Filter out stop words (noise)
    const noiseWords = ['אני', 'עושה', 'שלי', 'את', 'איפה', 'איך', 'עושים', 'רוצה', 'לדעת', 'לי', 'לנו', 'מתי', 'כמה', 'לשבוע', 'הקרוב', 'של', 'בבקשה', 'תגיד', 'שלום', 'היי', 'אשמח', 'צריך', 'יכול', 'מישהו', 'אפשר', 'מחפש'];
    const cleanTokens = text.split(/\s+/).filter(t => !noiseWords.includes(t) && t.length > 1);

    const scoredMatches = KNOWLEDGE_BASE.map(item => {
      let score = 0;
      
      // 1. Exact title match (Highest)
      if (text.includes(item.title.toLowerCase())) score += 100;

      // 2. Strong Keywords (High weight)
      item.keywords.forEach(k => {
        if (text.includes(k.toLowerCase())) {
          score += 45; // Increased weight
          // Bonus for exact token match
          if (cleanTokens.includes(k.toLowerCase())) score += 25;
        }
      });

      // 3. Contextual overlap (Low weight)
      item.context.forEach(c => {
        if (text.includes(c.toLowerCase())) score += 15;
      });

      // 4. Token overlap
      const matchingTokens = cleanTokens.filter(t => 
        item.keywords.some(k => k.includes(t)) || 
        item.title.toLowerCase().includes(t)
      );
      if (matchingTokens.length > 0) score += (matchingTokens.length * 20);

      return { ...item, score };
    });

    // Only return matches with significant score - Lowered threshold for more flexibility
    return scoredMatches
      .filter(m => m.score >= 30) 
      .sort((a, b) => b.score - a.score);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: chatInput, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");

    setTimeout(() => {
      const q = currentInput.toLowerCase().trim();
      const matches = findMatches(q);

      // logic for " Grey Area" - if top match is not dominant, show suggestions
      const topMatch = matches[0];
      const isDominant = topMatch && (!matches[1] || (topMatch.score > matches[1].score + 35));

      if (isDominant) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), text: topMatch.description, isBot: true,
          action: { label: "קח אותי לשם", stepId: topMatch.stepId }
        }]);
      } else if (matches.length > 0) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), text: "מצאתי כמה דברים שקשורים לבקשה שלך. למה התכוונת?", isBot: true,
          suggestions: matches.slice(0, 4).map(m => ({ label: m.title, stepId: m.stepId }))
        }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), text: "אני לא בטוח שהבנתי... תוכל לשאול על סינון וחיפוש, משמרות, הוספת עובד, הפקת דוחות או עיצוב המערכת.", isBot: true }]);
      }
    }, 600);
  };

  const handleAction = (stepId: string) => {
    if (stepId === 'full_tour') {
      setIsSingleStep(false);
      setIsOpen(false);
      const firstStep = TOUR_STEPS[0];
      const needsNav = firstStep.path.includes('?') 
        ? (location.pathname + location.search) !== firstStep.path
        : location.pathname !== firstStep.path;

      if (needsNav) {
        navigate(firstStep.path);
        setTimeout(() => setCurrentTourIndex(0), 500);
      } else {
        setCurrentTourIndex(0);
      }
      return;
    }

    const stepIdx = TOUR_STEPS.findIndex(s => s.id === stepId);
    if (stepIdx >= 0) {
      setIsSingleStep(true);
      setIsOpen(false);
      const step = TOUR_STEPS[stepIdx];
      const needsNav = step.path.includes('?') 
        ? (location.pathname + location.search) !== step.path
        : location.pathname !== step.path;

      if (needsNav) {
        navigate(step.path);
        setTimeout(() => setCurrentTourIndex(stepIdx), 500);
      } else {
        setCurrentTourIndex(stepIdx);
      }
    }
  };

  const handleCloseSpotlight = () => {
    setCurrentTourIndex(-1);
    setIsOpen(true);
  };

  return (
    <>
      <TourGuideOverlay steps={TOUR_STEPS} currentStepIndex={currentTourIndex} isActive={currentTourIndex >= 0} 
        onNext={() => isSingleStep ? handleCloseSpotlight() : setCurrentTourIndex(i => i + 1)} 
        onPrev={() => setCurrentTourIndex(i => i - 1)} 
        isSingleStep={isSingleStep} onClose={handleCloseSpotlight} 
      />

      <motion.div 
        key={`fab-container-${isOpen}-${isMinimized}-${resetKey}`}
        drag
        dragConstraints={{ left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 80 : 300, top: typeof window !== 'undefined' ? -window.innerHeight + 80 : -500, bottom: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (Math.abs(info.offset.x) > 20 || Math.abs(info.offset.y) > 20) {
            setHasMoved(true);
          }
        }}
        className={cn(
          "global-ai-support-btn fixed bottom-6 left-6 z-[100] flex flex-col items-center gap-2", 
          ((isOpen && !isMinimized) || (currentTourIndex >= 0 && TOUR_STEPS[currentTourIndex]?.path === location.pathname)) && "hidden"
        )}
      >
        <AnimatePresence>
          {hasMoved && (
            <motion.button 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setHasMoved(false);
                setResetKey(k => k + 1);
              }}
              className="w-8 h-8 bg-white dark:bg-slate-800 text-primary rounded-full shadow-lg flex items-center justify-center border border-border/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors pointer-events-auto"
              title="החזר למקום מקורי"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          onClick={() => { setIsOpen(true); setIsMinimized(false); }}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto"
        >
          <Sparkles className="w-6 h-6" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && !isMinimized && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] sm:hidden"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 bottom-4 sm:bottom-6 sm:left-6 sm:right-auto sm:inset-x-auto w-auto sm:w-[380px] h-[calc(100dvh-32px)] sm:h-[600px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[200] flex flex-col border border-border overflow-hidden"
            >
            <div onDoubleClick={() => setIsMinimized(true)} className="p-5 bg-primary text-primary-foreground flex items-center justify-between shadow-lg cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                <h3 className="font-black text-xs uppercase">צ'אט תמיכה</h3>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-xl text-white/80"><History className="w-4 h-4" /></button>
                <button onClick={() => setIsMinimized(true)} className="p-2 rounded-xl text-white/80"><Minus className="w-4 h-4" /></button>
                <button onClick={handleResetChat} className="p-2 rounded-xl text-white/80"><Square className="w-4 h-4 fill-current" /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden bg-slate-50/50 dark:bg-slate-800/30">
              {showHistory ? (
                <div className="h-full overflow-y-auto p-5 space-y-2 no-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">חיפושים אחרונים</h4>
                    <button onClick={() => setShowHistory(false)} className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">חזור לצ'אט</button>
                  </div>
                  {messages.filter(m => !m.isBot).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                      <History className="w-8 h-8 mb-2" />
                      <p className="text-xs font-bold text-center">אין היסטוריית חיפושים עדיין</p>
                    </div>
                  ) : (
                    [...messages].reverse().filter(m => !m.isBot).map((msg, idx) => (
                      <div 
                        key={`${msg.id}-${idx}`} 
                        onClick={() => {
                          setChatInput(msg.text);
                          setShowHistory(false);
                        }} 
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-primary/10 dark:hover:bg-slate-700 border border-border/50 flex justify-between items-center group transition-colors"
                      >
                        <span className="truncate pl-2">{msg.text}</span>
                        <History className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-5 space-y-4 no-scrollbar">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 text-center space-y-4">
                      <CalendarDays className="w-12 h-12 text-primary" />
                      <p className="text-sm font-black">במה אוכל לעזור היום?</p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-2">
                      <div className={cn("p-4 rounded-[1.5rem] text-[12px] font-bold shadow-sm", msg.isBot ? "bg-white dark:bg-slate-800 text-slate-700 ml-8 rounded-tl-none border border-border/50" : "bg-primary text-primary-foreground mr-8 rounded-tr-none text-left shadow-md shadow-primary/20")}>
                        {msg.text}
                      </div>
                      {msg.isBot && msg.action && (
                        <Button variant="outline" size="sm" className="ml-8 self-start rounded-xl border-emerald-200 text-emerald-600 font-black text-[11px] h-9 gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => handleAction(msg.action!.stepId)}>
                          <ExternalLink className="w-3.5 h-3.5" />{msg.action.label}
                        </Button>
                      )}
                      {msg.isBot && msg.suggestions && (
                        <div className="ml-8 flex flex-col gap-2">
                          {msg.suggestions.map((s, idx) => (
                            <Button key={idx} variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary font-black text-[11px] h-9 justify-start gap-2 hover:bg-primary/10 dark:hover:bg-primary/20" onClick={() => handleAction(s.stepId)}>
                              <Sparkles className="w-3.5 h-3.5" />{s.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border bg-white dark:bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-2xl">
                <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="שאל אותי משהו..." className="flex-grow bg-transparent border-none text-xs font-bold px-3 focus:ring-0" />
                <button type="submit" className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg"><Send className="w-4 h-4" /></button>
              </form>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
