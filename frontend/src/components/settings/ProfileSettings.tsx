import { Button } from "@/components/ui/button";
import {
  Save,
  Loader2,
  User,
  Phone,
  Shield,
  HeartPulse,
  MapPin,
  Calendar,
  BadgeCheck,
  Mail,
  Building2,
  History,
} from "lucide-react";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn, cleanUnitName } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileSettingsProps {
  formData: any;
  setFormData: (data: any) => void;
  emergencyDetails: any;
  setEmergencyDetails: (data: any) => void;
  relations: string[];
  isSaving: boolean;
  handleSaveProfile: () => void;
  handleImageUpload: () => void;
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
  handleImageUpload,
  readOnly = false,
}: ProfileSettingsProps & { user: any }) {
  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const userId = user?.id || formData.id;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-8">
        {/* RIGHT SIDE (MAIN) - Personal, Contact, Service */}
        <div className="col-span-12 lg:col-span-8 space-y-8 order-2 lg:order-1">
          {/* Section 1: Personal Details */}
          <SectionCard
            icon={User}
            title="פרטים אישיים"
            badge={
              user?.is_commander && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-tighter">
                    מפקד
                  </span>
                </div>
              )
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputItem label="שם פרטי" required icon={User}>
                <Input
                  disabled={readOnly}
                  value={formData.first_name || ""}
                  onChange={(e) =>
                    handleFieldChange("first_name", e.target.value)
                  }
                  className="h-12 bg-background/40 rounded-xl border-primary/5 focus:border-primary/20 transition-all font-bold"
                />
              </InputItem>
              <InputItem label="שם משפחה" required icon={User}>
                <Input
                  disabled={readOnly}
                  value={formData.last_name || ""}
                  onChange={(e) =>
                    handleFieldChange("last_name", e.target.value)
                  }
                  className="h-12 bg-background/40 rounded-xl border-primary/5 focus:border-primary/20 transition-all font-bold"
                />
              </InputItem>
              <InputItem label="מין" required icon={User}>
                <Select
                  disabled={readOnly}
                  value={formData.gender || ""}
                  onValueChange={(val) => handleFieldChange("gender", val)}
                >
                  <SelectTrigger className="h-12 bg-background/40 rounded-xl border-primary/5 font-bold">
                    <SelectValue placeholder="בחר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">גבר</SelectItem>
                    <SelectItem value="female">אישה</SelectItem>
                  </SelectContent>
                </Select>
              </InputItem>
              <InputItem label="תעודת זהות" required icon={BadgeCheck}>
                <Input
                  disabled={readOnly}
                  value={formData.national_id || ""}
                  onChange={(e) =>
                    handleFieldChange("national_id", e.target.value)
                  }
                  className="h-12 bg-background/40 rounded-xl border-primary/5 font-mono font-bold"
                />
              </InputItem>
              <InputItem label="מספר אישי" required icon={BadgeCheck}>
                <Input
                  disabled={readOnly}
                  value={formData.personal_number || ""}
                  onChange={(e) =>
                    handleFieldChange("personal_number", e.target.value)
                  }
                  className="h-12 bg-background/40 rounded-xl border-primary/5 font-mono font-bold"
                />
              </InputItem>
              <InputItem label="תאריך לידה" required icon={Calendar}>
                <Input
                  disabled={readOnly}
                  type="date"
                  value={
                    formData.birth_date ? formData.birth_date.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    handleFieldChange("birth_date", e.target.value)
                  }
                  className="h-12 bg-background/40 rounded-xl border-primary/5 font-bold"
                />
              </InputItem>
            </div>

            {/* Organizational Context */}
            <div className="mt-8 pt-6 border-t border-primary/5">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" /> שיוך ארגוני
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <UnitBadge
                  label="עיר מגורים"
                  value={formData.city}
                  editable
                  icon={MapPin}
                  onChange={(v: string) => handleFieldChange("city", v)}
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Contact & Emergency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SectionCard icon={Phone} title="פרטי התקשרות">
              <div className="space-y-6">
                <InputItem label="טלפון נייד" icon={Phone}>
                  <Input
                    disabled={readOnly}
                    type="tel"
                    value={formData.phone_number || ""}
                    onChange={(e) =>
                      handleFieldChange("phone_number", e.target.value)
                    }
                    className="h-12 bg-background/40 rounded-xl font-mono font-bold"
                    dir="ltr"
                  />
                </InputItem>
                <InputItem label="דואר אלקטרוני" icon={Mail}>
                  <Input
                    disabled={readOnly}
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="h-12 bg-background/40 rounded-xl font-mono font-bold"
                    dir="ltr"
                  />
                </InputItem>
              </div>
            </SectionCard>

            <SectionCard
              icon={HeartPulse}
              title="איש קשר לחירום"
              variant="danger"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <InputItem label="שם מלא">
                    <Input
                      disabled={readOnly}
                      value={emergencyDetails.name}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          name: e.target.value,
                        })
                      }
                      className="h-12 bg-background/40 rounded-xl font-bold"
                    />
                  </InputItem>
                  <InputItem label="קרבה">
                    <Select
                      disabled={readOnly}
                      value={emergencyDetails.relation}
                      onValueChange={(val) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          relation: val,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 bg-background/40 rounded-xl font-bold">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((r: string) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </InputItem>
                </div>
                <InputItem label="טלפון חירום" icon={Phone}>
                  <Input
                    disabled={readOnly}
                    value={emergencyDetails.phone}
                    onChange={(e) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        phone: e.target.value,
                      })
                    }
                    className="h-12 bg-background/40 rounded-xl font-mono font-bold"
                    dir="ltr"
                  />
                </InputItem>
              </div>
            </SectionCard>
          </div>

          {/* Section 3: Service Dates & Security */}
          <SectionCard icon={Shield} title="נתוני שירות ואבטחה">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4" /> תאריכי שירות
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InputItem label="תאריך גיוס">
                    <Input
                      disabled={readOnly}
                      type="date"
                      value={
                        formData.enlistment_date
                          ? formData.enlistment_date.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleFieldChange("enlistment_date", e.target.value)
                      }
                      className="h-11 bg-background/40 rounded-xl font-bold"
                    />
                  </InputItem>
                  <InputItem label="שחרור צפוי">
                    <Input
                      disabled={readOnly}
                      type="date"
                      value={
                        formData.discharge_date
                          ? formData.discharge_date.split("T")[0]
                          : ""
                      }
                      onChange={(e) =>
                        handleFieldChange("discharge_date", e.target.value)
                      }
                      className="h-11 bg-background/40 rounded-xl font-bold"
                    />
                  </InputItem>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4" /> הרשאות וסיווג
                </h4>
                <div className="space-y-3">
                  <SwitchItem
                    label="סיווג ביטחוני בתוקף"
                    checked={!!formData.security_clearance}
                    onChange={(v: boolean) =>
                      handleFieldChange("security_clearance", v)
                    }
                  />
                  <SwitchItem
                    label="רישיון נהיגה משטרתי"
                    checked={!!formData.police_license}
                    onChange={(v: boolean) =>
                      handleFieldChange("police_license", v)
                    }
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 4: History (Full Width) */}
          {!readOnly && (
            <SectionCard icon={History} title="היסטוריית דיווחים אישית">
              <div className="mt-2">
                <StatusHistoryList
                  employeeId={userId}
                  limit={10}
                  showControls
                />
              </div>
            </SectionCard>
          )}
        </div>

        {/* LEFT SIDE (SIDEBAR) - Summary & Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-8 order-1 lg:order-2">
          {/* User Profile Summary Card */}
          <div className="bg-card/50 backdrop-blur-2xl rounded-[2.5rem] border border-primary/10 shadow-2xl shadow-primary/5 overflow-hidden sticky top-8">
            <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/40 relative">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            <div className="px-8 pb-10 text-center -mt-16 relative">
              <div className="relative w-max mx-auto mb-6 group">
                <div className="w-32 h-32 rounded-[2.2rem] flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-card bg-gradient-to-br from-background to-muted text-primary transition-all duration-500 group-hover:scale-105 group-hover:rotate-3">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>
                {!readOnly && (
                  <button
                    onClick={handleImageUpload}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white hover:scale-110 active:scale-95 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-4 border-card"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1 mb-8">
                <h2 className="text-2xl font-black text-foreground tracking-tight">
                  {formData.first_name} {formData.last_name}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground/80 font-mono tracking-widest bg-muted px-3 py-0.5 rounded-full">
                    {formData.personal_number}
                  </span>
                </div>
              </div>

              {/* Stats / Labels in Sidebar */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10">
                  <p className="text-[10px] font-black text-primary/60 uppercase mb-1">
                    ת. גיוס
                  </p>
                  <p className="font-bold text-sm">
                    {formData.enlistment_date
                      ? new Date(formData.enlistment_date).toLocaleDateString(
                          "he-IL",
                        )
                      : "—"}
                  </p>
                </div>
                <div className="p-4 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase mb-1">
                    סטטוס
                  </p>
                  <p className="font-bold text-sm text-emerald-600">פעיל</p>
                </div>
              </div>

              {!readOnly && (
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[1px]"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 ml-3 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 ml-3" />
                  )}
                  שמור שינויים במערכת
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Uniform UI Components for Settings ---

function SectionCard({
  icon: Icon,
  title,
  children,
  badge,
  variant = "default",
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 backdrop-blur-xl rounded-[2rem] border shadow-2xl shadow-primary/5 overflow-hidden",
        variant === "danger" ? "border-red-500/10" : "border-primary/10",
      )}
    >
      <div
        className={cn(
          "px-8 py-6 border-b flex items-center justify-between",
          variant === "danger"
            ? "bg-red-500/5 border-red-500/10"
            : "bg-primary/5 border-primary/10",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-xl",
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

function UnitBadge({ label, value, editable, icon: Icon, onChange }: any) {
  return (
    <div className="group p-4 rounded-2xl bg-primary/[0.03] border border-primary/10 hover:bg-primary/[0.05] transition-all">
      <span className="text-[10px] font-black text-primary/40 block mb-1 uppercase tracking-widest leading-none">
        {label}
      </span>
      {editable ? (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3 text-primary/60" />}
          <input
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            className="bg-transparent border-none p-0 h-auto text-sm font-black text-foreground focus:ring-0 w-full placeholder:text-muted-foreground/30"
            placeholder="הזן..."
          />
        </div>
      ) : (
        <span className="font-black text-sm text-foreground block truncate">
          {value || "—"}
        </span>
      )}
    </div>
  );
}

function InputItem({ label, icon: Icon, required, children, className }: any) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest pl-1">
        {Icon && <Icon className="w-3 h-3 text-primary/60" />}
        {label}
        {required && <span className="text-red-500/80 mr-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

function SwitchItem({ label, checked, onChange, disabled }: any) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
        checked
          ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5"
          : "bg-muted/5 border-border/50 hover:border-primary/20",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <Label className="cursor-pointer flex-1 font-black text-sm tracking-tight">
        {label}
      </Label>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
}
