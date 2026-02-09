import { Button } from "@/components/ui/button";
import { Save, Loader2, User, Phone, Shield, HeartPulse } from "lucide-react";
import {
  CompactCard,
  DashboardGrid,
  FormField,
  ToggleField,
} from "@/components/forms/EmployeeFormComponents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileSettingsProps {
  formData: any;
  setFormData: (data: any) => void;
  emergencyDetails: any;
  setEmergencyDetails: (data: any) => void;
  relations: string[];
  isSaving: boolean;
  handleSaveProfile: () => void;
  handleImageUpload: () => void;
}

export function ProfileSettings({
  formData,
  setFormData,
  emergencyDetails,
  setEmergencyDetails,
  relations,
  isSaving,
  handleSaveProfile,
}: ProfileSettingsProps) {
  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 mt-6 pb-24">
      <DashboardGrid>
        {/* Sidebar Summary - Sticky & Compact */}
        <div className="hidden xl:block xl:col-span-3 sticky top-24 space-y-4">
          <CompactCard className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="text-center space-y-4 py-2">
              <div className="relative inline-block group">
                <div className="w-24 h-24 rounded-full bg-white border-2 border-primary/20 flex items-center justify-center text-4xl font-bold text-primary mx-auto shadow-sm group-hover:scale-105 transition-transform duration-300">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-foreground text-xl tracking-tight">
                  {formData.first_name} {formData.last_name}
                </h3>
                <p className="text-xs font-mono bg-background/80 py-1 px-3 rounded border border-border/50 inline-block text-muted-foreground mt-1">
                  {formData.personal_number || "-------"}
                </p>
              </div>

              <div className="pt-2 w-full">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full h-10 font-medium shadow-md shadow-primary/10 transition-all hover:shadow-primary/20"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      שומר...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      שמור שינויים
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CompactCard>

          <div className="bg-card rounded-lg border border-border/60 shadow-sm overflow-hidden text-sm">
            <div className="p-3 bg-muted/30 font-medium text-xs text-muted-foreground uppercase tracking-wider">
              ניווט מהיר
            </div>
            <div className="divide-y divide-border/40">
              <button
                onClick={() => scrollToSection("personal")}
                className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4 text-muted-foreground" /> פרטים אישיים
              </button>
              <button
                onClick={() => scrollToSection("emergency")}
                className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <HeartPulse className="w-4 h-4 text-muted-foreground" /> חירום
                ורפואה
              </button>
              <button
                onClick={() => scrollToSection("service")}
                className="w-full text-right px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-muted-foreground" /> שירות
                והרשאות
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-1 xl:col-span-9 space-y-4">
          {/* Row 1: Personal + Contact */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4" id="personal">
            <div className="md:col-span-8">
              <CompactCard
                title={
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> מידע אישי בסיסי
                  </span>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    field={{
                      name: "first_name",
                      label: "שם פרטי",
                      required: true,
                    }}
                    value={formData.first_name}
                    onChange={(v) => handleFieldChange("first_name", v)}
                  />
                  <FormField
                    field={{
                      name: "last_name",
                      label: "שם משפחה",
                      required: true,
                    }}
                    value={formData.last_name}
                    onChange={(v) => handleFieldChange("last_name", v)}
                  />
                  <FormField
                    field={{
                      name: "personal_number",
                      label: "מספר אישי",
                      required: true,
                      className: "font-mono",
                    }}
                    value={formData.personal_number}
                    onChange={(v) => handleFieldChange("personal_number", v)}
                  />
                  <FormField
                    field={{
                      name: "national_id",
                      label: "תעודת זהות",
                      className: "font-mono",
                    }}
                    value={formData.national_id}
                    onChange={(v) => handleFieldChange("national_id", v)}
                  />
                  <div className="sm:col-span-2 lg:col-span-1">
                    <FormField
                      field={{
                        name: "birth_date",
                        label: "תאריך לידה",
                        type: "date",
                      }}
                      value={formData.birth_date}
                      onChange={(v) => handleFieldChange("birth_date", v)}
                    />
                  </div>
                </div>
              </CompactCard>
            </div>

            <div className="md:col-span-4">
              <CompactCard
                title={
                  <span className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" /> פרטי התקשרות
                  </span>
                }
              >
                <div className="space-y-3">
                  <FormField
                    field={{
                      name: "phone_number",
                      label: "טלפון נייד",
                      type: "tel",
                    }}
                    value={formData.phone_number}
                    onChange={(v) => handleFieldChange("phone_number", v)}
                  />
                  <FormField
                    field={{ name: "email", label: "אימייל", type: "email" }}
                    value={formData.email}
                    onChange={(v) => handleFieldChange("email", v)}
                  />
                  <FormField
                    field={{ name: "city", label: "עיר מגורים" }}
                    value={formData.city}
                    onChange={(v) => handleFieldChange("city", v)}
                  />
                </div>
              </CompactCard>
            </div>
          </div>

          {/* Row 2: Emergency + Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompactCard
              title={
                <span className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-primary" /> איש קשר לחירום
                </span>
              }
              id="emergency"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium">שם מלא</Label>
                  <Input
                    className="h-9"
                    value={emergencyDetails.name}
                    onChange={(e) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        name: e.target.value,
                      })
                    }
                    placeholder="שם איש הקשר"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">קרבה</Label>
                  <Select
                    value={emergencyDetails.relation}
                    onValueChange={(val) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        relation: val,
                      })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="בחר קרבה" />
                    </SelectTrigger>
                    <SelectContent>
                      {relations.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">טלפון</Label>
                  <Input
                    className="h-9 font-mono"
                    type="tel"
                    value={emergencyDetails.phone}
                    onChange={(e) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        phone: e.target.value,
                      })
                    }
                    placeholder="050..."
                  />
                </div>
              </div>
            </CompactCard>

            <CompactCard
              title={
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> שירות והרשאות
                </span>
              }
              id="service"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    field={{
                      name: "enlistment_date",
                      label: "תאריך גיוס",
                      type: "date",
                    }}
                    value={formData.enlistment_date}
                    onChange={(v) => handleFieldChange("enlistment_date", v)}
                  />
                  <FormField
                    field={{
                      name: "discharge_date",
                      label: "תאריך שחרור",
                      type: "date",
                    }}
                    value={formData.discharge_date}
                    onChange={(v) => handleFieldChange("discharge_date", v)}
                  />
                </div>
                <div className="border-t border-border/40 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ToggleField
                    label="סיווג ביטחוני"
                    checked={formData.security_clearance || false}
                    onChange={(v) => handleFieldChange("security_clearance", v)}
                  />
                  <ToggleField
                    label="רישיון משטרתי"
                    checked={formData.police_license || false}
                    onChange={(v) => handleFieldChange("police_license", v)}
                  />
                </div>
              </div>
            </CompactCard>
          </div>

          {/* Mobile Save Button */}
          <div className="xl:hidden flex justify-end pt-4 sticky bottom-6 z-10">
            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              size="lg"
              className="w-full sm:w-auto px-8 shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </div>
      </DashboardGrid>
    </div>
  );
}
