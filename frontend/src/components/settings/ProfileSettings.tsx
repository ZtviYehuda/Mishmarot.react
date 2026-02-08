import {
  User,
  Calendar,
  Phone,
  Mail,
  Shield,
  MapPin,
  FileUser,
  Contact,
  Save,
  Camera,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cleanUnitName } from "@/lib/utils";

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
}: ProfileSettingsProps) {
  // Check if there are any changes
  const hasChanges = () => {
    if (!user) return false;

    // Check basic fields
    const basicChanged =
      formData.first_name !== (user.first_name || "") ||
      formData.last_name !== (user.last_name || "") ||
      formData.phone_number !== (user.phone_number || "") ||
      formData.email !== (user.email || "") ||
      formData.city !== (user.city || "") ||
      formData.national_id !== (user.national_id || "") ||
      (formData.birth_date ? formData.birth_date.split("T")[0] : "") !==
        (user.birth_date ? user.birth_date.split("T")[0] : "") ||
      (formData.enlistment_date
        ? formData.enlistment_date.split("T")[0]
        : "") !==
        (user.enlistment_date ? user.enlistment_date.split("T")[0] : "") ||
      (formData.assignment_date
        ? formData.assignment_date.split("T")[0]
        : "") !==
        (user.assignment_date ? user.assignment_date.split("T")[0] : "") ||
      (formData.discharge_date ? formData.discharge_date.split("T")[0] : "") !==
        (user.discharge_date ? user.discharge_date.split("T")[0] : "") ||
      formData.police_license !== !!user.police_license ||
      formData.security_clearance !== !!user.security_clearance;

    // Check emergency contact
    // Parse user emergency contact string for comparison
    let userEmergName = "";
    let userEmergRel = "";
    let userEmergPhone = "";

    if (user.emergency_contact) {
      const match = user.emergency_contact.match(/^(.*) \((.*)\) - (.*)$/);
      if (match) {
        userEmergName = match[1];
        userEmergRel = match[2];
        userEmergPhone = match[3];
      } else {
        userEmergName = user.emergency_contact;
      }
    }

    const emergencyChanged =
      emergencyDetails.name !== userEmergName ||
      (emergencyDetails.relation !== userEmergRel &&
        emergencyDetails.relation !== "") || // Handle case where relation might be empty in user data but parsed
      emergencyDetails.phone !== userEmergPhone;

    return basicChanged || emergencyChanged;
  };

  const isDirty = hasChanges();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Summary Section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-card border rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 w-full md:w-auto">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/10 shadow-inner">
              <span className="text-2xl font-black text-muted-foreground/50">
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </span>
            </div>
            <button
              onClick={handleImageUpload}
              className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:scale-110 transition-all ring-2 ring-background"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1 flex flex-col items-center sm:items-start text-center sm:text-right w-full">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center justify-center sm:justify-start gap-2">
              {user?.first_name} {user?.last_name}
              <Badge
                variant="outline"
                className="text-xs font-bold bg-primary/5 text-primary border-primary/20 h-5"
              >
                {user?.role_name || "משתמש"}
              </Badge>
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <FileUser className="w-3.5 h-3.5 opacity-70" />
                מ.א:{" "}
                <span className="font-mono text-foreground font-bold">
                  {user?.personal_number}
                </span>
              </span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="flex items-center gap-1.5">
                {user?.commands_team_id ||
                user?.commands_section_id ||
                user?.commands_department_id ? (
                  <>
                    <Shield className="w-3.5 h-3.5 opacity-70" />
                    {user?.commands_department_id
                      ? `מפקד מחלקת ${cleanUnitName(user.department_name)}`
                      : user?.commands_section_id
                        ? `מפקד מדור ${cleanUnitName(user.section_name)}`
                        : `מפקד חוליית ${cleanUnitName(user.team_name)}`}
                  </>
                ) : (
                  <>
                    {user?.department_name ||
                      user?.section_name ||
                      user?.team_name ||
                      "ללא שיוך יחידה"}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <Card className="border-0 ring-1 ring-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {/* Section 1: Basic & Contact Info */}
          <div className="p-4 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-foreground">
                פרטים אישיים ודרכי התקשרות
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>שם פרטי</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>שם משפחה</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>מספר זהות</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData({ ...formData, national_id: e.target.value })
                  }
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך לידה</Label>
                <Input
                  type="date"
                  value={
                    formData.birth_date ? formData.birth_date.split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  className="bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Label>עיר מגורים</Label>
                <div className="relative">
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="bg-muted/30 pl-8"
                  />
                  <MapPin className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5 opacity-50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>טלפון נייד</Label>
                <div className="relative">
                  <Input
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    className="bg-muted/30 text-left ltr pl-8"
                    placeholder="05X-XXXXXXX"
                  />
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5 opacity-50" />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>כתובת אימייל</Label>
                <div className="relative">
                  <Input
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-muted/30 text-left ltr pl-8"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-2.5 top-2.5 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Service Info */}
          <div className="p-6 md:p-8 bg-muted/5">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-foreground">פרטי שירות</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-muted-foreground">תאריך גיוס</Label>
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
                  className="bg-background border-muted-foreground/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">כניסה לתפקיד</Label>
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
                  className="bg-background border-muted-foreground/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  תאריך שחרור (צפוי)
                </Label>
                <Input
                  type="date"
                  value={
                    formData.discharge_date
                      ? formData.discharge_date.split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({ ...formData, discharge_date: e.target.value })
                  }
                  className="bg-background border-muted-foreground/20"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 3: Emergency & Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse">
            {/* Emergency Contact */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
                  <Contact className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-foreground">
                  איש קשר לחירום
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>שם מלא</Label>
                    <Input
                      value={emergencyDetails.name}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>קרבה</Label>
                    <Select
                      value={emergencyDetails.relation}
                      onValueChange={(val) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          relation: val,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="בחר" />
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
                  <div className="space-y-2">
                    <Label>טלפון</Label>
                    <Input
                      value={emergencyDetails.phone}
                      onChange={(e) =>
                        setEmergencyDetails({
                          ...emergencyDetails,
                          phone: e.target.value,
                        })
                      }
                      className="text-left ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-foreground">
                  אישורים והרשאות
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">סיווג ביטחוני</Label>
                    <p className="text-xs text-muted-foreground">
                      נדרש עבור גישה למערכות מסווגות
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.security_clearance}
                    onCheckedChange={(c) =>
                      setFormData({
                        ...formData,
                        security_clearance: c === true,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold">רישיון משטרתי</Label>
                    <p className="text-xs text-muted-foreground">
                      אישור נהיגה ברכב משטרתי
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.police_license}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, police_license: c === true })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button - Moved to bottom */}
      <div
        className={`flex justify-end pt-2 pb-6 transition-all duration-500 ${isDirty ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
      >
        <Button
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full md:w-auto bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 rounded-xl px-8 py-6 text-base min-w-[180px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              שומר שינויים...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 ml-2" />
              שמור שינויים
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
