import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Settings2,
  Save,
  X,
  User,
  Building2,
  Shield,
  Phone,
  HeartPulse,
  Calendar,
  MapPin,
  BadgeCheck,
  Mail,
  Briefcase,
  FileCheck,
  Award,
  Bell,
  ArrowLeft,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import type {
  Employee,
  CreateEmployeePayload,
  DepartmentNode,
  ServiceType,
} from "@/types/employee.types";
import { CompactCard } from "@/components/forms/EmployeeFormComponents";
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
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import { differenceInYears } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

// --- Tab Components ---

const PersonalEditTab = ({
  formData,
  handleFieldChange,
  emergencyDetails,
  setEmergencyDetails,
  relations,
}: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <User className="w-5 h-5" /> פרטים אישיים
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <InputItem label="שם פרטי" required>
            <Input
              value={formData.first_name || ""}
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
            />
          </InputItem>
          <InputItem label="שם משפחה" required>
            <Input
              value={formData.last_name || ""}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
            />
          </InputItem>
          <InputItem label="מספר אישי" required icon={BadgeCheck}>
            <Input
              value={formData.personal_number || ""}
              onChange={(e) =>
                handleFieldChange("personal_number", e.target.value)
              }
            />
          </InputItem>
          <InputItem label="תעודת זהות" required icon={BadgeCheck}>
            <Input
              value={formData.national_id || ""}
              onChange={(e) => handleFieldChange("national_id", e.target.value)}
            />
          </InputItem>
          <InputItem label="תאריך לידה" required icon={Calendar}>
            <Input
              type="date"
              value={
                formData.birth_date ? formData.birth_date.split("T")[0] : ""
              }
              onChange={(e) => handleFieldChange("birth_date", e.target.value)}
            />
          </InputItem>
          <InputItem label="עיר מגורים" icon={MapPin}>
            <Input
              value={formData.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
            />
          </InputItem>
        </div>
      </CompactCard>

      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Phone className="w-5 h-5" /> פרטי קשר וחירום
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
              פרטי התקשרות
            </h4>
            <InputItem label="טלפון נייד" icon={Phone}>
              <Input
                value={formData.phone_number || ""}
                onChange={(e) =>
                  handleFieldChange("phone_number", e.target.value)
                }
              />
            </InputItem>
            <InputItem label="דואר אלקטרוני" icon={Mail}>
              <Input
                value={formData.email || ""}
                onChange={(e) => handleFieldChange("email", e.target.value)}
              />
            </InputItem>
          </div>

          <div className="bg-red-50/60 rounded-2xl p-5 border border-red-100 dark:bg-red-950/10 dark:border-red-900/20">
            <h4 className="text-sm font-black text-red-600 flex items-center gap-2 pb-2 mb-4 border-b border-red-200/50">
              <HeartPulse className="w-4 h-4" /> איש קשר לחירום
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputItem label="שם מלא" className="bg-transparent">
                  <Input
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
    </div>
  );
};

