import { Palette, Moon, Sun, Type, Monitor, Pipette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useRef } from "react";

interface AppearanceSettingsProps {
  theme: string;
  setTheme: (theme: any) => void;
  accentColor: string;
  setAccentColor: (color: any) => void;
  fontSize: string;
  setFontSize: (size: any) => void;
}

export function AppearanceSettings({
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  fontSize,
  setFontSize,
}: AppearanceSettingsProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(accentColor.startsWith("#"));
  const colorInputRef = useRef<HTMLInputElement>(null);

  const accentColors = [
    { id: "blue", label: "כחול", class: "bg-blue-500" },
    { id: "indigo", label: "אינדיגו", class: "bg-indigo-500" },
    { id: "violet", label: "סגול", class: "bg-violet-500" },
    { id: "pink", label: "ורוד", class: "bg-pink-500" },
    { id: "rose", label: "ורד", class: "bg-rose-500" },
    { id: "orange", label: "כתום", class: "bg-orange-500" },
    { id: "amber", label: "ענבר", class: "bg-amber-500" },
    { id: "lime", label: "ליים", class: "bg-lime-500" },
    { id: "emerald", label: "אמרלד", class: "bg-emerald-500" },
    { id: "teal", label: "טורקיז", class: "bg-teal-500" },
    { id: "cyan", label: "ציאן", class: "bg-cyan-500" },
    { id: "zinc", label: "ניטרלי", class: "bg-slate-500" },
  ];

  const fontSizes = [
    { id: "small", label: "קטן" },
    { id: "normal", label: "רגיל" },
    { id: "large", label: "גדול" },
  ];

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentColor(e.target.value);
  };

  return (
    <div className="w-full pb-24 lg:pb-0 space-y-6 sm:space-y-8">
      {/* Top Row: Theme & Font Size Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-stretch">
        <SectionCard icon={Palette} title="ערכת נושא">
          <div className="grid grid-cols-2 gap-4 h-full">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as any)}
                className={cn(
                  "group relative h-28 sm:h-36 rounded-2xl border transition-all overflow-hidden",
                  theme === t
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/10",
                )}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-full transition-all",
                      theme === t
                        ? "bg-primary text-white scale-110"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                    )}
                  >
                    {t === "light" ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn("font-bold text-sm tracking-wide transition-colors", theme === t ? "text-primary" : "text-muted-foreground")}>
                    {t === "light" ? "מראה יום" : "מראה לילה"}
                  </span>
                </div>

                {theme === t && (
                  <motion.div
                    layoutId="active-theme"
                    className="absolute top-3 right-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={Type} title="גודל גופן">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full">
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setFontSize(size.id as any)}
                className={cn(
                  "group relative rounded-2xl border flex flex-col items-center justify-center gap-2 p-4 transition-all h-28 sm:h-36",
                  fontSize === size.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/10",
                )}
              >
                <span
                  className={cn(
                    "font-black transition-all",
                    size.id === "small" && "text-xs",
                    size.id === "normal" && "text-base",
                    size.id === "large" && "text-xl",
                    fontSize === size.id
                      ? "text-primary scale-110"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  אבג
                </span>
                <span className={cn("font-bold text-[10px] sm:text-xs", fontSize === size.id ? "text-primary" : "text-muted-foreground")}>
                  {size.label}
                </span>

                {fontSize === size.id && (
                  <motion.div
                    layoutId="active-font"
                    className="absolute top-3 right-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </motion.div>
                )}
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Bottom Row: Full Palette */}
      <SectionCard icon={Pipette} title="מניפת צבעי מערכת">
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-1 overflow-x-auto no-scrollbar pb-2">
            {accentColors.map((color, index) => (
              <motion.button
                key={color.id}
                initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{ 
                  delay: index * 0.04,
                  type: "spring",
                  stiffness: 260,
                  damping: 20 
                }}
                onClick={() => {
                  setAccentColor(color.id);
                  setIsCustomOpen(false);
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all min-w-[55px] sm:min-w-[65px] lg:min-w-[0] lg:flex-1",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 sm:w-11 sm:h-11 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-full transition-all duration-300 relative flex items-center justify-center",
                    color.class,
                    accentColor === color.id && !isCustomOpen
                      ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110",
                  )}
                >
                  {accentColor === color.id && !isCustomOpen && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className={cn(
                    "text-[9px] sm:text-[10px] font-bold text-center truncate w-full",
                    accentColor === color.id && !isCustomOpen ? "text-primary" : "text-muted-foreground"
                  )}>
                  {color.label}
                </span>
              </motion.button>
            ))}

            {/* Custom Color Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8, rotate: -20, y: 20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
              transition={{ delay: accentColors.length * 0.04 }}
              onClick={() => {
                setIsCustomOpen(true);
                colorInputRef.current?.click();
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-1 rounded-xl transition-all min-w-[55px] sm:min-w-[65px] lg:min-w-[0] lg:flex-1",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 sm:w-11 sm:h-11 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-full transition-all duration-300 relative flex items-center justify-center overflow-hidden",
                  isCustomOpen
                    ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "bg-linear-to-tr from-red-500 via-green-500 to-blue-500 hover:scale-110",
                )}
                style={isCustomOpen ? { backgroundColor: accentColor } : {}}
              >
                {!isCustomOpen ? (
                  <Pipette className="w-5 h-5 text-white" />
                ) : (
                  <Check className="w-5 h-5 text-white" />
                )}
                <input
                  ref={colorInputRef}
                  type="color"
                  className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                  value={accentColor.startsWith("#") ? accentColor : "#0074ff"}
                  onChange={handleCustomColorChange}
                />
              </div>
              <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold text-center",
                  isCustomOpen ? "text-primary" : "text-muted-foreground"
                )}>
                מותאם
              </span>
            </motion.button>
          </div>

          <AnimatePresence>
            {isCustomOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-4 p-5 rounded-[2.5rem] bg-muted/20 border border-border/40 backdrop-blur-md">
                  <div 
                    className="w-14 h-14 rounded-2xl border border-white/20 relative"
                    style={{ backgroundColor: accentColor }}
                  >
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">מזהה צבע נבחר</label>
                      <div className="flex items-center gap-3">
                         <span className="font-mono text-lg font-black tracking-tighter text-foreground">{accentColor.toUpperCase()}</span>
                         <div className="h-4 w-px bg-border" />
                         <button 
                          onClick={() => colorInputRef.current?.click()}
                          className="text-xs text-primary font-bold hover:underline"
                         >
                           שינוי צבע
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* Preview Info Mini-Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary mt-4 max-w-xl">
        <Monitor className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
        <p className="text-xs font-bold leading-relaxed opacity-90">
          שינויי התצוגה מיושמים אוטומטית ברחבי המערכת ונשמרים בחשבונך. המערכת תתאים את צבעי הרקע והטקסט בהתאם לבחירתך.
        </p>
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: any) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center gap-2 px-1">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-black text-foreground tracking-tight">
          {title}
        </h3>
      </div>
      <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-4 sm:p-6 overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}


