import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  CreateEmployeePayload,
  DepartmentNode,
  ServiceType,
  SectionNode,
  TeamNode,
} from "@/types/employee.types";
import {
  Loader2,
  UserPlus,
  User,
  Calendar,
  Phone,
  Shield,
  Building2,
  Save,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { cn, cleanUnitName } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

// --- Styled Components (Identical to EditPage) ---

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <div className="flex items-start gap-4 mb-6" dir="rtl">
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 shadow-lg shadow-primary/20 flex items-center justify-center text-primary-foreground shrink-0">
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h2 className="text-xl font-black text-foreground leading-tight text-right">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground font-bold pt-1 text-right">
        {description}
      </p>
    </div>
  </div>
);

const FormField = ({
  label,
  children,
  required,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
}) => (
  <div className="space-y-2 group" dir="rtl">
    <label className="text-sm font-bold text-muted-foreground/80 flex items-center gap-1 group-focus-within:text-primary transition-colors">
      {label}
      {required && <span className="text-destructive">*</span>}
    </label>
    <div className="relative">
      {children}
      {error && (
        <span className="text-xs text-destructive absolute -bottom-5 right-0 font-medium">
          {error}
        </span>
      )}
    </div>
  </div>
);

const ToggleCard = ({
  label,
  checked,
  onChange,
  icon: Icon,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ElementType;
  description?: string;
}) => (
  <div
    onClick={() => onChange(!checked)}
    className={cn(
      "relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer select-none group hover:shadow-md",
      checked
        ? "bg-primary/5 border-primary shadow-sm"
        : "bg-card border-border hover:border-accent",
    )}
    dir="rtl"
  >
    <div className="flex items-center gap-4 relative z-10">
      {Icon && (
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            checked
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div>
        <span
          className={cn(
            "block text-base font-bold transition-colors text-right",
            checked ? "text-primary" : "text-foreground/80",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground/60 font-medium text-right block">
            {description}
          </span>
        )}
      </div>
    </div>
    <div
      className={cn(
        "w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner",
        checked ? "bg-primary" : "bg-muted-foreground/20",
      )}
    >
      <div
        className={cn(
          "w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
          checked ? "left-1" : "left-6",
        )}
      />
    </div>
  </div>
);

// --- Main Page ---

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createEmployee, getStructure, getServiceTypes } = useEmployees();
  const [loading, setLoading] = useState(false);
  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

  // Selection States
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  // Tab State
  const [activeTab, setActiveTab] = useState("personal");

  const [formData, setFormData] = useState<CreateEmployeePayload>({
    first_name: "",
    last_name: "",
    personal_number: "",
    national_id: "",
    phone_number: "",
    city: "",
    birth_date: "",
    enlistment_date: "",
    discharge_date: "",
    assignment_date: "",
    team_id: undefined,
    section_id: undefined,
    department_id: undefined,
    role_id: undefined,
    service_type_id: undefined,
    is_commander: false,
    is_admin: false,
    security_clearance: false,
    police_license: false,
    employment_clearance: false,
    notif_sick_leave: true,
    notif_transfers: true,
    emergency_contact: "",
    is_active: true,
  });

  const [commanderWarning, setCommanderWarning] = useState<{
    name: string;
    unitType: string;
  } | null>(null);

  // Emergency Contact State
  const [emergencyDetails, setEmergencyDetails] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const relations = [
    "בן / בת זוג",
    "אבא / אמא",
    "אח / אחות",
    "בן / בת",
    "סבא / סבתא",
    "חבר / חברה",
    "אחר",
  ];

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      const [structData, srvData] = await Promise.all([
        getStructure(),
        getServiceTypes(),
      ]);

      if (structData) setStructure(structData);
      if (srvData) setServiceTypes(srvData);
    };
    fetchData();
  }, [getStructure, getServiceTypes]);

  // Scoping Effect
  useEffect(() => {
    if (!user || user.is_admin || structure.length === 0) return;

    if (user.commands_team_id) {
      const teamId = user.commands_team_id;
      for (const dept of structure) {
        for (const sec of dept.sections) {
          const team = sec.teams.find((t: TeamNode) => t.id === teamId);
          if (team) {
            setSelectedDeptId(dept.id.toString());
            setSelectedSectionId(sec.id.toString());
            setFormData((prev) => ({ ...prev, team_id: teamId }));
            return;
          }
        }
      }
    } else if (user.commands_section_id) {
      const secId = user.commands_section_id;
      for (const dept of structure) {
        const sec = dept.sections.find((s: SectionNode) => s.id === secId);
        if (sec) {
          setSelectedDeptId(dept.id.toString());
          setSelectedSectionId(secId.toString());
          return;
        }
      }
    } else if (user.commands_department_id) {
      setSelectedDeptId(user.commands_department_id.toString());
    } else if (user.assigned_department_id) {
      setSelectedDeptId(user.assigned_department_id.toString());
      if (user.assigned_section_id) {
        setSelectedSectionId(user.assigned_section_id.toString());
      }
    }
  }, [user, structure]);

  // Update formData when emergency details change
  useEffect(() => {
    const { name, relation, phone } = emergencyDetails;
    if (name || relation || phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contact: `${name} (${relation}) - ${phone}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, emergency_contact: "" }));
    }
  }, [emergencyDetails]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.personal_number
    ) {
      toast.error("נא למלא את כל שדות החובה");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      section_id: selectedSectionId ? parseInt(selectedSectionId) : undefined,
      department_id: selectedDeptId ? parseInt(selectedDeptId) : undefined,
    };

    const success = await createEmployee(payload);
    setLoading(false);
    if (success) {
      toast.success("שוטר נוסף בהצלחה");
      navigate("/employees");
    }
  };

  // Derived Options
  const sections =
    structure.find((d) => d.id.toString() === selectedDeptId)?.sections || [];
  const teams =
    sections.find((s) => s.id.toString() === selectedSectionId)?.teams || [];

  const TabButton = ({
    value,
    label,
    icon: Icon,
  }: {
    value: string;
    label: string;
    icon: any;
  }) => (
    <TabsTrigger
      value={value}
      className="flex-1 min-w-[120px] py-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-xl transition-all border border-transparent data-[state=active]:border-border font-bold text-sm gap-2 text-muted-foreground hover:bg-muted hover:text-foreground/80"
    >
      <Icon className="w-4 h-4 mb-0.5" />
      {label}
    </TabsTrigger>
  );

  return (
    <div
      className="min-h-screen bg-background pb-20 animate-in fade-in duration-500"
      dir="rtl"
    >
      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon={UserPlus}
            title="הוספת שוטר חדש"
            subtitle="יצירת כרטיס שוטר חדש במערכת, הגדרת הרשאות ושיוך ארגוני"
            category="ניהול שוטרים"
            categoryLink="/employees"
            iconClassName="from-primary/10 to-primary/5 border-primary/20"
            badge={
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate("/employees")}
                  className="border-input hover:bg-muted h-11 px-6 rounded-xl font-bold shadow-sm text-muted-foreground"
                >
                  ביטול
                </Button>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl px-8 h-11 font-black transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      שמור שוטר
                    </>
                  )}
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Sidebar Profile Summary (Live Preview) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="border-none shadow-lg shadow-primary/5 bg-card rounded-3xl overflow-hidden ring-1 ring-border">
              <div className="p-8 flex flex-col items-center text-center">
                {/* Minimal Avatar */}
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-foreground/70 mb-5 ring-4 ring-background shadow-sm">
                  {formData.first_name?.[0] || "?"}
                  {formData.last_name?.[0] || "?"}
                </div>

                {/* User Info */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {formData.first_name || "שם פרטי"}{" "}
                  {formData.last_name || "משפחה"}
                </h2>
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-mono font-medium text-muted-foreground tracking-wide">
                  {formData.personal_number || "-------"}
                </span>

                {/* Divider */}
                <div className="w-full h-px bg-border my-6" />

                {/* Stats List - Clean */}
                <div className="w-full space-y-4">
                  {/* Hierarchy Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מחלקה</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(
                        structure.find(
                          (d) => d.id === Number(formData.department_id),
                        )?.name,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מדור</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(
                        structure
                          .find((d) => d.id === Number(formData.department_id))
                          ?.sections.find(
                            (s) => s.id === Number(formData.section_id),
                          )?.name,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">חוליה</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(
                        structure
                          .find((d) => d.id === Number(formData.department_id))
                          ?.sections.find(
                            (s) => s.id === Number(formData.section_id),
                          )
                          ?.teams.find((t) => t.id === Number(formData.team_id))
                          ?.name,
                      )}
                    </span>
                  </div>

                  <div className="w-full h-px bg-border/50 my-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">דרגה/תפקיד</span>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <span>חדש</span>
                      <BadgeCheck className="w-4 h-4 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">סיווג ביטחוני</span>
                    <div className="flex gap-1 items-center">
                      <span
                        className={cn(
                          "font-medium",
                          formData.security_clearance
                            ? "text-primary"
                            : "text-muted-foreground/60",
                        )}
                      >
                        {formData.security_clearance ? "קיים" : "חסר"}
                      </span>
                      {formData.security_clearance && (
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">סטטוס ניהולי</span>
                    <span
                      className={cn(
                        "font-medium",
                        formData.is_commander
                          ? "text-primary"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {formData.is_commander ? "מפקד" : "רגיל"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-9">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            dir="rtl"
            className="w-full"
          >
            <div className="bg-muted/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto lg:mx-0 lg:w-full overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-full justify-start lg:justify-between min-w-[500px]">
                <TabButton value="personal" label="פרטים אישיים" icon={User} />
                <TabButton value="org" label="שיוך יחידתי" icon={Building2} />
                <TabButton
                  value="service_security"
                  label="שירות ואבטחה"
                  icon={Shield}
                />
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent
                  value="personal"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-8 space-y-8">
                      <SectionHeader
                        icon={User}
                        title="מידע אישי בסיסי"
                        description="הזנת פרטי זהות ופרטים אישיים"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField label="שם פרטי" required>
                          <Input
                            value={formData.first_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                first_name: e.target.value,
                              })
                            }
                            className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl text-right"
                            placeholder="הזן שם פרטי"
                          />
                        </FormField>
                        <FormField label="שם משפחה" required>
                          <Input
                            value={formData.last_name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                last_name: e.target.value,
                              })
                            }
                            className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl text-right"
                            placeholder="הזן שם משפחה"
                          />
                        </FormField>
                        <FormField label="מספר אישי" required>
                          <Input
                            value={formData.personal_number}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                personal_number: e.target.value,
                              })
                            }
                            className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl font-mono tracking-wide text-right"
                            placeholder="1234567"
                          />
                        </FormField>
                        <FormField label="תעודת זהות" required>
                          <Input
                            value={formData.national_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                national_id: e.target.value,
                              })
                            }
                            className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl font-mono tracking-wide text-right"
                            placeholder="012345678"
                          />
                        </FormField>
                        <FormField label="תאריך לידה">
                          <div className="relative">
                            <Input
                              type="date"
                              value={formData.birth_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  birth_date: e.target.value,
                                })
                              }
                              className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl text-right pr-4"
                            />
                            <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground/50 pointer-events-none" />
                          </div>
                        </FormField>
                      </div>

                      <div className="w-full h-px bg-border my-8" />

                      <SectionHeader
                        icon={Phone}
                        title="דרכי התקשרות"
                        description="הזנת כתובת, טלפונים ואנשי קשר"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField label="טלפון נייד">
                          <div className="relative">
                            <Phone className="absolute right-3 top-3.5 w-5 h-5 text-muted-foreground/50" />
                            <Input
                              value={formData.phone_number}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  phone_number: e.target.value,
                                })
                              }
                              className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl pr-10 text-right"
                              placeholder="05X-XXXXXXX"
                            />
                          </div>
                        </FormField>
                        <FormField label="עיר מגורים">
                          <Input
                            value={formData.city}
                            onChange={(e) =>
                              setFormData({ ...formData, city: e.target.value })
                            }
                            className="h-12 bg-muted/50 border-input focus:bg-card transition-all rounded-xl text-right"
                            placeholder="לדוגמה: תל אביב"
                          />
                        </FormField>
                        <div className="md:col-span-2">
                          {/* Emergency Contact Group */}
                          <div className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center gap-2">
                              <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                                <Phone className="w-4 h-4" />
                              </div>
                              <h4 className="font-bold text-sm text-foreground/80">
                                איש קשר לחירום
                              </h4>
                            </div>

                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="שם איש קשר">
                                  <Input
                                    value={emergencyDetails.name}
                                    onChange={(e) =>
                                      setEmergencyDetails((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                      }))
                                    }
                                    placeholder="שם מלא"
                                    className="bg-muted/30 border-input focus:bg-background transition-colors text-right"
                                  />
                                </FormField>

                                <FormField label="קרבה">
                                  <Select
                                    value={emergencyDetails.relation}
                                    onValueChange={(val) =>
                                      setEmergencyDetails((prev) => ({
                                        ...prev,
                                        relation: val,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="bg-muted/30 border-input text-right focus:bg-background transition-colors h-10">
                                      <SelectValue placeholder="בחר קרבה" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                      {relations.map((rel) => (
                                        <SelectItem key={rel} value={rel}>
                                          {rel}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormField>
                              </div>

                              <FormField label="טלפון איש קשר">
                                <Input
                                  type="tel"
                                  value={emergencyDetails.phone}
                                  onChange={(e) =>
                                    setEmergencyDetails((prev) => ({
                                      ...prev,
                                      phone: e.target.value,
                                    }))
                                  }
                                  className="font-mono text-left ltr bg-muted/30 border-input focus:bg-background transition-colors"
                                  placeholder="050-0000000"
                                />
                              </FormField>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6">
                        <Button
                          onClick={() => setActiveTab("org")}
                          size="lg"
                          type="button"
                          className="rounded-xl px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          הבא: שיוך ארגוני{" "}
                          <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent
                  value="org"
                  className="mt-0 focus-visible:outline-none"
                >
                  <div className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                      <CardContent className="p-8">
                        <SectionHeader
                          icon={Building2}
                          title="מבנה ארגוני"
                          description="הגדרת מיקום השוטר בעץ הארגוני (מחלקה -> מדור -> חולייה)"
                        />

                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField label="מחלקה" required>
                            <Select
                              value={selectedDeptId}
                              onValueChange={(val) => {
                                setSelectedDeptId(val);
                                setSelectedSectionId("");
                                setFormData({
                                  ...formData,
                                  team_id: undefined,
                                });
                              }}
                              disabled={
                                !user?.is_admin &&
                                !!(
                                  user?.commands_department_id ||
                                  user?.commands_section_id ||
                                  user?.commands_team_id
                                )
                              }
                            >
                              <SelectTrigger className="text-right bg-white border-input h-14 text-lg font-medium px-4 shadow-sm">
                                <SelectValue placeholder="בחר מחלקה" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {structure.map((dept) => (
                                  <SelectItem
                                    key={dept.id}
                                    value={dept.id.toString()}
                                    className="text-lg py-3"
                                  >
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField label="מדור">
                            <Select
                              value={selectedSectionId}
                              onValueChange={(val) => {
                                setSelectedSectionId(val);
                                setFormData({
                                  ...formData,
                                  team_id: undefined,
                                });
                              }}
                              disabled={
                                !selectedDeptId ||
                                (!user?.is_admin &&
                                  !!(
                                    user?.commands_section_id ||
                                    user?.commands_team_id
                                  ))
                              }
                            >
                              <SelectTrigger className="text-right bg-white border-input h-14 text-lg font-medium px-4 shadow-sm">
                                <SelectValue
                                  placeholder={
                                    !selectedDeptId
                                      ? "בחר מחלקה..."
                                      : "בחר מדור"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {sections.map((sec) => (
                                  <SelectItem
                                    key={sec.id}
                                    value={sec.id.toString()}
                                    className="text-lg py-3"
                                  >
                                    {sec.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField label="חולייה">
                            <Select
                              value={formData.team_id?.toString() || ""}
                              onValueChange={(val) =>
                                setFormData({
                                  ...formData,
                                  team_id: parseInt(val),
                                })
                              }
                              disabled={
                                !selectedSectionId ||
                                (!user?.is_admin && !!user?.commands_team_id)
                              }
                            >
                              <SelectTrigger className="text-right bg-white border-input h-14 text-lg font-medium px-4 shadow-sm">
                                <SelectValue
                                  placeholder={
                                    !selectedSectionId
                                      ? "בחר מדור..."
                                      : "בחר חולייה"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {teams.map((t) => (
                                  <SelectItem
                                    key={t.id}
                                    value={t.id.toString()}
                                    className="text-lg py-3"
                                  >
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("personal")}
                        size="lg"
                        type="button"
                        className="rounded-xl px-8 border-2"
                      >
                        חזור לפרטים אישיים
                      </Button>
                      <Button
                        onClick={() => setActiveTab("service_security")}
                        size="lg"
                        type="button"
                        className="rounded-xl px-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        הבא: שירות ואבטחה{" "}
                        <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="service_security"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-8 space-y-8">
                      <SectionHeader
                        icon={Calendar}
                        title="נתוני שירות, תפקיד והרשאות"
                        description="הגדרת תאריכים, סוג שירות והרשאות מערכת"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField label="סוג שירות" required>
                          <Select
                            value={
                              formData.service_type_id?.toString() || "1" // Default to Hova or first one
                            }
                            onValueChange={(val) =>
                              setFormData({
                                ...formData,
                                service_type_id: parseInt(val),
                              })
                            }
                          >
                            <SelectTrigger className="text-right bg-muted/50 border-input h-12 rounded-xl">
                              <SelectValue placeholder="בחר סוג שירות" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                              {serviceTypes.map((st) => (
                                <SelectItem
                                  key={st.id}
                                  value={st.id.toString()}
                                >
                                  {st.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField label="תאריך גיוס">
                            <Input
                              type="date"
                              value={formData.enlistment_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  enlistment_date: e.target.value,
                                })
                              }
                              className="bg-muted/50 border-input rounded-xl"
                            />
                          </FormField>
                          <FormField label="תאריך הצבה">
                            <Input
                              type="date"
                              value={formData.assignment_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  assignment_date: e.target.value,
                                })
                              }
                              className="bg-muted/50 border-input rounded-xl"
                            />
                          </FormField>
                          <FormField label="תאריך שחרור (צפוי)">
                            <Input
                              type="date"
                              value={formData.discharge_date}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  discharge_date: e.target.value,
                                })
                              }
                              className="bg-muted/50 border-input rounded-xl"
                            />
                          </FormField>
                        </div>
                      </div>

                      <div className="w-full h-px bg-border my-8" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleCard
                          label="בעל סיווג ביטחוני"
                          description="האם לשוטר יש סיווג בתוקף?"
                          checked={formData.security_clearance || false}
                          onChange={(v) =>
                            setFormData({ ...formData, security_clearance: v })
                          }
                          icon={Shield}
                        />

                        <div className="space-y-4">
                          <ToggleCard
                            label="מפקד יחידה"
                            description="הגדרת השוטר כמפקד (מדור/מחלקה)"
                            checked={formData.is_commander || false}
                            onChange={(v) => {
                              if (v) {
                                // Logic to check if commander exists...
                                let existingName = "";
                                let unitType = "";
                                if (formData.team_id) {
                                  const t = teams.find(
                                    (x) => x.id === formData.team_id,
                                  );
                                  if (t?.commander_id) {
                                    existingName = t.commander_name || "";
                                    unitType = "חולייה";
                                  }
                                } else if (selectedSectionId) {
                                  const s = sections.find(
                                    (x) =>
                                      x.id.toString() === selectedSectionId,
                                  );
                                  if (s?.commander_id) {
                                    existingName = s.commander_name || "";
                                    unitType = "מדור";
                                  }
                                } else if (selectedDeptId) {
                                  const d = structure.find(
                                    (x) => x.id.toString() === selectedDeptId,
                                  );
                                  if (d?.commander_id) {
                                    existingName = d.commander_name || "";
                                    unitType = "מחלקה";
                                  }
                                }

                                if (existingName) {
                                  setCommanderWarning({
                                    name: existingName,
                                    unitType,
                                  });
                                  return;
                                }
                              }
                              setFormData({ ...formData, is_commander: v });
                            }}
                            icon={BadgeCheck}
                          />

                          {commanderWarning && (
                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                  <p className="text-sm text-amber-900 font-bold">
                                    שים לב: קיים מפקד ביחידה
                                  </p>
                                  <p className="text-xs text-amber-800 mt-1">
                                    השוטר {commanderWarning.name} כבר מוגדר
                                    כמפקד ה{commanderWarning.unitType}. האם
                                    להחליף?
                                  </p>
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      type="button"
                                      className="bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          is_commander: true,
                                        });
                                        setCommanderWarning(null);
                                      }}
                                    >
                                      כן, החלף מפקד
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      type="button"
                                      className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 h-8 text-xs"
                                      onClick={() => setCommanderWarning(null)}
                                    >
                                      ביטול
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <ToggleCard
                          label="רישיון משטרתי"
                          description="האם השוטר מחזיק ברישיון נהיגה משטרתי?"
                          checked={formData.police_license || false}
                          onChange={(v) =>
                            setFormData({ ...formData, police_license: v })
                          }
                          icon={AlertTriangle} // Or Car icon if available
                        />

                        <ToggleCard
                          label="התראות ימי מחלה"
                          description="קבלת התראות על ימי מחלה של כפופים"
                          checked={formData.notif_sick_leave || false}
                          onChange={(v) =>
                            setFormData({ ...formData, notif_sick_leave: v })
                          }
                          icon={Save} // Just a placeholder icon, maybe Bell
                        />
                      </div>

                      <div className="flex justify-between pt-6">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("org")}
                          size="lg"
                          type="button"
                          className="rounded-xl px-8 border-2"
                        >
                          חזור למבנה ארגוני
                        </Button>
                        <Button
                          onClick={() => handleSubmit()}
                          disabled={loading}
                          size="lg"
                          className="rounded-xl px-12 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-lg shadow-primary/20"
                        >
                          {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-5 h-5 ml-2" />
                              שמור שוטר חדש
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
