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
  Cpu,
  Wifi,
  Search,
  Laptop2,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "@/config/api.client";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";


import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoadingActivity(true);
      try {
        const { data } = await apiClient.get("/auth/profile/activity?limit=10");
        if (data.success) {
          setActivity(data.logs);
        }
      } catch (err) {
        console.error("Failed to fetch user activity", err);
      } finally {
        setIsLoadingActivity(false);
      }
    };
    fetchActivity();
  }, []);



  const shouldShowAlert = daysSinceChange > 180;

  return (
    <div className=" w-full pb-24 lg:pb-0">
      {/* Alerts Area - Redesigned to be subtler but effective */}
      {(user?.is_impersonated || shouldShowAlert) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {user?.is_impersonated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-destructive/10 shrink-0">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
                </div>
                <div className="space-y-1 sm:space-y-2 flex-1">
                  <h4 className="font-black text-destructive text-base sm:text-lg">
                    מצב התחזות פעיל
                  </h4>
                  <p className="text-xs sm:text-sm text-destructive/70 font-medium">
                    התחברת כשוטר אחר. ניתן לאפס את הסיסמה לשם המשתמש המקורי.
                  </p>
                  <Button
                    onClick={handleResetImpersonatedPassword}
                    disabled={isResetting}
                    variant="destructive"
                    size="sm"
                    className="mt-2 font-black rounded-lg sm:rounded-xl h-9 sm:h-10 px-4 sm:px-6"
                  >
                    {isResetting && (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    )}
                    אפס סיסמה לשם משתמש
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
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 flex items-start gap-3 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/10 shrink-0">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div className="space-y-1 sm:space-y-2 flex-1">
                  <h4 className="font-black text-amber-700 text-base sm:text-lg">
                    נדרשת החלפת סיסמה
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-700/70 font-medium leading-relaxed">
                    חלפו {daysSinceChange} יום מהחלפה אחרונה. מומלץ להחליף סיסמה
                    כל מספר חודשים.
                  </p>
                  <Button
                    onClick={() => handleConfirmCurrentPassword()}
                    variant="outline"
                    size="sm"
                    className="mt-2 font-black border-amber-500/20 text-amber-700 rounded-lg sm:rounded-xl h-9 sm:h-10 px-4 sm:px-6 hover:bg-amber-500/10"
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
                      className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg focus:bg-background transition-all"
                      placeholder="••••••••"
                    />
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
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
                      className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg"
                      placeholder="לפחות 6 תווים"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30" />
                  </div>
                  {/* Strength Bar */}
                  <div className="flex gap-1 h-1.5 px-1 mt-3">
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        passwordData.new_password.length > 0
                          ? passwordData.new_password.length < 6
                            ? "bg-red-500/60"
                            : "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
                        passwordData.new_password.length >= 6
                          ? "bg-emerald-500/60"
                          : "bg-muted",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-full transition-all",
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
                        "h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-14 font-bold text-base sm:text-lg",
                        passwordData.confirm_password &&
                          passwordData.new_password !==
                            passwordData.confirm_password &&
                          "border-red-500/50",
                      )}
                      placeholder="חזור על הסיסמה"
                    />
                    <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/30" />
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 gap-5">
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
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 ml-2 sm:ml-3" />
                  )}
                  שמור סיסמה חדשה
                </Button>
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
                title="אורך הסיסמה המומלצת"
                desc="לפחות 6 תווים הכוללים ספרות ואותיות."
                color="text-emerald-600"
              />
              <SecurityGuideItem
                icon={History}
                title="תדירות החלפה"
                desc="מומלץ להחליף סיסמה אחת למספר חודשים."
                color="text-blue-600"
              />
              <SecurityGuideItem
                icon={Shield}
                title="סיווג והרשאות"
                desc="מנע גישות בלתי מורשות לחשבון שלך."
                color="text-amber-600"
              />

              <div className="pt-8 border-t border-primary/5">
                <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-border/40 relative overflow-hidden group">
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

      {/* RECENT ACTIVITY - New Section */}
      <div className="mt-8">
        <SectionCard 
            icon={History} 
            title="פעילות אחרונה וחיבורים" 
            badge={
              <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
                10 כניסות אחרונות
              </span>
            }
        >
          <div className="space-y-2">
            {isLoadingActivity ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-40">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-bold">טוען היסטוריית חיבורים...</span>
              </div>
            ) : activity.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-[2rem] border border-dashed border-border/60">
                <p className="text-xs font-bold text-muted-foreground">לא נמצאה פעילות מתועדת</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {activity.map((log, idx) => (
                  <UserActivityEntry key={log.id} log={log} index={idx} />
                ))}
              </div>
            )}
            
            <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 border-t border-primary/5 mt-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center gap-3">
                <Shield className="w-4 h-4 text-amber-600" />
                <p className="text-[10px] font-bold text-amber-700 leading-tight">
                  אם זיהית חיבור ממכשיר או מיקום שאינך מכיר, מומלץ להחליף סיסמה מיד.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function UserActivityEntry({ log, index }: { log: any, index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isFailed = log.action_type === "FAILED_LOGIN" || log.action_type.includes("BLOCKED");
  
  const browser = log.metadata?.browser || "";
  const ip = log.metadata?.real_ip || log.ip_address;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(browser);
  const isWindows = /Windows/i.test(browser);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "group flex flex-col rounded-2xl border transition-all cursor-pointer overflow-hidden",
        isFailed 
          ? "bg-red-500/5 hover:bg-red-500/[0.08] border-red-100" 
          : "bg-muted/10 hover:bg-muted/20 border-transparent hover:border-border/40",
        expanded && "bg-muted/30 border-border/40"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
            isFailed ? "bg-red-100 border-red-200 text-red-600" : "bg-background border-border/40 text-primary"
          )}>
            {log.action_type === "LOGIN" ? <Laptop2 className="w-4 h-4" /> : isFailed ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </div>
          
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border",
                isFailed ? "bg-red-500 text-white border-transparent" : "bg-primary/5 border-primary/10 text-primary"
              )}>
                {log.action_type}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground">
                {format(new Date(log.created_at), "HH:mm, dd/MM")}
              </span>
            </div>
            <p className="text-[11px] font-bold text-foreground/80 truncate mt-0.5">
              {log.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end opacity-60">
            <span className="text-[10px] font-mono font-bold">{ip}</span>
            <span className="text-[9px] font-black text-muted-foreground uppercase">{isWindows ? "Windows" : isMobile ? "Mobile" : "Device"}</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="border-t border-border/20 bg-muted/40 overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px]">
              <div className="space-y-1">
                <span className="font-black text-muted-foreground uppercase text-[8px] tracking-widest">תיאור מכשיר</span>
                <div className="bg-background/40 p-2 rounded-lg border border-border/20 break-all font-mono leading-relaxed">
                  {browser || "לא זוהה"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="font-black text-muted-foreground uppercase text-[8px] tracking-widest">מידע רשת</span>
                <div className="bg-background/40 p-2 rounded-lg border border-border/20 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span>IP:</span>
                    <span className="font-bold text-primary">{ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>זמן מדויק:</span>
                    <span className="font-bold">{format(new Date(log.created_at), "HH:mm:ss.SSS")}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- UI Components ---



function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: any) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", variant === "danger" ? "text-red-500" : "text-primary")} />
          <h3 className={cn("text-sm font-black tracking-tight", variant === "danger" ? "text-red-500" : "text-foreground")}>
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl rounded-[2rem] border p-4 sm:p-6 shadow-sm overflow-hidden h-full",
        variant === "danger" ? "border-red-500/20 bg-red-500/5" : "border-border/40"
      )}>
        {children}
      </div>
    </div>
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
        "px-5 py-2 rounded-xl text-xs font-black transition-all",
        active
          ? isSuspicious
            ? "bg-destructive text-white  "
            : "bg-background text-primary  "
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
          "p-3 bg-background rounded-2xl border border-border/40  group-hover:scale-110 transition-transform h-fit",
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

