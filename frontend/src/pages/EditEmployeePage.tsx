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
  ArrowLeft,
  ArrowRightLeft,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { TransferRequestModal } from "@/components/employees/modals/TransferRequestModal";
import { toast } from "sonner";
import { useAuthContext } from "@/context/AuthContext";
import type {
  Employee,
  CreateEmployeePayload,
  DepartmentNode,
  ServiceType,
} from "@/types/employee.types";
import { CompactCard } from "@/components/forms/EmployeeFormComponents";
import { Badge } from "@/components/ui/badge";
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
import { cn, cleanUnitName } from "@/lib/utils";

// --- Tab Components ---

const PersonalEditTab = ({
  formData,
  handleFieldChange,
  emergencyDetails,
  setEmergencyDetails,
  relations,
  serviceTypes,
}: any) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <User className="w-5 h-5" /> פרטים אישיים
            </span>
            {(() => {
              if (formData.commands_department_id)
                return (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold"
                  >
                    רמ"ח - {cleanUnitName(formData.department_name)}
                  </Badge>
                );
              if (formData.commands_section_id)
                return (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold"
                  >
                    רמ"ד - {cleanUnitName(formData.section_name)}
                  </Badge>
                );
              if (formData.commands_team_id)
                return (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 border-primary/20 text-primary text-[10px] font-bold"
                  >
                    מ"ח - {cleanUnitName(formData.team_name)}
                  </Badge>
                );
              return null;
            })()}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <InputItem label="שם מלא (פרטי ומשפחה)" required icon={User}>
            <div className="flex gap-2">
              <Input
                value={formData.first_name || ""}
                onChange={(e) =>
                  handleFieldChange("first_name", e.target.value)
                }
                placeholder="פרטי"
                className="bg-background/50 focus:bg-background transition-colors flex-1 h-11"
              />
              <Input
                value={formData.last_name || ""}
                onChange={(e) => handleFieldChange("last_name", e.target.value)}
                placeholder="משפחה"
                className="bg-background/50 focus:bg-background transition-colors flex-1 h-11"
              />
            </div>
          </InputItem>
          <div className="flex gap-3 w-full">
            <InputItem label="מין" required icon={User} className="flex-1">
              <Select
                value={formData.gender || ""}
                onValueChange={(val) => handleFieldChange("gender", val)}
              >
                <SelectTrigger className="w-full bg-background/50 focus:bg-background transition-colors h-11">
                  <SelectValue placeholder="בחר מין" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">גבר</SelectItem>
                  <SelectItem value="female">אישה</SelectItem>
                </SelectContent>
              </Select>
            </InputItem>
            <InputItem label="מעמד" icon={FileCheck} className="flex-1">
              <Select
                value={formData.service_type_id?.toString() || ""}
                onValueChange={(val) =>
                  handleFieldChange("service_type_id", parseInt(val))
                }
              >
                <SelectTrigger className="w-full bg-background/50 focus:bg-background transition-colors h-11">
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
          <InputItem label="עיר מגורים" icon={MapPin}>
            <Input
              value={formData.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="ירושלים, ת''א..."
              className="bg-background/50 focus:bg-background transition-colors h-11"
            />
          </InputItem>

          <InputItem label="מספר אישי" required icon={BadgeCheck}>
            <Input
              value={formData.personal_number || ""}
              onChange={(e) =>
                handleFieldChange("personal_number", e.target.value)
              }
              placeholder="0000000"
              className="font-mono bg-background/50 focus:bg-background transition-colors h-11"
            />
          </InputItem>
          <InputItem label="תעודת זהות" required icon={BadgeCheck}>
            <Input
              value={formData.national_id || ""}
              onChange={(e) => handleFieldChange("national_id", e.target.value)}
              placeholder="000000000"
              className="font-mono bg-background/50 focus:bg-background transition-colors h-11"
            />
          </InputItem>
          <InputItem label="תאריך לידה" required icon={Calendar}>
            <Input
              type="date"
              value={
                formData.birth_date ? formData.birth_date.split("T")[0] : ""
              }
              onChange={(e) => handleFieldChange("birth_date", e.target.value)}
              className="bg-background/50 focus:bg-background transition-colors h-11"
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

const ProfessionalEditTab = ({
  formData,
  handleFieldChange,
  structure,
  selectedDeptId,
  setSelectedDeptId,
  selectedSectionId,
  setSelectedSectionId,
  sections,
  teams,
  user,
}: any) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const isDeptDisabled = !user.is_admin;
  const isSectionDisabled = !user.is_admin && !user.commands_department_id;
  const isTeamDisabled =
    !user.is_admin && !user.commands_department_id && !user.commands_section_id;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Organizational Structure Card */}
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Building2 className="w-5 h-5" /> מבנה ארגוני ופיקוד
          </span>
        }
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 rounded-xl font-black text-[11px] transition-all active:scale-95"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            בקשת העברה
          </Button>
        }
      >
        <div className="py-10 px-4">
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8">
            <OrgSelectBox
              title="מחלקה"
              icon={Building2}
              disabled={isDeptDisabled}
            >
              <Select
                value={selectedDeptId}
                onValueChange={(val) => {
                  setSelectedDeptId(val);
                  handleFieldChange("department_id", parseInt(val));
                  setSelectedSectionId("");
                }}
                disabled={isDeptDisabled}
              >
                <SelectTrigger className="bg-white/80 border-primary/10 font-bold h-11 shadow-sm rounded-xl focus:ring-primary/20">
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

            <div className="hidden md:flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
                <ArrowLeft className="w-5 h-5 text-primary/40" />
              </div>
            </div>

            <OrgSelectBox
              title="מדור"
              icon={Briefcase}
              disabled={!selectedDeptId || isSectionDisabled}
            >
              <Select
                value={selectedSectionId}
                onValueChange={(val) => {
                  setSelectedSectionId(val);
                  handleFieldChange("section_id", parseInt(val));
                }}
                disabled={!selectedDeptId || isSectionDisabled}
              >
                <SelectTrigger className="bg-white/80 border-primary/10 font-bold h-11 shadow-sm rounded-xl focus:ring-primary/20">
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

            <div className="hidden md:flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
                <ArrowLeft className="w-5 h-5 text-primary/40" />
              </div>
            </div>

            <OrgSelectBox
              title="חוליה"
              icon={User}
              disabled={!selectedSectionId || isTeamDisabled}
            >
              <Select
                value={formData.team_id?.toString() || ""}
                onValueChange={(val) =>
                  handleFieldChange("team_id", parseInt(val))
                }
                disabled={!selectedSectionId || isTeamDisabled}
              >
                <SelectTrigger className="bg-white/80 border-primary/10 font-bold h-11 shadow-sm rounded-xl focus:ring-primary/20">
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

          {user?.is_admin && (
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-dashed">
              <div className="w-full max-w-md">
                <SwitchItem
                  label={(() => {
                    if (formData.team_id) return "מפקד חוליה (ראש חוליה)";
                    if (selectedSectionId) return "ראש מדור";
                    if (selectedDeptId) return "ראש מחלקה";
                    return "מפקד יחידה";
                  })()}
                  checked={!!formData.is_commander}
                  onChange={(c: boolean) =>
                    handleFieldChange("is_commander", c)
                  }
                  highlight
                />
                <p className="text-[11px] text-muted-foreground mt-2 text-center bg-muted/30 py-1.5 rounded-lg border border-border/50">
                  💡 <strong>טיפ:</strong> כאשר מסומן כמפקד, ניתן להשאיר רמות
                  ארגוניות נמוכות יותר ריקות
                </p>
              </div>
            </div>
          )}
        </div>
      </CompactCard>

      <TransferRequestModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        employeeName={formData.full_name || "השוטר"}
        structure={structure}
      />

      {/* 2. Professional Details & Permissions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Details */}
        <CompactCard
          title={
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <Briefcase className="w-5 h-5" /> פרטי תפקיד
            </span>
          }
        >
          <div className="space-y-4">
            <InputItem label="תפקיד" icon={Briefcase}>
              <Input
                value={formData.role_name || ""}
                onChange={(e) => handleFieldChange("role_name", e.target.value)}
                placeholder="הזן שם תפקיד..."
              />
            </InputItem>
          </div>
        </CompactCard>

        {/* Permissions & Badges */}
        <CompactCard
          title={
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <Shield className="w-5 h-5" /> הרשאות ואישורים
            </span>
          }
        >
          <div className="space-y-3">
            <SwitchItem
              label="סיווג ביטחוני (פעיל)"
              checked={!!formData.security_clearance}
              onChange={(c: boolean) =>
                handleFieldChange("security_clearance", c)
              }
            />
            <SwitchItem
              label="רישיון נהיגה משטרתי"
              checked={!!formData.police_license}
              onChange={(c: boolean) => handleFieldChange("police_license", c)}
            />
            {user?.is_admin && (
              <SwitchItem
                label="הרשאת מנהל מערכת (Admin)"
                checked={!!formData.is_admin}
                onChange={(c: boolean) => handleFieldChange("is_admin", c)}
                highlight
              />
            )}
          </div>
        </CompactCard>
      </div>

      {/* 3. Service Timeline */}
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
              className="border-primary/20 bg-primary/5 focus:bg-background transition-colors"
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
              className="border-primary/20 bg-primary/5 focus:bg-background transition-colors"
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
              className="border-primary/20 bg-primary/5 focus:bg-background transition-colors"
            />
          </InputItem>
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
  const [activeTab, setActiveTab] = useState("personal"); // New state for active tab

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

        // Ensure IDs are strings for the select components
        if (emp.department_id) setSelectedDeptId(emp.department_id.toString());
        if (emp.section_id) setSelectedSectionId(emp.section_id.toString());

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

    // Validation for organizational affiliation
    if (formData.is_commander) {
      if (!selectedDeptId) {
        toast.error("יש לבחור לפחות מחלקה עבור מפקד");
        setSaving(false);
        return;
      }
    } else {
      // Not a commander - full affiliation required
      if (!selectedDeptId || !selectedSectionId || !formData.team_id) {
        toast.error(
          "עבור שוטר שאינו מפקד, יש להזין שיוך ארגוני מלא (מחלקה, מדור וחוליה)",
        );
        setSaving(false);
        return;
      }
    }
    const age = differenceInYears(new Date(), new Date(formData.birth_date));
    if (age < 17) {
      toast.error("גיל השוטר חייב להיות 17 ומעלה");
      setSaving(false);
      return;
    }

    if (!formData.gender) {
      toast.error("יש לבחור מין");
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  if (!employee) return null;

  const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-bold transition-all duration-300",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {Icon && <Icon className="w-4 h-4" />} {label}
    </button>
  );

  return (
    <div className="bg-[#f8fafc] dark:bg-[#020617]">
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
        <div className="container max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <PageHeader
              title={`עריכת שוטר: ${employee.first_name} ${employee.last_name}`}
              subtitle="עדכון פרטים אישיים, שיוך ארגוני והרשאות"
              icon={Settings2}
              category="ניהול שוטרים"
              categoryLink="/employees"
            />
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className={cn(
                  "gap-2",
                  employee.is_active
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
                )}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : employee.is_active ? (
                  <UserX className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {employee.is_active ? "השבת שוטר" : "הפעל שוטר"}
                </span>
              </Button>

              <div className="h-8 w-[1px] bg-border mx-1" />

              <Button
                variant="outline"
                onClick={() => navigate(`/employees/${id}`)}
                className="gap-2"
              >
                <X className="w-4 h-4" />{" "}
                <span className="hidden sm:inline">ביטול</span>
              </Button>
              <Button
                className="gap-2 shadow-lg shadow-primary/20"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "מעדכן..." : "עדכן שוטר"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 flex gap-2 mb-8 overflow-x-auto">
          <TabButton
            active={activeTab === "personal"}
            onClick={() => setActiveTab("personal")}
            icon={User}
            label="פרטים אישיים"
          />
          <TabButton
            active={activeTab === "pro"}
            onClick={() => setActiveTab("pro")}
            icon={Briefcase}
            label="מקצועי והרשאות"
          />
        </div>

        <div className="space-y-6">
          {activeTab === "personal" && (
            <PersonalEditTab
              formData={formData}
              handleFieldChange={handleFieldChange}
              emergencyDetails={emergencyDetails}
              setEmergencyDetails={setEmergencyDetails}
              relations={relations}
              serviceTypes={serviceTypes}
            />
          )}

          {activeTab === "pro" && (
            <ProfessionalEditTab
              formData={formData}
              handleFieldChange={handleFieldChange}
              structure={structure}
              selectedDeptId={selectedDeptId}
              setSelectedDeptId={setSelectedDeptId}
              selectedSectionId={selectedSectionId}
              setSelectedSectionId={setSelectedSectionId}
              sections={sections}
              teams={teams}
              user={user}
            />
          )}
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
const OrgSelectBox = ({ title, children, disabled, icon: Icon }: any) => (
  <div
    className={cn(
      "relative z-10 flex-1 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] border border-primary/20 pb-4 pt-2 px-1 rounded-2xl transition-all text-center shadow-sm",
      disabled
        ? "opacity-30 grayscale cursor-not-allowed"
        : "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 mt-4 group",
    )}
  >
    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-primary/20 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm transition-transform group-hover:scale-110">
      {Icon && <Icon className="w-3.5 h-3.5 text-primary animate-pulse" />}
      <span className="text-[11px] font-black text-primary uppercase tracking-widest leading-none">
        {title}
      </span>
    </div>
    <div className="pt-5 px-3">{children}</div>
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