const OrganizationEditTab = ({
  formData,
  handleFieldChange,
  structure,
  selectedDeptId,
  setSelectedDeptId,
  selectedSectionId,
  setSelectedSectionId,
  sections,
  teams,
  serviceTypes,
  isUserRestricted,
}: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Building2 className="w-5 h-5" /> מבנה ארגוני
          </span>
        }
      >
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 relative">
            <div className="hidden md:block absolute top-[43px] left-10 right-10 h-0.5 bg-gradient-to-l from-transparent via-border to-transparent z-0" />

            <OrgSelectBox
              title="מחלקה"
              icon={Building2}
              disabled={isUserRestricted}
            >
              <Select
                value={selectedDeptId}
                onValueChange={(val) => {
                  setSelectedDeptId(val);
                  handleFieldChange("department_id", parseInt(val));
                  setSelectedSectionId("");
                }}
                disabled={isUserRestricted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מחלקה" />
                </SelectTrigger>
                <SelectContent>
                  {structure.map((d: any) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrgSelectBox>

            <ArrowLeft className="hidden md:block w-5 h-5 text-muted-foreground/40 z-10 mb-3" />

            <OrgSelectBox
              title="מדור"
              icon={Building2}
              disabled={!selectedDeptId}
            >
              <Select
                value={selectedSectionId}
                onValueChange={(val) => {
                  setSelectedSectionId(val);
                  handleFieldChange("section_id", parseInt(val));
                }}
                disabled={!selectedDeptId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מדור" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s: any) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrgSelectBox>

            <ArrowLeft className="hidden md:block w-5 h-5 text-muted-foreground/40 z-10 mb-3" />

            <OrgSelectBox
              title="חוליה"
              icon={Building2}
              disabled={!selectedSectionId}
            >
              <Select
                value={formData.team_id?.toString() || ""}
                onValueChange={(val) =>
                  handleFieldChange("team_id", parseInt(val))
                }
                disabled={!selectedSectionId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר חוליה" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t: any) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrgSelectBox>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-border/50">
            <InputItem label="תפקיד" icon={Briefcase}>
              <Input
                value={formData.role_name || ""}
                onChange={(e) => handleFieldChange("role_name", e.target.value)}
              />
            </InputItem>
            <InputItem label="מעמד" icon={FileCheck}>
              <Select
                value={formData.service_type_id?.toString() || ""}
                onValueChange={(val) =>
                  handleFieldChange("service_type_id", parseInt(val))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מעמד" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((st: any) => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InputItem>
          </div>
        </div>
      </CompactCard>

      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Calendar className="w-5 h-5" /> ציר זמן שירות
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputItem label="תאריך גיוס" icon={Calendar}>
            <Input
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
          </InputItem>
          <InputItem label="כניסה לתפקיד" icon={Calendar}>
            <Input
              type="date"
              value={
                formData.assignment_date
                  ? formData.assignment_date.split("T")[0]
                  : ""
              }
              onChange={(e) =>
                handleFieldChange("assignment_date", e.target.value)
              }
            />
          </InputItem>
          <InputItem label="שחרור צפוי (תש''ש)" icon={Calendar}>
            <Input
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
          </InputItem>
        </div>
      </CompactCard>
    </div>
  );
};

const SettingsEditTab = ({ formData, handleFieldChange, user }: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Award className="w-5 h-5" /> הגדרות והרשאות
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
              <Shield className="w-4 h-4" /> הרשאות ואישורים
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <SwitchItem
                label="סיווג ביטחוני"
                checked={!!formData.security_clearance}
                onChange={(c: boolean) =>
                  handleFieldChange("security_clearance", c)
                }
              />
              <SwitchItem
                label="רישיון נהיגה משטרתי"
                checked={!!formData.police_license}
                onChange={(c: boolean) =>
                  handleFieldChange("police_license", c)
                }
              />
              <SwitchItem
                label="אישור העסקה"
                checked={!!formData.employment_clearance}
                onChange={(c: boolean) =>
                  handleFieldChange("employment_clearance", c)
                }
              />
              {user?.is_admin && (
                <>
                  <SwitchItem
                    label="מפקד יחידה"
                    checked={!!formData.is_commander}
                    onChange={(c: boolean) =>
                      handleFieldChange("is_commander", c)
                    }
                    highlight
                  />
                  <SwitchItem
                    label="מנהל מערכת"
                    checked={!!formData.is_admin}
                    onChange={(c: boolean) => handleFieldChange("is_admin", c)}
                    highlight
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b">
              <Bell className="w-4 h-4" /> התראות מערכת
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <SwitchItem
                label="קבלת התראות מחלה"
                checked={!!formData.notif_sick_leave}
                onChange={(c: boolean) =>
                  handleFieldChange("notif_sick_leave", c)
                }
              />
              <SwitchItem
                label="קבלת התראות העברות"
                checked={!!formData.notif_transfers}
                onChange={(c: boolean) =>
                  handleFieldChange("notif_transfers", c)
                }
              />
            </div>
          </div>
        </div>
      </CompactCard>
    </div>
  );
};

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { updateEmployee, getStructure } = useEmployees();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [structure, setStructure] = useState<DepartmentNode[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [formData, setFormData] = useState<Partial<CreateEmployeePayload>>({});

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
      try {
        setLoading(true);
        const [empResp, structResp, serviceResp] = await Promise.all([
          apiClient.get(endpoints.getEmployeeByIdEndpoint(Number(id))),
          getStructure(),
          apiClient.get(endpoints.EMPLOYEES_SERVICE_TYPES_ENDPOINT),
        ]);

        const emp = empResp.data;
        setEmployee(emp);
        setFormData(emp);

        if (structResp) setStructure(structResp);
        if (serviceResp?.data) setServiceTypes(serviceResp.data);

        if (emp.assigned_department_id)
          setSelectedDeptId(emp.assigned_department_id.toString());
        if (emp.assigned_section_id)
          setSelectedSectionId(emp.assigned_section_id.toString());

        if (emp.emergency_contact) {
          const match = emp.emergency_contact.match(/^(.*) \((.*)\) - (.*)$/);
          if (match) {
            setEmergencyDetails({
              name: match[1],
              relation: match[2],
              phone: match[3],
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        toast.error("שגיאה בטעינת נתוני השוטר");
        navigate("/employees");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, getStructure, navigate]);

  // Update emergency contact
  useEffect(() => {
    const { name, relation, phone } = emergencyDetails;
    if (name || relation || phone) {
      setFormData((prev) => ({
        ...prev,
        emergency_contact: `${name} (${relation}) - ${phone}`,
      }));
    }
  }, [emergencyDetails]);

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);

    if (!formData.national_id || !formData.birth_date) {
      toast.error("ת.ז ותאריך לידה הינם שדות חובה");
      setSaving(false);
      return;
    }
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    if (age < 17) {
      toast.error("גיל השוטר חייב להיות 17 ומעלה");
      setSaving(false);
      return;
    }

    const payload = {
      ...formData,
      department_id: selectedDeptId ? parseInt(selectedDeptId) : undefined,
      section_id: selectedSectionId ? parseInt(selectedSectionId) : undefined,
    };

    const success = await updateEmployee(Number(id), payload);
    setSaving(false);

    if (success) {
      toast.success("השוטר עודכן בהצלחה");
      navigate(`/employees/${id}`);
    }
  };

  const handleToggleActiveStatus = async () => {
    if (!employee || !id) return;
    const newStatus = !employee.is_active;

    setActionLoading(true);
    try {
      await apiClient.put(endpoints.updateEmployeeEndpoint(parseInt(id)), {
        is_active: newStatus,
      });
      toast.success(
        newStatus ? "השוטר הוחזר למצב פעיל" : "השוטר הועבר לסטטוס לא פעיל",
      );
      setEmployee((prev) => {
        if (!prev) return null;
        return { ...prev, is_active: !!newStatus };
      });
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const sections =
    structure.find((d) => d.id.toString() === selectedDeptId)?.sections || [];
  const teams =
    sections.find((s) => s.id.toString() === selectedSectionId)?.teams || [];
  const isUserRestricted =
    !user?.is_admin &&
    !!(
      user?.commands_department_id ||
      user?.commands_section_id ||
      user?.commands_team_id
    );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (!employee) return null;

  return (
    <div
      className="min-h-screen bg-background/50 pb-20 animate-in fade-in duration-500"
      dir="rtl"
    >
      <BirthdayGreetingsModal
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
        targetEmployee={
          employee
            ? {
                id: employee.id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                phone_number: employee.phone_number || "",
                birth_date: employee.birth_date,
                day: employee.birth_date
                  ? new Date(employee.birth_date).getDate()
                  : 1,
                month: employee.birth_date
                  ? new Date(employee.birth_date).getMonth() + 1
                  : 1,
              }
            : undefined
        }
      />

      <div className="bg-background border-b border-border/60 py-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <PageHeader
            icon={Settings2}
            title={`עריכת כרטיס: ${employee.first_name} ${employee.last_name}`}
            subtitle={`עדכון פרטי שוטר מס' ${employee.personal_number}`}
            category="ניהול שוטרים"
            categoryLink="/employees"
          />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* RIGHT SIDEBAR (Sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 order-1">
            <div className="bg-card rounded-3xl border border-primary/10 shadow-lg shadow-primary/5 overflow-hidden">
              <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
              </div>
              <div className="px-6 pb-8 text-center -mt-12 relative">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 mx-auto shadow-md border-4 border-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground transition-all duration-300">
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>
                <h2 className="text-xl font-black text-foreground mb-1 min-h-[28px]">
                  {formData.first_name} {formData.last_name}
                </h2>
                <p className="text-sm text-muted-foreground mb-6 font-mono">
                  {formData.personal_number || "מספר אישי"}
                </p>

                <div className="space-y-3 text-sm text-right bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span className="font-bold text-foreground text-xs">
                      שיוך יחידתי נוכחי
                    </span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>מחלקה:</span>
                      <span className="font-bold text-foreground">
                        {structure.find(
                          (d) => d.id.toString() === selectedDeptId,
                        )?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>מדור:</span>
                      <span className="font-bold text-foreground">
                        {sections.find(
                          (s) => s.id.toString() === selectedSectionId,
                        )?.name || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full h-12 rounded-xl font-bold shadow-sm text-base"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 ml-2" />
                )}{" "}
                שמור שינויים
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/employees/${id}`)}
                className="w-full h-12 rounded-xl font-bold border-2"
              >
                <X className="w-4 h-4 ml-2" /> ביטול
              </Button>
              <div className="border-t border-border/50 my-4" />
              <Button
                variant="ghost"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className={cn(
                  "w-full h-12 rounded-xl font-bold border-2 bg-transparent",
                  employee.is_active
                    ? "text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/40"
                    : "text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400",
                )}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : employee.is_active ? (
                  <>
                    <UserX className="w-4 h-4 ml-2" />
                    השבתת שוטר
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    הפעלת שוטר
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* LEFT CONTENT (Variable Content) */}
          <div className="lg:col-span-9 space-y-8 order-2 min-h-[500px]">
            {/* Tab Navigation (Sticky) */}
            <div className="sticky top-4 z-30 bg-background/80 backdrop-blur-xl p-1.5 rounded-2xl shadow-sm border border-border/60 mx-1 mb-8">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "personal", label: "פרטים אישיים וקשר", icon: User },
                  {
                    id: "organization",
                    label: "מבנה ארגוני ושירות",
                    icon: Building2,
                  },
                  { id: "settings", label: "הגדרות והרשאות", icon: Award },
                ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap border-2",
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.02]"
                          : "bg-card text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn("w-4 h-4", isActive && "animate-pulse")}
                      />
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">
                        {item.label.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content Area */}
            <div key={activeTab}>
              {activeTab === "personal" && (
                <PersonalEditTab
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  emergencyDetails={emergencyDetails}
                  setEmergencyDetails={setEmergencyDetails}
                  relations={relations}
                />
              )}
              {activeTab === "organization" && (
                <OrganizationEditTab
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  structure={structure}
                  selectedDeptId={selectedDeptId}
                  setSelectedDeptId={setSelectedDeptId}
                  selectedSectionId={selectedSectionId}
                  setSelectedSectionId={setSelectedSectionId}
                  sections={sections}
                  teams={teams}
                  serviceTypes={serviceTypes}
                  isUserRestricted={isUserRestricted}
                />
              )}
              {activeTab === "settings" && (
                <SettingsEditTab
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  user={user}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
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
const OrgSelectBox = ({ title, icon: Icon, children, disabled }: any) => (
  <div
    className={cn(
      "relative z-10 flex-1 w-full bg-card border border-border p-3 rounded-xl shadow-sm transition-all text-center min-w-[140px]",
      disabled && "opacity-60 grayscale",
    )}
  >
    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-2">
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {title}
      </span>
    </div>
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
