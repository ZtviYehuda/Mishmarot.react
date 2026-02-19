import { Button } from "@/components/ui/button";
import {
  Save,
  User,
  Phone,
  Heart,
  Building2,
  Camera,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cleanUnitName } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileSettingsProps {
  user: any;
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
}: ProfileSettingsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-[1600px] mx-auto pb-24 lg:pb-0">
      <div className="grid grid-cols-12 gap-4 sm:gap-8">
        {/* Main Settings Area */}
        <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-8 order-2 lg:order-1">
          <SectionCard icon={User} title="פרטים אישיים">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <InputItem label="שם פרטי" required>
                <Input
                  disabled={readOnly}
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg focus:bg-background transition-all"
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
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg"
                  placeholder="ישראלי"
                />
              </InputItem>

              <InputItem label="מספר טלפון">
                <Input
                  disabled={readOnly}
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg"
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
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg"
                  placeholder="israel@example.com"
                />
              </InputItem>

              <InputItem label="עיר מגורים">
                <Input
                  disabled={readOnly}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg"
                  placeholder="תל אביב"
                />
              </InputItem>

              <InputItem label="תאריך לידה">
                <Input
                  disabled={readOnly}
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 font-bold text-base sm:text-lg text-right"
                />
              </InputItem>
            </div>
          </SectionCard>

          <SectionCard icon={Settings2} title="פרטי שירות ומזהים">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <InputItem label="מספר אישי / ת.ז" required>
                <div className="relative group">
                  <Input
                    disabled={readOnly}
                    value={formData.national_id}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value })
                    }
                    className="h-12 sm:h-14 bg-background/40 rounded-xl sm:rounded-2xl border-primary/5 pl-4 pr-12 font-bold text-base sm:text-lg"
                    placeholder="1234567"
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
          <SectionCard icon={Camera} title="תמונת פרופיל">
            <div className="flex flex-col items-center">
              <div
                className="w-full h-32 sm:h-40 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 relative overflow-hidden group mb-[-4rem] sm:mb-[-5rem]"
                onDoubleClick={handleImageUpload}
              >
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>

              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 sm:border-8 border-background bg-card flex items-center justify-center text-primary text-3xl sm:text-5xl font-black   z-10 relative group overflow-hidden">
                  <span className="group-hover:scale-110 transition-transform duration-500">
                    {user?.first_name?.[0]}
                    {user?.last_name?.[0]}
                  </span>
                  {!readOnly && (
                    <div
                      onClick={handleImageUpload}
                      className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1"
                    >
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-[8px] sm:text-[10px] font-black uppercase">
                        החלף
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500 border-2 sm:border-4 border-background rounded-full z-20" />
              </div>

              <div className="text-center mt-4 sm:mt-6 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">
                  {user?.first_name} {user?.last_name}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] sm:text-xs font-black rounded-full border border-primary/10">
                    {user?.national_id}
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
      className="bg-card/50 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] border border-primary/10 overflow-hidden"
    >
      <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-primary/10 bg-primary/5 flex items-center justify-between">
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
    <div className="p-4 sm:p-6 rounded-2xl sm:rounded-[3rem] bg-background/30 border border-primary/5 space-y-2 sm:space-y-3">
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
    <div className="p-4 rounded-2xl bg-primary/[0.03] border border-primary/10">
      <span className="text-[10px] font-black text-primary/40 block mb-1 uppercase tracking-widest leading-none">
        {label}
      </span>
      <span className="font-black text-sm text-foreground block truncate">
        {value || "—"}
      </span>
    </div>
  );
}
