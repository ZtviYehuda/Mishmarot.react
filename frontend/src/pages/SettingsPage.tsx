import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import apiClient from "@/config/api.client";
import { toast } from "sonner";
import {
  User,
  Settings as SettingsIcon,
  Palette,
  ShieldCheck,
  Bell,
  Database,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

// Import Settings Components
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { ForgotPasswordDialog } from "@/components/settings/ForgotPasswordDialog";

export default function SettingsPage() {
  const { user, refreshUser } = useAuthContext();
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
  } = useTheme();

  const [activeTab, setActiveTab] = useState(
    user?.is_temp_commander ? "appearance" : "profile",
  );
  // const [mobileNavOpen, setMobileNavOpen] = useState(true);
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
    email: "",
    city: "",
    birth_date: "",
    emergency_contact: "",
    notif_sick_leave: true,
    notif_transfers: true,
    notif_morning_report: true,
    // New fields
    national_id: "",
    enlistment_date: "",
    discharge_date: "",
    assignment_date: "",
    police_license: false,
    security_clearance: false,
    // New fields for commander display
    commands_department_id: null as number | null,
    department_name: "",
    commands_section_id: null as number | null,
    section_name: "",
    commands_team_id: null as number | null,
    team_name: "",
  });

  const [emergencyDetails, setEmergencyDetails] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const relations = [
    "בן / בת זוג",
    "אבא / אמא",
    "אח / אחות",
    "בן / בת",
    "סבא / סבתא",
    "חבר / חברה",
    "אחר",
  ];

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        email: user.email || "",
        city: user.city || "",
        birth_date: user.birth_date || "",
        emergency_contact: user.emergency_contact || "",
        notif_sick_leave: user.notif_sick_leave !== false,
        notif_transfers: user.notif_transfers !== false,
        notif_morning_report: user.notif_morning_report !== false,
        national_id: user.national_id || "",
        enlistment_date: user.enlistment_date || "",
        discharge_date: user.discharge_date || "",
        assignment_date: user.assignment_date || "",
        police_license: !!user.police_license,
        security_clearance: !!user.security_clearance,
        // Commander fields for UI display
        commands_department_id: user.commands_department_id ?? null,
        department_name: user.department_name ?? "",
        commands_section_id: user.commands_section_id ?? null,
        section_name: user.section_name ?? "",
        commands_team_id: user.commands_team_id ?? null,
        team_name: user.team_name ?? "",
      });

      // Parse Emergency Contact
      if (user.emergency_contact) {
        const match = user.emergency_contact.match(/^(.*) \((.*)\) - (.*)$/);
        if (match) {
          setEmergencyDetails({
            name: match[1],
            relation: match[2],
            phone: match[3],
          });
        } else {
          setEmergencyDetails({
            name: user.emergency_contact,
            relation: "",
            phone: "",
          });
        }
      } else {
        setEmergencyDetails({
          name: "",
          relation: "",
          phone: "",
        });
      }
    }
  }, [user]);

  // Update formData when emergencyDetails changes
  useEffect(() => {
    const { name, relation, phone } = emergencyDetails;
    if (name || relation || phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contact: `${name} (${relation}) - ${phone}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, emergency_contact: "" }));
    }
  }, [emergencyDetails]);

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
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      if (data.success) {
        toast.success("הסיסמה עודכנה בהצלחה");
        setPasswordData({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });
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

  const handleConfirmCurrentPassword = async () => {
    try {
      const { data } = await apiClient.post("/auth/confirm-password");
      if (data.success) {
        await refreshUser();
        toast.success("תוקף הסיסמה הוארך ב-6 חודשים");
      } else {
        toast.error(data.error);
      }
    } catch (err) {
      toast.error("שגיאה בתקשורת עם השרת");
    }
  };

  const handleImageUpload = () => {
    toast.info("העלאת תמונה", {
      description: "פיצ'ר זה יהיה זמין בגרסה הבאה של המערכת",
    });
  };

  return (
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-8 lg:pb-12">
      <PageHeader
        icon={SettingsIcon}
        title="הגדרות מערכת"
        subtitle="ניהול העדפות אישיות, מראה הממשק ואבטחה"
        category="הגדרות"
        categoryLink="/settings"
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
      />

      {/* Desktop Horizontal Navigation (Replaces Sidebar) */}
      <div className="hidden lg:flex items-center gap-1 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50 pb-0 overflow-x-auto no-scrollbar pt-2">
        {!user?.is_temp_commander && (
          <TabItem
            label="פרופיל אישי"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        )}
        <TabItem
          label="מראה ותצוגה"
          active={activeTab === "appearance"}
          onClick={() => setActiveTab("appearance")}
        />
        {!user?.is_temp_commander && (
          <TabItem
            label="אבטחה"
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
        )}
        {!user?.is_temp_commander && (
          <TabItem
            label="התראות"
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
        )}
        {user?.is_admin && (
          <TabItem
            label="גיבוי ושחזור"
            active={activeTab === "backup"}
            onClick={() => setActiveTab("backup")}
          />
        )}
      </div>

      {/* Content Area */}
      <div className="min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "profile" && !user?.is_temp_commander && (
          <ProfileSettings
            user={user}
            formData={formData}
            setFormData={setFormData}
            emergencyDetails={emergencyDetails}
            setEmergencyDetails={setEmergencyDetails}
            relations={relations}
            isSaving={isSaving}
            handleSaveProfile={handleSaveProfile}
            handleImageUpload={handleImageUpload}
            readOnly={!!user?.is_temp_commander}
          />
        )}

        {activeTab === "appearance" && (
          <AppearanceSettings
            theme={theme}
            setTheme={setTheme}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            fontSize={fontSize}
            setFontSize={setFontSize}
          />
        )}

        {activeTab === "security" && !user?.is_temp_commander && (
          <>
            <SecuritySettings
              user={user}
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
              isChangingPassword={isChangingPassword}
              handleChangePassword={handleChangePassword}
              isResetting={isResetting}
              handleResetImpersonatedPassword={handleResetImpersonatedPassword}
              onForgotPassword={() => setShowForgotPassword(true)}
              handleConfirmCurrentPassword={handleConfirmCurrentPassword}
            />

            <ForgotPasswordDialog
              open={showForgotPassword}
              onOpenChange={setShowForgotPassword}
              user={user}
            />
          </>
        )}

        {activeTab === "notifications" && !user?.is_temp_commander && (
          <NotificationSettings
            user={user}
            formData={formData}
            setFormData={setFormData}
            systemSettings={systemSettings}
            updateSystemSetting={updateSystemSetting}
          />
        )}

        {activeTab === "backup" && user?.is_admin && (
          <BackupSettings
            backupConfig={backupConfig}
            updateBackupConfig={updateBackupConfig}
            isServerBackingUp={isServerBackingUp}
            handleServerBackupNow={handleServerBackupNow}
            isBackingUp={isBackingUp}
            handleBackup={handleBackup}
            isRestoring={isRestoring}
            handleRestore={handleRestore}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar - Standard Fixed */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border flex justify-around items-center h-16 px-2 safe-area-bottom">
        {!user?.is_temp_commander && (
          <MobileBottomNavLink
            label="פרופיל"
            icon={User}
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        )}
        <MobileBottomNavLink
          label="תצוגה"
          icon={Palette}
          active={activeTab === "appearance"}
          onClick={() => setActiveTab("appearance")}
        />
        {!user?.is_temp_commander && (
          <MobileBottomNavLink
            label="אבטחה"
            icon={ShieldCheck}
            active={activeTab === "security"}
            onClick={() => setActiveTab("security")}
          />
        )}
        {!user?.is_temp_commander && (
          <MobileBottomNavLink
            label="התראות"
            icon={Bell}
            active={activeTab === "notifications"}
            onClick={() => setActiveTab("notifications")}
          />
        )}
        {user?.is_admin && (
          <MobileBottomNavLink
            label="גיבוי"
            icon={Database}
            active={activeTab === "backup"}
            onClick={() => setActiveTab("backup")}
          />
        )}
      </div>
    </div>
  );
}

function MobileBottomNavLink({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <div
        className={`p-1.5 rounded-xl transition-all ${active ? "bg-primary/10" : "bg-transparent"}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
      {active && (
        <span className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.3)]" />
      )}
    </button>
  );
}

function TabItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2.5 rounded-lg transition-all duration-200 font-bold text-sm whitespace-nowrap
        ${
          active
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }
      `}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full mx-2" />
      )}
    </button>
  );
}
