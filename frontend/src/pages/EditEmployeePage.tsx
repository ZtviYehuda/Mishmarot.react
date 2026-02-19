import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRightLeft,
  AlertTriangle,
  Cake,
} from "lucide-react";
import { useMemo } from "react";
import { TransferRequestModal } from "@/components/employees/modals/TransferRequestModal";
import { PageHeader } from "@/components/layout/PageHeader";
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
import { cn, cleanUnitName } from "@/lib/utils";

const InputItem = ({
  label,
  icon: Icon,
  children,
  required,
  className,
}: any) => (
  <div className={cn("space-y-1.5 h-full flex flex-col", className)}>
    <Label className="text-[12px] font-bold text-slate-400 pr-1 flex items-center gap-2">
      {Icon && <Icon className="w-3.5 h-3.5 opacity-60" />}
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    <div className="relative flex-1 flex flex-col justify-center">
      {children}
    </div>
  </div>
);

const UnitPicker = ({
  label,
  value,
  options = [],
  onChange,
  placeholder,
  disabled,
  icon: Icon,
  onClear,
  open,
  onOpenChange,
}: any) => {
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const timer = setTimeout(() => {
        if (triggerRef.current?.getAttribute("data-state") !== "open") {
          triggerRef.current?.click();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const selectedOption = options.find((o: any) => o.id.toString() === value);
  const displayValue = selectedOption
    ? cleanUnitName(selectedOption.name)
    : placeholder;
  const pickerId = `picker-${label}`;

  return (
    <div className="flex-1 min-w-[200px] space-y-1.5 group">
      <div className="flex items-center justify-between px-1">
        <label
          onClick={() => !disabled && triggerRef.current?.click()}
          className={cn(
            "text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors",
            !disabled && "cursor-pointer hover:text-primary",
          )}
        >
          {label}
        </label>
        {value && !disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="text-[9px] font-bold text-primary hover:opacity-70 transition-opacity"
          >
            איפוס
          </button>
        )}
      </div>

      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        onOpenChange={onOpenChange}
      >
        <SelectTrigger
          ref={triggerRef}
          id={pickerId}
          className={cn(
            "h-16 w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl transition-all duration-200 px-4 hover:border-primary/30 focus:ring-0 cursor-pointer overflow-hidden",
            !value && "bg-slate-50/30 border-dashed",
            disabled && "opacity-30 grayscale pointer-events-none",
          )}
        >
          <div className="flex items-center gap-4 w-full text-right pointer-events-none">
            {Icon && (
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0",
                  value ? "text-primary" : "text-slate-300",
                )}
              />
            )}

            <div className="flex-1 overflow-hidden">
              <p
                className={cn(
                  "text-[15px] font-bold tracking-tight",
                  value ? "text-slate-900 dark:text-white" : "text-slate-400",
                )}
              >
                {displayValue}
              </p>
            </div>
          </div>
        </SelectTrigger>

        <SelectContent
          dir="rtl"
          position="popper"
          sideOffset={5}
          className="rounded-xl border-slate-200 dark:border-slate-800 shadow-2xl p-1 bg-white dark:bg-slate-950 z-[150] min-w-[200px]"
        >
          {options.map((opt: any) => (
            <SelectItem
              key={opt.id}
              value={opt.id.toString()}
              className="rounded-lg py-2.5 pr-10 pl-4 font-bold text-slate-700 dark:text-slate-200 focus:bg-slate-50 dark:focus:bg-slate-900 focus:text-primary transition-all cursor-pointer"
            >
              {cleanUnitName(opt.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const SwitchItem = ({
  label,
  checked,
  onCheckedChange,
  icon: Icon,
  description,
}: any) => (
  <div
    className={cn(
      "flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-900 transition-colors",
      checked
        ? "bg-primary/[0.02] border-primary/10"
        : "bg-white dark:bg-slate-950",
    )}
  >
    <div className="flex items-center gap-4">
      {Icon && (
        <Icon
          className={cn(
            "w-5.5 h-5.5 shrink-0",
            checked ? "text-primary" : "text-slate-300",
          )}
        />
      )}
      <div>
        <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-none">
          {label}
        </p>
        <p className="text-[11px] text-slate-400 font-medium mt-1 truncate max-w-[280px]">
          {description}
        </p>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="scale-90"
    />
  </div>
);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <InputItem label="שם פרטי" required icon={User}>
            <Input
              value={formData.first_name || ""}
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
              placeholder="פרטי"
              className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 shadow-sm rounded-xl font-bold"
            />
          </InputItem>

          <InputItem label="שם משפחה" required icon={User}>
            <Input
              value={formData.last_name || ""}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
              placeholder="משפחה"
              className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 shadow-sm rounded-xl font-bold"
            />
          </InputItem>

          <InputItem label="תעודת זהות" icon={BadgeCheck}>
            <Input
              value={formData.national_id || ""}
              onChange={(e) => handleFieldChange("national_id", e.target.value)}
              placeholder="000000000"
              className="font-mono bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 shadow-sm rounded-xl text-lg font-black tracking-widest text-center"
            />
          </InputItem>

          <InputItem label="מספר אישי" icon={BadgeCheck}>
            <Input
              value={formData.personal_number || ""}
              onChange={(e) =>
                handleFieldChange("personal_number", e.target.value)
              }
              placeholder="0000000"
              className="font-mono bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 shadow-sm rounded-xl text-lg font-black tracking-widest text-center"
            />
          </InputItem>

          <InputItem label="מין" required icon={User}>
            <Select
              value={formData.gender || ""}
              onValueChange={(val) => handleFieldChange("gender", val)}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 text-right shadow-sm rounded-xl font-bold px-4">
                <SelectValue placeholder="בחר מין" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                <SelectItem value="male" className="font-bold py-2.5">
                  גבר
                </SelectItem>
                <SelectItem value="female" className="font-bold py-2.5">
                  אישה
                </SelectItem>
              </SelectContent>
            </Select>
          </InputItem>

          <InputItem label="תאריך לידה" required icon={Calendar}>
            <Input
              type="date"
              value={
                formData.birth_date ? formData.birth_date.split("T")[0] : ""
              }
              onChange={(e) => handleFieldChange("birth_date", e.target.value)}
              className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 w-full shadow-sm rounded-xl font-bold"
            />
          </InputItem>

          <InputItem label="מעמד" icon={FileCheck}>
            <Select
              value={formData.service_type_id?.toString() || ""}
              onValueChange={(val) =>
                handleFieldChange("service_type_id", parseInt(val))
              }
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 text-right shadow-sm rounded-xl font-bold px-4">
                <SelectValue placeholder="בחר מעמד" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-xl border-slate-200 dark:border-slate-800"
              >
                {serviceTypes.map((st: any) => (
                  <SelectItem
                    key={st.id}
                    value={st.id.toString()}
                    className="font-bold py-2.5"
                  >
                    {st.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InputItem>

          <InputItem label="עיר מגורים" icon={MapPin}>
            <Input
              value={formData.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="ירושלים, ת''א..."
              className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/20 transition-all h-12 shadow-sm rounded-xl font-bold"
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

          <div className="bg-red-50/60 rounded-2xl p-5 border border-red-100 dark:bg-red-900/10 dark:border-red-900/30 shadow-md">
            <h4 className="text-sm font-black text-red-600 flex items-center gap-2 pb-2 mb-4 border-b border-red-200/50">
              <HeartPulse className="w-4 h-4" /> איש קשר לחירום
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 w-full items-end">
                <InputItem
                  label="שם מלא (פרטי ומשפחה)"
                  className="bg-transparent col-span-3"
                >
                  <Input
                    value={emergencyDetails.name}
                    onChange={(e) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        name: e.target.value,
                      })
                    }
                    className="w-full h-11 bg-transparent border-red-200/50 focus-visible:ring-red-500/30 flex"
                  />
                </InputItem>
                <InputItem label="קרבה" className="bg-transparent col-span-2">
                  <Select
                    value={emergencyDetails.relation}
                    onValueChange={(val) =>
                      setEmergencyDetails({
                        ...emergencyDetails,
                        relation: val,
                      })
                    }
                  >
                    <SelectTrigger className="w-full h-11 bg-transparent border-red-200/50 text-right flex">
                      <SelectValue placeholder="בחר" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
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
  setFormData,
  openUnit,
  setOpenUnit,
}: any) => {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const isDeptDisabled = !user.is_admin;
  const isSectionDisabled = !user.is_admin && !user.commands_department_id;
  const isTeamDisabled =
    !user.is_admin && !user.commands_department_id && !user.commands_section_id;

  const currentCommander = useMemo(() => {
    if (!formData.is_commander) return null;

    let unitWithCommander = null;
    if (formData.team_id) {
      unitWithCommander = teams.find((t: any) => t.id === formData.team_id);
    } else if (selectedSectionId) {
      unitWithCommander = sections.find(
        (s: any) => s.id === parseInt(selectedSectionId),
      );
    } else if (selectedDeptId) {
      unitWithCommander = structure.find(
        (d: any) => d.id === parseInt(selectedDeptId),
      );
    }

    if (
      unitWithCommander?.commander_id &&
      unitWithCommander.commander_id !== formData.id
    ) {
      return {
        id: unitWithCommander.commander_id,
        name: unitWithCommander.commander_name,
      };
    }
    return null;
  }, [
    formData.is_commander,
    formData.team_id,
    selectedSectionId,
    selectedDeptId,
    structure,
    sections,
    teams,
    formData.id,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 1. Organizational Affiliation - Compact & Professional */}
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Building2 className="w-5 h-5" /> שיוך יחידתי
          </span>
        }
        action={
          <Button
            variant="secondary"
            className="h-10 px-4 gap-2 font-black bg-slate-100 dark:bg-slate-900 hover:bg-primary hover:text-white transition-all rounded-xl border-none shadow-sm text-xs"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>בקשת העברה</span>
          </Button>
        }
      >
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          <UnitPicker
            label="מחלקה"
            value={selectedDeptId}
            options={structure}
            open={openUnit === "dept"}
            onOpenChange={(o: boolean) => setOpenUnit(o ? "dept" : null)}
            onChange={(val: any) => {
              setSelectedDeptId(val);
              setFormData((prev: any) => ({
                ...prev,
                department_id: parseInt(val),
                section_id: undefined,
                team_id: undefined,
              }));
              setSelectedSectionId("");
            }}
            placeholder="בחר מחלקה"
            icon={Building2}
            disabled={isDeptDisabled}
            onClear={() => {
              setSelectedDeptId("");
              setFormData((prev: any) => ({
                ...prev,
                department_id: undefined,
                section_id: undefined,
                team_id: undefined,
              }));
              setSelectedSectionId("");
            }}
          />

          <UnitPicker
            label="מדור"
            value={selectedSectionId}
            options={sections}
            open={openUnit === "section"}
            onOpenChange={(o: boolean) => setOpenUnit(o ? "section" : null)}
            onChange={(val: any) => {
              setSelectedSectionId(val);
              setFormData((prev: any) => ({
                ...prev,
                section_id: parseInt(val),
                team_id: undefined,
              }));
            }}
            placeholder="בחר מדור"
            icon={Briefcase}
            disabled={!selectedDeptId || isSectionDisabled}
            onClear={() => {
              setSelectedSectionId("");
              setFormData((prev: any) => ({
                ...prev,
                section_id: undefined,
                team_id: undefined,
              }));
            }}
          />

          <UnitPicker
            label="חוליה"
            value={formData.team_id?.toString() || ""}
            options={teams}
            open={openUnit === "team"}
            onOpenChange={(o: boolean) => setOpenUnit(o ? "team" : null)}
            onChange={(val: any) => handleFieldChange("team_id", parseInt(val))}
            placeholder="בחר חוליה"
            icon={User}
            disabled={!selectedSectionId || isTeamDisabled}
            onClear={() => handleFieldChange("team_id", undefined)}
          />
        </div>

        {(user?.is_admin || user?.is_commander) && (
          <div className="mt-8 space-y-6 max-w-xl mx-auto border-t pt-6">
            <SwitchItem
              label="מינוי מפקד"
              checked={!!formData.is_commander}
              onCheckedChange={(c: boolean) =>
                handleFieldChange("is_commander", c)
              }
              icon={Shield}
              description="הגדר שוטר זה כמפקד היחידה הארגונית שנבחרה"
            />

            {currentCommander && (
              <div className="flex items-start gap-4 p-5 rounded-[24px] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20 animate-in slide-in-from-top-2 duration-500">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-black text-amber-900 dark:text-amber-200 leading-tight">
                    שים לב: קיים מפקד פעיל ליחידה זו
                  </p>
                  <p className="text-[11px] font-bold text-amber-600/80 leading-tight">
                    הגדרת שוטר זה כמפקד תבטל את מינויו של{" "}
                    <span className="text-amber-700 dark:text-amber-300 underline decoration-2 underline-offset-2">
                      {currentCommander.name}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CompactCard>

      <TransferRequestModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        employeeName={formData.full_name || "השוטר"}
        structure={structure}
      />

      {/* 2. Professional Details & Permissions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Timeline */}
        <CompactCard
          title={
            <span className="flex items-center gap-2 text-primary font-black text-lg">
              <Calendar className="w-5 h-5" /> ציר זמן שירות
            </span>
          }
        >
          <div className="space-y-4">
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
              label="סיווג ביטחוני"
              checked={!!formData.security_clearance}
              onCheckedChange={(c: boolean) =>
                handleFieldChange("security_clearance", c)
              }
            />
            <SwitchItem
              label="רישיון נהיגה משטרתי"
              checked={!!formData.police_license}
              onCheckedChange={(c: boolean) =>
                handleFieldChange("police_license", c)
              }
            />
          </div>
        </CompactCard>
      </div>
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
  const [openUnit, setOpenUnit] = useState<string | null>(null);

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

    if (
      (!formData.national_id && !formData.personal_number) ||
      !formData.birth_date
    ) {
      toast.error("יש להזין מספר אישי או ת.ז, ותאריך לידה");
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
        "flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-sm font-black transition-all duration-500 relative group overflow-hidden",
        active
          ? "text-primary"
          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white dark:bg-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-none rounded-2xl border border-slate-200/50 dark:border-slate-700/50"
          initial={false}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500",
              active
                ? "bg-primary text-white scale-110 rotate-0 shadow-lg shadow-primary/20"
                : "bg-white/50 dark:bg-slate-800/50 text-slate-400 group-hover:scale-110 group-hover:bg-white",
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <span className="tracking-tight">{label}</span>
      </div>
    </button>
  );

  return (
    <div className="bg-background/50 animate-in fade-in duration-500" dir="rtl">
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

      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/60 py-8 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <PageHeader
              icon={Settings2}
              title={`עריכת שוטר: ${formData.first_name || ""} ${formData.last_name || ""}`}
              subtitle={`תיק אישי: ${formData.personal_number || employee.personal_number}`}
              category="ניהול שוטרים"
              categoryLink="/employees"
            />

            <div className="flex items-center gap-3 self-end md:self-auto">
              <Button
                variant="ghost"
                onClick={() => navigate(`/employees/${id}`)}
                className="h-11 px-5 rounded-xl font-bold text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4 ml-2" />
                ביטול
              </Button>

              <Button
                variant="outline"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className={cn(
                  "h-11 px-5 rounded-xl font-bold transition-all",
                  employee.is_active
                    ? "text-destructive border-destructive/20 hover:bg-destructive hover:text-white"
                    : "text-emerald-600 border-emerald-500/20 hover:bg-emerald-600 hover:text-white",
                )}
              >
                {employee.is_active ? "הפוך ללא פעיל" : "החזר לפעילות"}
              </Button>

              <Button
                className="h-11 px-8 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2"
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>שמור שינויים</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SIDEBAR (Match Profile Page) */}
          <div className="lg:col-span-3 lg:sticky lg:top-[120px] space-y-6 order-2">
            <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden shadow-sm">
              <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
                <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>

                {(() => {
                  if (!formData.birth_date) return null;
                  const today = new Date();
                  const birthDate = new Date(formData.birth_date);
                  if (
                    today.getDate() === birthDate.getDate() &&
                    today.getMonth() === birthDate.getMonth()
                  ) {
                    return (
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                          <Cake className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-900">
                            יום הולדת
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="px-6 pb-8 text-center -mt-12 relative text-right">
                <div
                  className={cn(
                    "w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 mx-auto border-4 border-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
                    !employee.is_active && "grayscale opacity-50",
                  )}
                >
                  {formData.first_name?.[0]}
                  {formData.last_name?.[0]}
                </div>

                <h2 className="text-xl font-black text-foreground mb-1 text-center">
                  {formData.first_name} {formData.last_name}
                </h2>

                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge variant="outline" className="font-mono bg-muted/50">
                    {formData.personal_number}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {serviceTypes.find(
                      (st) => st.id === formData.service_type_id,
                    )?.name || "—"}
                  </Badge>
                </div>

                <div className="pr-2 py-4 space-y-6 relative border-t border-dashed border-border/60">
                  <div className="absolute right-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

                  <div
                    className="relative pr-6 cursor-pointer group/item transition-all"
                    onClick={() => {
                      setActiveTab("pro");
                      setTimeout(() => setOpenUnit("dept"), 150);
                    }}
                  >
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10 group-hover/item:scale-125 transition-transform" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider group-hover/item:text-primary transition-colors">
                      מחלקה
                    </span>
                    <span className="font-bold text-sm text-foreground block group-hover/item:text-primary transition-colors">
                      {cleanUnitName(
                        structure.find(
                          (d) => d.id.toString() === selectedDeptId,
                        )?.name,
                      ) || "לא נבחרה"}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "relative pr-6 transition-all",
                      selectedDeptId
                        ? "cursor-pointer group/item"
                        : "opacity-40",
                    )}
                    onClick={() =>
                      selectedDeptId &&
                      (setActiveTab("pro"),
                      setTimeout(() => setOpenUnit("section"), 150))
                    }
                  >
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary/60 ring-4 ring-primary/5 group-hover/item:scale-125 transition-transform" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider group-hover/item:text-primary transition-colors">
                      מדור
                    </span>
                    <span className="font-bold text-sm text-foreground block group-hover/item:text-primary transition-colors">
                      {cleanUnitName(
                        sections.find(
                          (s) => s.id.toString() === selectedSectionId,
                        )?.name,
                      ) || "לא נבחר"}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "relative pr-6 transition-all",
                      selectedSectionId
                        ? "cursor-pointer group/item"
                        : "opacity-40",
                    )}
                    onClick={() =>
                      selectedSectionId &&
                      (setActiveTab("pro"),
                      setTimeout(() => setOpenUnit("team"), 150))
                    }
                  >
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary/30 ring-4 ring-primary/5 group-hover/item:scale-125 transition-transform" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider group-hover/item:text-primary transition-colors">
                      חוליה
                    </span>
                    <span className="font-bold text-sm text-foreground block group-hover/item:text-primary transition-colors">
                      {cleanUnitName(
                        teams.find((t) => t.id === formData.team_id)?.name,
                      ) || "לא נבחרה"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT Area */}
          <div className="lg:col-span-9 space-y-8 order-1 min-h-[600px]">
            {/* Tabs Selector */}
            <div className="bg-slate-200/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-1.5 flex gap-1.5 max-w-md shadow-inner">
              <TabButton
                active={activeTab === "personal"}
                onClick={() => setActiveTab("personal")}
                icon={User}
                label="פרטים אישיים"
              />
              <TabButton
                active={activeTab === "pro"}
                onClick={() => setActiveTab("pro")}
                icon={Shield}
                label="מקצועי והרשאות"
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pb-20"
              >
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
                    setFormData={setFormData}
                    openUnit={openUnit}
                    setOpenUnit={setOpenUnit}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
