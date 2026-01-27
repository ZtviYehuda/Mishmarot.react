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
    ChevronRight,
    Building2,
    Calendar,
    Loader2,
    FileText,
    History,
    Settings2,
    Briefcase,
    BadgeCheck,
    AlertTriangle,
    ArrowRight
} from "lucide-react";
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
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Employee, CreateEmployeePayload } from "@/types/employee.types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// --- Styled Components ---

const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <div className="flex items-start gap-4 mb-6" dir="rtl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20 flex items-center justify-center text-white shrink-0">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight text-right">{title}</h2>
            <p className="text-sm text-slate-500 font-medium pt-1 text-right">{description}</p>
        </div>
    </div>
);

const FormField = ({ label, children, required, error }: { label: string, children: React.ReactNode, required?: boolean, error?: string }) => (
    <div className="space-y-2 group" dir="rtl">
        <label className="text-sm font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 group-focus-within:text-blue-600 transition-colors">
            {label}
            {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {children}
            {error && <span className="text-xs text-red-500 absolute -bottom-5 right-0 font-medium">{error}</span>}
        </div>
    </div>
);

const ToggleCard = ({ label, checked, onChange, icon: Icon, description }: {
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void,
    icon?: any,
    description?: string
}) => (
    <div
        onClick={() => onChange(!checked)}
        className={cn(
            "relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer select-none group hover:shadow-md",
            checked
                ? "bg-blue-50/50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-500"
                : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700 hover:border-slate-300"
        )}
        dir="rtl"
    >
        <div className="flex items-center gap-4 relative z-10">
            {Icon && (
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    checked ? "bg-blue-500 text-white shadow-md shadow-blue-500/20" : "bg-slate-100 text-slate-400 dark:bg-slate-700"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
            )}
            <div>
                <span className={cn("block text-base font-bold transition-colors text-right", checked ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
                    {label}
                </span>
                {description && <span className="text-xs text-slate-400 font-medium text-right block">{description}</span>}
            </div>
        </div>
        <div className={cn(
            "w-12 h-7 rounded-full relative transition-colors duration-300 shadow-inner",
            checked ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-600"
        )}>
            <div className={cn(
                "w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-sm",
                checked ? "left-1" : "left-6"
            )} />
        </div>
    </div>
);

// --- Main Page ---

export default function EditEmployeePage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { updateEmployee, getStructure, getServiceTypes } = useEmployees();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [structure, setStructure] = useState<any[]>([]);
    const [serviceTypes, setServiceTypes] = useState<any[]>([]);
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
        security_clearance: 0,
        police_license: false,
        emergency_contact: "",
    });

    // Cascading & UI state
    const [selectedDeptId, setSelectedDeptId] = useState<string>("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("");
    const [activeTab, setActiveTab] = useState("personal");

    useEffect(() => {
        const init = async () => {
            if (!id) return;
            try {
                const [structData, serviceData] = await Promise.all([
                    getStructure(),
                    getServiceTypes()
                ]);
                setStructure(structData);
                setServiceTypes(serviceData);

                const { data } = await apiClient.get<Employee>(endpoints.updateEmployeeEndpoint(parseInt(id)));
                setEmployee(data);

                setFormData({
                    first_name: data.first_name || "",
                    last_name: data.last_name || "",
                    personal_number: data.personal_number || "",
                    national_id: data.national_id || "",
                    phone_number: data.phone_number || "",
                    city: data.city || "",
                    birth_date: data.birth_date ? data.birth_date.split('T')[0] : "",
                    enlistment_date: data.enlistment_date ? data.enlistment_date.split('T')[0] : "",
                    discharge_date: data.discharge_date ? data.discharge_date.split('T')[0] : "",
                    assignment_date: data.assignment_date ? data.assignment_date.split('T')[0] : "",
                    team_id: data.team_id || undefined,
                    section_id: data.section_id || undefined,
                    department_id: data.department_id || undefined,
                    role_id: data.role_id || undefined,
                    service_type_id: data.service_type_id || undefined,
                    is_commander: data.is_commander || false,
                    is_admin: data.is_admin || false,
                    security_clearance: data.security_clearance || 0,
                    police_license: data.police_license || false,
                    emergency_contact: data.emergency_contact || "",
                });

                if (data.department_id) setSelectedDeptId(data.department_id.toString());
                if (data.section_id) setSelectedSectionId(data.section_id.toString());

            } catch (error) {
                console.error("Failed to fetch data:", error);
                toast.error("שגיאה בטעינת נתוני המשרת");
            } finally {
                setFetching(false);
            }
        };
        init();
    }, [id, getStructure, getServiceTypes]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!id) return;

        if (!formData.first_name || !formData.last_name || !formData.personal_number) {
            toast.error("אנא מלא את כל שדות החובה");
            return;
        }

        setLoading(true);
        const payload = {
            ...formData,
            section_id: selectedSectionId ? parseInt(selectedSectionId) : undefined,
            department_id: selectedDeptId ? parseInt(selectedDeptId) : undefined,
            team_id: formData.team_id || undefined
        };

        const success = await updateEmployee(parseInt(id), payload);
        if (success) {
            toast.success("תיק המשרת עודכן בהצלחה");
            navigate("/employees");
        }
        setLoading(false);
    };

    const sections = structure.find(d => d.id.toString() === selectedDeptId)?.sections || [];
    const teams = sections.find((s: any) => s.id.toString() === selectedSectionId)?.teams || [];

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                </div>
                <span className="mt-4 text-sm font-bold text-slate-400 animate-pulse">
                    טוען נתונים...
                </span>
            </div>
        );
    }

    if (!employee) return null;

    const TabButton = ({ value, label, icon: Icon }: { value: string, label: string, icon: any }) => (
        <TabsTrigger
            value={value}
            className="flex-1 min-w-[120px] py-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-xl transition-all border border-transparent data-[state=active]:border-slate-200/60 font-bold text-sm gap-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
            <Icon className="w-4 h-4 mb-0.5" />
            {label}
        </TabsTrigger>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 animate-in fade-in duration-500" dir="rtl">

            {/* Top Bar / Breadcrumbs */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm/50 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate('/employees')}>מצבת כוח אדם</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 rotate-180" />
                        <span className="text-slate-800 dark:text-white font-bold">עריכת תיק אישי</span>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/employees")} className="text-slate-500 hover:text-red-500 hover:bg-red-50">
                            ביטול
                        </Button>
                        <Button size="sm" onClick={() => handleSubmit()} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-lg px-6">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור שינויים"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Visual Sidebar Profile Summary - Positioned for Logic RTL (Col 1) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="lg:sticky lg:top-24 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-800 rounded-3xl relative group">
                            <div className="absolute top-0 w-full h-32 bg-gradient-to-br from-blue-600 to-indigo-600 -z-0"></div>

                            <div className="relative z-10 pt-16 px-6 pb-6 text-center">
                                <div className="w-28 h-28 rounded-3xl bg-white p-1 mx-auto shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500 ease-out">
                                    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-4xl font-black text-blue-600 overflow-hidden">
                                        {formData.first_name?.[0]}{formData.last_name?.[0]}
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1">
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                                        {formData.first_name} {formData.last_name}
                                    </h2>
                                    <p className="font-mono text-slate-400 font-bold tracking-wider">{formData.personal_number || "-------"}</p>
                                </div>

                                <div className="mt-6 flex flex-col gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">דרגה/תפקיד</span>
                                        <BadgeCheck className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-400">סיווג</span>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i < (formData.security_clearance || 0) ? "bg-amber-500" : "bg-slate-200")} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-blue-50 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 p-4 rounded-2xl">
                            <h4 className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300 text-sm mb-2">
                                <Settings2 className="w-4 h-4" /> סטטוס ניהולי
                            </h4>
                            <p className="text-xs text-blue-600/80 leading-relaxed text-right">
                                {formData.is_commander ? "מוגדר כמפקד במערכת." : "אינו מוגדר כמפקד."}
                                {formData.is_admin ? " בעל הרשאות ניהול מלאות." : ""}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-9">
                    <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto lg:mx-0 lg:w-full overflow-x-auto">
                            <TabsList className="bg-transparent h-auto p-0 flex gap-1 w-full justify-start lg:justify-between min-w-[500px]">
                                <TabButton value="personal" label="פרטים אישיים" icon={User} />
                                <TabButton value="org" label="שיוך וארגון" icon={Building2} />
                                <TabButton value="service" label="שירות וזמנים" icon={Calendar} />
                                <TabButton value="security" label="אבטחה והיתרים" icon={Shield} />
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
                                {/* Tab 1: Personal */}
                                <TabsContent value="personal" className="mt-0 focus-visible:outline-none">
                                    <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                                        <CardContent className="p-8 space-y-8">
                                            <SectionHeader icon={User} title="מידע אישי בסיסי" description="עדכון פרטי זהות ופרטים אישיים של המשרת" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField label="שם פרטי" required>
                                                    <Input
                                                        value={formData.first_name}
                                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl text-right"
                                                        placeholder="הזן שם פרטי"
                                                    />
                                                </FormField>
                                                <FormField label="שם משפחה" required>
                                                    <Input
                                                        value={formData.last_name}
                                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl text-right"
                                                        placeholder="הזן שם משפחה"
                                                    />
                                                </FormField>
                                                <FormField label="מספר אישי" required>
                                                    <Input
                                                        value={formData.personal_number}
                                                        onChange={(e) => setFormData({ ...formData, personal_number: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl font-mono tracking-wide text-right"
                                                        placeholder="1234567"
                                                    />
                                                </FormField>
                                                <FormField label="תעודת זהות" required>
                                                    <Input
                                                        value={formData.national_id}
                                                        onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl font-mono tracking-wide text-right"
                                                        placeholder="012345678"
                                                    />
                                                </FormField>
                                            </div>

                                            <div className="w-full h-px bg-slate-100 my-8" />

                                            <SectionHeader icon={Phone} title="דרכי התקשרות" description="עדכון כתובת, טלפונים ואנשי קשר" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                                <FormField label="טלפון נייד">
                                                    <div className="relative">
                                                        <Phone className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                                                        <Input
                                                            value={formData.phone_number}
                                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                                            className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl pr-10 text-right"
                                                            placeholder="05X-XXXXXXX"
                                                        />
                                                    </div>
                                                </FormField>
                                                <FormField label="עיר מגורים">
                                                    <Input
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                        className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl text-right"
                                                        placeholder="לדוגמה: תל אביב"
                                                    />
                                                </FormField>
                                                <div className="md:col-span-2">
                                                    <FormField label="איש קשר לחירום">
                                                        <div className="relative">
                                                            <AlertTriangle className="absolute right-3 top-3.5 w-5 h-5 text-amber-500/50" />
                                                            <Input
                                                                value={formData.emergency_contact}
                                                                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                                                                className="h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl pr-10 text-right"
                                                                placeholder="שם מלא ומספר טלפון"
                                                            />
                                                        </div>
                                                    </FormField>
                                                </div>
                                            </div>

                                            <div className="flex justify-end pt-6">
                                                <Button onClick={() => setActiveTab("org")} size="lg" className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800">
                                                    הבא: שיוך ארגוני <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Tab 2: Organization */}
                                <TabsContent value="org" className="mt-0 focus-visible:outline-none">
                                    <div className="space-y-6">
                                        <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                                            <CardContent className="p-8">
                                                <SectionHeader icon={Building2} title="מבנה ארגוני" description="הגדרת מיקום המשרת בעץ הארגוני (מחלקה -> מדור -> חולייה)" />

                                                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <FormField label="מחלקה (Department)" required>
                                                        <Select value={selectedDeptId} onValueChange={(val) => { setSelectedDeptId(val); setSelectedSectionId(""); setFormData({ ...formData, team_id: undefined }); }}>
                                                            <SelectTrigger className="h-12 bg-white border-blue-200/60 rounded-xl text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-200"><SelectValue placeholder="בחר מחלקה..." /></SelectTrigger>
                                                            <SelectContent dir="rtl">
                                                                {structure.map(dept => <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormField>

                                                    <FormField label="מדור (Section)">
                                                        <Select value={selectedSectionId} onValueChange={(val) => { setSelectedSectionId(val); setFormData({ ...formData, team_id: undefined }); }} disabled={!selectedDeptId}>
                                                            <SelectTrigger className="h-12 bg-white border-blue-200/60 rounded-xl text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-200"><SelectValue placeholder="בחר מדור..." /></SelectTrigger>
                                                            <SelectContent dir="rtl">
                                                                {sections.map((sec: any) => <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormField>

                                                    <FormField label="חולייה (Team)">
                                                        <Select value={formData.team_id?.toString() || ""} onValueChange={(val) => setFormData({ ...formData, team_id: parseInt(val) })} disabled={!selectedSectionId}>
                                                            <SelectTrigger className="h-12 bg-white border-blue-200/60 rounded-xl text-right font-bold text-slate-700 focus:ring-2 focus:ring-blue-200"><SelectValue placeholder="בחר חולייה..." /></SelectTrigger>
                                                            <SelectContent dir="rtl">
                                                                {teams.map((t: any) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormField>
                                                </div>

                                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <FormField label="סוג שירות">
                                                        <Select value={formData.service_type_id?.toString() || ""} onValueChange={(val) => setFormData({ ...formData, service_type_id: parseInt(val) })}>
                                                            <SelectTrigger className="h-12 bg-slate-50 border-slate-200 rounded-xl text-right"><SelectValue placeholder="בחר סוג שירות..." /></SelectTrigger>
                                                            <SelectContent dir="rtl">
                                                                {serviceTypes.map(st => <SelectItem key={st.id} value={st.id.toString()}>{st.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </FormField>
                                                    <FormField label="מזהה תפקיד (Role ID)">
                                                        <Input
                                                            type="number"
                                                            value={formData.role_id || ""}
                                                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value ? parseInt(e.target.value) : undefined })}
                                                            className="h-12 bg-slate-50 border-slate-200 rounded-xl text-right"
                                                            placeholder="קוד תפקיד (אם קיים)"
                                                        />
                                                    </FormField>
                                                </div>

                                                <div className="mt-8 space-y-6">
                                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                        <ToggleCard
                                                            label="מוגדר כמפקד"
                                                            description="בעל סמכויות פיקודיות על היחידה הארגונית שלו"
                                                            checked={formData.is_commander || false}
                                                            onChange={(v) => setFormData({ ...formData, is_commander: v })}
                                                            icon={Settings2}
                                                        />

                                                        {formData.is_commander && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-xl text-sm border border-blue-100 flex items-start gap-3">
                                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">💡</div>
                                                                <div>
                                                                    <strong>שים לב:</strong> המשרת יוגדר כמפקד הישיר של הדרג הארגוני אליו הוא משויך
                                                                    ({formData.team_id ? 'חולייה' : selectedSectionId ? 'מדור' : selectedDeptId ? 'מחלקה' : 'מפקדה'}).
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="flex justify-between">
                                            <Button variant="ghost" onClick={() => setActiveTab("personal")} className="text-slate-400">חזור לקודם</Button>
                                            <Button onClick={() => setActiveTab("service")} size="lg" className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800">
                                                הבא: שירות וזמנים <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Tab 3: Service */}
                                <TabsContent value="service" className="mt-0 focus-visible:outline-none">
                                    <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                                        <CardContent className="p-8">
                                            <SectionHeader icon={Calendar} title="ציר זמן צבאי" description="ניהול תאריכי שירות, כניסה לתפקיד ושחרור" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                                    <h3 className="font-bold flex items-center gap-2 text-slate-700"><History className="w-4 h-4" /> התחלה</h3>
                                                    <FormField label="תאריך גיוס">
                                                        <Input type="date" value={formData.enlistment_date} onChange={(e) => setFormData({ ...formData, enlistment_date: e.target.value })} className="h-12 bg-white text-right" />
                                                    </FormField>
                                                    <FormField label="תאריך הצבה ביחידה">
                                                        <Input type="date" value={formData.assignment_date} onChange={(e) => setFormData({ ...formData, assignment_date: e.target.value })} className="h-12 bg-white text-right" />
                                                    </FormField>
                                                </div>

                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                                                    <h3 className="font-bold flex items-center gap-2 text-slate-700"><Briefcase className="w-4 h-4" /> סיום ואישי</h3>
                                                    <FormField label="תאריך שחרור צפוי (תש''ש)">
                                                        <Input type="date" value={formData.discharge_date} onChange={(e) => setFormData({ ...formData, discharge_date: e.target.value })} className="h-12 bg-white text-right" />
                                                    </FormField>
                                                    <FormField label="תאריך לידה">
                                                        <Input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="h-12 bg-white text-right" />
                                                    </FormField>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="flex justify-between mt-6">
                                        <Button variant="ghost" onClick={() => setActiveTab("org")} className="text-slate-400">חזור לקודם</Button>
                                        <Button onClick={() => setActiveTab("security")} size="lg" className="rounded-xl px-8 bg-slate-900 text-white hover:bg-slate-800">
                                            הבא: אבטחה <ArrowRight className="mr-2 w-4 h-4 rotate-180" />
                                        </Button>
                                    </div>
                                </TabsContent>

                                {/* Tab 4: Security */}
                                <TabsContent value="security" className="mt-0 focus-visible:outline-none">
                                    <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
                                        <CardContent className="p-8 space-y-8">
                                            <SectionHeader icon={Shield} title="אבטחה והרשאות" description="ניהול רמות סיווג וסמכויות מיוחדות" />

                                            <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl">
                                                <FormField label="רמת סיווג אבטחתי (0-5)">
                                                    <div className="flex items-center gap-6 mt-2">
                                                        <Input
                                                            type="number" min="0" max="5"
                                                            value={formData.security_clearance}
                                                            onChange={(e) => setFormData({ ...formData, security_clearance: parseInt(e.target.value) || 0 })}
                                                            className="w-24 h-16 text-center text-3xl font-black bg-white rounded-xl shadow-sm border-amber-200 text-amber-600"
                                                        />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex gap-2">
                                                                {[1, 2, 3, 4, 5].map(lvl => (
                                                                    <div key={lvl} className={cn("flex-1 h-4 rounded-md transition-all", lvl <= (formData.security_clearance || 0) ? "bg-amber-500 shadow-sm" : "bg-slate-200")} />
                                                                ))}
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Security Clearance Level</p>
                                                        </div>
                                                    </div>
                                                </FormField>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <div className="lg:col-span-2">
                                                    <ToggleCard
                                                        label="בעל רישיון משטרה"
                                                        description="מאושר לשאת נשק משטרתי / סמכויות"
                                                        checked={formData.police_license || false}
                                                        onChange={(v) => setFormData({ ...formData, police_license: v })}
                                                        icon={BadgeCheck}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="flex justify-between mt-8 items-center bg-white p-4 rounded-2xl shadow-lg border border-slate-100 sticky bottom-6">
                                        <Button variant="ghost" onClick={() => setActiveTab("service")} className="text-slate-400 font-bold">
                                            חזור
                                        </Button>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-400 font-medium hidden md:inline-block">
                                                * בדוק את הפרטים לפני שמירה
                                            </span>
                                            <Button onClick={() => handleSubmit()} size="lg" className="rounded-xl px-12 bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30 font-bold text-lg">
                                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "עדכן תיק עובד"}
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
