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
  Loader2,
  Lock,
  Database,
  Download,
  Upload,
  FolderOpen,
  RefreshCw,
  MapPin,
  Clock,
  Cake,
  PhoneForwarded,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

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
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Backup Config State
  const [backupConfig, setBackupConfig] = useState({
    enabled: false,
    interval_hours: 24,
    last_backup: null
  });

  useEffect(() => {
    if (activeTab === "backup" && user?.is_admin) {
      apiClient.get("/admin/backup/config")
        .then(res => setBackupConfig(res.data))
        .catch(err => console.error("Failed to load backup config", err));
    }
  }, [activeTab, user]);

  const updateBackupConfig = async (key: string, value: any) => {
    const newConfig = { ...backupConfig, [key]: value };
    setBackupConfig(newConfig);
    try {
      await apiClient.post("/admin/backup/config", newConfig);
      toast.success("הגדרות הגיבוי עודכנו");
    } catch {
      toast.error("שגיאה בשמירת הגדרות");
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await apiClient.get("/admin/backup", {
        responseType: "blob",
      });

      // יצירת לינק להורדה
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `mishmarot_backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("הגיבוי הושלם בהצלחה");
    } catch (err) {
      toast.error("שגיאה בביצוע הגיבוי");
      console.error(err);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm("האם אתה בטוח שברצונך לשחזר נתונים? פעולה זו תדרוס את כל המידע הקיים!")) {
      event.target.value = ""; // איפוס הקלט
      return;
    }

    setIsRestoring(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiClient.post("/admin/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("הנתונים שוחזרו בהצלחה", {
        description: "רענן את הדף כדי לראות את השינויים"
      });
      // רענון אוטומטי של הדף לאחר השחזור
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      toast.error("שגיאה בשחזור הנתונים");
      console.error(err);
    } finally {
      setIsRestoring(false);
      event.target.value = "";
    }
  };

  // Profile form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    city: "",
    birth_date: "",
    emergency_contact: "",
    notif_sick_leave: true,
    notif_transfers: true,
  });

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        city: user.city || "",
        birth_date: user.birth_date || "",
        emergency_contact: user.emergency_contact || "",
        notif_sick_leave: user.notif_sick_leave !== false,
        notif_transfers: user.notif_transfers !== false,
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data } = await apiClient.put("/auth/update-profile", formData);
      if (data.success) {
        toast.success("ההגדרות עודכנו בהצלחה", {
          description: "השינויים נשמרו במערכת",
        });
      } else {
        toast.error("שגיאה בעדכון ההגדרות", {
          description: data.error,
        });
      }
    } catch (err: any) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data } = await apiClient.post("/auth/change-password", {
        new_password: passwordData.new_password
      });
      if (data.success) {
        toast.success("הסיסמה עודכנה בהצלחה");
        setPasswordData({ new_password: "", confirm_password: "" });
      } else {
        toast.error(data.error || "שגיאה בעדכון הסיסמה");
      }
    } catch (err) {
      toast.error("שגיאה בתקשורת עם השרת");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = () => {
    toast.info("העלאת תמונה", {
      description: "פיצ'ר זה יהיה זמין בגרסה הבאה של המערכת",
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        icon={SettingsIcon}
        title="הגדרות מערכת"
        subtitle="ניהול העדפות אישיות, מראה הממשק ואבטחה"
        category="הגדרות"
        categoryLink="/settings"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-border shadow-sm overflow-hidden border-0 ring-1 ring-border bg-card">
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
              {user?.is_admin && (
                <NavItem
                  icon={Database}
                  label="גיבוי ושחזור"
                  active={activeTab === "backup"}
                  onClick={() => setActiveTab("backup")}
                />
              )}
            </div>
            <div className="mt-4 p-4 border-t border-border">
              <Button
                variant="ghost"
                onClick={logout}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-3 rounded-xl transition-all h-11"
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
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
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
                  <div className="flex flex-col sm:flex-row items-center gap-8 py-4 border-b border-border">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-xl ring-1 ring-border">
                        <span className="text-4xl font-black text-muted-foreground/40">
                          {user?.first_name?.[0]}
                          {user?.last_name?.[0]}
                        </span>
                      </div>
                      <button
                        onClick={handleImageUpload}
                        className="absolute -bottom-2 -left-2 p-2.5 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-center sm:text-right space-y-2">
                      <h3 className="text-2xl font-black text-foreground">
                        {user?.first_name} {user?.last_name}
                      </h3>
                      <p className="text-muted-foreground font-bold flex items-center justify-center sm:justify-start gap-2 text-right">
                        <span className="bg-muted px-2 py-0.5 rounded text-[10px] uppercase">
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
                      <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-lg border-primary/20 text-primary font-bold transition-colors"
                        >
                          פעיל
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-lg border-emerald-100 text-emerald-600 font-bold"
                        >
                          מאומת
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Personal Info Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-right">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
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
                        className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
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
                        className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
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
                        className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
                        עיר מגורים
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              city: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary pr-10"
                        />
                        <MapPin className="w-4 h-4 text-muted-foreground/40 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
                        תאריך לידה
                      </Label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={formData.birth_date ? formData.birth_date.split("T")[0] : ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              birth_date: e.target.value,
                            })
                          }
                          className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary pr-10"
                        />
                        <Cake className="w-4 h-4 text-muted-foreground/40 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
                        איש קשר לחירום
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.emergency_contact}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              emergency_contact: e.target.value,
                            })
                          }
                          placeholder="שם וטלפון..."
                          className="h-12 rounded-xl bg-muted/50 border-0 font-bold focus-visible:ring-2 focus-visible:ring-primary pr-10"
                        />
                        <PhoneForwarded className="w-4 h-4 text-muted-foreground/40 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-sm font-black text-muted-foreground/80">
                        מספר אישי (נעול)
                      </Label>
                      <div className="relative">
                        <Input
                          value={user?.personal_number || ""}
                          readOnly
                          className="h-12 rounded-xl bg-muted border-0 font-black opacity-70 pr-10"
                        />
                        <Lock className="w-4 h-4 text-muted-foreground/50 absolute right-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Organizational Info (Read-only) */}
                  <div className="pt-8 border-t border-border">
                    <h4 className="text-sm font-black text-foreground mb-6 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-primary" />
                      שיוך ארגוני (לקריאה בלבד)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <InfoBlock label="מחלקה" value={user?.department_name || "-"} />
                      <InfoBlock label="מדור" value={user?.section_name || "-"} />
                      <InfoBlock label="חולייה" value={user?.team_name || "-"} />
                      <InfoBlock label="תפקיד" value={user?.role_name || "-"} />
                      <InfoBlock label="סוג שירות" value={user?.service_type_name || "-"} />
                    </div>
                  </div>

                  <div className="flex justify-start pt-6">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
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
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
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
                    <Label className="text-sm font-black text-foreground block text-right">
                      מצב תצוגה
                    </Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => theme === "dark" && toggleTheme()}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === "light" ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-border hover:border-border/80"}`}
                      >
                        <div className="w-full aspect-[2/1] rounded-xl bg-background shadow-inner border border-border flex items-center justify-center">
                          <Monitor className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <span className="font-black text-sm">יום (Light)</span>
                      </button>
                      <button
                        onClick={() => theme === "light" && toggleTheme()}
                        className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-4 ${theme === "dark" ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border hover:border-border/80"}`}
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
                    <Label className="text-sm font-black text-foreground block text-right">
                      ערכת נושא (Accent Color)
                    </Label>
                    <div className="flex flex-wrap gap-4">
                      {["blue", "indigo", "emerald", "rose", "amber"].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() => setAccentColor(color as any)}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${accentColor === color ? "ring-4 ring-offset-4 ring-border shadow-lg" : "opacity-80 hover:opacity-100"}`}
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
                    <Label className="text-sm font-black text-foreground block text-right">
                      גודל טקסט
                    </Label>
                    <RadioGroup
                      value={fontSize}
                      onValueChange={(val) => setFontSize(val as any)}
                      className="grid grid-cols-3 gap-4"
                    >
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "small" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                      >
                        <RadioGroupItem value="small" className="sr-only" />
                        <span className="text-xs font-black font-sans">Aa</span>
                        <span className="text-xs font-black">קטן</span>
                      </label>
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "normal" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                      >
                        <RadioGroupItem value="normal" className="sr-only" />
                        <span className="text-base font-black font-sans">
                          Aa
                        </span>
                        <span className="text-xs font-black">רגיל</span>
                      </label>
                      <label
                        className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-2 cursor-pointer transition-all ${fontSize === "large" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
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
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-black">
                    אבטחה ופרטיות
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">
                    נהל את אמצעי האבטחה של חשבונך
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-4 text-right transition-colors">
                    <div className="p-2.5 rounded-xl bg-amber-500/20">
                      <ShieldCheck className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-base font-black text-amber-700 text-right">
                        החלפת סיסמה תקופתית
                      </h4>
                      <p className="text-sm text-amber-700/80 font-bold leading-relaxed text-right">
                        חלפו 45 ימים מאז החלפת הסיסמה האחרונה. מומלץ לעדכן את
                        הסיסמה לשיפור אבטחת הנתונים.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-6">
                    <div className="space-y-4 p-6 rounded-2xl border-2 border-muted bg-muted/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-right">
                          <h5 className="text-base font-black text-foreground flex items-center gap-2 justify-end">
                            החלפת סיסמה
                            <KeyRound className="w-4 h-4 text-primary" />
                          </h5>
                          <p className="text-xs text-muted-foreground font-bold">
                            הגדר סיסמה חדשה לכניסה למערכת
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">סיסמה חדשה</Label>
                          <div className="relative">
                            <Input
                              type={showPasswords ? "text" : "password"}
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                              className="h-11 rounded-xl bg-background border-border font-bold pr-4"
                              placeholder="לפחות 6 תווים"
                            />
                            <button
                              onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                            >
                              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">אימות סיסמה</Label>
                          <Input
                            type={showPasswords ? "text" : "password"}
                            value={passwordData.confirm_password}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                            className="h-11 rounded-xl bg-background border-border font-bold"
                            placeholder="הקלד שוב..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-start pt-2">
                        <Button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword || !passwordData.new_password}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-8 rounded-xl font-bold shadow-md transition-all"
                        >
                          {isChangingPassword ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "עדכן סיסמה"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl border-2 border-muted group opacity-60">
                      <div className="w-12 h-6 bg-muted-foreground/20 rounded-full relative p-1 cursor-not-allowed">
                        <div className="w-4 h-4 bg-background rounded-full transition-all"></div>
                      </div>
                      <div className="text-right">
                        <h5 className="text-base font-black text-foreground">
                          אימות דו-שלבי
                        </h5>
                        <p className="text-sm text-muted-foreground font-bold">
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
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl font-black text-right">
                    התראות ודיווחים
                  </CardTitle>
                  <CardDescription className="text-sm font-medium text-right">
                    הגדר מה ומתי ברצונך לקבל עדכונים מהמערכת
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <NotifSetting
                      title="התראת מחלה ממושכת"
                      description="קבל התראה כאשר שוטר נמצא בסטטוס 'מחלה' מעל ל-4 ימים רצופים"
                      enabled={formData.notif_sick_leave}
                      onChange={(val: boolean) =>
                        setFormData({ ...formData, notif_sick_leave: val })
                      }
                    />
                    <NotifSetting
                      title="בקשות העברה חדשות"
                      description="קבל התראה כאשר שוטר מגיש בקשת העברה הממתינה לאישור המפקד"
                      enabled={formData.notif_transfers}
                      onChange={(val: boolean) =>
                        setFormData({ ...formData, notif_transfers: val })
                      }
                    />
                  </div>

                  <div className="flex justify-start pt-6 border-t border-border">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-11 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          שומר...
                        </>
                      ) : (
                        "שמור הגדרות התראה"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "backup" && user?.is_admin && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              {/* כותרת ראשית */}
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-right flex items-center gap-3 text-foreground">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Database className="w-6 h-6 text-primary" />
                    </div>
                    גיבוי ושחזור מערכת
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-right text-muted-foreground mt-1">
                    ניהול מערך הגיבויים האוטומטי ושחזור נתונים במקרי חירום
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                  {/* Automatic Backup Settings */}
                  <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                      <h4 className="text-lg font-black text-foreground">הגדרות אוטומציה</h4>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${backupConfig.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                          {backupConfig.enabled ? "גיבוי אוטומטי פעיל" : "גיבוי אוטומטי כבוי"}
                        </span>
                        <div className={`p-1.5 rounded-lg transition-colors ${backupConfig.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <RefreshCw className={`w-5 h-5 ${backupConfig.enabled ? 'animate-spin-slow' : ''}`} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Switch */}
                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                        <div className="text-right">
                          <span className="block font-bold text-foreground">הפעל גיבוי אוטומטי</span>
                          <span className="text-xs text-muted-foreground font-medium">המערכת תבצע גיבוי באופן עצמאי ברקע</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => updateBackupConfig("enabled", !backupConfig.enabled)}
                            className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${backupConfig.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${backupConfig.enabled ? 'right-1' : 'right-[calc(100%-28px)]'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Frequency Selector */}
                      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-opacity duration-300 ${!backupConfig.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[6, 12, 24].map((hours) => (
                          <button
                            key={hours}
                            onClick={() => updateBackupConfig("interval_hours", hours)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                        ${backupConfig.interval_hours === hours
                                ? "border-primary bg-primary/5 text-primary shadow-md"
                                : "border-border hover:border-border/80 bg-card"
                              }
                                    `}
                          >
                            <Clock className="w-6 h-6 opacity-80" />
                            <span className="font-bold">כל {hours} שעות</span>
                          </button>
                        ))}
                      </div>

                      {/* Backup Location Info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/60 font-medium mt-2 bg-muted/30 p-3 rounded-lg">
                        <FolderOpen className="w-4 h-4" />
                        <span>נשמר בתיקייה:</span>
                        <span dir="ltr">backend/backups/</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Manual Backup Section */}
                    <div className="bg-card p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm flex flex-col justify-between h-full">
                      <div className="text-right space-y-2 mb-6">
                        <h4 className="text-lg font-black text-foreground flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Download className="w-4 h-4 text-primary" />
                          </div>
                          ייצוא ידני
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          הורדה מיידית של קובץ הגיבוי למחשב האישי שלך.
                        </p>
                      </div>
                      <Button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                      >
                        {isBackingUp ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin ml-2" />
                            מעבד...
                          </>
                        ) : (
                          "הורד קובץ גיבוי"
                        )}
                      </Button>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
                      <div className="absolute top-0 right-0 w-1 h-full bg-destructive/10"></div>
                      <div className="text-right space-y-2 mb-6">
                        <h4 className="text-lg font-black text-foreground flex items-center gap-2">
                          <div className="p-1.5 bg-destructive/10 rounded-lg">
                            <Upload className="w-4 h-4 text-destructive" />
                          </div>
                          שחזור מגיבוי
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          דריסת כל הנתונים במערכת ושחזור מקובץ.
                          <span className="block text-destructive font-bold text-xs mt-1">פעולה בלתי הפיכה!</span>
                        </p>
                      </div>

                      <div className="w-full">
                        <input
                          type="file"
                          id="restore-file"
                          accept=".json"
                          className="hidden"
                          onChange={handleRestore}
                        />
                        <Button
                          onClick={() => document.getElementById("restore-file")?.click()}
                          disabled={isRestoring}
                          variant="outline"
                          className="w-full h-11 border-destructive/20 hover:bg-destructive/10 text-destructive rounded-xl font-bold active:scale-95 transition-all"
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin ml-2" />
                              משחזר נתונים...
                            </>
                          ) : (
                            "בחר קובץ לשחזור"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5 p-4 rounded-xl bg-muted/30 border border-border/50">
      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block text-right">
        {label}
      </span>
      <span className="text-sm font-bold text-foreground block text-right">
        {value}
      </span>
    </div>
  );
}

function NotifSetting({
  title,
  description,
  enabled,
  onChange,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      className={`
      flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group
      ${enabled ? "border-primary/20 bg-primary/5" : "border-border bg-card hover:border-border/80"}
    `}
      onClick={() => onChange(!enabled)}
    >
      <div className="text-right">
        <h5
          className={`text-base font-black transition-colors ${enabled ? "text-primary" : "text-foreground"}`}
        >
          {title}
        </h5>
        <p className="text-sm text-muted-foreground font-bold leading-tight mt-0.5">
          {description}
        </p>
      </div>

      <div
        className={`
        w-14 h-7 rounded-full relative p-1 transition-colors duration-300 flex-shrink-0
        ${enabled ? "bg-primary" : "bg-muted-foreground/20"}
      `}
      >
        <div
          className={`
          w-5 h-5 bg-background rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center
          ${enabled ? "-translate-x-7" : "translate-x-0"}
        `}
        >
          {enabled ? (
            <Check className="w-3 h-3 text-primary" />
          ) : (
            <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}

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
        w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-black text-sm
        ${active
          ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
    >
      <Icon className={`w-5 h-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
      <span className="flex-1 text-right">{label}</span>
      {active && (
        <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse shadow-sm shadow-primary-foreground" />
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
