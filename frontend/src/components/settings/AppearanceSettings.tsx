import { Palette, Check, Moon, Sun, Monitor, Type } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1920px] mx-auto pb-24 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Palette className="w-8 h-8 text-primary" />
            </div>
            מראה ותצוגה
          </h2>
          <p className="text-muted-foreground mt-2 text-lg font-medium max-w-2xl">
            התאם אישית את הממשק והעיצוב של המערכת לנוחותך
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Settings Area (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Theme Selection */}
          <Card className="border shadow-sm overflow-hidden text-right">
            <CardHeader className="bg-muted/10 border-b pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Monitor className="w-6 h-6 text-primary" />
                מצב תצוגה
              </CardTitle>
              <CardDescription className="text-base">
                בחר בין מצב בהיר לכהה בהתאם לסביבת העבודה שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div
                  onClick={() => setTheme("light")}
                  className={`
                    cursor-pointer relative overflow-hidden rounded-2xl border-2 p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg
                    ${theme === "light" ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                  `}
                >
                  <div className="w-full h-40 rounded-xl bg-[#f8fafc] border border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-3 right-3 w-20 h-2.5 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors"></div>
                    <div className="absolute top-8 right-3 w-10 h-2.5 bg-slate-200 rounded-full group-hover:bg-slate-300 transition-colors"></div>
                    <div className="absolute inset-x-12 bottom-6 h-20 bg-white rounded-t-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:h-24 transition-all">
                      <Sun className="w-10 h-10 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="font-bold text-lg block">מצב בהיר</span>
                    <span className="text-sm text-muted-foreground">
                      עבור סביבה מוארת
                    </span>
                  </div>
                  {theme === "light" && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setTheme("dark")}
                  className={`
                    cursor-pointer relative overflow-hidden rounded-2xl border-2 p-6 flex flex-col items-center gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg
                    ${theme === "dark" ? "border-primary bg-primary/5 shadow-md ring-4 ring-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                  `}
                >
                  <div className="w-full h-40 rounded-xl bg-[#020617] border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-3 right-3 w-20 h-2.5 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors"></div>
                    <div className="absolute top-8 right-3 w-10 h-2.5 bg-slate-800 rounded-full group-hover:bg-slate-700 transition-colors"></div>
                    <div className="absolute inset-x-12 bottom-6 h-20 bg-slate-900 rounded-t-2xl shadow-sm border border-slate-800 flex items-center justify-center group-hover:h-24 transition-all">
                      <Moon className="w-10 h-10 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <span className="font-bold text-lg block">מצב כהה</span>
                    <span className="text-sm text-muted-foreground">
                      עבור סביבה חשוכה
                    </span>
                  </div>
                  {theme === "dark" && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground rounded-full p-1.5 shadow-sm">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card className="border shadow-sm overflow-hidden text-right">
            <CardHeader className="bg-muted/10 border-b pb-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Type className="w-6 h-6 text-primary" />
                גודל טקסט
              </CardTitle>
              <CardDescription className="text-base">
                התאם את גודל הגופן לנוחות קריאה מרבית
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
                    className={`
                      relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md h-full justify-between
                      ${fontSize === item.value ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                    `}
                  >
                    <RadioGroupItem value={item.value} className="sr-only" />
                    <span
                      className={`font-black font-sans text-foreground block ${item.cls}`}
                    >
                      {item.size}
                    </span>
                    <div className="text-center space-y-1">
                      <span className="text-lg font-bold block">
                        {item.label}
                      </span>
                      <span className="text-sm text-muted-foreground block">
                        {item.desc}
                      </span>
                    </div>

                    {fontSize === item.value && (
                      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary animate-in zoom-in" />
                    )}
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Area (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Accent Color */}
          <Card className="border shadow-sm h-full flex flex-col text-right">
            <CardHeader className="pb-6 border-b bg-muted/10">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Palette className="w-5 h-5 text-primary" />
                ערכת נושא
              </CardTitle>
              <CardDescription className="text-sm">
                בחר את הצבע הראשי של המערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1">
              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    name: "blue",
                    label: "כחול (ברירת מחדל)",
                    hex: "#0074ff",
                    class: "bg-blue-600",
                  },
                  {
                    name: "zinc",
                    label: "אפור",
                    hex: "#475569",
                    class: "bg-slate-600",
                  },
                  {
                    name: "emerald",
                    label: "ירוק",
                    hex: "#059669",
                    class: "bg-emerald-600",
                  },
                  {
                    name: "violet",
                    label: "סגול",
                    hex: "#7c3aed",
                    class: "bg-violet-600",
                  },
                  {
                    name: "amber",
                    label: "כתום",
                    hex: "#d97706",
                    class: "bg-amber-600",
                  },
                  {
                    name: "rose",
                    label: "אדום",
                    hex: "#e11d48",
                    class: "bg-rose-600",
                  },
                ].map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setAccentColor(color.name)}
                    className={`
                      relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-sm
                      ${
                        accentColor === color.name
                          ? `border-primary bg-accent/50 shadow-sm ring-1 ring-primary/20`
                          : "border-border hover:bg-muted/40"
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full shadow-sm flex items-center justify-center ring-2 ring-background ${color.class}`}
                      ></div>
                      <span className="font-bold text-base">{color.label}</span>
                    </div>
                    {accentColor === color.name && (
                      <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
