import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import apiClient from "@/config/api.client";
import type { Employee } from "@/types/employee.types";
import {
  Loader2, User as UserIcon, Phone, Calendar, BadgeCheck,
  MapPin, History as HistoryIcon, Mail, HeartPulse, Cake,
  ArrowRight, Save, X, Shield, Settings, Info, Briefcase, Camera, Star,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { format } from "date-fns";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared Component: UnitPicker ──────────────────────────────────────────────
const UnitPicker = ({ label, value, options, onChange, disabled, icon: Icon }: any) => (
  <div className="flex-1 space-y-1.5">
    <div className="flex items-center gap-1.5 px-1">
      {Icon && <Icon className="w-3 h-3 text-muted-foreground" />}
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
    <Select value={value?.toString() || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full bg-background sm:bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 transition-all h-12 rounded-xl font-bold px-4">
        <SelectValue placeholder={`בחר ${label}`} />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {options.map((opt: any) => (
          <SelectItem key={opt.id} value={opt.id.toString()}>
            {cleanUnitName(opt.name)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

// ── Shared Component: Field Display ──────────────────────────────────────────
const Field = ({ label, value, mono = false, href, icon: Icon }: {
  label: string; value?: string | null; mono?: boolean; href?: string; icon?: any;
}) => {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-primary/20">
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
        </div>
      )}
      <div className="flex flex-col justify-center">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className={cn("font-bold text-foreground text-[15px] mt-0.5", href && "text-primary hover:underline", mono && "font-mono")}>
          {value}
        </span>
      </div>
    </div>
  );

  if (href) return <a href={href} className="block group">{content}</a>;
  return content;
};

// ── Shared Component: Edit Field Wrapper ─────────────────────────────────────
const EditField = ({ label, children, icon: Icon, className }: {
  label: string; children: React.ReactNode; icon?: any; className?: string;
}) => (
  <div className={cn(
    "flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5",
    className
  )}>
    {Icon && (
      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
    )}
    <div className="flex-1 flex flex-col justify-center min-w-0">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{label}</span>
      <div className="relative mt-0.5">
        {children}
      </div>
    </div>
  </div>
);

// ── Section Card ──────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, className, action }: {
  title: string; icon: any; children: React.ReactNode; className?: string; action?: React.ReactNode;
}) => (
  <div className={cn("bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm", className)}>
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/60">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-base font-black text-slate-800 dark:text-slate-100">{title}</span>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ── Tab Button (New Premium Design) ──────────────────────────────────────────
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex-1 flex items-center justify-center transition-all relative group h-full",
      active
        ? "text-primary"
        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
    )}
  >
    {active && (
      <motion.div
        layoutId="activeTab"
        className="absolute inset-1 bg-white dark:bg-slate-800 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-slate-200/50 dark:border-slate-700/50"
        initial={false}
        transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
      />
    )}
    <div className="relative z-10 flex items-center gap-3">
      {Icon && (
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
            active
              ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
              : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:scale-110",
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      )}
      <span className={cn(
        "font-black tracking-tight leading-none whitespace-nowrap transition-all text-sm",
        active ? "opacity-100" : "opacity-70 group-hover:opacity-100"
      )}>
        {label}
      </span>
    </div>
  </button>
);

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const dateParam = searchParams.get("date");
  const initialDate = useMemo(() => {
    if (!dateParam) return undefined;
    const parts = dateParam.split("-");
    if (parts.length === 3)
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return undefined;
  }, [dateParam]);

  const { user } = useAuthContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal"); // personal | pro
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<any>({});
  const [structure, setStructure] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const fetchData = async () => {
    if (!id) return;
    try {
      const [{ data: empData }, { data: structData }, { data: serviceData }] = await Promise.all([
        apiClient.get<Employee>(endpoints.updateEmployeeEndpoint(parseInt(id))),
        apiClient.get("/employees/structure"),
        apiClient.get("/employees/service-types"),
      ]);
      setEmployee(empData);
      setStructure(structData);
      setServiceTypes(serviceData);
      
      // Init form
      setFormData(empData);
      setSelectedDeptId(empData.department_id?.toString() || "");
      setSelectedSectionId(empData.section_id?.toString() || "");
    } catch {
      toast.error("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (pathname.includes("/edit/")) {
       setEditMode(true);
    } else {
       setEditMode(false);
    }
  }, [pathname]);

  const sections = useMemo(() => {
    if (!selectedDeptId) return [];
    return structure.find((d) => d.id.toString() === selectedDeptId)?.sections || [];
  }, [selectedDeptId, structure]);

  const teams = useMemo(() => {
    if (!selectedSectionId) return [];
    return sections.find((s: any) => s.id.toString() === selectedSectionId)?.teams || [];
  }, [selectedSectionId, sections]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await apiClient.put(endpoints.updateEmployeeEndpoint(parseInt(id!)), formData);
      toast.success("כרטיס שוטר עודכן בהצלחה");
      await fetchData();
      setEditMode(false);
      navigate(`/employees/${id}`); // Back to non-edit URL
    } catch {
      toast.error("שגיאה בעדכון כרטיס שוטר");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }
  if (!employee) return null;

  const displayName = employee.dominant_name
    ? `${employee.dominant_name} ${employee.last_name}`
    : `${employee.first_name} ${employee.last_name}`;

  const isBirthdayToday = (() => {
    if (!employee.birth_date) return false;
    const today = new Date();
    const bd = new Date(employee.birth_date);
    return today.getDate() === bd.getDate() && today.getMonth() === bd.getMonth();
  })();

  const commanderTitle = (() => {
    if (!employee.is_commander) return null;
    if (employee.commands_team_id) return `מפקד חוליית ${cleanUnitName(employee.team_name)}`;
    if (employee.commands_section_id) return `מפקד מדור ${cleanUnitName(employee.section_name)}`;
    if (employee.commands_department_id) return `מפקד מחלקת ${cleanUnitName(employee.department_name)}`;
    return "מפקד";
  })();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background" dir="rtl">
      <BirthdayGreetingsModal
        open={showBirthdayModal}
        onOpenChange={setShowBirthdayModal}
        targetEmployee={employee ? {
          id: employee.id, first_name: employee.first_name, last_name: employee.last_name,
          phone_number: employee.phone_number || "", birth_date: employee.birth_date,
          day: employee.birth_date ? new Date(employee.birth_date).getDate() : 1,
          month: employee.birth_date ? new Date(employee.birth_date).getMonth() + 1 : 1,
        } : undefined}
      />

      <div className="w-full max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 2xl:p-12">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between mb-6">
           <button
             onClick={() => navigate(editMode ? `/employees/${id}` : "/employees")}
             className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors bg-white dark:bg-slate-900 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"
           >
             <ArrowRight className="w-4 h-4" /> חזרה
           </button>
           
           {!editMode && isBirthdayToday && (
              <button
                onClick={() => setShowBirthdayModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-black dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200"
              >
                <Cake className="w-4 h-4" />
                יום הולדת 🎂
              </button>
            )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* ── RIGHT FRAME: PROFILE CARD (HERO) ── */}
          <div className="w-full lg:w-80 xl:w-[360px] shrink-0 sticky top-24">
             <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center text-center relative overflow-hidden">
                
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent -z-10" />

                <div className="relative group mt-4">
                  <div className={cn(
                    "w-28 h-28 rounded-3xl flex items-center justify-center text-4xl font-black border-[6px] border-white dark:border-slate-950 ring-1 ring-slate-100 dark:ring-slate-800 shadow-xl transition-all",
                    employee.is_active
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-slate-200 text-slate-500 grayscale",
                    editMode && "ring-primary/40 ring-offset-4 ring-offset-white dark:ring-offset-slate-950 scale-105"
                  )}>
                    {formData.first_name?.[0]}{formData.last_name?.[0]}
                  </div>
                  {editMode && (
                    <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg border-[3px] border-white dark:border-slate-950">
                      <Camera className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-1.5 w-full">
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {editMode ? `${formData.first_name || ""} ${formData.last_name || ""}` : displayName}
                  </h1>
                  {commanderTitle && (
                    <div className="flex justify-center mt-2">
                       <p className="flex items-center gap-1.5 text-xs font-black text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 bg-gradient-to-l from-primary/5 to-primary/10">
                         <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                         {commanderTitle}
                       </p>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-6" />

                <div className="w-full space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {selectedDeptId && (
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0 shadow-sm">
                        {cleanUnitName(structure.find(d => d.id.toString() === selectedDeptId)?.name)}
                      </Badge>
                    )}
                    {selectedSectionId && (
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0 shadow-sm">
                        {cleanUnitName(sections.find((s: any) => s.id.toString() === selectedSectionId)?.name)}
                      </Badge>
                    )}
                    {formData.team_id && (
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 text-[10px] rounded-lg border-0 shadow-sm">
                        {cleanUnitName(teams.find((t: any) => t.id === formData.team_id)?.name)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-center mt-2">
                     <Badge variant="outline" className="border-primary/20 text-primary font-bold px-3 py-1 rounded-lg bg-white dark:bg-slate-900">
                        {employee.service_type_name}
                     </Badge>
                  </div>
                </div>

                <div className="w-full mt-8">
                  {editMode ? (
                     <div className="flex flex-col gap-2">
                        <Button size="lg" onClick={handleSubmit} disabled={saving} className="w-full rounded-xl font-black h-12 shadow-md shadow-primary/20">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />} שמור שינויים
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate(`/employees/${id}`)} className="w-full rounded-xl font-bold h-12 bg-white dark:bg-slate-950">
                           ביטול
                        </Button>
                     </div>
                  ) : (
                     !user?.is_temp_commander && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/employees/edit/${id}`)}
                          className="w-full h-12 rounded-xl font-black text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-primary transition-all shadow-sm"
                        >
                          <Settings className="w-4 h-4 ml-2" />
                          עריכת פרופיל
                        </Button>
                     )
                  )}
                </div>

             </div>

             {/* Tab transition buttons (Moved below the card) */}
             {editMode && (
               <div className="mt-4 bg-white dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-1.5 flex shadow-sm h-14 items-stretch w-full">
                 <TabButton
                   active={activeTab === "personal"}
                   onClick={() => setActiveTab("personal")}
                   icon={UserIcon}
                   label="פרטים אישיים"
                 />
                 <TabButton
                   active={activeTab === "pro"}
                   onClick={() => setActiveTab("pro")}
                   icon={Shield}
                   label="מקצועי והרשאות"
                 />
               </div>
             )}
          </div>

          {/* ── LEFT FRAME: CONTENT AREA ── */}
          <div className="flex-1 w-full min-w-0">

            <AnimatePresence mode="wait">
              {!editMode ? (
                <motion.div
                  key="view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Section title="פרטים אישיים" icon={UserIcon}>
                      <div className="grid grid-cols-1 gap-4">
                        <Field label="שם מלא" value={`${employee.first_name} ${employee.last_name}`} />
                        {employee.dominant_name && <Field label="שם תצוגה" value={employee.dominant_name} />}
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="מין" value={employee.gender === "male" ? "גבר" : "אישה"} />
                            <Field label="תאריך לידה" value={employee.birth_date ? format(new Date(employee.birth_date), "dd/MM/yyyy") : null} />
                        </div>
                        <Field label="עיר מגורים" value={employee.city} />
                      </div>
                    </Section>

                    <Section title="פרטי קשר" icon={Phone}>
                      <div className="grid grid-cols-1 gap-4">
                        <Field label="טלפון נייד" value={employee.phone_number} mono href={`tel:${employee.phone_number}`} icon={Phone} />
                        <Field label="דואר אלקטרוני" value={employee.email} href={`mailto:${employee.email}`} icon={Mail} />
                      </div>
                    </Section>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <Section title="איש קשר לחירום" icon={HeartPulse} className="border-rose-100 dark:border-rose-900/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="שם וקרבה" value={employee.emergency_contact?.split('-')?.[0]?.trim() || "-"} icon={UserIcon} />
                        <Field label="טלפון חירום" value={employee.emergency_contact?.split('-')?.[1]?.trim() || employee.emergency_contact} icon={Phone} mono />
                      </div>
                    </Section>
                  </div>

                  {user && !user.is_temp_commander && (
                     <Section title="היסטוריית דיווחים" icon={HistoryIcon}>
                        <StatusHistoryList employeeId={employee.id} showControls initialDate={initialDate} limit={3} />
                     </Section>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="space-y-6 pb-24 lg:pb-0"
                >
                  {activeTab === "personal" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Section title="פרטים אישיים" icon={UserIcon}>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-2 gap-4">
                              <EditField label="שם פרטי *" icon={UserIcon}>
                                <Input value={formData.first_name || ""} onChange={(e) => handleFieldChange("first_name", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" />
                              </EditField>
                              
                              <EditField label="שם משפחה *" icon={UserIcon}>
                                <Input value={formData.last_name || ""} onChange={(e) => handleFieldChange("last_name", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" />
                              </EditField>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <EditField label="מין" icon={UserIcon}>
                                <Select value={formData.gender} onValueChange={(val) => handleFieldChange("gender", val)}>
                                  <SelectTrigger className="h-8 border-0 bg-transparent px-0 focus:ring-0 shadow-none font-bold text-[15px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent dir="rtl">
                                    <SelectItem value="male">גבר</SelectItem>
                                    <SelectItem value="female">אישה</SelectItem>
                                  </SelectContent>
                                </Select>
                              </EditField>

                              <EditField label="תאריך לידה" icon={Calendar}>
                                <Input type="date" value={formData.birth_date ? formData.birth_date.split("T")[0] : ""} onChange={(e) => handleFieldChange("birth_date", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" />
                              </EditField>
                            </div>

                            <EditField label="עיר מגורים" icon={MapPin}>
                              <Input value={formData.city || ""} onChange={(e) => handleFieldChange("city", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" />
                            </EditField>
                          </div>
                        </Section>

                        <Section title="פרטי קשר" icon={Phone}>
                          <div className="grid grid-cols-1 gap-4">
                            <EditField label="טלפון נייד" icon={Phone}>
                              <Input value={formData.phone_number || ""} onChange={(e) => handleFieldChange("phone_number", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" dir="ltr" />
                            </EditField>
                            
                            <EditField label="אימייל" icon={Mail}>
                              <Input value={formData.email || ""} onChange={(e) => handleFieldChange("email", e.target.value)} className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" dir="ltr" />
                            </EditField>
                          </div>
                        </Section>
                      </div>

                      <Section title="איש קשר לחירום" icon={HeartPulse} className="border-rose-100 dark:border-rose-900/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <EditField label="שם וקרבה" icon={UserIcon}>
                            <Input 
                              value={formData.emergency_contact?.split('-')?.[0]?.trim() || ""} 
                              onChange={(e) => {
                                const [_, phone] = (formData.emergency_contact || "").split('-').map((s: string) => s.trim());
                                handleFieldChange("emergency_contact", `${e.target.value} - ${phone || ""}`);
                              }}
                              className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" 
                            />
                          </EditField>
                          <EditField label="טלפון חירום" icon={Phone}>
                            <Input 
                              value={formData.emergency_contact?.split('-')?.[1]?.trim() || ""} 
                              onChange={(e) => {
                                const [name, _] = (formData.emergency_contact || "").split('-').map((s: string) => s.trim());
                                handleFieldChange("emergency_contact", `${name || ""} - ${e.target.value}`);
                              }}
                              className="h-8 border-0 bg-transparent px-0 focus-visible:ring-0 shadow-none font-bold text-[15px]" 
                              dir="ltr"
                            />
                          </EditField>
                        </div>
                      </Section>
                    </div>
                  )}

                  {activeTab === "pro" && (
                    <div className="grid grid-cols-1 gap-6">
                      <Section title="שיבוץ ארגוני" icon={MapPin}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          {user && (
                            <>
                          <UnitPicker
                            label="מחלקה"
                            value={selectedDeptId}
                            options={structure}
                            onChange={(val: string) => {
                              setSelectedDeptId(val);
                              setSelectedSectionId("");
                              handleFieldChange("department_id", parseInt(val));
                              handleFieldChange("section_id", null);
                              handleFieldChange("team_id", null);
                            }}
                            disabled={!user.is_admin}
                          />
                          <UnitPicker
                            label="מדור"
                            value={selectedSectionId}
                            options={sections}
                            onChange={(val: string) => {
                              setSelectedSectionId(val);
                              handleFieldChange("section_id", parseInt(val));
                              handleFieldChange("team_id", null);
                            }}
                            disabled={!user.is_admin && !user.commands_department_id}
                          />
                          <UnitPicker
                            label="חוליה"
                            value={formData.team_id}
                            options={teams}
                            onChange={(val: string) => handleFieldChange("team_id", parseInt(val))}
                            disabled={!user.is_admin && !user.commands_department_id && !user.commands_section_id}
                          />
                          </>
                          )}
                        </div>
                      </Section>

                      <Section title="הגדרות תפקיד וצבא" icon={Shield}>
                        <div className="grid grid-cols-1 gap-8">
                           <div className="space-y-4">
                              <div className="space-y-1.5">
                                 <Label className="text-[12px] font-bold text-slate-400 pr-1">מעמד אירגוני</Label>
                                 <Select value={formData.service_type_id?.toString()} onValueChange={(val) => handleFieldChange("service_type_id", parseInt(val))}>
                                  <SelectTrigger className="w-full h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent dir="rtl">
                                    {serviceTypes.map(st => <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>)}
                                  </SelectContent>
                                 </Select>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black">דרגת פיקוד</span>
                                    <span className="text-[10px] text-muted-foreground font-bold">  סמכות צפייה וניהול שוטרים </span>
                                 </div>
                                 <Switch checked={formData.is_commander} onCheckedChange={(val) => handleFieldChange("is_commander", val)} />
                              </div>
                              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black"> שוטר פעיל</span>
                                 </div>
                                 <Switch checked={formData.is_active} onCheckedChange={(val) => handleFieldChange("is_active", val)} />
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                              <div className="space-y-1.5">
                                <Label className="text-[12px] font-bold text-slate-400 pr-1">תאריך גיוס</Label>
                                <Input type="date" value={formData.enlistment_date ? formData.enlistment_date.split("T")[0] : ""} onChange={(e) => handleFieldChange("enlistment_date", e.target.value)} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[12px] font-bold text-slate-400 pr-1">שחרור צפוי</Label>
                                <Input type="date" value={formData.discharge_date ? formData.discharge_date.split("T")[0] : ""} onChange={(e) => handleFieldChange("discharge_date", e.target.value)} className="h-12 rounded-xl font-bold bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                              </div>
                           </div>
                        </div>
                      </Section>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
