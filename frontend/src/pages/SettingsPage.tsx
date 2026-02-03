import { useState, useEffect } from "react";

import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw,
  MapPin,
  Clock,
  Cake,
  PhoneForwarded,
  Briefcase,
  KeyRound,
  Eye,
  EyeOff,
  Calendar,
  FileText,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuthContext();
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
  const [isServerBackingUp, setIsServerBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Backup Config State
  const [backupConfig, setBackupConfig] = useState({
    enabled: false,
    interval_hours: 24,
    last_backup: null,
  });

  // System Settings State
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    if (activeTab === "notifications" && user?.is_admin) {
      apiClient
        .get("/admin/settings")
        .then((res) => setSystemSettings(res.data))
        .catch((err) => console.error("Failed to load system settings", err));
    }
  }, [activeTab, user]);

  const updateSystemSetting = async (key: string, value: any) => {
    // Optimistic update
    setSystemSettings((prev) => ({ ...prev, [key]: value }));
    try {
      await apiClient.post("/admin/settings", { key, value });
      toast.success("הגדרת מערכת עודכנה");
    } catch {
      toast.error("שגיאה בשמירת הגדרת מערכת");
    }
  };

  useEffect(() => {
    if (activeTab === "backup" && user?.is_admin) {
      apiClient
        .get("/admin/backup/config")
        .then((res) => setBackupConfig(res.data))
        .catch((err) => console.error("Failed to load backup config", err));
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

  const handleServerBackupNow = async () => {
    setIsServerBackingUp(true);
    try {
      const { data } = await apiClient.post("/admin/backup/now");
      if (data.success) {
        toast.success("גיבוי בוצע בהצלחה", {
          description: `נשמר בשם: ${data.file.split(/[\\/]/).pop()}`,
        });
        setBackupConfig((prev) => ({
          ...prev,
          last_backup: data.last_backup,
        }));
      }
    } catch (e) {
      toast.error("שגיאה בביצוע הגיבוי");
    } finally {
      setIsServerBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        "האם אתה בטוח שברצונך לשחזר נתונים? פעולה זו תדרוס את כל המידע הקיים!",
      )
    ) {
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
        description: "רענן את הדף כדי לראות את השינויים",
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

    // New fields
    national_id: "",
    enlistment_date: "",
    discharge_date: "",
    assignment_date: "",
    police_license: false,
    security_clearance: false,
  });

  const [passwordData, setPasswordData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
        national_id: user.national_id || "",
        enlistment_date: user.enlistment_date || "",
        discharge_date: user.discharge_date || "",
        assignment_date: user.assignment_date || "",
        police_license: !!user.police_license,
        security_clearance: !!user.security_clearance,
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        security_clearance: formData.security_clearance,
        national_id: formData.national_id || null,
        birth_date: formData.birth_date || null,
        enlistment_date: formData.enlistment_date || null,
        discharge_date: formData.discharge_date || null,
        assignment_date: formData.assignment_date || null,
      };
      const { data } = await apiClient.put("/auth/update-profile", payload);
      if (data.success) {
        await refreshUser();
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
        new_password: passwordData.new_password,
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

  const handleResetImpersonatedPassword = async () => {
    if (
      !confirm(
        "האם אתה בטוח שברצונך לאפס את הסיסמה של המשתמש לתעודת הזהות שלו?",
      )
    )
      return;

    try {
      setIsResetting(true);
      const response = await apiClient.post(
        "/auth/reset-impersonated-password",
      );
      if (response.status === 200) {
        toast.success("הסיסמה אופסה בהצלחה לתעודת הזהות של המשתמש");
      }
    } catch (error) {
      console.error(error);
      toast.error("שגיאה באיפוס הסיסמה");
    } finally {
      setIsResetting(false);
    }
  };

  const handleImageUpload = () => {
    toast.info("העלאת תמונה", {
      description: "פיצ'ר זה יהיה זמין בגרסה הבאה של המערכת",
    });
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        icon={SettingsIcon}
        title="הגדרות מערכת"
        subtitle="ניהול העדפות אישיות, מראה הממשק ואבטחה"
        category="הגדרות"
        categoryLink="/settings"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Sidebar / Navigation */}
        <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 lg:sticky lg:top-24 space-y-4">
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
                onClick={() => logout()}
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 font-bold gap-3 rounded-xl transition-all h-11"
              >
                <LogOut className="w-4 h-4" />
                התנתק מהמערכת
              </Button>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
                <div className="bg-muted/30 p-6 border-b border-border flex flex-col sm:flex-row items-center gap-6">
                  {/* Compact Header Section */}
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-background flex items-center justify-center overflow-hidden border-2 border-border shadow-sm">
                      <span className="text-2xl font-black text-muted-foreground/40">
                        {user?.first_name?.[0]}
                        {user?.last_name?.[0]}
                      </span>
                    </div>
                    <button
                      onClick={handleImageUpload}
                      className="absolute -bottom-1 -left-1 p-1.5 bg-primary text-primary-foreground rounded-lg shadow-md hover:scale-110 active:scale-95 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 text-center sm:text-right space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <h3 className="text-xl font-black text-foreground">
                        {user?.first_name} {user?.last_name}
                      </h3>
                      <div className="flex gap-1.5">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary border-0 font-bold text-[10px] px-2 h-5"
                        >
                          פעיל
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground flex items-center justify-center sm:justify-start gap-3">
                      <span className="bg-background px-2 py-0.5 rounded border border-border/50 text-[10px] font-bold uppercase tracking-wider">
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
                  </div>

                  <div className="shrink-0">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-9 rounded-lg font-bold shadow-sm transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin ml-2" />
                          שומר...
                        </>
                      ) : (
                        "שמור שינויים"
                      )}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* Personal Info Form */}
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      פרטים אישיים
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-right">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
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
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
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
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          ת.ז (מספר זהות)
                        </Label>
                        <div className="relative">
                          <Input
                            value={formData.national_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                national_id: e.target.value,
                              })
                            }
                            className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm pr-9"
                          />
                          <FileText className="w-3.5 h-3.5 text-muted-foreground/40 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          תאריך לידה
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={
                              formData.birth_date
                                ? formData.birth_date.split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                birth_date: e.target.value,
                              })
                            }
                            className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm pr-9"
                          />
                          <Cake className="w-3.5 h-3.5 text-muted-foreground/40 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          מספר אישי (נעול)
                        </Label>
                        <div className="relative">
                          <Input
                            value={user?.personal_number || ""}
                            readOnly
                            className="h-9 rounded-lg bg-muted border-0 font-black opacity-60 text-sm pr-9"
                          />
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/50 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Dates */}
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      תאריכי שירות
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-right">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          תאריך גיוס
                        </Label>
                        <Input
                          type="date"
                          value={
                            formData.enlistment_date
                              ? formData.enlistment_date.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              enlistment_date: e.target.value,
                            })
                          }
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          תאריך כניסה לתפקיד
                        </Label>
                        <Input
                          type="date"
                          value={
                            formData.assignment_date
                              ? formData.assignment_date.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              assignment_date: e.target.value,
                            })
                          }
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          תאריך שחרור צפוי
                        </Label>
                        <Input
                          type="date"
                          value={
                            formData.discharge_date
                              ? formData.discharge_date.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              discharge_date: e.target.value,
                            })
                          }
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" />
                      כישורים והרשאות
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-right items-end">
                      <div className="flex items-center gap-3 h-9 bg-muted/30 border border-border/50 px-3 rounded-lg">
                        <Checkbox
                          checked={formData.security_clearance}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              security_clearance: checked as boolean,
                            })
                          }
                          id="security_clearance"
                        />
                        <Label
                          htmlFor="security_clearance"
                          className="text-sm font-bold text-foreground cursor-pointer"
                        >
                          סיווג ביטחוני
                        </Label>
                      </div>

                      <div className="flex items-center gap-3 h-9 bg-muted/30 border border-border/50 px-3 rounded-lg">
                        <Checkbox
                          checked={formData.police_license}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              police_license: checked as boolean,
                            })
                          }
                          id="police_license"
                        />
                        <Label
                          htmlFor="police_license"
                          className="text-sm font-bold text-foreground cursor-pointer"
                        >
                          רישיון משטרתי
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h4 className="text-xs font-black text-muted-foreground/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      פרטי התקשרות
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 text-right">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
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
                          className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">
                          עיר מגורים
                        </Label>
                        <div className="relative">
                          <Input
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                            className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm pr-9"
                          />
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/40 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
                        <Label className="text-xs font-bold text-foreground">
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
                            className="h-9 rounded-lg bg-muted/30 border-border/50 font-medium focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all text-sm pr-9"
                          />
                          <PhoneForwarded className="w-3.5 h-3.5 text-muted-foreground/40 absolute right-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organizational Info (Read-only) */}
                  <div className="pt-2">
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-primary" />
                        שיוך ארגוני (לקריאה בלבד)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <InfoBlock
                          label="מחלקה"
                          value={user?.department_name || "-"}
                          compact
                        />
                        <InfoBlock
                          label="מדור"
                          value={user?.section_name || "-"}
                          compact
                        />
                        <InfoBlock
                          label="חולייה"
                          value={user?.team_name || "-"}
                          compact
                        />
                        <InfoBlock
                          label="תפקיד"
                          value={user?.role_name || "-"}
                          compact
                        />
                        <InfoBlock
                          label="סוג שירות"
                          value={user?.service_type_name || "-"}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
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

                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {/* Theme Mode */}
                    <div className="space-y-4">
                      <Label className="text-sm font-black text-foreground block text-right flex items-center gap-2 justify-end">
                        מצב תצוגה
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => theme === "dark" && toggleTheme()}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === "light" ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-border hover:border-border/80"}`}
                        >
                          <div className="w-full aspect-[16/9] rounded-lg bg-background shadow-sm border border-border flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-muted-foreground/30" />
                          </div>
                          <span className="font-black text-xs">
                            יום (Light)
                          </span>
                        </button>
                        <button
                          onClick={() => theme === "light" && toggleTheme()}
                          className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${theme === "dark" ? "border-primary bg-primary/10 shadow-md shadow-primary/10" : "border-border hover:border-border/80"}`}
                        >
                          <div className="w-full aspect-[16/9] rounded-lg bg-slate-900 shadow-sm border border-slate-800 flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-slate-700" />
                          </div>
                          <span className="font-black text-xs">
                            לילה (Dark)
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Accent Color */}
                      <div className="space-y-4">
                        <Label className="text-sm font-black text-foreground block text-right flex items-center gap-2 justify-end">
                          ערכת נושא
                          <Palette className="w-4 h-4 text-muted-foreground" />
                        </Label>
                        <div className="flex flex-wrap justify-end gap-3">
                          {["blue", "indigo", "emerald", "rose", "amber"].map(
                            (color) => (
                              <button
                                key={color}
                                onClick={() => setAccentColor(color as any)}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${accentColor === color ? "ring-2 ring-offset-2 ring-border shadow" : "opacity-80 hover:opacity-100"}`}
                                style={{ backgroundColor: getHexColor(color) }}
                              >
                                {accentColor === color && (
                                  <Check className="w-5 h-5 text-white" />
                                )}
                              </button>
                            ),
                          )}
                        </div>
                      </div>

                      {/* Font Size */}
                      <div className="space-y-4">
                        <Label className="text-sm font-black text-foreground block text-right flex items-center gap-2 justify-end">
                          גודל טקסט
                          <div className="text-xs font-sans font-black bg-muted px-1.5 rounded">
                            Aa
                          </div>
                        </Label>
                        <RadioGroup
                          value={fontSize}
                          onValueChange={(val) => setFontSize(val as any)}
                          className="grid grid-cols-3 gap-3"
                        >
                          <label
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${fontSize === "small" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                          >
                            <RadioGroupItem value="small" className="sr-only" />
                            <span className="text-xs font-black font-sans">
                              Aa
                            </span>
                            <span className="text-[10px] font-black">קטן</span>
                          </label>
                          <label
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${fontSize === "normal" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                          >
                            <RadioGroupItem
                              value="normal"
                              className="sr-only"
                            />
                            <span className="text-sm font-black font-sans">
                              Aa
                            </span>
                            <span className="text-[10px] font-black">רגיל</span>
                          </label>
                          <label
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${fontSize === "large" ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}
                          >
                            <RadioGroupItem value="large" className="sr-only" />
                            <span className="text-base font-black font-sans">
                              Aa
                            </span>
                            <span className="text-[10px] font-black">גדול</span>
                          </label>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
                <div className="bg-muted/30 p-6 border-b border-border">
                  <div className="flex items-center gap-4 text-right">
                    <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm shrink-0">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground">
                        אבטחה ופרטיות
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        נהל את אמצעי האבטחה של חשבונך
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 md:p-8">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Password Change Column */}
                    <div className="space-y-4 p-6 rounded-2xl border border-muted bg-muted/20 h-fit">
                      <div className="text-right mb-2">
                        <h5 className="text-base font-black text-foreground flex items-center gap-2 justify-end">
                          החלפת סיסמה
                          <KeyRound className="w-4 h-4 text-primary" />
                        </h5>
                        <p className="text-xs text-muted-foreground font-bold">
                          הגדר סיסמה חדשה לכניסה למערכת
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">
                            סיסמה חדשה
                          </Label>
                          <div className="relative">
                            <Input
                              type={showPasswords ? "text" : "password"}
                              value={passwordData.new_password}
                              onChange={(e) =>
                                setPasswordData({
                                  ...passwordData,
                                  new_password: e.target.value,
                                })
                              }
                              className="h-10 rounded-lg bg-background border-border font-bold pr-4 text-sm"
                              placeholder="לפחות 6 תווים"
                            />
                            <button
                              onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-primary transition-colors"
                            >
                              {showPasswords ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">
                            אימות סיסמה
                          </Label>
                          <Input
                            type={showPasswords ? "text" : "password"}
                            value={passwordData.confirm_password}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirm_password: e.target.value,
                              })
                            }
                            className="h-10 rounded-lg bg-background border-border font-bold text-sm"
                            placeholder="הקלד שוב..."
                          />
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={handleChangePassword}
                            disabled={
                              isChangingPassword || !passwordData.new_password
                            }
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-xl font-bold shadow-md transition-all active:scale-95"
                          >
                            {isChangingPassword ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "עדכן סיסמה"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Alerts Column */}
                    <div className="space-y-4 flex flex-col">
                      {user?.is_impersonated && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-right transition-colors">
                          <div className="p-2 rounded-lg bg-destructive/20 shrink-0">
                            <Lock className="w-4 h-4 text-destructive" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="text-sm font-black text-destructive text-right">
                                איפוס סיסמה למשתמש
                              </h4>
                              <p className="text-xs text-destructive/80 font-bold leading-relaxed text-right mt-1">
                                במצב התחזות באפשרותך לאפס את סיסמת המשתמש לתעודת
                                הזהות שלו.
                              </p>
                            </div>
                            <Button
                              onClick={handleResetImpersonatedPassword}
                              disabled={isResetting}
                              variant="destructive"
                              size="sm"
                              className="font-bold shadow-sm h-8 w-full"
                            >
                              {isResetting ? (
                                <Loader2 className="w-3 h-3 animate-spin ml-2" />
                              ) : (
                                <RefreshCw className="w-3 h-3 ml-2" />
                              )}
                              אפס לת.ז.
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-right">
                        <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-amber-700 text-right">
                            החלפת סיסמה תקופתית
                          </h4>
                          <p className="text-xs text-amber-700/80 font-bold mt-0.5">
                            חלפו 45 ימים מאז החלפת הסיסמה האחרונה.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-xl border border-muted opacity-60">
                        <div className="w-10 h-5 bg-muted-foreground/20 rounded-full relative p-1 cursor-not-allowed shrink-0">
                          <div className="w-3 h-3 bg-background rounded-full transition-all"></div>
                        </div>
                        <div className="text-right flex-1">
                          <h5 className="text-sm font-black text-foreground">
                            אימות דו-שלבי (2FA)
                          </h5>
                          <p className="text-xs text-muted-foreground font-bold">
                            פיצ'ר זה אינו פעיל כרגע בארגון
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
                <div className="bg-muted/30 p-6 border-b border-border">
                  <div className="flex items-center gap-4 text-right">
                    <div className="p-2.5 bg-background rounded-xl border border-border/50 shadow-sm shrink-0">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground">
                        התראות ודיווחים
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">
                        הגדר מה ומתי ברצונך לקבל עדכונים מהמערכת
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 md:p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  {user?.is_admin && (
                    <div className="pt-6 border-t border-border">
                      <div className="mb-4">
                        <h4 className="text-sm font-black text-muted-foreground uppercase tracking-wider flex items-center justify-end gap-2">
                          הגדרות מערכת (מנהלים)
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <NotifSetting
                          title="התראות דיווח בסופ״ש"
                          description="שלח התראות על אי-דיווח בוקר גם בימי שישי ושבת"
                          enabled={
                            systemSettings.alerts_weekend_enabled === true
                          }
                          onChange={(val: boolean) =>
                            updateSystemSetting("alerts_weekend_enabled", val)
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-start">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-10 rounded-xl font-bold shadow-md shadow-primary/20 transition-all active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          שומר...
                        </>
                      ) : (
                        "שמור הגדרות"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "backup" && user?.is_admin && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 text-right">
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Automatic Backup Settings */}
                  <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/50 pb-4 mb-4 gap-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold text-sm ${backupConfig.enabled ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {backupConfig.enabled
                            ? "גיבוי אוטומטי פעיל"
                            : "גיבוי אוטומטי כבוי"}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg transition-colors ${backupConfig.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${backupConfig.enabled ? "animate-spin-slow" : ""}`}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleServerBackupNow}
                        disabled={isServerBackingUp}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground gap-2"
                      >
                        {isServerBackingUp ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Database className="w-3 h-3" />
                        )}
                        בצע גיבוי ידני
                      </Button>
                    </div>

                    <div className="space-y-6">
                      {/* Switch */}
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <span className="block font-bold text-sm text-foreground">
                            הפעל גיבוי אוטומטי
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            המערכת תבצע גיבוי באופן עצמאי ברקע
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() =>
                              updateBackupConfig(
                                "enabled",
                                !backupConfig.enabled,
                              )
                            }
                            className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${backupConfig.enabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform duration-300 ${backupConfig.enabled ? "right-1" : "right-[calc(100%-24px)]"}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Frequency Selector */}
                      <div
                        className={`grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity duration-300 ${!backupConfig.enabled ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {[6, 12, 24].map((hours) => (
                          <button
                            key={hours}
                            onClick={() =>
                              updateBackupConfig("interval_hours", hours)
                            }
                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all
                                        ${
                                          backupConfig.interval_hours === hours
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-border hover:border-border/80 bg-background"
                                        }
                                    `}
                          >
                            <Clock className="w-5 h-5 opacity-80" />
                            <span className="font-bold text-xs">
                              כל {hours} שעות
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Manual Backup Section */}
                    <div className="bg-card p-6 rounded-2xl border border-primary/20 bg-primary/5 shadow-sm flex flex-col justify-between h-full space-y-6">
                      <div className="text-right space-y-1">
                        <h4 className="text-base font-black text-foreground flex items-center gap-2">
                          <div className="p-1 bg-primary/10 rounded-lg">
                            <Download className="w-3.5 h-3.5 text-primary" />
                          </div>
                          ייצוא לקובץ
                        </h4>
                        <p className="text-xs text-muted-foreground pr-8">
                          הורדה מיידית של קובץ הגיבוי למחשב האישי.
                        </p>
                      </div>
                      <Button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-md shadow-primary/10 active:scale-95 transition-all text-sm"
                      >
                        {isBackingUp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                            מעבד...
                          </>
                        ) : (
                          "הורד קובץ גיבוי"
                        )}
                      </Button>
                    </div>

                    {/* Restore Section */}
                    <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-sm relative overflow-hidden flex flex-col justify-between h-full space-y-6">
                      <div className="absolute top-0 right-0 w-1 h-full bg-destructive/10"></div>
                      <div className="text-right space-y-1">
                        <h4 className="text-base font-black text-foreground flex items-center gap-2">
                          <div className="p-1 bg-destructive/10 rounded-lg">
                            <Upload className="w-3.5 h-3.5 text-destructive" />
                          </div>
                          שחזור מגיבוי
                        </h4>
                        <p className="text-xs text-muted-foreground pr-8">
                          דריסת נתונים ושחזור מקובץ.
                          <span className="text-destructive font-bold mr-1">
                            זהירות!
                          </span>
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
                          onClick={() =>
                            document.getElementById("restore-file")?.click()
                          }
                          disabled={isRestoring}
                          variant="outline"
                          className="w-full h-10 border-destructive/20 hover:bg-destructive/10 text-destructive rounded-xl font-bold active:scale-95 transition-all text-sm"
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin ml-2" />
                              משחזר...
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

function InfoBlock({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`space-y-1 rounded-xl bg-muted/30 border border-border/50 ${compact ? "p-3" : "p-4"}`}
    >
      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest block text-right">
        {label}
      </span>
      <span
        className={`${compact ? "text-xs" : "text-sm"} font-bold text-foreground block text-right`}
      >
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
        ${
          active
            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02]"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }
      `}
    >
      <Icon
        className={`w-5 h-5 ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
      />
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
