import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Phone,
  Shield,
  Save,
  Building2,
  Calendar,
  Loader2,
  Settings2,
  Briefcase,
  BadgeCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, cleanUnitName } from "@/lib/utils";
import type {
  Employee,
  CreateEmployeePayload,
  DepartmentNode,
} from "@/types/employee.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";

// --- Styled Components ---

interface ServiceType {
  id: number;
  name: string;
}

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

export default function EditEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateEmployee, getStructure, getServiceTypes } = useEmployees();
  const { user } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Form State
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
    emergency_contact: "",
    is_active: true,
  });

  const [commanderWarning, setCommanderWarning] = useState<{
    name: string;
    unitType: string;
  } | null>(null);

  const [emergencyDetails, setEmergencyDetails] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  // Update formData when emergencyDetails changes
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

  const relations = [
    "בן / בת זוג",
    "אבא / אמא",
    "אח / אחות",
    "בן / בת",
    "סבא / סבתא",
    "חבר / חברה",
    "אחר",
  ];

  // Cascading & UI state
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("personal");
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  // Check if today is birthday
  const isBirthdayToday = () => {
    if (!formData.birth_date) return false;
    const today = new Date();
    const birthDate = new Date(formData.birth_date);
    return (
      today.getDate() === birthDate.getDate() &&
      today.getMonth() === birthDate.getMonth()
    );
  };

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const [structData, serviceData] = await Promise.all([
          getStructure(),
          getServiceTypes(),
        ]);
        setStructure(structData);
        setServiceTypes(serviceData);

        const { data } = await apiClient.get<Employee>(
          endpoints.updateEmployeeEndpoint(parseInt(id)),
        );
        setEmployee(data);

        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          personal_number: data.personal_number || "",
          national_id: data.national_id || "",
          phone_number: data.phone_number || "",
          city: data.city || "",
          birth_date: data.birth_date ? data.birth_date.split("T")[0] : "",
          enlistment_date: data.enlistment_date
            ? data.enlistment_date.split("T")[0]
            : "",
          discharge_date: data.discharge_date
            ? data.discharge_date.split("T")[0]
            : "",
          assignment_date: data.assignment_date
            ? data.assignment_date.split("T")[0]
            : "",
          team_id: data.team_id || undefined,
          section_id: data.section_id || undefined,
          department_id: data.department_id || undefined,
          role_id: data.role_id || undefined,
          service_type_id: data.service_type_id || undefined,
          is_commander: data.is_commander || false,
          is_admin: data.is_admin || false,
          security_clearance: !!data.security_clearance,
          police_license: data.police_license || false,
          emergency_contact: data.emergency_contact || "",
          is_active: data.is_active ?? true,
        });

        // Parse Emergency Contact
        if (data.emergency_contact) {
          const match = data.emergency_contact.match(/^(.*) \((.*)\) - (.*)$/);
          if (match) {
            setEmergencyDetails({
              name: match[1],
              relation: match[2],
              phone: match[3],
            });
          } else {
            // Fallback for unformatted strings
            setEmergencyDetails({
              name: data.emergency_contact,
              relation: "",
              phone: "",
            });
          }
        }

        if (data.department_id)
          setSelectedDeptId(data.department_id.toString());
        if (data.section_id) setSelectedSectionId(data.section_id.toString());
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("שגיאה בטעינת נתוני השוטר");
      } finally {
        setFetching(false);
      }
    };
    init();
  }, [id, getStructure, getServiceTypes]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id) return;

    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.personal_number
    ) {
      toast.error("אנא מלא את כל שדות החובה");
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      section_id: selectedSectionId ? parseInt(selectedSectionId) : null,
      department_id: selectedDeptId ? parseInt(selectedDeptId) : null,
      team_id: formData.team_id || null,
    };

    const success = await updateEmployee(parseInt(id), payload);
    if (success) {
      toast.success("תיק השוטר עודכן בהצלחה");
      navigate("/employees");
    }
    setLoading(false);
  };

  const sections =
    structure.find((d: any) => d.id.toString() === selectedDeptId)?.sections ||
    [];
  const teams =
    sections.find((s: any) => s.id.toString() === selectedSectionId)?.teams ||
    [];

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-background rounded-full"></div>
          </div>
        </div>
        <span className="mt-4 text-sm font-bold text-muted-foreground animate-pulse">
          טוען נתונים...
        </span>
      </div>
    );
  }

  if (!employee) return null;

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
            icon={Briefcase}
            title={`עריכת תיק: ${formData.first_name} ${formData.last_name}`}
            subtitle={`עדכון פרטים אישיים, שיוך ארגוני והרשאות אבטחה המזהה המערכתי: ${employee.personal_number}`}
            category="ניהול שוטרים"
            categoryLink="/employees"
            iconClassName="from-primary/10 to-primary/5 border-primary/20"
            badge={
              <div className="flex items-center gap-3">
                {isBirthdayToday() && employee && (
                  <Button
                    onClick={() => setShowBirthdayModal(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20 rounded-xl px-4 h-11 font-black gap-2 animate-bounce hover:animate-none"
                  >
                    <Sparkles className="w-5 h-5" />
                    שלח ברכת יום הולדת!
                  </Button>
                )}
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
                      שמור שינויים
                    </>
                  )}
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {employee && (
        <BirthdayGreetingsModal
          open={showBirthdayModal}
          onOpenChange={setShowBirthdayModal}
          employeesToday={[
            {
              id: employee.id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              birth_date: employee.birth_date || undefined,
              phone_number: employee.phone_number || undefined,
            },
          ]}
        />
      )}

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Sidebar Profile Summary - Positioned for Logic RTL (Col 1) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="border-none shadow-lg shadow-primary/5 bg-card rounded-3xl overflow-hidden ring-1 ring-border">
              <div className="p-8 flex flex-col items-center text-center">
                {/* Minimal Avatar */}
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-foreground/70 mb-5 ring-4 ring-background shadow-sm">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>

                {/* User Info */}
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {formData.first_name} {formData.last_name}
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
                      {/* Role Name would go here if available */}
                      <span>--</span>
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
                        description="עדכון פרטי זהות ופרטים אישיים של השוטר"
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
                        description="עדכון כתובת, טלפונים ואנשי קשר"
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
                          <div className="md:col-span-2">
                            {/* Emergency Contact Group - Redesigned */}
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
                      </div>

                      <div className="flex justify-end pt-6">
                        <Button
                          onClick={() => setActiveTab("org")}
                          size="lg"
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
                                setFormData({ ...formData, team_id: null });
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
                              <SelectTrigger className="h-12 bg-card border-input rounded-xl text-right font-bold text-foreground focus:ring-2 focus:ring-ring/20">
                                <SelectValue placeholder="בחר מחלקה..." />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {structure.map((dept: any) => (
                                  <SelectItem
                                    key={dept.id}
                                    value={dept.id.toString()}
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
                                setFormData({ ...formData, team_id: null });
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
                              <SelectTrigger className="h-12 bg-card border-input rounded-xl text-right font-bold text-foreground focus:ring-2 focus:ring-ring/20">
                                <SelectValue
                                  placeholder={
                                    !selectedDeptId
                                      ? "בחר מחלקה קודם..."
                                      : "בחר מדור..."
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {sections.map((sec: any) => (
                                  <SelectItem
                                    key={sec.id}
                                    value={sec.id.toString()}
                                  >
                                    {sec.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>

                          <FormField label="חוליה">
                            <Select
                              value={formData.team_id?.toString() || "none"}
                              onValueChange={(val) =>
                                setFormData({
                                  ...formData,
                                  team_id:
                                    val === "none" ? null : parseInt(val),
                                })
                              }
                              disabled={
                                !selectedSectionId ||
                                (!user?.is_admin && !!user?.commands_team_id)
                              }
                            >
                              <SelectTrigger className="h-12 bg-card border-input rounded-xl text-right font-bold text-foreground focus:ring-2 focus:ring-ring/20">
                                <SelectValue placeholder="בחר חולייה..." />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                <SelectItem value="none">ללא חולייה</SelectItem>
                                {teams.map((t: any) => (
                                  <SelectItem
                                    key={t.id}
                                    value={t.id.toString()}
                                  >
                                    {t.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <FormField label="סוג שירות">
                            <Select
                              value={formData.service_type_id?.toString() || ""}
                              onValueChange={(val) =>
                                setFormData({
                                  ...formData,
                                  service_type_id: parseInt(val),
                                })
                              }
                            >
                              <SelectTrigger className="h-12 bg-muted/50 border-input rounded-xl text-right">
                                <SelectValue placeholder="בחר סוג שירות..." />
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
                        </div>

                        <div className="mt-8 space-y-6">
                          <div className="p-4 bg-muted/30 border border-border rounded-2xl">
                            <ToggleCard
                              label="מוגדר כמפקד"
                              description="בעל סמכויות פיקודיות על היחידה הארגונית שלו"
                              checked={formData.is_commander || false}
                              onChange={(v) => {
                                if (v && id) {
                                  // Check for existing commander
                                  const empId = parseInt(id);
                                  let existing: {
                                    name: string;
                                    type: string;
                                  } | null = null;

                                  if (formData.team_id) {
                                    const team = teams.find(
                                      (t: any) => t.id === formData.team_id,
                                    );
                                    if (
                                      team?.commander_id &&
                                      team.commander_id !== empId
                                    ) {
                                      existing = {
                                        name: team.commander_name || "לא ידוע",
                                        type: "חולייה",
                                      };
                                    }
                                  } else if (selectedSectionId) {
                                    const sec = sections.find(
                                      (s: any) =>
                                        s.id.toString() === selectedSectionId,
                                    );
                                    if (
                                      sec?.commander_id &&
                                      sec.commander_id !== empId
                                    ) {
                                      existing = {
                                        name: sec.commander_name || "לא ידוע",
                                        type: "מדור",
                                      };
                                    }
                                  } else if (selectedDeptId) {
                                    const dept = structure.find(
                                      (d: any) =>
                                        d.id.toString() === selectedDeptId,
                                    );
                                    if (
                                      dept?.commander_id &&
                                      dept.commander_id !== empId
                                    ) {
                                      existing = {
                                        name: dept.commander_name || "לא ידוע",
                                        type: "מחלקה",
                                      };
                                    }
                                  }

                                  if (existing) {
                                    setCommanderWarning({
                                      name: existing.name,
                                      unitType: existing.type,
                                    });
                                    return;
                                  }
                                }
                                setFormData({ ...formData, is_commander: v });
                              }}
                              icon={Settings2}
                            />

                            <AnimatePresence>
                              {commanderWarning && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600">
                                      <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-sm font-black text-amber-900 mb-1">
                                        שים לב: החלפת מפקד
                                      </h4>
                                      <p className="text-xs text-amber-800 font-bold leading-relaxed">
                                        ליחידה זו כבר מוגדר מפקד:{" "}
                                        <span className="underline">
                                          {commanderWarning.name}
                                        </span>
                                        . האם אתה בטוח שברצונך להגדיר את{" "}
                                        <span className="text-amber-950 font-black">
                                          {formData.first_name}{" "}
                                          {formData.last_name}
                                        </span>{" "}
                                        כמפקד ה{commanderWarning.unitType}{" "}
                                        במקומו? פעולה זו תסיר את המפקד הנוכחי
                                        מתפקידו הפיקודי.
                                      </p>
                                      <div className="flex gap-2 mt-3">
                                        <Button
                                          size="sm"
                                          className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] h-8 px-4 rounded-xl shadow-sm"
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
                                          className="text-amber-800 font-bold text-[10px] h-8 px-4 hover:bg-amber-500/10 rounded-xl"
                                          onClick={() =>
                                            setCommanderWarning(null)
                                          }
                                        >
                                          ביטול
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <div className="mt-4">
                              <ToggleCard
                                label="שוטר פעיל"
                                description="האם השוטר נכלל כרגע במצבת הפעילה"
                                checked={formData.is_active ?? true}
                                onChange={(v) =>
                                  setFormData({ ...formData, is_active: v })
                                }
                                icon={User}
                              />
                            </div>

                            {formData.is_commander && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 p-4 bg-primary/5 text-primary rounded-xl text-sm border border-primary/10 flex items-start gap-3"
                              >
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                  💡
                                </div>
                                <div>
                                  <strong>שים לב:</strong> השוטר יוגדר כמפקד
                                  הישיר של הדרג הארגוני אליו הוא משויך (
                                  {formData.team_id
                                    ? "חולייה"
                                    : selectedSectionId
                                      ? "מדור"
                                      : selectedDeptId
                                        ? "מחלקה"
                                        : "מפקדה"}
                                  ).
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-between">
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab("personal")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        חזור לקודם
                      </Button>
                      <Button
                        onClick={() => setActiveTab("service_security")}
                        size="lg"
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
                      {/* Section 1: Dates */}
                      <SectionHeader
                        icon={Calendar}
                        title="תאריכי שירות"
                        description="ציר זמן שירות"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            className="h-12 bg-muted/50 border-input rounded-xl"
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
                            className="h-12 bg-muted/50 border-input rounded-xl"
                          />
                        </FormField>
                        <FormField label="תאריך שחרור">
                          <Input
                            type="date"
                            value={formData.discharge_date}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                discharge_date: e.target.value,
                              })
                            }
                            className="h-12 bg-muted/50 border-input rounded-xl"
                          />
                        </FormField>
                      </div>

                      <div className="w-full h-px bg-border my-8" />

                      {/* Section 2: Security */}
                      <SectionHeader
                        icon={Shield}
                        title="הגדרות מערכת ואבטחה"
                        description="הרשאות ואישורים"
                      />

                      <div className="grid grid-cols-1 gap-4">
                        <ToggleCard
                          label="בעל סיווג ביטחוני"
                          description="השוטר עבר בדיקת סיווג ורשאי להיחשף למידע מסווג"
                          checked={formData.security_clearance as boolean}
                          onChange={(v) =>
                            setFormData({
                              ...formData,
                              security_clearance: v,
                            })
                          }
                          icon={Shield}
                        />

                        <ToggleCard
                          label="רישיון משטרה"
                          description="מאושר לשאת נשק משטרתי / סמכויות"
                          checked={formData.police_license || false}
                          onChange={(v) =>
                            setFormData({ ...formData, police_license: v })
                          }
                          icon={BadgeCheck}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between mt-8 items-center bg-card p-4 rounded-2xl shadow-lg border border-border sticky bottom-6 z-20">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveTab("org")}
                      className="text-muted-foreground font-bold hover:text-foreground"
                    >
                      חזור
                    </Button>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground font-medium hidden md:inline-block">
                        * בדוק את הפרטים לפני שמירה
                      </span>
                      <Button
                        onClick={() => handleSubmit()}
                        size="lg"
                        className="rounded-xl px-12 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 font-bold text-lg"
                      >
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          "עדכן תיק שוטר"
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
