import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings as SettingsIcon,
  Palette,
  ShieldCheck,
  Bell,
  Monitor,
  Check,
  Camera,
  LogOut,
  ChevronLeft,
  Loader2,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const {
    theme,
    toggleTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
  } = useTheme();

  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data } = await apiClient.put("/auth/update-profile", formData);
      if (data.success) {
        toast.success("הפרופיל עודכן בהצלחה", {
          description: "השינויים נשמרו במערכת",
        });
      } else {
        toast.error("שגיאה בעדכון הפרופיל", {
          description: data.error,
        });
      }
    } catch (err: any) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = () => {
    toast.info("העלאת תמונה", {
      description: "פיצ'ר זה יהיה זמין בגרסה הבאה של המערכת",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
          <span>ניהול מערכת</span>
          <ChevronLeft className="w-3 h-3 rotate-180" />
          <span className="text-primary transition-colors">הגדרות</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 dark:from-slate-800 dark:to-slate-900 dark:border-slate-800 flex items-center justify-center shadow-sm">
              <SettingsIcon className="w-7 h-7 text-slate-600 dark:text-slate-400" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">
                הגדרות מערכת
              </h1>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-none">
                ניהול העדפות אישיות, מראה הממשק ואבטחה
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden border-0 ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="p-4 space-y-1">
              <NavItem
                icon={User}
                label="פרופיל אישי"
                active={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              />
              <NavItem
                icon={Palette}
                label="מראה ותצוגה"
                active={activeTab === "appearance"}
                onClick={() => setActiveTab("appearance")}
              />
              <NavItem
                icon={ShieldCheck}
                label="אבטחה ופרטיות"
                active={activeTab === "security"}
                onClick={() => setActiveTab("security")}
              />
              <NavItem
                icon={Bell}
                label="התראות"
                active={activeTab === "notifications"}
                onClick={() => setActiveTab("notifications")}
              />
            </div>
            <div className="mt-4 p-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold gap-3 rounded-xl transition-all h-11"
              >
                <LogOut className="w-4 h-4" />
                התנתק מהמערכת
              </Button>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-9">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-black text-right">
                    פרופיל שוטר
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-right">
                    עדכן את פרטי הקשר והפרופיל האישי שלך
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Profile Image Section */}
                  <div className="flex flex-col sm:flex-row-reverse items-center gap-8 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700">
                        <span className="text-4xl font-black text-slate-300 dark:text-slate-600">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </span>
                      </div>
                      <button
                        onClick={handleImageUpload}
                        className="absolute -bottom-2 -left-2 p-2.5 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center sm:text-right space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                        {user?.first_name} {user?.last_name}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center sm:justify-start flex-row-reverse gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase">
                          {user?.personal_number}
                        </span>
                        <span>
                          מפקד{" "}
                          {user?.commands_team_id
                            ? "חולייה"
                            : user?.commands_section_id
                              ? "מדור"
                              : "יחידה"}
                        </span>
                      </p>
                      <div className="pt-2 flex flex-wrap justify-center sm:justify-start flex-row-reverse gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-lg border-primary/20 dark:border-primary/30 text-primary font-bold transition-colors"
                        >
                          פעיל
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-emerald-100 dark:border-emerald-900 text-emerald-600 font-bold"
                        >
                          מאומת
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-right">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-slate-700 dark:text-slate-300">
                        שם פרטי
                      </Label>
                      <Input
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-slate-700 dark:text-slate-300">
                        שם משפחה
                      </Label>
                      <Input
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-slate-700 dark:text-slate-300">
                        מספר טלפון
                      </Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone_number: e.target.value,
                          })
                        }
                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-slate-700 dark:text-slate-300">
                        מספר אישי (נעול)
                      </Label>
                      <div className="relative">
                        <Input
                          value={user?.personal_number || ""}
                          readOnly
                          className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border-0 font-black opacity-70 pr-10"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-start pt-6">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:opacity-90 text-white px-10 h-12 rounded-xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          שומר...
                        </>
                      ) : (
                        "שמור שינויים"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-right">
                    מראה ותצוגה
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-right">
                    התאם אישית את הממשק והעיצוב של המערכת
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-10">
                  {/* Theme Mode */}
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-800 dark:text-white block text-right">
                      מצב תצוגה
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => theme === "dark" && toggleTheme()}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === "light" ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        <div className="w-full aspect-[2/1] rounded-xl bg-white shadow-inner border border-slate-100 flex items-center justify-center">
                          <Monitor className="w-10 h-10 text-slate-300" />
                        </div>
                        <span className="font-black text-sm">יום (Light)</span>
                      </button>
                      <button
                        onClick={() => theme === "light" && toggleTheme()}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === "dark" ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        <div className="w-full aspect-[2/1] rounded-xl bg-slate-900 shadow-inner border border-slate-800 flex items-center justify-center">
                          <Monitor className="w-10 h-10 text-slate-700" />
                        </div>
                        <span className="font-black text-sm">לילה (Dark)</span>
                      </button>
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-800 dark:text-white block text-right">
                      ערכת נושא (Accent Color)
                    </Label>
                    <div className="flex flex-wrap flex-row-reverse gap-4">
                      {["blue", "indigo", "emerald", "rose", "amber"].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setAccentColor(color as any)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${accentColor === color ? "ring-4 ring-offset-4 ring-slate-200 dark:ring-slate-700 shadow-lg" : "opacity-80 hover:opacity-100"}`}
                            style={{ backgroundColor: getHexColor(color) }}
                          >
                            {accentColor === color && (
                              <Check className="w-7 h-7 text-white" />
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="space-y-4">
                    <Label className="text-sm font-black text-slate-800 dark:text-white block text-right">
                      גודל טקסט
                    </Label>
                    <RadioGroup
                      value={fontSize}
                      onValueChange={(val) => setFontSize(val as any)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "small" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        <RadioGroupItem value="small" className="sr-only" />
                        <span className="text-xs font-black font-sans">Aa</span>
                        <span className="text-xs font-black">קטן</span>
                      </label>
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "normal" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        <RadioGroupItem value="normal" className="sr-only" />
                        <span className="text-base font-black font-sans">
                          Aa
                        </span>
                        <span className="text-xs font-black">רגיל</span>
                      </label>
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "large" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"}`}
                      >
                        <RadioGroupItem value="large" className="sr-only" />
                        <span className="text-xl font-black font-sans">Aa</span>
                        <span className="text-xs font-black">גדול</span>
                      </label>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-black">
                    אבטחה ופרטיות
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">
                    נהל את אמצעי האבטחה של חשבונך
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex flex-row-reverse items-start gap-4 text-right transition-colors">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <ShieldCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-base font-black text-amber-900 dark:text-amber-400 text-right">
                        החלפת סיסמה תקופתית
                      </h4>
                      <p className="text-sm text-amber-700/80 dark:text-amber-500/80 font-bold leading-relaxed text-right">
                        חלפו 45 ימים מאז החלפת הסיסמה האחרונה. מומלץ לעדכן את
                        הסיסמה לשיפור אבטחת הנתונים.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <div
                      onClick={() => navigate("/change-password")}
                      className="flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-900 group hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <button className="text-xs font-black text-primary hover:underline transition-colors">
                        עדכן כעת
                      </button>
                      <div className="text-right">
                        <h5 className="text-base font-black text-slate-800 dark:text-white">
                          סיסמת כניסה
                        </h5>
                        <p className="text-sm text-slate-400 font-bold">
                          החלף את סיסמת הגישה למערכת
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-900 group">
                      <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative p-1 cursor-not-allowed opacity-50">
                        <div className="w-4 h-4 bg-white rounded-full transition-all"></div>
                      </div>
                      <div className="text-right">
                        <h5 className="text-base font-black text-slate-800 dark:text-white">
                          אימות דו-שלבי
                        </h5>
                        <p className="text-sm text-slate-400 font-bold">
                          פיצ'ר זה אינו פעיל כרגע בארגון
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl font-black">
                    התראות ודיווחים
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">
                    הגדר מה ומתי ברצונך לקבל עדכונים
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4 opacity-50">
                  <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Bell className="w-10 h-10 text-slate-300" />
                  </div>
                  <p className="text-sm font-black text-slate-500">
                    מרכז ההתראות בבניה...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center flex-row-reverse gap-4 p-4 rounded-2xl transition-all duration-300 font-black text-sm
        ${
          active
            ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
            : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
        }
      `}
    >
      <Icon className={`w-5 h-5 ${active ? "text-white" : "text-slate-400"}`} />
      <span className="flex-1 text-right">{label}</span>
      {active && (
        <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm shadow-white" />
      )}
    </button>
  );
}

function getHexColor(color: string) {
  switch (color) {
    case "blue":
      return "#0074ff";
    case "indigo":
      return "#6366f1";
    case "emerald":
      return "#10b981";
    case "rose":
      return "#f43f5e";
    case "amber":
      return "#f59e0b";
    default:
      return "#0074ff";
  }
}
