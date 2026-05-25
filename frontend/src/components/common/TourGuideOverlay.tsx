import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  ChevronRight,
  RefreshCw,
  MessageCircle,
  Heart,
  PartyPopper,
  Headphones
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export interface TourStep {
  id: string;
  selector: string;
  path: string;
  title: string;
  content: string;
}

interface TourGuideOverlayProps {
  steps: TourStep[];
  currentStepIndex: number;
  isActive: boolean;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isSingleStep?: boolean;
  showCompletion?: boolean;
  onCloseCompletion?: () => void;
}

export const TourGuideOverlay: React.FC<TourGuideOverlayProps> = ({
  steps,
  currentStepIndex,
  isActive,
  onNext,
  onPrev,
  onClose,
  isSingleStep = false,
  showCompletion = false,
  onCloseCompletion
}) => {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    // Reset drag when step changes
    setDragOffset({ x: 0, y: 0 });
    setHasDragged(false);
  }, [currentStepIndex]);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setElementRect(null);
      setIsVisible(false);
      return;
    }

    const updateRect = () => {
      // Use querySelectorAll to find ALL matching elements (e.g. desktop + mobile versions)
      // then pick the first one that is actually visible on screen
      const allElements = document.querySelectorAll(currentStep.selector);
      let visibleElement: Element | null = null;

      allElements.forEach(el => {
        if (!visibleElement) {
          const rect = el.getBoundingClientRect();
          // Check element is rendered and not hidden (display:none gives 0x0)
          if (rect.width > 0 && rect.height > 0) {
            visibleElement = el;
          }
        }
      });

      if (visibleElement) {
        const rect = (visibleElement as Element).getBoundingClientRect();
        setElementRect(rect);
        setIsVisible(true);
        // Scroll logic: if off-screen, scroll to it.
        // For large elements (like lists), scroll to the start so the header is visible without scrolling to the middle.
        // For small elements, center them on screen.
        const isOffScreen = rect.top < 100 || rect.bottom > window.innerHeight - 100;
        if (isOffScreen) {
          const scrollBlock = rect.height > window.innerHeight * 0.5 ? 'start' : 'center';
          setTimeout(() => {
            (visibleElement as Element).scrollIntoView({ behavior: 'smooth', block: scrollBlock });
          }, 100);
        }
      } else {
        setIsVisible(false);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 500);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isActive, currentStep]);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, onNext]);

  // Tour completion screen
  if (showCompletion) {
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-auto overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0"
          style={{ 
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)',
            backdropFilter: 'blur(20px)'
          }}
          onClick={onCloseCompletion}
        />

        {/* Floating sparkle particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: `${20 + Math.random() * 60}%`,
              y: `${20 + Math.random() * 60}%`,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 0.7, 0],
              scale: [0, 1, 0],
              y: [`${30 + Math.random() * 40}%`, `${10 + Math.random() * 20}%`]
            }}
            transition={{ 
              duration: 2.5 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeOut'
            }}
            className="absolute pointer-events-none"
          >
            <Sparkles className="w-3 h-3 text-primary/60" />
          </motion.div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
            className="relative w-full max-w-sm"
            dir="rtl"
          >
            {/* Glow behind card */}
            <div 
              className="absolute -inset-4 rounded-[3rem] opacity-30 blur-2xl"
              style={{ background: 'linear-gradient(135deg, var(--primary) 0%, transparent 60%)' }}
            />

            {/* Main card */}
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] border-[3px] border-primary/60 shadow-[0_0_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Decorative top gradient strip */}
              <div 
                className="h-2"
                style={{ background: 'linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, #ec4899), var(--primary))' }}
              />

              <div className="p-8 text-center">
                {/* Party icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
                  className="relative mx-auto mb-6 w-20 h-20"
                >
                  {/* Pulsing ring */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
                  />
                  <div className="relative w-20 h-20 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] border-2 border-primary/30 flex items-center justify-center">
                    <PartyPopper className="w-9 h-9 text-primary" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight"
                >
                  סיימנו את הסיור! 🎉
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
                >
                  תודה רבה שהקדשת מזמנך לצפות בסיור.
                  <br />
                  אני זמין לכל שאלה!
                </motion.p>

                {/* Divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                  className="h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent mb-6"
                />

                {/* Quote card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 mb-6 border border-border/50 text-right"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-[1.8]">
                      אמנם אני לא AI, אבל יש לי תשובות לרוב השאלות 😉
                      <br />
                      ואם בכל זאת אתקע — אני מעביר ישר לצוות התמיכה שלנו
                      <span className="inline-flex mr-1">
                        <Headphones className="w-3.5 h-3.5 text-primary inline" />
                      </span>
                    </p>
                  </div>
                </motion.div>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 }}
                  className="flex flex-col gap-3"
                >
                  <Button
                    onClick={onCloseCompletion}
                    className="w-full rounded-2xl font-black text-[12px] h-12 gap-2 shadow-lg shadow-primary/20 active:scale-[0.97] transition-all"
                  >
                    <Heart className="w-4 h-4" />
                    מעולה, בואו נתחיל!
                  </Button>
                </motion.div>

                {/* Steps completed badge */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-wider"
                >
                  ✓ {steps.length} שלבים הושלמו בהצלחה
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!isActive || !currentStep) return null;

  const getTooltipStyle = (): React.CSSProperties => {
    if (!elementRect) return {};

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw < 640;
    const tooltipH = 240;  // conservative tooltip height estimate
    const tooltipW = isMobile ? vw - 40 : 320;
    const pad = 20;        // minimum gap from screen edge

    const spaceBelow = vh - elementRect.bottom;
    const spaceAbove = elementRect.top;
    const elementIsLarge = elementRect.height > vh - 200;

    let topVal: number;

    if (elementIsLarge) {
      // Element fills most of the screen — pin tooltip to bottom of viewport
      topVal = vh - tooltipH - pad;
    } else if (spaceBelow >= tooltipH + pad) {
      // Enough room below
      topVal = elementRect.bottom + pad;
    } else if (spaceAbove >= tooltipH + pad) {
      // Enough room above
      topVal = elementRect.top - tooltipH - pad;
    } else {
      // Not enough room either side — centre vertically in viewport
      topVal = Math.max(pad, (vh - tooltipH) / 2);
    }

    // Clamp: never let it go off the top or bottom
    topVal = Math.max(pad, Math.min(topVal, vh - tooltipH - pad));

    let leftVal: number;
    if (isMobile) {
      leftVal = pad;
    } else {
      // Align with element left, but clamp so it never goes off the right edge
      leftVal = Math.max(pad, Math.min(elementRect.left, vw - tooltipW - pad));
    }

    return {
      position: 'fixed',
      top: topVal + (hasDragged ? dragOffset.y : 0),
      left: leftVal + (hasDragged ? dragOffset.x : 0),
      width: tooltipW,
      maxWidth: vw - 2 * pad,
      zIndex: 10000,
    };
  };

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {isVisible && elementRect && (
          <>
            {/* SVG Mask for Spotlight */}
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 w-full h-full pointer-events-auto"
            >
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <rect
                    x={elementRect.left - 8}
                    y={elementRect.top - 8}
                    width={elementRect.width + 16}
                    height={elementRect.height + 16}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.7)"
                mask="url(#spotlight-mask)"
                onClick={onClose}
              />
            </motion.svg>

            {/* Pulse Effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3], 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                left: elementRect.left - 12,
                top: elementRect.top - 12,
                width: elementRect.width + 24,
                height: elementRect.height + 24,
                border: '4px solid var(--primary)',
                borderRadius: '16px',
                pointerEvents: 'none'
              }}
            />

            {/* Content Tooltip */}
            <motion.div
              drag
              dragMomentum={false}
              onDragStart={() => setHasDragged(true)}
              onDragEnd={(_, info) => {
                setDragOffset(prev => ({
                  x: prev.x + info.offset.x,
                  y: prev.y + info.offset.y
                }));
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={getTooltipStyle()}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] pointer-events-auto border-[3px] border-primary/80 ring-8 ring-primary/20 text-right cursor-default"
              dir="rtl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  {!isSingleStep && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      שלב {currentStepIndex + 1} מתוך {steps.length}
                    </span>
                  )}
                  {isSingleStep && (
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      מצאתי!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-slate-300 hover:text-slate-400 p-1 cursor-grab active:cursor-grabbing" title="לחץ וגרור להזזה">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </div>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-2 leading-tight select-none">
                {currentStep.title}
              </h4>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-6 select-none">
                {currentStep.content}
              </p>

              <div className="flex items-center gap-2">
                {isSingleStep ? (
                  <Button 
                    onClick={onClose}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[11px] h-10 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    הבנתי, תודה
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={onNext}
                      variant="default"
                      className="flex-1 rounded-xl font-black text-[11px] h-10 gap-2 active:scale-95 transition-all"
                    >
                      הבנתי, המשך
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {currentStepIndex > 0 && (
                      <Button 
                        variant="ghost"
                        onClick={onPrev}
                        className="text-slate-500 font-black text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                      >
                        חזור
                      </Button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isVisible && isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative flex flex-col items-center text-center max-w-xs w-full mx-4"
            dir="rtl"
          >
            {/* Pulsing rings */}
            <div className="relative flex items-center justify-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-24 h-24 rounded-full"
                style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', opacity: 0.3 }}
              />
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute w-20 h-20 rounded-full border-2 border-primary/40"
              />
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-7 h-7 text-primary" />
                </motion.div>
              </div>
            </div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-base font-black text-white mb-1">
                {currentStep?.title || 'מחפש את הפיצ\'ר...'}
              </p>
              <p className="text-[11px] font-bold text-white/50 mb-6">
                מנווט למיקום הנכון
              </p>
            </motion.div>

            {/* Animated progress bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="h-full w-1/2 rounded-full"
                style={{ background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }}
              />
            </div>

            <Button
              variant="ghost"
              onClick={onClose}
              className="text-[11px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 rounded-xl h-8"
            >
              בטל סיור
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
