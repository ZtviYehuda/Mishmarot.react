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
  commander_id?: number | null;
  commander_name?: string | null;
}
interface Section {
  id: number;
  name: string;
  department_id: number;
  teams: Team[];
  commander_id?: number | null;
  commander_name?: string | null;
}
interface Department {
  id: number;
  name: string;
  sections: Section[];
  commander_id?: number | null;
  commander_name?: string | null;
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

  const [commanderWarning, setCommanderWarning] = useState<{
    name: string;
    unitType: string;
  } | null>(null);

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
        iconClassName="from-primary/10 to-primary/5 border-primary/20"
        badge={
          <div className="hidden sm:flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/employees")}
              className="border-input hover:bg-muted h-11 px-6 rounded-xl font-bold text-muted-foreground"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20"
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
                  className="bg-muted/50 border-input focus:ring-ring/20"
                />
              </FormField>
              <FormField label="שם משפחה" required>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="לדוגמה: ישראלי"
                  className="bg-muted/50 border-input focus:ring-ring/20"
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
                  className="font-mono text-left ltr bg-muted/50 border-input focus:ring-ring/20"
                  placeholder="1234567"
                />
              </FormField>
              <FormField label="תעודת זהות" required>
                <Input
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData({ ...formData, national_id: e.target.value })
                  }
                  className="font-mono text-left ltr bg-muted/50 border-input focus:ring-ring/20"
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
                  className="font-mono text-left ltr bg-muted/50 border-input focus:ring-ring/20"
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
                  className="bg-muted/50 border-input focus:ring-ring/20"
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
                    className="bg-muted/50 border-input focus:ring-ring/20"
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
                <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
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
                      <SelectTrigger className="text-right bg-muted/50 border-input">
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
                      <SelectTrigger className="text-right bg-muted/50 border-input">
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
                      <SelectTrigger className="text-right bg-muted/50 border-input">
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
                  <div className="w-full border-t border-border"></div>
                </div>
              </div>

              {/* Role and Service Type */}
              <div>
                <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary/70 rounded-full"></div>
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
                      <SelectTrigger className="text-right bg-muted/50 border-input">
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
                      className="bg-muted/50 border-input focus:ring-ring/20"
                    />
                  </FormField>
                </div>
              </div>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
              </div>

              {/* Command Position Toggle */}
              <div>
                <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary/50 rounded-full"></div>
                  סטטוס פיקוד
                </h3>
                <ToggleCard
                  label="תפקיד פיקודי"
                  checked={formData.is_commander || false}
                  onChange={(v) => {
                    if (v) {
                      // Check for existing commander
                      let existing: { name: string; type: string } | null = null;
                      if (formData.team_id) {
                        const team = teams.find(t => t.id === formData.team_id);
                        if (team?.commander_id) existing = { name: team.commander_name || "לא ידוע", type: "חולייה" };
                      } else if (selectedSectionId) {
                        const sec = sections.find(s => s.id.toString() === selectedSectionId);
                        if (sec?.commander_id) existing = { name: sec.commander_name || "לא ידוע", type: "מדור" };
                      } else if (selectedDeptId) {
                        const dept = structure.find(d => d.id.toString() === selectedDeptId);
                        if (dept?.commander_id) existing = { name: dept.commander_name || "לא ידוע", type: "מחלקה" };
                      }

                      if (existing) {
                        setCommanderWarning({ name: existing.name, unitType: existing.type });
                        return; // Don't toggle yet
                      }
                    }
                    setFormData({ ...formData, is_commander: v });
                  }}
                />

                {commanderWarning && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-amber-500/20 text-amber-600">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-amber-700 mb-1">שים לב: החלפת מפקד</h4>
                        <p className="text-xs text-amber-700/80 font-bold leading-relaxed">
                          ליחידה זו כבר מוגדר מפקד: <span className="underline">{commanderWarning.name}</span>.
                          האם אתה בטוח שברצונך להגדיר את <span className="text-amber-900 font-black">{formData.first_name} {formData.last_name}</span> כמפקד ה{commanderWarning.unitType} במקומו?
                          פעולה זו תסיר את המפקד הנוכחי מתפקידו הפיקודי.
                        </p>
                        <div className="flex gap-3 mt-3">
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] h-7 px-4 rounded-full shadow-sm"
                            onClick={() => {
                              setFormData({ ...formData, is_commander: true });
                              setCommanderWarning(null);
                            }}
                          >
                            כן, החלף מפקד
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-amber-700 font-bold text-[10px] h-7 px-4 hover:bg-amber-500/10"
                            onClick={() => setCommanderWarning(null)}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formData.is_commander && !commanderWarning && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <p className="text-xs text-primary flex items-start gap-2">
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
                  className="bg-muted/50 border-input focus:ring-ring/20"
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
                  className="bg-muted/50 border-input focus:ring-ring/20"
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
                  className="bg-muted/50 border-input focus:ring-ring/20"
                />
              </FormField>
              <FormField label="תאריך שחרור">
                <Input
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) =>
                    setFormData({ ...formData, discharge_date: e.target.value })
                  }
                  className="bg-muted/50 border-input focus:ring-ring/20"
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
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="w-8 h-8 rounded-md bg-primary/10 text-primary font-bold flex items-center justify-center border border-primary/20">
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
        <div className="lg:hidden col-span-1 flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            type="button"
            onClick={() => navigate("/employees")}
            className="flex-1 h-11 border-input"
          >
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-primary text-primary-foreground h-11"
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
    <Card className="border-0 shadow-sm ring-1 ring-border bg-card overflow-hidden">
      <CardHeader
        className={`bg-muted/30 border-b border-border ${compact ? "p-4" : "p-6"}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-card shadow-sm ring-1 ring-border ${compact ? "w-8 h-8" : "w-10 h-10"} flex items-center justify-center`}
          >
            <Icon
              className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-primary`}
            />
          </div>
          <div>
            <CardTitle
              className={`${compact ? "text-base" : "text-xl"} font-black text-foreground`}
            >
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-muted-foreground mt-1 text-xs">
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
      <Label className="text-sm font-semibold text-foreground/70 flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
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
        ${checked
          ? danger
            ? "bg-destructive/10 border-destructive/20 ring-1 ring-destructive/20"
            : "bg-primary/10 border-primary/20 ring-1 ring-primary/20"
          : "bg-card border-input hover:border-accent hover:bg-muted"
        }
      `}
    >
      <span
        className={`text-sm font-medium ${checked ? (danger ? "text-destructive" : "text-primary") : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <div
        className={`
        w-5 h-5 rounded flex items-center justify-center transition-colors
        ${checked ? (danger ? "bg-destructive" : "bg-primary") : "bg-muted-foreground/30"}
      `}
      >
        {checked && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
      </div>
    </div>
  );
}
