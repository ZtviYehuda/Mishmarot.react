import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import apiClient from "@/config/api.client";
import * as endpoints from "@/config/employees.endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import type { Employee, CreateEmployeePayload } from "@/types/employee.types";
import {
  Loader2,
  User,
  Phone,
  Shield,
  Save,
  X,
  ChevronRight,
  UserCog,
  FileBadge,
  AlertTriangle,
  History,
  Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EditEmployeePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateEmployee } = useEmployees();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("personal");
  
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
    team_id: undefined,
    role_id: undefined,
    is_commander: false,
    is_admin: false,
    security_clearance: 0,
    police_license: false,
    emergency_contact: "",
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Employee>(endpoints.updateEmployeeEndpoint(parseInt(id)));
        setEmployee(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          personal_number: data.personal_number || "",
          national_id: data.national_id || "",
          phone_number: data.phone_number || "",
          city: data.city || "",
          birth_date: data.birth_date || "",
          enlistment_date: data.enlistment_date || "",
          discharge_date: data.discharge_date || "",
          team_id: data.team_id || undefined,
          role_id: data.role_id || undefined,
          is_commander: data.is_commander || false,
          is_admin: data.is_admin || false,
          security_clearance: data.security_clearance || 0,
          police_license: data.police_license || false,
          emergency_contact: data.emergency_contact || "",
        });
      } catch (error) {
        console.error("Failed to fetch employee:", error);
      } finally {
        setFetching(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id) return;
    setLoading(true);
    const success = await updateEmployee(parseInt(id), formData);
    setLoading(false);
    if (success) {
      navigate("/employees");
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#0074ff] animate-spin mb-4" />
        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">טוען תיק עובד...</span>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Gov Strip */}
      <div className="w-full h-1.5 bg-gradient-to-r from-[#001e30] via-[#0074ff] to-[#001e30] rounded-full opacity-80" />

      {/* Breadcrumbs & Title */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none text-right">
          <span>Portal</span>
          <ChevronRight className="w-3 h-3" />
          <span>Personnel</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0074ff]">File #{employee.personal_number}</span>
        </div>
        
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-black text-[#001e30] dark:text-white tracking-tight">
                עריכת תיק משרת
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                ניהול פרטים אישיים, הרשאות ושיוך ארגוני
                </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/employees")} className="border-slate-300">
                    <X className="w-4 h-4 ml-2" />
                    ביטול
                </Button>
                <Button onClick={() => handleSubmit()} className="bg-[#0074ff] hover:bg-[#0060d5]">
                    <Save className="w-4 h-4 ml-2" />
                    שמור שינויים
                </Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Profile "ID Card" */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border-t-4 border-t-[#0074ff] shadow-md bg-white dark:bg-slate-800/50 overflow-hidden">
                <CardHeader className="text-center pb-2 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50 pt-8">
                    <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-[#0074ff] mb-4 relative">
                        {employee.first_name[0]}{employee.last_name[0]}
                        <div className={cn("absolute bottom-1 right-1 w-6 h-6 rounded-full border-2 border-white", 
                            employee.status_name === "נוכח" ? "bg-green-500" : "bg-slate-400")} 
                        />
                    </div>
                    <CardTitle className="text-xl font-black text-[#001e30] dark:text-white">
                        {employee.first_name} {employee.last_name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full mx-auto w-fit mt-2">
                        {employee.personal_number}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                         <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">תפקיד</div>
                            <div className="font-bold text-[#001e30] dark:text-white text-sm">
                                {employee.is_commander ? "מפקד" : "משרת"}
                            </div>
                         </div>
                         <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">סיווג</div>
                            <div className="font-bold text-[#001e30] dark:text-white text-sm">
                                רמה {employee.security_clearance}
                            </div>
                         </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">מחלקה:</span>
                            <span className="font-bold text-[#001e30] dark:text-white">{employee.department_name || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">מדור:</span>
                            <span className="font-bold text-[#001e30] dark:text-white">{employee.section_name || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">צוות:</span>
                            <span className="font-bold text-[#001e30] dark:text-white">{employee.team_name || "-"}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-slate-50 dark:bg-slate-800/80 p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                     <div className="flex items-center gap-2 w-full text-xs text-slate-500">
                        <History className="w-3 h-3" />
                        <span>עודכן לאחרונה: {new Date().toLocaleDateString()}</span>
                     </div>
                </CardFooter>
            </Card>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#0074ff] shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-[#001e30]">שים לב</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        שינוי שיוך ארגוני עשוי להשפיע על הרשאות הגישה של המשרת. יש לוודא עדכון מול קמ"ן היחידה.
                    </p>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Tabbed Form */}
        <div className="lg:col-span-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full h-12 p-1 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl mb-6 shadow-sm grid grid-cols-4">
                    <TabsTrigger value="personal" className="h-full rounded-lg data-[state=active]:bg-[#eff6ff] data-[state=active]:text-[#0074ff] font-bold text-xs">
                        <User className="w-4 h-4 ml-2" /> פרטים אישיים
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="h-full rounded-lg data-[state=active]:bg-[#eff6ff] data-[state=active]:text-[#0074ff] font-bold text-xs">
                        <Phone className="w-4 h-4 ml-2" /> יצירת קשר
                    </TabsTrigger>
                    <TabsTrigger value="service" className="h-full rounded-lg data-[state=active]:bg-[#eff6ff] data-[state=active]:text-[#0074ff] font-bold text-xs">
                        <Briefcase className="w-4 h-4 ml-2" /> שירות ותפקיד
                    </TabsTrigger>
                    <TabsTrigger value="security" className="h-full rounded-lg data-[state=active]:bg-[#eff6ff] data-[state=active]:text-[#0074ff] font-bold text-xs">
                        <Shield className="w-4 h-4 ml-2" /> אבטחה
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: PERSONAL */}
                <TabsContent value="personal" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-[#0074ff]" />
                                זהות בסיסית
                            </CardTitle>
                            <CardDescription>פרטי זיהוי רשמיים כפי שמופיעים ברשומות כוח האדם</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>שם פרטי</Label>
                                    <Input 
                                        value={formData.first_name} 
                                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>שם משפחה</Label>
                                    <Input 
                                        value={formData.last_name} 
                                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>מספר אישי</Label>
                                    <Input 
                                        value={formData.personal_number} 
                                        onChange={(e) => setFormData({...formData, personal_number: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20 font-mono tracking-wide font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>תעודת זהות</Label>
                                    <Input 
                                        value={formData.national_id} 
                                        onChange={(e) => setFormData({...formData, national_id: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20 font-mono"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>תאריך לידה</Label>
                                    <Input 
                                        type="date"
                                        value={formData.birth_date ? formData.birth_date.split('T')[0] : ''} 
                                        onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" onClick={() => setActiveTab("contact")}>
                            הבא: פרטי קשר <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                        </Button>
                    </div>
                </TabsContent>

                {/* TAB 2: CONTACT */}
                <TabsContent value="contact" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="w-5 h-5 text-[#0074ff]" />
                                פרטי יצירת קשר
                            </CardTitle>
                            <CardDescription>כתובת מגורים ומספרי חירום</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>טלפון נייד</Label>
                                    <Input 
                                        type="tel"
                                        value={formData.phone_number} 
                                        onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>עיר מגורים</Label>
                                    <Input 
                                        value={formData.city} 
                                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-red-500 font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        איש קשר לחירום
                                    </Label>
                                    <Input 
                                        value={formData.emergency_contact} 
                                        onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                                        className="h-11 bg-red-50 border-red-100 focus:border-red-500 focus:ring-red-200"
                                        placeholder="שם ומספר טלפון"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <div className="flex justify-between mt-4">
                        <Button variant="ghost" onClick={() => setActiveTab("personal")}>חזור</Button>
                        <Button variant="outline" onClick={() => setActiveTab("service")}>
                            הבא: שירות ותפקיד <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                        </Button>
                    </div>
                </TabsContent>

                 {/* TAB 3: SERVICE */}
                 <TabsContent value="service" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-[#0074ff]" />
                                נתוני שירות
                            </CardTitle>
                            <CardDescription>תאריכי גיוס/שחרור ומיקום בעץ הארגוני</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>תאריך גיוס</Label>
                                    <Input 
                                        type="date"
                                        value={formData.enlistment_date ? formData.enlistment_date.split('T')[0] : ''} 
                                        onChange={(e) => setFormData({...formData, enlistment_date: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>תאריך שחרור (צפוי)</Label>
                                    <Input 
                                        type="date"
                                        value={formData.discharge_date ? formData.discharge_date.split('T')[0] : ''} 
                                        onChange={(e) => setFormData({...formData, discharge_date: e.target.value})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                            </div>
                            
                            <div className="h-px bg-slate-100 my-4" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>מזהה צוות (Team ID)</Label>
                                    <Input 
                                        type="number"
                                        value={formData.team_id || ''} 
                                        onChange={(e) => setFormData({...formData, team_id: parseInt(e.target.value) || undefined})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                    <p className="text-[10px] text-slate-400">יש להזין מזהה צוות קיים מהמערכת</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>מזהה תפקיד (Role ID)</Label>
                                    <Input 
                                        type="number"
                                        value={formData.role_id || ''} 
                                        onChange={(e) => setFormData({...formData, role_id: parseInt(e.target.value) || undefined})}
                                        className="h-11 bg-slate-50 border-slate-200 focus:border-[#0074ff] focus:ring-[#0074ff]/20"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-between mt-4">
                        <Button variant="ghost" onClick={() => setActiveTab("contact")}>חזור</Button>
                        <Button variant="outline" onClick={() => setActiveTab("security")}>
                            הבא: אבטחה <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                        </Button>
                    </div>
                </TabsContent>

                {/* TAB 4: SECURITY */}
                <TabsContent value="security" className="mt-0">
                    <Card className="border-none shadow-sm bg-white dark:bg-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-[#0074ff]" />
                                הרשאות ואבטחה
                            </CardTitle>
                            <CardDescription>קביעת רמת סיווג והרשאות ניהול במערכת</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl mb-4 flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
                                <div className="text-xs text-yellow-800">
                                    <strong>שים לב:</strong> הענקת הרשאות "מנהל מערכת" מאפשרת למשתמש גישה מלאה לכל נתוני כוח האדם ביחידה.
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label>רמת סיווג (0-5)</Label>
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            type="number" 
                                            min="0" max="5"
                                            value={formData.security_clearance}
                                            onChange={(e) => setFormData({...formData, security_clearance: parseInt(e.target.value) || 0})}
                                            className="w-24 h-12 text-center text-lg font-bold bg-slate-50"
                                        />
                                        <div className="text-xs text-slate-500">
                                            0 = בלמ"ס<br/>
                                            5 = סודי ביותר
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({...prev, is_commander: !prev.is_commander}))}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", formData.is_commander ? "bg-blue-100 text-[#0074ff]" : "bg-slate-100 text-slate-400")}>
                                                <UserCog className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">מפקד / מנהל</div>
                                                <div className="text-xs text-slate-500">האם מוגדר כגורם פיקודי?</div>
                                            </div>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center", formData.is_commander ? "bg-[#0074ff] border-[#0074ff]" : "border-slate-300")}>
                                            {formData.is_commander && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({...prev, is_admin: !prev.is_admin}))}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", formData.is_admin ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400")}>
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">Administrator</div>
                                                <div className="text-xs text-slate-500">גישה מלאה למערכת</div>
                                            </div>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center", formData.is_admin ? "bg-[#0074ff] border-[#0074ff]" : "border-slate-300")}>
                                            {formData.is_admin && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </div>

                                     <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({...prev, police_license: !prev.police_license}))}>
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", formData.police_license ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400")}>
                                                <FileBadge className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">רישיון משטרה</div>
                                                <div className="text-xs text-slate-500">האם קיים אישור משטרתי בתוקף?</div>
                                            </div>
                                        </div>
                                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center", formData.police_license ? "bg-[#0074ff] border-[#0074ff]" : "border-slate-300")}>
                                            {formData.police_license && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-between mt-4">
                        <Button variant="ghost" onClick={() => setActiveTab("service")}>חזור</Button>
                        <Button className="bg-[#0074ff] hover:bg-[#0060d5] px-8 shadow-lg shadow-blue-500/20" onClick={() => handleSubmit()}>
                             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור וסיים"}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
}