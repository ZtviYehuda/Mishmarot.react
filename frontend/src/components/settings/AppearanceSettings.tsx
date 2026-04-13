import { Palette, Moon, Sun, Type, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  // Only showing the 7 colors that are defined in index.css themes for perfect functionality.
  const accentColors = [
    { id: "emerald", label: "אמרלד", class: "bg-emerald-500" },
    { id: "cyan", label: "ציאן", class: "bg-cyan-500" },
    { id: "blue", label: "כחול", class: "bg-blue-500" },
    { id: "violet", label: "סגול", class: "bg-violet-500" },
    { id: "rose", label: "ורד", class: "bg-rose-500" },
    { id: "amber", label: "ענבר", class: "bg-amber-500" },
    { id: "zinc", label: "ניטרלי", class: "bg-slate-500" },
  ];

  const fontSizes = [
    { id: "small", label: "קטן" },
    { id: "normal", label: "רגיל" },
    { id: "large", label: "גדול" },
  ];

  return (
    <div className="w-full pb-24 lg:pb-0 max-w-7xl mx-auto space-y-6 sm:space-y-8">
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
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-muted/10",
                )}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div
                    className={cn(
                      "p-3 rounded-full transition-all",
                      theme === t
                        ? "bg-primary text-white scale-110 shadow-sm shadow-primary/20"
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
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
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
      <SectionCard icon={Palette} title="מניפת צבעי מערכת">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {accentColors.map((color) => (
            <button
              key={color.id}
              onClick={() => setAccentColor(color.id)}
              className={cn(
                "relative group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                accentColor === color.id
                  ? "bg-muted/50 border border-border/60 shadow-sm"
                  : "border border-transparent hover:bg-muted/20",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform",
                  color.class,
                  accentColor === color.id
                    ? "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md shadow-primary/20"
                    : "hover:scale-110 shadow-sm hover:shadow-md",
                )}
              />
              <span className={cn(
                  "text-[9px] sm:text-[10px] font-bold text-center",
                  accentColor === color.id ? "text-primary" : "text-muted-foreground"
                )}>
                {color.label}
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Preview Info Mini-Header */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary mt-4 max-w-xl">
        <Monitor className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
        <p className="text-xs font-bold leading-relaxed opacity-90">
          שינויי התצוגה מיושמים אוטומטית ברחבי המערכת ונשמרים בחשבונך.
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
      <div className="bg-card/40 backdrop-blur-xl rounded-[2rem] border border-border/40 p-4 sm:p-6 shadow-sm overflow-hidden h-full">
        {children}
      </div>
    </div>
  );
}

