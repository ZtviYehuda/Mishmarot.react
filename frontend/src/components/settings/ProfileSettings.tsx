import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  User as UserIcon,
  Phone,
  Heart,
  Building2,
  Settings2,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  ShieldOff,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cleanUnitName } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface ProfileSettingsProps {
  user: any;
  formData: any;
  setFormData: (data: any) => void;
  emergencyDetails: any;
  setEmergencyDetails: (data: any) => void;
  relations: string[];
  isSaving: boolean;
  handleSaveProfile: () => void;
  readOnly?: boolean;
}

export function ProfileSettings({
  user,
  formData,
  setFormData,
  emergencyDetails,
  setEmergencyDetails,
  relations,
  isSaving,
  handleSaveProfile,
  readOnly = false,
}: ProfileSettingsProps) {
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [biometricPassword, setBiometricPassword] = useState("");
  const [showBioPassword, setShowBioPassword] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(`biometric_registered_${user?.username}`);
    setBiometricRegistered(!!stored);
  }, [user?.username]);

  const handleRegisterBiometric = async () => {
    setBiometricError("");
    if (!biometricPassword.trim()) {
      setBiometricError("יש להזין את הסיסמה כדי לאמת את זהותך");
      return;
    }
    if (!window.PublicKeyCredential) {
      setBiometricError("הדפדפן אינו תומך בזיהוי ביומטרי — יש להשתמש ב-HTTPS");
      return;
    }
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      setBiometricError("לא נמצא חיישן ביומטרי במכשיר זה");
      return;
    }
    setBiometricLoading(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "ShiftGuard", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user.username),
            name: user.username,
            displayName: `${user.first_name} ${user.last_name}`,
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) throw new Error("ביטול על ידי המשתמש");

      const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem(`biometric_cred_${user.username}`, credId);
      localStorage.setItem(`biometric_token_${user.username}`, btoa(`${user.username}:${biometricPassword}`));
      localStorage.setItem(`biometric_registered_${user.username}`, "1");
      setBiometricRegistered(true);
      setBiometricPassword("");
      toast.success("כניסה ביומטרית הופעלה בהצלחה!");
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setBiometricError("הגישה לזיהוי ביומטרי נדחתה — אנא נסה שנית");
      } else {
        setBiometricError(err.message || "שגיאה בהרשמה הביומטרית");
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleRemoveBiometric = () => {
    localStorage.removeItem(`biometric_cred_${user?.username}`);
    localStorage.removeItem(`biometric_token_${user?.username}`);
    localStorage.removeItem(`biometric_registered_${user?.username}`);
    setBiometricRegistered(false);
    setBiometricPassword("");
    setBiometricError("");
    toast.success("כניסה ביומטרית בוטלה");
  };

  return (
    <div className=" w-full pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8 order-2 lg:order-1">
          <SectionCard icon={User} title="פרטים אישיים">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <InputItem label="שם פרטי" required>
                  <Input
                    disabled={readOnly}
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg"
                    placeholder="ישראל"
                  />
                </InputItem>

                <InputItem label="שם משפחה" required>
                  <Input
                    disabled={readOnly}
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg"
                    placeholder="ישראלי"
                  />
                </InputItem>

                <InputItem label="עיר מגורים">
                  <Input
                    disabled={readOnly}
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg"
                    placeholder="תל אביב"
                  />
                </InputItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <InputItem label="מספר טלפון">
                  <Input
                    disabled={readOnly}
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg"
                    placeholder="050-0000000"
                  />
                </InputItem>

                <InputItem label="כתובת אימייל">
                  <Input
                    disabled={readOnly}
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg"
                    placeholder="israel@example.com"
                  />
                </InputItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <InputItem label="תאריך לידה">
                  <Input
                    disabled={readOnly}
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 font-bold text-base sm:text-lg text-right"
                  />
                </InputItem>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Settings2} title="פרטי שירות ומזהים">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <InputItem label="שם משתמש" required>
                <div className="relative group">
                  <Input
                    disabled={true}
                    value={formData.username || user?.username || ""}
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-border/40 pl-4 pr-12 font-bold text-base sm:text-lg opacity-70"
                    placeholder="username"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
              </InputItem>

              <InputItem label="תאריך גיוס">
                <Input
                  disabled={readOnly}
                  type="date"
                  value={formData.enlistment_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enlistment_date: e.target.value,
                    })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg text-right"
                />
              </InputItem>
            </div>

            {/* Organizational Context */}
            <div className="mt-8 pt-6 border-t border-primary/5">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> שיוך ארגוני
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UnitBadge
                  label="מחלקה"
                  value={cleanUnitName(user?.department_name)}
                />
                <UnitBadge
                  label="מדור"
                  value={cleanUnitName(user?.section_name)}
                />
                <UnitBadge
                  label="חוליה"
                  value={cleanUnitName(user?.team_name)}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Heart} title="איש קשר לחירום">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-right">
              <InputItem label="שם מלא של איש הקשר">
                <Input
                  disabled={readOnly}
                  value={emergencyDetails.name}
                  onChange={(e) =>
                    setEmergencyDetails({
                      ...emergencyDetails,
                      name: e.target.value,
                    })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg"
                  placeholder="לדוגמה: משה כהן"
                />
              </InputItem>

              <InputItem label="קרבה">
                <select
                  disabled={readOnly}
                  value={emergencyDetails.relation}
                  onChange={(e) =>
                    setEmergencyDetails({
                      ...emergencyDetails,
                      relation: e.target.value,
                    })
                  }
                  className="w-full h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 px-4 font-bold text-base sm:text-lg appearance-none cursor-pointer focus:bg-background transition-all outline-none"
                >
                  <option value="">בחר קרבה...</option>
                  {relations.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </InputItem>

              <InputItem label="מספר טלפון לחירום">
                <div className="relative group">
                  <Input
                    disabled={readOnly}
                    value={emergencyDetails.phone}
                    onChange={(e) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        phone: e.target.value,
                      })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 pr-12 font-bold text-base sm:text-lg"
                    placeholder="05X-XXXXXXX"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-red-500/10 text-red-600">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
              </InputItem>
            </div>
          </SectionCard>

          {/* Biometric section */}
          {!readOnly && (
            <SectionCard
              icon={Fingerprint}
              title="כניסה ביומטרית"
              badge={
                biometricRegistered ? (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-1">
                    <CheckCircle2 className="w-3 h-3" /> מופעל
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-black text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2.5 py-1">
                    <ShieldOff className="w-3 h-3" /> לא מופעל
                  </span>
                )
              }
            >
              {biometricRegistered ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Fingerprint className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground">כניסה ביומטרית פעילה</p>
                      <p className="text-[11px] font-bold text-muted-foreground">ניתן להתחבר עם טביעת אצבע / זיהוי פנים</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveBiometric}
                    className="h-11 rounded-xl border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500/10 font-black text-sm gap-2"
                  >
                    <ShieldOff className="w-4 h-4" />
                    בטל כניסה ביומטרית
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                    הפעל כניסה מהירה בטביעת אצבע או זיהוי פנים. הזן את הסיסמה שלך כדי לאשר את ההגדרה.
                  </p>
                  <div className="relative">
                    <Input
                      type={showBioPassword ? "text" : "password"}
                      placeholder="הזן סיסמה נוכחית"
                      value={biometricPassword}
                      onChange={(e) => { setBiometricPassword(e.target.value); setBiometricError(""); }}
                      className="h-12 rounded-xl border-border/40 bg-background/40 font-mono tracking-widest pr-4 pl-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBioPassword(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showBioPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {biometricError && (
                    <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {biometricError}
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleRegisterBiometric}
                    disabled={biometricLoading}
                    className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm gap-2"
                  >
                    {biometricLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    ) : (
                      <Fingerprint className="w-4 h-4" />
                    )}
                    הפעל כניסה ביומטרית
                  </Button>
                </div>
              )}
            </SectionCard>
          )}

          {!readOnly && (
            <div className="flex justify-end pt-4 sm:pt-8">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 rounded-xl sm:rounded-[2rem] font-black text-lg sm:text-xl   transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSaving ? (
                  <div className="w-6 h-6 border-4 border-white border-t-transparent animate-spin rounded-full ml-3" />
                ) : (
                  <Save className="w-6 h-6 ml-3" />
                )}
                שמור שינויים במערכת
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-8 order-1 lg:order-2">
          <SectionCard icon={UserIcon} title="פרופיל">
            <div className="flex flex-col items-center">
              <div className="relative mt-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 sm:border-8 border-background bg-card flex items-center justify-center text-primary text-3xl sm:text-5xl font-black z-10 relative overflow-hidden">
                  <span>
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </span>
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 border-2 sm:border-4 border-background rounded-full z-20" />
              </div>

              <div className="text-center mt-4 sm:mt-6 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {user?.first_name} {user?.last_name}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-black rounded-full border border-border/40">
                    {user?.username}
                  </span>
                </div>
              </div>

              <div className="w-full h-px bg-primary/5 my-6 sm:my-8" />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// --- Uniform UI Components for Settings ---

function SectionCard({ icon: Icon, title, children, badge }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-border/40 overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-border/40 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/10 text-primary">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
            {title}
          </h3>
        </div>
        {badge}
      </div>
      <div className="p-5 sm:p-8">{children}</div>
    </motion.div>
  );
}

function InputItem({ label, required, children }: any) {
  return (
    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[3rem] bg-background/30 border border-border/40 space-y-2 sm:space-y-3">
      <Label className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-black uppercase tracking-widest pl-2">
        {label}
        {required && <span className="text-red-500/80 mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function UnitBadge({ label, value }: any) {
  return (
    <div className="p-4 rounded-2xl bg-primary/[0.03] border border-border/40">
      <span className="text-[10px] font-black text-primary/40 block mb-1 uppercase tracking-widest leading-none">
        {label}
      </span>
      <span className="font-black text-sm text-foreground block truncate">
        {value || "—"}
      </span>
    </div>
  );
}

