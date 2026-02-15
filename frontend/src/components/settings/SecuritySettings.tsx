import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Loader2,
  AlertTriangle,
  History,
  HelpCircle,
  CheckCircle2,
  Shield,
  Activity,
  Laptop2,
  Monitor,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { format } from "date-fns";

interface AuditLog {
  id: number;
  user_id: number;
  user_name?: string;
  action_type: string;
  description: string;
  created_at: string;
  ip_address: string;
  metadata: any;
  reason?: string; // For suspicious logs
  target_name?: string;
}
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SecuritySettingsProps {
  user: any;
  passwordData: any;
  setPasswordData: (data: any) => void;
  showPasswords: boolean;
  setShowPasswords: (show: boolean) => void;
  isChangingPassword: boolean;
  handleChangePassword: () => void;
  isResetting: boolean;
  handleResetImpersonatedPassword: () => void;
  onForgotPassword: () => void;
  handleConfirmCurrentPassword: () => Promise<void>;
}

export function SecuritySettings({
  user,
  passwordData,
  setPasswordData,
  showPasswords,
  setShowPasswords,
  isChangingPassword,
  handleChangePassword,
  isResetting,
  handleResetImpersonatedPassword,
  onForgotPassword,
  handleConfirmCurrentPassword,
}: SecuritySettingsProps) {
  // Calculate days since last password change
  const daysSinceChange = user?.last_password_change
    ? Math.floor(
        (new Date().getTime() - new Date(user.last_password_change).getTime()) /
          (1000 * 3600 * 24),
      )
    : 0;

  // Activity Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allActivity, setAllActivity] = useState<AuditLog[]>([]);
  const [suspiciousActivity, setSuspiciousActivity] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "all" | "suspicious">("my");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const [myRes, allRes, suspRes] = await Promise.all([
          apiClient.get("/audit/my-activity"),
          user?.is_admin || user?.is_commander
            ? apiClient.get("/audit/all-activity")
            : Promise.resolve({ data: [] }),
          user?.is_admin
            ? apiClient.get("/audit/suspicious")
            : Promise.resolve({ data: [] }),
        ]);

        setAuditLogs(myRes.data);
        setAllActivity(allRes.data);
        setSuspiciousActivity(suspRes.data);
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [user]);

  const displayedLogs =
    activeTab === "my"
      ? auditLogs
      : activeTab === "all"
        ? allActivity
        : suspiciousActivity;

  const shouldShowAlert = daysSinceChange > 180;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      {/* Alerts Area - Redesigned to be subtler but effective */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {user?.is_impersonated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-destructive/5 border border-destructive/20 rounded-[2rem] p-6 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-destructive/10 shrink-0">
                  <Lock className="w-6 h-6 text-destructive" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-black text-destructive text-lg">
                    מצב התחזות פעיל
                  </h4>
                  <p className="text-sm text-destructive/70 font-medium">
                    התחברת כשוטר אחר. ניתן לאפס את הסיסמה לתעודת הזהות המקורית.
                  </p>
                  <Button
                    onClick={handleResetImpersonatedPassword}
                    disabled={isResetting}
                    variant="destructive"
                    size="sm"
                    className="mt-2 font-black rounded-xl h-10 px-6"
                  >
                    {isResetting && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    אפס סיסמה לת.ז.
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {shouldShowAlert && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2rem] p-6 flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-black text-amber-700 text-lg">
                    נדרשת החלפת סיסמה
                  </h4>
                  <p className="text-sm text-amber-700/70 font-medium leading-relaxed">
                    חלפו {daysSinceChange} יום מהחלפה אחרונה. מומלץ להחליף סיסמה
                    כל 180 יום.
                  </p>
                  <Button
                    onClick={() => handleConfirmCurrentPassword()}
                    variant="outline"
                    size="sm"
                    className="mt-2 font-black border-amber-500/20 text-amber-700 rounded-xl h-10 px-6 hover:bg-amber-500/10"
                  >
                    דלג הפעם
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        {/* RIGHT SIDE - Password Change */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <SectionCard icon={KeyRound} title="שינוי סיסמה">
            <div className="space-y-8">
              {/* Old Password */}
              <div className="max-w-md">
                <InputItem
                  label="סיסמה נוכחית"
                  required
                  icon={Lock}
                  extra={
                    <button
                      onClick={onForgotPassword}
                      className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors pr-1"
                    >
                      שכחתי?
                    </button>
                  }
                >
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.old_password || ""}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          old_password: e.target.value,
                        })
                      }
                      className="h-14 bg-background/40 rounded-2xl border-primary/5 pl-14 font-bold text-lg focus:bg-background transition-all"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                  </div>
                </InputItem>
              </div>

              <div className="h-px bg-primary/5 w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputItem label="סיסמה חדשה" required icon={ShieldCheck}>
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          new_password: e.target.value,
                        })
                      }
                      className="h-14 bg-background/40 rounded-2xl border-primary/5 pl-14 font-bold text-lg"
                      placeholder="לפחות 6 תווים"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                  </div>
                  {/* Strength Bar */}
                  <div className="flex gap-1 h-1.5 px-1 mt-3">
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        passwordData.new_password.length > 0
                          ? passwordData.new_password.length < 6
                            ? "bg-red-500/60"
                            : "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        passwordData.new_password.length >= 6
                          ? "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all duration-500",
                        passwordData.new_password.length >= 10
                          ? "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                  </div>
                </InputItem>

                <InputItem label="אימות סיסמה" required icon={ShieldCheck}>
                  <div className="relative group">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={passwordData.confirm_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirm_password: e.target.value,
                        })
                      }
                      className={cn(
                        "h-14 bg-background/40 rounded-2xl border-primary/5 pl-14 font-bold text-lg",
                        passwordData.confirm_password &&
                          passwordData.new_password !==
                            passwordData.confirm_password &&
                          "border-red-500/50",
                      )}
                      placeholder="חזור על הסיסמה"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                  </div>
                  {passwordData.confirm_password &&
                    passwordData.new_password !==
                      passwordData.confirm_password && (
                      <p className="text-[10px] font-black text-red-500 mr-1 mt-2 uppercase tracking-tighter">
                        הסיסמאות אינן תואמות
                      </p>
                    )}
                </InputItem>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-all group"
                >
                  <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10">
                    {showPasswords ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                  {showPasswords ? "הסתר תווים" : "הצג תווים"}
                </button>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-5 h-5 ml-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 ml-3" />
                  )}
                  שמור סיסמה חדשה
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Activity Log Section */}
          <SectionCard icon={Activity} title="יומן פעילות וניטור">
            <div className="space-y-6">
              <div className="flex justify-center md:justify-start">
                <div className="flex bg-muted/60 p-1.5 rounded-2xl gap-1">
                  <TabButton
                    active={activeTab === "my"}
                    label="הפעילות שלי"
                    onClick={() => setActiveTab("my")}
                  />
                  {(user?.is_admin || user?.is_commander) && (
                    <TabButton
                      active={activeTab === "all"}
                      label="כלל המשתמשים"
                      onClick={() => setActiveTab("all")}
                    />
                  )}
                  {user?.is_admin && (
                    <TabButton
                      active={activeTab === "suspicious"}
                      label="פעילות חריגה"
                      onClick={() => setActiveTab("suspicious")}
                      isSuspicious
                    />
                  )}
                </div>
              </div>

              <div className="min-h-[400px]">
                {loadingLogs ? (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="w-12 h-12 animate-spin text-primary/40" />
                    <p className="font-black text-sm uppercase animate-pulse">
                      טוען נתונים...
                    </p>
                  </div>
                ) : displayedLogs.length === 0 ? (
                  <div className="h-[400px] flex flex-col items-center justify-center gap-6 text-muted-foreground">
                    <div className="p-8 bg-primary/5 rounded-[3rem] border border-primary/5">
                      <ShieldCheck className="w-16 h-16 text-primary/20" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xl font-black text-foreground">
                        אין תיעוד להצגה
                      </p>
                      <p className="text-sm font-medium">
                        לא נמצאו רשומות רלוונטיות לתקופה זו.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-primary/5 -mx-8">
                    {displayedLogs.map((log, idx) => (
                      <ActivityLogItem
                        key={`${log.id}-${idx}`}
                        log={log}
                        activeTab={activeTab}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* LEFT SIDE - Security Tips */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <SectionCard icon={HelpCircle} title="הנחיות אבטחה">
            <div className="space-y-8 py-4">
              <SecurityGuideItem
                icon={CheckCircle2}
                title="אורך סיסמה"
                desc="לפחות 6 תווים הכוללים ספרות ואותיות."
                color="text-emerald-600"
              />
              <SecurityGuideItem
                icon={History}
                title="תדירות החלפה"
                desc="מומלץ להחליף סיסמה אחת ל-180 יום."
                color="text-blue-600"
              />
              <SecurityGuideItem
                icon={Shield}
                title="סיווג והרשאות"
                desc="מנע גישות בלתי מורשות לחשבון שלך."
                color="text-amber-600"
              />

              <div className="pt-8 border-t border-primary/5">
                <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/20" />
                  <p className="text-sm font-black text-primary leading-relaxed relative z-10 transition-colors group-hover:text-primary/100">
                    שים לב: המערכת מנטרת פעילות חריגה ומדווחת עליה למנהלי המערכת
                    באופן אוטומטי.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- UI Components ---

function ActivityLogItem({
  log,
  activeTab,
}: {
  log: AuditLog;
  activeTab: string;
}) {
  const getActionColor = () => {
    if (log.reason) return "text-red-600 bg-red-500/10 border-red-500/10";
    if (log.action_type === "LOGIN")
      return "text-emerald-600 bg-emerald-500/10 border-emerald-500/10";
    if (log.action_type.includes("PASSWORD"))
      return "text-amber-600 bg-amber-500/10 border-amber-500/10";
    return "text-primary bg-primary/10 border-primary/10";
  };

  const getLogTitle = () => {
    if (log.reason) return log.reason;
    switch (log.action_type) {
      case "LOGIN":
        return "התחברות מוצלחת";
      case "FAILED_LOGIN":
        return "ניסיון התחברות שנכשל";
      case "PASSWORD_CHANGE":
        return "שינוי סיסמה";
      case "PROFILE_UPDATE":
        return "עדכון פרטים";
      default:
        return log.action_type;
    }
  };

  return (
    <div
      className={cn(
        "p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-primary/[0.02]",
        log.reason && "bg-destructive/[0.03]",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-2xl border transition-transform shrink-0",
            getActionColor(),
          )}
        >
          {log.action_type === "LOGIN" ? (
            <Laptop2 className="w-5 h-5" />
          ) : (
            <Activity className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-black text-base tracking-tight">
              {getLogTitle()}
            </h4>
            {log.user_name && activeTab !== "my" && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary border border-primary/10">
                {log.user_name}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-xs font-medium leading-relaxed max-w-xl">
            {log.description}
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60 bg-muted/50 px-2 py-0.5 rounded-lg border border-border/10">
              <Shield className="w-3 h-3" />
              {log.ip_address}
            </span>
            {log.metadata?.browser && (
              <span className="hidden md:flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60">
                <Monitor className="w-3 h-3" />
                {log.metadata.browser.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-1">
        <span className="text-sm font-black font-mono text-foreground">
          {format(new Date(log.created_at), "HH:mm")}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
          {format(new Date(log.created_at), "dd/MM/yy")}
        </span>
      </div>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 backdrop-blur-xl rounded-[2.5rem] border shadow-2xl shadow-primary/5 overflow-hidden",
        variant === "danger" ? "border-red-500/10" : "border-primary/10",
      )}
    >
      <div
        className={cn(
          "px-8 py-6 border-b flex items-center justify-between",
          variant === "danger" ? "bg-red-500/5" : "bg-primary/5",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-2xl",
              variant === "danger"
                ? "bg-red-500/10 text-red-600"
                : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <h3
            className={cn(
              "text-xl font-black tracking-tight",
              variant === "danger" ? "text-red-600" : "text-foreground",
            )}
          >
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-8">{children}</div>
    </motion.div>
  );
}

function InputItem({ label, icon: Icon, required, children, extra }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pl-1">
        <Label className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary/60" />}
          {label}
          {required && <span className="text-red-500/80 mr-0.5">*</span>}
        </Label>
        {extra}
      </div>
      {children}
    </div>
  );
}

function TabButton({ active, label, onClick, isSuspicious }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-xl text-xs font-black transition-all duration-300",
        active
          ? isSuspicious
            ? "bg-destructive text-white shadow-xl shadow-destructive/20"
            : "bg-background text-primary shadow-xl shadow-black/5"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SecurityGuideItem({ icon: Icon, title, desc, color }: any) {
  return (
    <div className="flex gap-4 group">
      <div
        className={cn(
          "p-3 bg-background rounded-2xl border border-border shadow-sm group-hover:scale-110 transition-transform h-fit",
          color.replace("text", "border"),
        )}
      >
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-sm tracking-tight">{title}</h4>
        <p className="text-muted-foreground text-[11px] font-medium leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
