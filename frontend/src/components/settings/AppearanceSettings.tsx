import { Palette, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getHexColor } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

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
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      {/* Header Card */}
      <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
        <div className="bg-muted/30 p-6 border-b border-border">
          <div className="flex items-center gap-4 text-right">
            <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm shrink-0">
              <Palette className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">
                מראה ותצוגה
              </h3>
              <p className="text-sm font-medium text-muted-foreground mt-0.5">
                התאם אישית את הממשק והעיצוב של המערכת
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 md:p-8 space-y-12">
          {/* Top Section: Display & Colors */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Theme Mode (Right Side in RTL - Widest) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-base font-black text-foreground block">
                  מצב תצוגה
                </Label>
                <p className="text-xs text-muted-foreground">
                  בחר בין מצב בהיר למצב כהה עבור נוחות הקריאה שלך
                </p>
              </div>
              <ThemeToggle
                theme={theme}
                setTheme={setTheme}
                showLabels={true}
                className="w-full h-14 bg-muted/30 border-border/50 shadow-sm"
              />
            </div>

            {/* Accent Color (Left Side in RTL - Compacters) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-base font-black text-foreground block">
                  ערכת נושא
                </Label>
                <p className="text-xs text-muted-foreground">
                  בחר את צבע המדגיש הראשי של המערכת
                </p>
              </div>
              <div className="grid grid-cols-5 gap-3 w-full min-w-0">
                {["blue", "indigo", "emerald", "rose", "amber"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setAccentColor(color as any)}
                    className={`h-14 w-full rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
                      accentColor === color
                        ? "ring-4 ring-offset-2 ring-primary/20 shadow-lg scale-105"
                        : "opacity-70 hover:opacity-100 hover:shadow-md"
                    }`}
                    style={{ backgroundColor: getHexColor(color) }}
                    title={color}
                  >
                    {accentColor === color && (
                      <Check className="w-6 h-6 text-white animate-in zoom-in duration-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Bottom Section: Font Size */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className="text-base font-black text-foreground">
                גודל טקסט
              </Label>
              <p className="text-xs text-muted-foreground">
                התאם את גודל הגופן לצרכים שלך
              </p>
            </div>

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
                  desc: "דחוס וקומפקטי",
                  cls: "text-sm",
                },
                {
                  value: "normal",
                  label: "רגיל",
                  size: "Aa",
                  desc: "מומלץ לרוב המשתמשים",
                  cls: "text-base",
                },
                {
                  value: "large",
                  label: "גדול",
                  size: "Aa",
                  desc: "קריאות מקסימלית",
                  cls: "text-xl",
                },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                    fontSize === item.value
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                      : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <RadioGroupItem value={item.value} className="sr-only" />
                  <span
                    className={`font-black font-sans text-foreground ${item.cls}`}
                  >
                    {item.size}
                  </span>
                  <div className="text-center space-y-0.5">
                    <span className="block text-sm font-bold text-foreground">
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {item.desc}
                    </span>
                  </div>
                  {fontSize === item.value && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-in zoom-in" />
                  )}
                </label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
