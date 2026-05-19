import React, { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  ChevronRight,
  RefreshCw
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
}

export const TourGuideOverlay: React.FC<TourGuideOverlayProps> = ({
  steps,
  currentStepIndex,
  isActive,
  onNext,
  onPrev,
  onClose,
  isSingleStep = false
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
        // Scroll only for elements that are partially or fully outside the viewport
        const isSmallElement = rect.height < window.innerHeight * 0.8;
        const isOffScreen = rect.top < 100 || rect.bottom > window.innerHeight - 100;
        
        if (isSmallElement && isOffScreen) {
          setTimeout(() => {
            (visibleElement as Element).scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl pointer-events-auto border border-[color-mix(in_srgb,var(--primary)_15%,transparent)] dark:border-slate-800 text-right cursor-default"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center max-w-sm" dir="rtl">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
            <p className="text-sm font-black text-slate-900 dark:text-white">מחפש את הפיצ'ר...</p>
            <p className="text-[11px] font-bold text-slate-500 mt-1 mb-6">מיד נגיע למקום הנכון</p>
            <Button variant="ghost" onClick={onClose} className="text-xs font-bold">בטל</Button>
          </div>
        </div>
      )}
    </div>
  );
};
