import { Button } from "@/components/ui/button";
import {
  Save,
  Loader2,
  User,
  Phone,
  Shield,
  HeartPulse,
  UserCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            פרופיל אישי
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium mr-12 md:mr-0">
            נהל את הפרטים האישיים, פרטי ההתקשרות ונתוני השירות שלך
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main User Info Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" />
                מידע אישי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>שם פרטי</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    handleFieldChange("first_name", e.target.value)
                  }
                  className="bg-muted/20 focus:bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>שם משפחה</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    handleFieldChange("last_name", e.target.value)
                  }
                  className="bg-muted/20 focus:bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>מספר אישי</Label>
                <Input
                  value={formData.personal_number}
                  readOnly
                  className="bg-muted font-mono text-muted-foreground cursor-not-allowed opacity-80"
                />
              </div>
              <div className="space-y-2">
                <Label>תעודת זהות</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) =>
                    handleFieldChange("national_id", e.target.value)
                  }
                  className="bg-muted/20 focus:bg-background font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>תאריך לידה</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    handleFieldChange("birth_date", e.target.value)
                  }
                  className="bg-muted/20 focus:bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>עיר מגורים</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleFieldChange("city", e.target.value)}
                  className="bg-muted/20 focus:bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-primary" />
                פרטי התקשרות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>טלפון נייד</Label>
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleFieldChange("phone_number", e.target.value)
                  }
                  className="bg-muted/20 focus:bg-background font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  className="bg-muted/20 focus:bg-background"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <HeartPulse className="w-5 h-5 text-rose-500" />
                איש קשר לחירום
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>שם מלא</Label>
                <Input
                  value={emergencyDetails.name}
                  onChange={(e) =>
                    setEmergencyDetails({
                      ...emergencyDetails,
                      name: e.target.value,
                    })
                  }
                  className="bg-muted/20 focus:bg-background"
                  placeholder="שם איש הקשר במקרה חירום"
                />
              </div>
              <div className="space-y-2">
                <Label>קרבה</Label>
                <Select
                  value={emergencyDetails.relation}
                  onValueChange={(val) =>
                    setEmergencyDetails({ ...emergencyDetails, relation: val })
                  }
                >
                  <SelectTrigger className="bg-muted/20 focus:bg-background">
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
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input
                  type="tel"
                  value={emergencyDetails.phone}
                  onChange={(e) =>
                    setEmergencyDetails({
                      ...emergencyDetails,
                      phone: e.target.value,
                    })
                  }
                  className="bg-muted/20 focus:bg-background font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Service Info & Summary */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/10 shadow-sm border overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-background border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-primary mx-auto">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  {formData.first_name} {formData.last_name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground mt-1 mx-auto bg-background/50 w-fit px-3 py-1 rounded-full border border-border/50">
                  {formData.personal_number || "-------"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                פרטי שירות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">
                    תאריך גיוס
                  </span>
                  <div className="font-mono text-sm font-bold bg-muted/30 p-2 rounded border border-border/50 text-center">
                    {formData.enlistment_date || "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground block">
                    תאריך שחרור
                  </span>
                  <div className="font-mono text-sm font-bold bg-muted/30 p-2 rounded border border-border/50 text-center">
                    {formData.discharge_date || "-"}
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">סיווג ביטחוני</span>
                  <Switch
                    checked={formData.security_clearance}
                    onCheckedChange={(v) =>
                      handleFieldChange("security_clearance", v)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-sm font-medium">רישיון משטרתי</span>
                  <Switch
                    checked={formData.police_license}
                    onCheckedChange={(v) =>
                      handleFieldChange("police_license", v)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
