import { Palette, Check, Moon, Sun, Monitor, Type } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SectionCard icon={Monitor} title="מצב תצוגה">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                {
                  id: "light",
                  label: "מצב בהיר",
                  icon: Sun,
                  color: "text-amber-500",
                  bg: "bg-[#f8fafc]",
                  border: "border-slate-200",
                },
                {
                  id: "dark",
                  label: "מצב כהה",
                  icon: Moon,
                  color: "text-indigo-400",
                  bg: "bg-[#020617]",
                  border: "border-slate-800",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => setTheme(item.id)}
                  className={cn(
                    "cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5",
                    theme === item.id
                      ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 ring-4 ring-primary/5"
                      : "border-border/50 bg-background/50 hover:border-primary/30",
                  )}
                >
                  <div
                    className={cn(
                      "w-full h-48 flex items-center justify-center p-8",
                      item.bg,
                    )}
                  >
                    <div
                      className={cn(
                        "p-6 rounded-3xl bg-background/10 backdrop-blur-md border shadow-2xl transition-all duration-500 group-hover:scale-110",
                        item.border,
                      )}
                    >
                      <item.icon className={cn("w-12 h-12", item.color)} />
                    </div>
                  </div>

                  <div className="p-6 text-center space-y-1">
                    <span className="font-black text-xl tracking-tight block">
                      {item.label}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">
                      {item.id === "light"
                        ? "צפייה אופטימלית ביום"
                        : "צפייה נעימה בלילה"}
                    </span>
                  </div>

                  {theme === item.id && (
                    <motion.div
                      layoutId="theme-check"
                      className="absolute top-4 right-4 bg-primary text-white rounded-full p-2 shadow-xl"
                    >
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard icon={Type} title="גודל גופן">
            <RadioGroup
              value={fontSize}
              onValueChange={(val) => setFontSize(val as any)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {[
                {
                  value: "small",
                  label: "קטן",
                  size: "Aa",
                  cls: "text-xl",
                  desc: "לתצוגה צפופה",
                },
                {
                  value: "normal",
                  label: "רגיל",
                  size: "Aa",
                  cls: "text-2xl",
                  desc: "ברירת מחדל",
                },
                {
                  value: "large",
                  label: "גדול",
                  size: "Aa",
                  cls: "text-4xl",
                  desc: "לקריאה נוחה",
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    "relative flex flex-col items-center gap-6 p-8 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 hover:shadow-xl group",
                    fontSize === item.value
                      ? "border-primary bg-primary/5 shadow-primary/10"
                      : "border-border/50 hover:border-primary/20 bg-background/50",
                  )}
                >
                  <RadioGroupItem value={item.value} className="sr-only" />
                  <div
                    className={cn(
                      "w-16 h-16 rounded-2xl bg-background flex items-center justify-center border shadow-sm transition-all duration-500 group-hover:scale-110",
                      fontSize === item.value
                        ? "border-primary/30 text-primary"
                        : "border-border/50 text-muted-foreground",
                    )}
                  >
                    <span className={cn("font-black font-sans", item.cls)}>
                      {item.size}
                    </span>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-lg font-black block tracking-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium block">
                      {item.desc}
                    </span>
                  </div>

                  {fontSize === item.value && (
                    <motion.div
                      layoutId="size-dot"
                      className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-primary shadow-lg shadow-primary/40"
                    />
                  )}
                </label>
              ))}
            </RadioGroup>
          </SectionCard>
        </div>

        {/* Sidebar Colors */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <SectionCard icon={Palette} title="צבע דגש">
            <div className="grid grid-cols-1 gap-4 py-2">
              {[
                { name: "blue", label: "כחול (ברירת מחדל)", color: "bg-blue-600" },
                { name: "zinc", label: "אפור", color: "bg-slate-600" },
                {
                  name: "emerald",
                  label: "ירוק",
                  color: "bg-emerald-600",
                },
                {
                  name: "violet",
                  label: "סגול",
                  color: "bg-violet-600",
                },
                { name: "amber", label: "כתום", color: "bg-amber-600" },
                { name: "rose", label: "אדום", color: "bg-rose-600" },
              ].map((color) => (
                <button
                  key={color.name}
                  onClick={() => setAccentColor(color.name)}
                  className={cn(
                    "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group",
                    accentColor === color.name
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-4 ring-primary/5"
                      : "border-border/50 bg-background/50 hover:border-primary/20",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl shadow-inner transition-transform duration-500 group-hover:scale-110",
                        color.color,
                      )}
                    />
                    <span className="font-black text-sm tracking-tight">
                      {color.label}
                    </span>
                  </div>
                  {accentColor === color.name && (
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 stroke-[3px]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Internal UI Components ---

function SectionCard({ icon: Icon, title, children, badge }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-8">{children}</div>
    </motion.div>
  );
}
