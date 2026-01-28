import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "@/config/api.client";
import type { Employee } from "@/types/employee.types";
import {
  Loader2,
  User,
  Phone,
  Building2,
  Calendar,
  Shield,
  Edit,
  UserX,
  BadgeCheck,
  MapPin,
  AlertTriangle,
  X,
  History as HistoryIcon,
  Briefcase,
  FileCheck,
  Siren,
  Users,
  ArrowLeft,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import { PageHeader } from "@/components/layout/PageHeader";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { format, differenceInYears } from "date-fns";
import { he } from "date-fns/locale";

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Employee>(
          endpoints.updateEmployeeEndpoint(parseInt(id)),
        );
        setEmployee(data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        toast.error("שגיאה בטעינת פרטי שוטר");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleToggleActiveStatus = async () => {
    const newStatus = !employee?.is_active;

    setActionLoading(true);
    try {
      await apiClient.put(endpoints.updateEmployeeEndpoint(parseInt(id!)), {
        is_active: newStatus,
      });
      toast.success(
        newStatus ? "השוטר הוחזר למצב פעיל" : "השוטר הועבר לסטטוס לא פעיל",
      );
      setEmployee((prev) => {
        if (!prev) return null;
        if (newStatus) {
          return {
            ...prev,
            is_active: true,
            status_id: undefined,
            status_name: undefined,
            status_color: undefined,
            last_status_update: undefined,
          };
        }
        return { ...prev, is_active: false };
      });
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "לא מוגדר";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const calculateAge = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const age = differenceInYears(new Date(), new Date(dateStr));
      return `(גיל ${age})`;
    } catch (e) {
      return "";
    }
  };

  const DetailItem = ({
    icon: Icon,
    label,
    value,
    subValue,
    className
  }: {
    icon: any;
    label: string;
    value: React.ReactNode;
    subValue?: string;
    className?: string;
  }) => (
    <div className={cn("flex items-start gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-card transition-all border border-transparent hover:border-border hover:shadow-sm", className)}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm border border-primary/5">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-muted-foreground/80 mb-0.5">{label}</p>
        <div className="font-bold text-foreground truncate text-sm sm:text-base">
          {value || "—"}
        </div>
        {subValue && <p className="text-xs text-muted-foreground/80 mt-1 font-medium">{subValue}</p>}
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-background pb-20 animate-in fade-in duration-300"
      dir="rtl"
    >
      {/* Inactive Banner */}
      {!employee.is_active && (
        <div className="sticky top-0 z-50 px-6 py-3">
          <div className="max-w-7xl mx-auto bg-destructive/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-xl shadow-destructive/20 animate-in slide-in-from-top-4 duration-500 border border-destructive/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
                  <UserX className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-sm md:text-base">תיק שוטר לא פעיל</p>
                  <p className="text-xs md:text-sm opacity-90 font-medium">השוטר אינו פעיל במערכת ואינו נכלל בדיווחי הנוכחות השוטפים</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className="font-black whitespace-nowrap shadow-lg"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "החזר לפעילות"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={cn("px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto", !employee.is_active && "mt-6 grayscale-[0.5] opacity-90")}>

        {/* Header Profile Section */}
        <div className="relative mt-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-8 px-6 pb-6 pt-2">

            {/* Info */}
            <div className="flex-1 text-right mb-2 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h1>
                <div className="flex gap-2 justify-start">
                  {employee.is_commander && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded-lg shadow-md shadow-blue-500/20 border-0">
                      <Siren className="w-3 h-3 mr-1.5" /> מפקד
                    </Badge>
                  )}
                  {employee.is_admin && (
                    <Badge className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-xs rounded-lg shadow-md shadow-purple-500/20 border-0">
                      <Shield className="w-3 h-3 mr-1.5" /> מנהל מערכת
                    </Badge>
                  )}
                  {!employee.is_active && (
                    <Badge className="bg-muted text-muted-foreground px-3 py-1 text-xs rounded-lg border-0">
                      <UserX className="w-3 h-3 mr-1.5" /> לא פעיל
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-muted-foreground font-medium text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-primary" />
                  <span>מספר אישי: <span className="text-foreground font-bold font-mono">{employee.personal_number}</span></span>
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-border" />
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>{employee.department_name || 'ללא מחלקה'}</span>
                </div>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-border" />
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <span>{employee.role_name || 'תפקיד כללי'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Button
                onClick={() => navigate(`/employees/edit/${employee.id}`)}
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm md:text-base px-8"
              >
                <Edit className="w-4 h-4 ml-2" />
                עריכת כרטיס
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className={cn(
                  "h-12 rounded-2xl border-2 font-bold hover:scale-105 transition-all text-sm md:text-base px-6",
                  employee.is_active ? "bg-background hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                )}
              >
                {employee.is_active ? "השבתת שוטר" : "הפעלה מחדש"}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full space-y-8" dir="rtl">

          {/* Tabs List */}
          <div className="flex justify-center md:justify-start">
            <TabsList className="bg-muted/40 p-1.5 h-auto rounded-2xl border border-border/50 inline-flex">
              <TabsTrigger value="overview" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all">
                <User className="w-4 h-4 ml-2" />
                פרטים אישיים
              </TabsTrigger>
              <TabsTrigger value="service" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all">
                <Shield className="w-4 h-4 ml-2" />
                שירות ותפקיד
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl h-11 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-sm md:text-base transition-all">
                <HistoryIcon className="w-4 h-4 ml-2" />
                נוכחות והיסטוריה
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB: PERSONAL INFO */}
          <TabsContent value="overview" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {/* Identification */}
              <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    זיהוי ופרטים כלליים
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <DetailItem icon={User} label="שם מלא" value={`${employee.first_name} ${employee.last_name}`} />
                  <DetailItem icon={BadgeCheck} label="תעודת זהות" value={employee.national_id} />
                  <DetailItem icon={Calendar} label="תאריך לידה" value={formatDate(employee.birth_date)} subValue={calculateAge(employee.birth_date)} />
                  <DetailItem icon={MapPin} label="עיר מגורים" value={employee.city} />
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="w-5 h-5 text-primary" />
                    יצירת קשר וחירום
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <DetailItem icon={Phone} label="טלפון נייד" value={employee.phone_number} className="bg-emerald-50/50 border-emerald-100/50" />
                  <div className="my-2 h-px bg-border/50" />
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span className="font-black text-xs text-red-600 uppercase tracking-wider">מקרה חירום בלבד</span>
                    </div>
                    <DetailItem
                      icon={Phone}
                      label="איש קשר לחירום"
                      value={employee.emergency_contact}
                      className="bg-white shadow-sm border-red-100"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-primary" />
                    הגדרות מערכת
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", employee.is_active ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                        <BadgeCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">סטטוס משתמש</p>
                        <p className="text-xs text-muted-foreground">{employee.is_active ? "פעיל במערכת" : "מושבת זמנית"}</p>
                      </div>
                    </div>
                    <Badge className={cn("px-3 py-1 text-xs", employee.is_active ? "bg-emerald-500" : "bg-red-500")}>
                      {employee.is_active ? "פעיל" : "חסום"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">הרשאות ניהול</p>
                        <p className="text-xs text-muted-foreground ml-2">{employee.is_admin ? "מנהל מערכת מלא" : "משתמש רגיל"}</p>
                      </div>
                    </div>
                    {employee.is_admin && <Badge className="bg-violet-500">Admin</Badge>}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Siren className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">פיקוד</p>
                        <p className="text-xs text-muted-foreground ml-2">{employee.is_commander ? "מפקד (יכול לנהל אחרים)" : "ללא סמכויות פיקוד"}</p>
                      </div>
                    </div>
                    {employee.is_commander && <Badge className="bg-blue-500">מפקד</Badge>}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* TAB: SERVICE INFO */}
          <TabsContent value="service" className="space-y-6 focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Organization Hierarchy */}
              <div className="lg:col-span-8">
                <Card className="rounded-3xl shadow-sm border-border overflow-hidden h-full">
                  <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-primary" />
                      מיקום ארגוני והיררכיה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                      {/* Line connector for desktop */}
                      <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-gradient-to-l from-transparent via-border to-transparent -translate-y-1/2 z-0" />

                      <div className={cn(
                        "relative z-10 flex flex-col items-center border p-4 rounded-2xl shadow-sm w-full md:w-48 text-center transition-all",
                        employee.commands_department_id ? "bg-amber-50 md:-translate-y-2 border-amber-300 shadow-amber-100" : "bg-card border-border hover:border-primary/30"
                      )}>
                        {employee.commands_department_id && (
                          <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                            מפקד מחלקה
                          </div>
                        )}

                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">מחלקה</span>
                        <span className="font-black text-lg text-foreground">{employee.department_name || "—"}</span>
                      </div>

                      <div className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-muted-foreground/50 z-10 mx-2">
                        <ArrowLeft className="w-5 h-5" />
                      </div>

                      <div className={cn(
                        "relative z-10 flex flex-col items-center border p-4 rounded-2xl shadow-sm w-full md:w-48 text-center transition-all",
                        employee.commands_section_id ? "bg-amber-50 md:-translate-y-2 border-amber-300 shadow-amber-100" : "bg-card border-border hover:border-primary/30"
                      )}>
                        {employee.commands_section_id && (
                          <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                            מפקד מדור
                          </div>
                        )}

                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">מדור</span>
                        <span className="font-black text-lg text-foreground">{employee.section_name || "—"}</span>
                      </div>

                      <div className="hidden md:flex w-8 h-8 rounded-full items-center justify-center text-muted-foreground/50 z-10 mx-2">
                        <ArrowLeft className="w-5 h-5" />
                      </div>

                      <div className={cn(
                        "relative z-10 flex flex-col items-center border p-4 rounded-2xl shadow-sm w-full md:w-48 text-center transition-all",
                        employee.commands_team_id ? "bg-amber-50 md:-translate-y-2 border-amber-300 shadow-amber-100" : "bg-card border-border hover:border-primary/30"
                      )}>
                        {employee.commands_team_id && (
                          <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                            מפקד חוליה
                          </div>
                        )}

                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">צוות/חוליה</span>
                        <span className="font-black text-lg text-foreground">{employee.team_name || "—"}</span>
                      </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailItem icon={Briefcase} label="תפקיד נוכחי" value={employee.role_name} />
                      <DetailItem icon={FileCheck} label="סוג שירות" value={employee.service_type_name} />
                    </div>


                  </CardContent>
                </Card>
              </div>

              {/* Timeline & Security */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
                  <CardHeader className="bg-muted/30 border-b border-border pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                      צירי זמן
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="relative border-r-2 border-primary/20 pr-4 py-2 space-y-8">
                      <div className="relative">
                        <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 bg-primary rounded-full ring-4 ring-background" />
                        <p className="text-xs font-bold text-primary mb-0.5">תאריך גיוס</p>
                        <p className="font-black text-foreground">{formatDate(employee.enlistment_date)}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 bg-primary/60 rounded-full ring-4 ring-background" />
                        <p className="text-xs font-bold text-muted-foreground mb-0.5">כניסה לתפקיד</p>
                        <p className="font-bold text-foreground">{formatDate(employee.assignment_date)}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -right-[23px] top-1 w-3.5 h-3.5 bg-muted-foreground/30 rounded-full ring-4 ring-background" />
                        <p className="text-xs font-bold text-muted-foreground mb-0.5">שחרור צפוי (תש"ש)</p>
                        <p className="font-bold text-foreground">{formatDate(employee.discharge_date)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
                  <CardContent className="p-6 space-y-4 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-muted-foreground">סיווג אבטחתי</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                          <div key={lvl} className={cn("w-1.5 h-4 rounded-full", lvl <= (employee.security_clearance || 0) ? "bg-primary" : "bg-muted")} />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm font-bold text-muted-foreground">רישיון משטרתי</span>
                      <Badge className={cn("px-2", employee.police_license ? "bg-emerald-500" : "bg-muted text-muted-foreground")}>
                        {employee.police_license ? "בתוקף" : "ללא רישיון"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB: HISTORY */}
          <TabsContent value="history" className="focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <Card className="rounded-3xl shadow-sm border-border overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border pb-4 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HistoryIcon className="w-5 h-5 text-primary" />
                  היסטוריית דיווחים מלאה
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/attendance')}
                  className="bg-background"
                >
                  מעבר ללוח בקרה ראשי
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {/* We pass limit={20} to show more but not infinite, or remove limit for all */}
                <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                  <StatusHistoryList employeeId={employee.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
