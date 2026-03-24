import { Palette, Moon, Sun, Monitor, Type, Sparkles } from "lucide-react";
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
  const accentColors = [
    { id: "blue", label: "כחול", class: "bg-blue-600" },
    { id: "zinc", label: "אפור", class: "bg-zinc-600" },
    { id: "emerald", label: "ירוק", class: "bg-emerald-600" },
    { id: "violet", label: "סגול", class: "bg-violet-600" },
    { id: "amber", label: "כתום", class: "bg-amber-600" },
    { id: "rose", label: "אדום", class: "bg-rose-600" },
    { id: "cyan", label: "ציאן", class: "bg-cyan-500" },
  ];

  const fontSizes = [
    { id: "small", label: "קטן" },
    { id: "normal", label: "רגיל" },
    { id: "large", label: "גדול" },
  ];

  return (
    <div className=" w-full pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8">
          <SectionCard icon={Palette} title="ערכת נושא">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              {["light", "dark"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as any)}
                  className={cn(
                    "group relative h-32 sm:h-48 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all overflow-hidden",
                    theme === t
                      ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                      : "border-border/40 bg-background/50 hover:border-border/40",
                  )}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-4 p-4 sm:p-8">
                    <div
                      className={cn(
                        "p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all",
                        theme === t
                          ? "bg-primary text-white scale-110"
                          : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                      )}
                    >
                      {t === "light" ? (
                        <Sun className="w-5 h-5 sm:w-8 sm:h-8" />
                      ) : (
                        <Moon className="w-5 h-5 sm:w-8 sm:h-8" />
                      )}
                    </div>
                    <span className="font-black text-sm sm:text-lg uppercase tracking-wider">
                      {t === "light" ? "מראה יום" : "מראה לילה"}
                    </span>
                  </div>

                  {theme === t && (
                    <motion.div
                      layoutId="active-theme"
                      className="absolute top-3 right-3 sm:top-5 sm:right-5"
                    >
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Sparkles} title="צבע דגש">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-4">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all",
                    accentColor === color.id
                      ? "bg-primary/10 border border-border/40"
                      : "hover:bg-muted/50 border border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-transform",
                      color.class,
                      accentColor === color.id
                        ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                        : "hover:scale-105",
                    )}
                  />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-muted-foreground truncate w-full text-center">
                    {color.label}
                  </span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Type} title="גודל גופן">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setFontSize(size.id as any)}
                  className={cn(
                    "group relative p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border-2 flex flex-col items-center gap-2 sm:gap-3 transition-all",
                    fontSize === size.id
                      ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                      : "border-border/40 bg-background/50 hover:border-border/40",
                  )}
                >
                  <span
                    className={cn(
                      "font-black transition-all",
                      size.id === "small" && "text-sm",
                      size.id === "normal" && "text-base",
                      size.id === "large" && "text-lg",
                      fontSize === size.id
                        ? "text-primary scale-110"
                        : "text-muted-foreground/60 group-hover:text-muted-foreground",
                    )}
                  >
                    אבג
                  </span>
                  <span className="font-black text-[9px] sm:text-[10px] uppercase text-muted-foreground">
                    {size.label}
                  </span>

                  {fontSize === size.id && (
                    <motion.div
                      layoutId="active-font"
                      className="absolute top-3 right-3 sm:top-4 sm:right-4"
                    >
                      <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-primary" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Info Area */}
        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-8">
          <SectionCard icon={Monitor} title="תצוגה מקדימה">
            <div className="p-6 rounded-3xl bg-primary/5 border border-border/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/20" />
              <p className="text-sm font-black text-primary leading-relaxed relative z-10 transition-colors group-hover:text-primary/100">
                שינויי העיצוב משפיעים על כל דפי המערכת באופן מיידי ומסונכרנים עם
                חשבונך בכל המכשירים.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Internal UI Components ---

function SectionCard({ icon: Icon, title, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-border/40 overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-border/40 bg-primary/5 flex items-center gap-2 sm:gap-3">
        <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/10 text-primary">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
          {title}
        </h3>
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </motion.div>
  );
}

