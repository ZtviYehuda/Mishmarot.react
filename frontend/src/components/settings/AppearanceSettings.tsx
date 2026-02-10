import { Palette, Check, Moon, Sun, Monitor, Type } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getHexColor } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Palette className="w-6 h-6 text-primary" />
            </div>
            מראה ותצוגה
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium mr-12 md:mr-0">
            התאם אישית את הממשק והעיצוב של המערכת לנוחותך
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Theme Selection */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5 text-primary" />
                מצב תצוגה
              </CardTitle>
              <CardDescription>
                בחר בין מצב בהיר לכהה בהתאם לסביבת העבודה שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setTheme("light")}
                  className={`
                    cursor-pointer relative overflow-hidden rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.02]
                    ${theme === "light" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                  `}
                >
                  <div className="w-full h-24 rounded-lg bg-[#f8fafc] border border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 w-16 h-2 bg-slate-200 rounded-full"></div>
                    <div className="absolute top-6 right-2 w-8 h-2 bg-slate-200 rounded-full"></div>
                    <div className="absolute inset-x-8 bottom-4 h-12 bg-white rounded-t-lg shadow-sm border border-slate-100 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-bold block">מצב בהיר</span>
                  </div>
                  {theme === "light" && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div
                  onClick={() => setTheme("dark")}
                  className={`
                    cursor-pointer relative overflow-hidden rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-[1.02]
                    ${theme === "dark" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                  `}
                >
                  <div className="w-full h-24 rounded-lg bg-[#020617] border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-2 right-2 w-16 h-2 bg-slate-800 rounded-full"></div>
                    <div className="absolute top-6 right-2 w-8 h-2 bg-slate-800 rounded-full"></div>
                    <div className="absolute inset-x-8 bottom-4 h-12 bg-slate-900 rounded-t-lg shadow-sm border border-slate-800 flex items-center justify-center">
                      <Moon className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="font-bold block">מצב כהה</span>
                  </div>
                  {theme === "dark" && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Font Size */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Type className="w-5 h-5 text-primary" />
                גודל טקסט
              </CardTitle>
              <CardDescription>
                התאם את גודל הגופן לנוחות קריאה מרבית
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup
                value={fontSize}
                onValueChange={(val) => setFontSize(val as any)}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                {[
                  {
                    value: "small",
                    label: "קטן",
                    size: "Aa",
                    cls: "text-sm",
                    desc: "לתצוגה צפופה",
                  },
                  {
                    value: "normal",
                    label: "רגיל",
                    size: "Aa",
                    cls: "text-base",
                    desc: "ברירת מחדל",
                  },
                  {
                    value: "large",
                    label: "גדול",
                    size: "Aa",
                    cls: "text-xl",
                    desc: "לקריאה נוחה",
                  },
                ].map((item) => (
                  <label
                    key={item.value}
                    className={`
                      relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md
                      ${fontSize === item.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:bg-muted/30"}
                    `}
                  >
                    <RadioGroupItem value={item.value} className="sr-only" />
                    <span
                      className={`font-black font-sans text-foreground mb-1 block ${item.cls}`}
                    >
                      {item.size}
                    </span>
                    <span className="text-sm font-bold block">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {item.desc}
                    </span>

                    {fontSize === item.value && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-in zoom-in" />
                    )}
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Area */}
        <div className="space-y-6">
          {/* Accent Color */}
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Palette className="w-4 h-4 text-primary" />
                ערכת נושא
              </CardTitle>
              <CardDescription className="text-xs">
                בחר את הצבע הראשי של המערכת
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "blue", label: "כחול משטרתי", hex: "#3b82f6" },
                  { id: "indigo", label: "סגול עמוק", hex: "#6366f1" },
                  { id: "emerald", label: "ירוק טבעי", hex: "#10b981" },
                  { id: "rose", label: "אדום חם", hex: "#f43f5e" },
                  { id: "amber", label: "כתום שמש", hex: "#f59e0b" },
                ].map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setAccentColor(color.id as any)}
                    className={`
                      relative w-full p-2 rounded-xl flex items-center gap-3 transition-all duration-200 border
                      ${
                        accentColor === color.id
                          ? "bg-muted border-primary/30 shadow-sm ring-1 ring-primary/20"
                          : "border-transparent hover:bg-muted/50 hover:border-border"
                      }
                    `}
                  >
                    <div
                      className="w-10 h-10 rounded-lg shadow-sm flex items-center justify-center transition-transform duration-300"
                      style={{ backgroundColor: color.hex }}
                    >
                      {accentColor === color.id && (
                        <Check className="w-5 h-5 text-white animate-in zoom-in" />
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm block text-foreground">
                        {color.label}
                      </span>
                    </div>
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
