import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  content: string;
  path: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideOverlayProps {
  steps: TourStep[];
  currentStepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isActive: boolean;
}

export function TourGuideOverlay({ steps, currentStepIndex, onNext, onPrev, onClose, isActive }: TourGuideOverlayProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const currentStep = steps[currentStepIndex];

  useLayoutEffect(() => {
    if (!isActive || !currentStep) return;

    const updateCoords = () => {
      const element = document.querySelector(currentStep.selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        // Only set coords if element has visible dimensions
        if (rect.width > 0 && rect.height > 0) {
          setCoords({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
          // Smooth scroll if element is far away
          if (rect.top < 0 || rect.top > window.innerHeight) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }
      setCoords(null);
    };

    updateCoords();
    // Poll more frequently during transitions
    const interval = setInterval(updateCoords, 250); 
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [currentStep, isActive, currentStepIndex]);

  if (!isActive || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentStepIndex} // Force re-render on step change
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
        >
          {coords ? (
            <>
              {/* Dark Overlay with Hole */}
              <motion.svg
                className="absolute inset-0 w-full h-full pointer-events-auto"
              >
                <defs>
                  <mask id={`tour-mask-${currentStepIndex}`}>
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    <rect
                      x={coords.left - 8}
                      y={coords.top - 8}
                      width={coords.width + 16}
                      height={coords.height + 16}
                      rx="16"
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width="100%"
                  height="100%"
                  fill="rgba(15, 23, 42, 0.75)"
                  mask={`url(#tour-mask-${currentStepIndex})`}
                  onClick={onClose}
                />
              </motion.svg>

              {/* Explanation Window */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  top: Math.min(window.innerHeight - 300, Math.max(20, coords.top + coords.height + 20)),
                  left: Math.max(20, Math.min(window.innerWidth - 340, coords.left + (coords.width / 2) - 160))
                }}
                className="absolute w-[320px] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl pointer-events-auto border border-white/20 overflow-hidden z-[10001]"
              >
                <div className="p-6 text-right" dir="rtl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                        שלב {currentStepIndex + 1} מתוך {steps.length}
                      </span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-white mb-2">{currentStep.title}</h3>
                  <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {currentStep.content}
                  </p>

                  <div className="flex items-center gap-3">
                    {currentStepIndex > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onPrev}
                        className="rounded-xl h-10 border-none hover:bg-slate-100 font-black text-xs"
                      >
                        <ChevronRight className="w-4 h-4 ml-1.5" />
                        חזור
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={onNext}
                      className="flex-1 rounded-xl h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      {currentStepIndex === steps.length - 1 ? 'סיום סיור' : 'הבנתי, המשך'}
                      {currentStepIndex < steps.length - 1 && <ChevronLeft className="w-4 h-4 mr-1" />}
                    </Button>
                  </div>
                </div>
                
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Highlighting Pulse */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.1, 0.3, 0.1],
                  top: coords.top - 12,
                  left: coords.left - 12,
                  width: coords.width + 24,
                  height: coords.height + 24
                }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute border-4 border-blue-500/30 rounded-[1.5rem] pointer-events-none z-[10000]"
              />
            </>
          ) : (
            /* Loading State if element not found yet */
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-border">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-black text-slate-700 dark:text-slate-200">מחפש את הפיצ'ר הבא...</p>
                <Button variant="ghost" onClick={onClose} className="text-xs font-bold">ביטול סיור</Button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
