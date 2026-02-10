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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-24 lg:pb-0 lg:space-y-6">

      {/* Header Actions (Desktop Only) */}
      <div className="hidden lg:flex flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            פרופיל אישי
          </h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
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

      {/* ============================================================================== */}
      {/* MOBILE CONTENT (Clean & Minimalist) */}
      {/* ============================================================================== */}
      <div className="lg:hidden flex flex-col gap-6">

        {/* Floating Island Header */}
        <div className="relative mt-4">
          <div className="mx-auto w-full max-w-[85%] bg-card/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20 flex items-center justify-center text-3xl font-black text-primary-foreground shrink-0 rotate-3 transition-transform hover:rotate-0">
                {formData.first_name?.[0]}{formData.last_name?.[0]}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-card rounded-full shadow-sm animate-pulse"></div>
            </div>

            {/* User Details */}
            <div className="space-y-1 relative z-10">
              <h3 className="text-2xl font-black tracking-tight text-foreground">
                {formData.first_name} {formData.last_name}
              </h3>
              <p className="text-sm font-bold text-primary/80 uppercase tracking-wide">
                {formData.role || "משתמש מערכת"}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full border border-border/50 shadow-sm mt-1">
                <span className="text-xs font-mono font-medium text-muted-foreground tracking-wider">
                  {formData.personal_number || "-------"}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Forms Stack - Unified Design */}
        <div className="space-y-4">

          {/* Personal Info */}
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                מידע אישי
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">שם פרטי</Label>
                  <Input value={formData.first_name} onChange={(e) => handleFieldChange("first_name", e.target.value)} className="h-10 bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">שם משפחה</Label>
                  <Input value={formData.last_name} onChange={(e) => handleFieldChange("last_name", e.target.value)} className="h-10 bg-muted/40" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">מין</Label>
                <Select value={formData.gender || "male"} onValueChange={(val) => handleFieldChange("gender", val)}>
                  <SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="בחר מין" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">גבר</SelectItem>
                    <SelectItem value="female">אישה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">תעודת זהות</Label>
                <Input value={formData.national_id} onChange={(e) => handleFieldChange("national_id", e.target.value)} className="h-10 bg-muted/40 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">עיר מגורים</Label>
                <Input value={formData.city} onChange={(e) => handleFieldChange("city", e.target.value)} className="h-10 bg-muted/40" />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                פרטי קשר
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">טלפון נייד</Label>
                <Input type="tel" value={formData.phone_number} onChange={(e) => handleFieldChange("phone_number", e.target.value)} className="h-10 bg-muted/40 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">אימייל</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleFieldChange("email", e.target.value)} className="h-10 bg-muted/40" />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Info */}
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-muted-foreground" />
                חירום
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">שם מלא</Label>
                <Input value={emergencyDetails.name} onChange={(e) => setEmergencyDetails({ ...emergencyDetails, name: e.target.value })} className="h-10 bg-muted/40" placeholder="איש קשר..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">קרבה</Label>
                <Select value={emergencyDetails.relation} onValueChange={(val) => setEmergencyDetails({ ...emergencyDetails, relation: val })}>
                  <SelectTrigger className="h-10 bg-muted/40"><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>{relations.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">טלפון</Label>
                <Input type="tel" value={emergencyDetails.phone} onChange={(e) => setEmergencyDetails({ ...emergencyDetails, phone: e.target.value })} className="h-10 bg-muted/40 font-mono" />
              </div>
            </CardContent>
          </Card>

          {/* Service Settings */}
          <Card className="border shadow-sm mb-20">
            <CardHeader className="py-4 px-5 border-b bg-muted/20">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                שירות
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">סיווג ביטחוני</span>
                <Switch checked={formData.security_clearance} onCheckedChange={(v) => handleFieldChange("security_clearance", v)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">רישיון משטרתי</span>
                <Switch checked={formData.police_license} onCheckedChange={(v) => handleFieldChange("police_license", v)} />
              </div>

            </CardContent>
          </Card>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full h-12 rounded-xl shadow-md text-base font-bold mb-8"
          >
            {isSaving ? (
              <Loader2 className="animate-spin ml-2 h-4 w-4" />
            ) : (
              <Save className="ml-2 h-4 w-4" />
            )}
            שמור שינויים
          </Button>

        </div>

        {/* Floating Save Button */}


      </div>

      {/* ============================================================================== */}
      {/* DESKTOP CONTENT (Original Grid) */}
      {/* ============================================================================== */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
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
                <Label>מין</Label>
                <Select
                  value={formData.gender || "male"}
                  onValueChange={(val) => handleFieldChange("gender", val)}
                >
                  <SelectTrigger className="bg-muted/20 focus:bg-background">
                    <SelectValue placeholder="בחר מין" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">גבר</SelectItem>
                    <SelectItem value="female">אישה</SelectItem>
                  </SelectContent>
                </Select>
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
