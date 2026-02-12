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
  Wallet,
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
import { CompactCard } from "@/components/forms/EmployeeFormComponents";
import { cn, cleanUnitName } from "@/lib/utils";

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1920px] mx-auto pb-24 lg:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b pb-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <User className="w-8 h-8 text-primary" />
            </div>
            פרופיל אישי
          </h2>
          <p className="text-muted-foreground mt-2 text-lg font-medium max-w-2xl">
            נהל את המידע האישי שלך, פרטי קשר ונתוני שירות
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* RIGHT SIDEBAR (Sticky) - Order 2 in LTR, but visually Left in LTR? 
           Wait. In EditEmployeePage (RTL): 
           Sidebar (order-2) is last in DOM. 
           Main (order-1) is first in DOM.
           In RTL (grid), first item is on Right. Last item is on Left.
           So Main (1) -> Right. Sidebar (2) -> Left.
           So Sidebar is on the LEFT.
           
           I want Summary Card on the LEFT (Sidebar).
           So I should use order-2 for Sidebar and order-1 for Main.
        */}
        <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 order-2">
          {/* User Summary Card */}
          <div className="bg-card rounded-3xl border border-primary/10 shadow-lg shadow-primary/5 overflow-hidden">
            <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
              <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
            </div>
            <div className="px-6 pb-8 text-center -mt-12 relative">
              <div className="relative w-max mx-auto mb-4">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black shadow-md border-4 border-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transition-all duration-300">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>
                {/* Upload Button */}
                {!readOnly && (
                  <button
                    onClick={handleImageUpload}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-muted text-muted-foreground hover:bg-primary hover:text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-card"
                    title="עדכן תמונה"
                  >
                    <User className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h2 className="text-xl font-black text-foreground mb-1 min-h-[28px]">
                {formData.first_name} {formData.last_name}
              </h2>

              {(() => {
                // If user object is available via context or passed in, use it
                // formData might not have these fields if not explicitly added,
                // but let's assume we want to show it if they exist
                if (formData.commands_department_id)
                  return (
                    <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
                      רמ"ח - {cleanUnitName(formData.department_name)}
                    </div>
                  );
                if (formData.commands_section_id)
                  return (
                    <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
                      רמ"ד - {cleanUnitName(formData.section_name)}
                    </div>
                  );
                if (formData.commands_team_id)
                  return (
                    <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
                      מ"ח - {cleanUnitName(formData.team_name)}
                    </div>
                  );
                return null;
              })()}

              <p className="text-sm text-muted-foreground font-mono">
                {formData.personal_number || "מספר אישי"}
              </p>
            </div>
          </div>

          {!readOnly && (
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full h-12 rounded-xl font-bold shadow-sm text-base"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שינויים
            </Button>
          )}
        </div>

        {/* MAIN CONTENT (Variable Content) - Order 1 */}
        <div className="lg:col-span-9 space-y-8 order-1 min-h-[500px]">
          {/* Personal Details */}
          <CompactCard
            title={
              <span className="flex items-center gap-2 text-primary font-black text-lg">
                <User className="w-5 h-5" /> פרטים אישיים
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputItem
                label="שם מלא (פרטי ומשפחה)"
                required
                icon={User}
              >
                <div className="flex gap-2">
                  <Input
                    disabled={readOnly}
                    value={formData.first_name || ""}
                    onChange={(e) =>
                      handleFieldChange("first_name", e.target.value)
                    }
                    placeholder="פרטי"
                    className="h-11 bg-background/50 focus:bg-background transition-colors flex-1"
                  />
                  <Input
                    disabled={readOnly}
                    value={formData.last_name || ""}
                    onChange={(e) =>
                      handleFieldChange("last_name", e.target.value)
                    }
                    placeholder="משפחה"
                    className="h-11 bg-background/50 focus:bg-background transition-colors flex-1"
                  />
                </div>
              </InputItem>
              <InputItem label="מין" required icon={User}>
                <Select
                  disabled={readOnly}
                  value={formData.gender || ""}
                  onValueChange={(val) => handleFieldChange("gender", val)}
                >
                  <SelectTrigger className="h-11 bg-background/50 focus:bg-background transition-colors">
                    <SelectValue placeholder="בחר מין" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">גבר</SelectItem>
                    <SelectItem value="female">אישה</SelectItem>
                  </SelectContent>
                </Select>
              </InputItem>
              <InputItem label="עיר מגורים" icon={MapPin}>
                <Input
                  disabled={readOnly}
                  value={formData.city || ""}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  placeholder="ירושלים, ת''א..."
                  className="h-11 bg-background/50 focus:bg-background transition-colors"
                />
              </InputItem>

              <InputItem label="תעודת זהות" required icon={BadgeCheck}>
                <Input
                  disabled={readOnly}
                  value={formData.national_id || ""}
                  onChange={(e) =>
                    handleFieldChange("national_id", e.target.value)
                  }
                  className="h-11 bg-background/50 focus:bg-background transition-colors font-mono"
                />
              </InputItem>
              <InputItem label="מספר אישי" required icon={BadgeCheck}>
                <Input
                  disabled={readOnly}
                  value={formData.personal_number || ""}
                  onChange={(e) =>
                    handleFieldChange("personal_number", e.target.value)
                  }
                  className="h-11 bg-background/50 focus:bg-background transition-colors font-mono"
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
                  className="h-11 bg-background/50 focus:bg-background transition-colors"
                />
              </InputItem>
            </div>
          </CompactCard>

          {/* Contact & Emergency */}
          <CompactCard
            title={
              <span className="flex items-center gap-2 text-primary font-black text-lg">
                <Phone className="w-5 h-5" /> פרטי קשר וחירום
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Contact */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
                  <Phone className="w-4 h-4" /> פרטי התקשרות
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <InputItem label="טלפון נייד">
                    <Input
                      disabled={readOnly}
                      type="tel"
                      value={formData.phone_number || ""}
                      onChange={(e) =>
                        handleFieldChange("phone_number", e.target.value)
                      }
                      className="font-mono"
                      dir="ltr"
                    />
                  </InputItem>
                  <InputItem label="דואר אלקטרוני" icon={Mail}>
                    <Input
                      disabled={readOnly}
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      dir="ltr"
                    />
                  </InputItem>
                </div>
              </div>

              {/* Emergency */}
              <div className="bg-red-50/60 rounded-2xl p-5 border border-red-100 dark:bg-red-950/10 dark:border-red-900/20">
                <h4 className="text-sm font-black text-red-600 flex items-center gap-2 pb-2 mb-4 border-b border-red-200/50">
                  <HeartPulse className="w-4 h-4" /> איש קשר לחירום
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputItem
                      label="שם מלא (פרטי ומשפחה)"
                      className="bg-transparent"
                    >
                      <Input
                        disabled={readOnly}
                        value={emergencyDetails.name}
                        onChange={(e) =>
                          setEmergencyDetails({
                            ...emergencyDetails,
                            name: e.target.value,
                          })
                        }
                        className="bg-transparent border-red-200/50 focus-visible:ring-red-500/30"
                      />
                    </InputItem>
                    <InputItem label="קרבה" className="bg-transparent">
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
                        <SelectTrigger className="bg-transparent border-red-200/50">
                          <SelectValue placeholder="בחר" />
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
                  <InputItem
                    label="טלפון חירום"
                    icon={Phone}
                    className="bg-transparent"
                  >
                    <Input
                      disabled={readOnly}
                      value={emergencyDetails.phone}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          phone: e.target.value,
                        })
                      }
                      className="bg-transparent border-red-200/50 focus-visible:ring-red-500/30 font-mono"
                      dir="ltr"
                    />
                  </InputItem>
                </div>
              </div>
            </div>
          </CompactCard>

          {/* Service & Security Data */}
          <CompactCard
            title={
              <span className="flex items-center gap-2 text-primary font-black text-lg">
                <Shield className="w-5 h-5" /> נתוני שירות ואבטחה
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
                  <Calendar className="w-4 h-4" /> תאריכי שירות
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      תאריך גיוס
                    </Label>
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
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      שחרור צפוי
                    </Label>
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
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
                  <Shield className="w-4 h-4" /> אישורים והרשאות
                </h4>
                <div className="space-y-3">
                  <SwitchItem
                    disabled={readOnly}
                    label="סיווג ביטחוני"
                    checked={!!formData.security_clearance}
                    onChange={(c: boolean) =>
                      handleFieldChange("security_clearance", c)
                    }
                  />
                  <div className="flex items-center justify-between p-3 rounded-xl border transition-colors bg-transparent border-border/50 hover:bg-muted/30">
                    <Label className="cursor-pointer flex-1 font-medium text-sm">
                      רישיון נהיגה משטרתי
                    </Label>
                    <Switch
                      disabled={readOnly}
                      checked={!!formData.police_license}
                      onCheckedChange={(c: boolean) =>
                        handleFieldChange("police_license", c)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CompactCard>

          {/* History Section - Added per user request */}
          {!readOnly && (
            <CompactCard
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2 text-primary font-black text-lg">
                    <History className="w-5 h-5" /> היסטוריית דיווחים אישית
                  </span>
                  <div className="flex gap-2"></div>
                </div>
              }
            >
              <StatusHistoryList employeeId={userId} limit={10} showControls />
            </CompactCard>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Helper Components (Matches EditEmployeePage style) ---

const InputItem = ({
  label,
  icon: Icon,
  required,
  children,
  className,
}: any) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}{" "}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {children}
  </div>
);

const SwitchItem = ({ label, checked, onChange, highlight }: any) => (
  <div
    className={cn(
      "flex items-center justify-between p-3 rounded-xl border transition-colors",
      checked
        ? highlight
          ? "bg-primary/5 border-primary/20"
          : "bg-muted/50 border-primary/20"
        : "bg-transparent border-border/50 hover:bg-muted/30",
    )}
  >
    <Label className="cursor-pointer flex-1 font-medium text-sm">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);
