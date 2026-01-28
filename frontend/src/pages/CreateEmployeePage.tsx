import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { CreateEmployeePayload } from "@/types/employee.types";
import {
  Loader2,
  UserPlus,
  User,
  Calendar,
  Phone,
  Shield,
  Building2,
  Save,
  Check,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";

interface Team {
  id: number;
  name: string;
  section_id: number;
}
interface Section {
  id: number;
  name: string;
  department_id: number;
  teams: Team[];
}
interface Department {
  id: number;
  name: string;
  sections: Section[];
}

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { createEmployee, getStructure, getServiceTypes } = useEmployees();
  const [loading, setLoading] = useState(false);
  const [structure, setStructure] = useState<Department[]>([]);
  const [serviceTypes, setServiceTypes] = useState<
    { id: number; name: string }[]
  >([]);

  // Selection States
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

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
    security_clearance: 0,
    police_license: false,
    emergency_contact: "",
  });

  // Fetch structure and service types on mount
  // 1. Fetch structure and service types on mount
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

  // 2. Apply scoping Effect - Runs when User OR Structure updates
  useEffect(() => {
    if (!user || user.is_admin || structure.length === 0) return;

    console.log("[DEBUG] Scoping Effect Triggered", {
      user,
      structureLoaded: structure.length > 0,
    });

    if (user.commands_team_id) {
      const teamId = user.commands_team_id;
      for (const dept of structure) {
        for (const sec of dept.sections) {
          const team = sec.teams.find((t: Team) => t.id === teamId);
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
        const sec = dept.sections.find((s: Section) => s.id === secId);
        if (sec) {
          setSelectedDeptId(dept.id.toString());
          setSelectedSectionId(secId.toString());
          return;
        }
      }
    } else if (user.commands_department_id) {
      setSelectedDeptId(user.commands_department_id.toString());
    }
    // Fallback to assigned if no command found (already handled largely by backend now, but good for UI sync)
    else if (user.assigned_department_id) {
      setSelectedDeptId(user.assigned_department_id.toString());
      if (user.assigned_section_id) {
        setSelectedSectionId(user.assigned_section_id.toString());
      }
    }
  }, [user, structure]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      section_id: selectedSectionId ? parseInt(selectedSectionId) : undefined,
      department_id: selectedDeptId ? parseInt(selectedDeptId) : undefined,
    };

    const success = await createEmployee(payload);
    setLoading(false);
    if (success) {
      navigate("/employees");
    }
  };

  // Derived Options
  const sections =
    structure.find((d) => d.id.toString() === selectedDeptId)?.sections || [];
  const teams =
    sections.find((s) => s.id.toString() === selectedSectionId)?.teams || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        icon={UserPlus}
        title="הוספת שוטר חדש"
        subtitle="מלא את פרטי השוטר בטופס למטה כדי לצרפו ליחידה"
        category="ניהול שוטרים"
        categoryLink="/employees"
        iconClassName="from-blue-50 to-blue-100 border-blue-100"
        badge={
          <div className="hidden sm:flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/employees")}
              className="border-slate-200 hover:bg-slate-50 h-11 px-6 rounded-xl font-bold"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:opacity-90 text-white h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור שוטר
            </Button>
          </div>
        }
      />

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Personal Information */}
          <SectionCard
            icon={User}
            title="פרטים אישיים"
            description="פרטי זיהוי בסיסיים של השוטר"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="שם פרטי" required>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="לדוגמה: ישראל"
                />
              </FormField>
              <FormField label="שם משפחה" required>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="לדוגמה: ישראלי"
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
                  className="font-mono text-left ltr"
                  placeholder="1234567"
                />
              </FormField>
              <FormField label="תעודת זהות" required>
                <Input
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData({ ...formData, national_id: e.target.value })
                  }
                  className="font-mono text-left ltr"
                  placeholder="000000000"
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Contact Information */}
          <SectionCard
            icon={Phone}
            title="פרטי קשר"
            description="כתובת, טלפון ואנשי קשר"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField label="מספר טלפון">
                <Input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="font-mono text-left ltr"
                  placeholder="050-0000000"
                />
              </FormField>
              <FormField label="עיר מגורים">
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="לדוגמה: תל אביב"
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="איש קשר לחירום">
                  <Input
                    value={formData.emergency_contact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_contact: e.target.value,
                      })
                    }
                    placeholder="שם ומספר טלפון"
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          {/* Organizational */}
          <SectionCard
            icon={Building2}
            title="שיוך ארגוני"
            description="הגדר את מיקום השוטר במבנה הארגון"
          >
            {/* Hierarchical Structure */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                  מבנה היררכי
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Department Select */}
                  <FormField label="מחלקה">
                    <Select
                      value={selectedDeptId}
                      onValueChange={(val) => {
                        setSelectedDeptId(val);
                        setSelectedSectionId("");
                        setFormData({ ...formData, team_id: undefined });
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
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="בחר מחלקה..." />
                      </SelectTrigger>
                      <SelectContent>
                        {structure.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Section Select */}
                  <FormField label="מדור">
                    <Select
                      value={selectedSectionId}
                      onValueChange={(val) => {
                        setSelectedSectionId(val);
                        setFormData({ ...formData, team_id: undefined });
                      }}
                      disabled={
                        !selectedDeptId ||
                        (!user?.is_admin &&
                          !!(
                            user?.commands_section_id || user?.commands_team_id
                          ))
                      }
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue
                          placeholder={
                            !selectedDeptId
                              ? "בחר מחלקה קודם..."
                              : "בחר מדור..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((sec) => (
                          <SelectItem key={sec.id} value={sec.id.toString()}>
                            {sec.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  {/* Team Select */}
                  <FormField label="חולייה">
                    <Select
                      value={formData.team_id?.toString() || ""}
                      onValueChange={(val) =>
                        setFormData({ ...formData, team_id: parseInt(val) })
                      }
                      disabled={
                        !selectedSectionId ||
                        (!user?.is_admin && !!user?.commands_team_id)
                      }
                    >
                      <SelectTrigger className="text-right">
                        <SelectValue
                          placeholder={
                            !selectedSectionId
                              ? "בחר מדור קודם..."
                              : "בחר חולייה..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
              </div>

              {/* Role and Service Type */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                  תפקיד ושירות
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <SelectTrigger className="text-right">
                        <SelectValue placeholder="בחר סוג שירות..." />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((st) => (
                          <SelectItem key={st.id} value={st.id.toString()}>
                            {st.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="מזהה תפקיד">
                    <Input
                      type="number"
                      value={formData.role_id || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role_id: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="הזן מזהה תפקיד"
                    />
                  </FormField>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
              </div>

              {/* Command Position Toggle */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  סטטוס פיקוד
                </h3>
                <ToggleCard
                  label="תפקיד פיקודי"
                  checked={formData.is_commander || false}
                  onChange={(v) =>
                    setFormData({ ...formData, is_commander: v })
                  }
                />
                {formData.is_commander && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                      <span className="text-base">💡</span>
                      <span>
                        השוטר יוגדר כמפקד של{" "}
                        <strong>
                          {formData.team_id
                            ? "החולייה"
                            : selectedSectionId
                              ? "המדור"
                              : selectedDeptId
                                ? "המחלקה"
                                : "היחידה הנבחרת"}
                        </strong>
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-8">
          {/* Dates */}
          <SectionCard icon={Calendar} title="תאריכים" compact>
            <div className="space-y-4">
              <FormField label="תאריך לידה">
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                />
              </FormField>
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
                />
              </FormField>
              <FormField label="תאריך שחרור">
                <Input
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) =>
                    setFormData({ ...formData, discharge_date: e.target.value })
                  }
                />
              </FormField>
            </div>
          </SectionCard>

          {/* Security & Permissions */}
          <SectionCard icon={Shield} title="הגדרות ואבטחה" compact>
            <div className="space-y-6">
              <FormField label="רמת סיווג (0-5)">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={formData.security_clearance}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          security_clearance: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0074ff]"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-md bg-blue-50 text-[#0074ff] font-bold flex items-center justify-center border border-blue-100">
                    {formData.security_clearance}
                  </div>
                </div>
              </FormField>

              <div className="space-y-3 pt-2">
                <ToggleCard
                  label="רישיון משטרה"
                  checked={formData.police_license || false}
                  onChange={(v) =>
                    setFormData({ ...formData, police_license: v })
                  }
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Mobile Action Buttons */}
        <div className="lg:hidden col-span-1 flex gap-3 pt-4 border-t border-slate-200">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/employees")}
            className="flex-1 h-11"
          >
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#0074ff] text-white h-11"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור
          </Button>
        </div>
      </form>
    </div>
  );
}

// --- Helper Components ---

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  compact,
}: {
  icon: any;
  title: string;
  description?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className="border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden">
      <CardHeader
        className={`bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 ${compact ? "p-4" : "p-6"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700 ${compact ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center`}
          >
            <Icon
              className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-[#0074ff]`}
            />
          </div>
          <div>
            <CardTitle
              className={`${compact ? "text-base" : "text-xl"} font-black text-slate-900 dark:text-white`}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-slate-500 mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={`${compact ? "p-4" : "p-6"}`}>
        {children}
      </CardContent>
    </Card>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
  danger,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`
        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200
        ${
          checked
            ? danger
              ? "bg-red-50 border-red-200 ring-1 ring-red-200"
              : "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        }
      `}
    >
      <span
        className={`text-sm font-medium ${checked ? (danger ? "text-red-700" : "text-blue-700") : "text-slate-600"}`}
      >
        {label}
      </span>
      <div
        className={`
        w-5 h-5 rounded flex items-center justify-center transition-colors
        ${checked ? (danger ? "bg-red-500" : "bg-[#0074ff]") : "bg-slate-200"}
      `}
      >
        {checked && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
    </div>
  );
}
