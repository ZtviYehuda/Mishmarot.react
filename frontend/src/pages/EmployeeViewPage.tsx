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
  History as HistoryIcon,
  Briefcase,
  FileCheck,
  Siren,
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { format, differenceInYears } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatePresence, motion } from "framer-motion";

// --- Styled Components (Shared) ---

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
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

const DetailItem = ({
  icon: Icon,
  label,
  value,
  subValue,
  className,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  className?: string;
}) => (
  <div
    className={cn(
      "space-y-2 group p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/10 transition-colors",
      className,
    )}
    dir="rtl"
  >
    <div className="flex items-center gap-2 text-muted-foreground/80">
      <Icon className="w-4 h-4 text-primary/70" />
      <span className="text-sm font-bold group-hover:text-primary transition-colors">
        {label}
      </span>
    </div>
    <div className="mr-6">
      <div className="font-bold text-foreground text-base truncate">
        {value || "—"}
      </div>
      {subValue && (
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          {subValue}
        </p>
      )}
    </div>
  </div>
);

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
    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary rounded-xl transition-all border border-transparent data-[state=active]:border-border font-bold text-[10px] sm:text-sm w-full h-full hover:bg-muted hover:text-foreground/80 leading-tight text-center"
  >
    <Icon className="w-4 h-4 sm:w-4 sm:h-4 mb-0.5 sm:mb-0" />
    <span className="truncate w-full">{label}</span>
  </TabsTrigger>
);

// --- Main Page ---

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

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
        return { ...prev, is_active: !!newStatus };
      });
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בביצוע הפעולה");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "לא מוגדר";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const calculateAge = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const age = differenceInYears(new Date(), new Date(dateStr));
      return `(גיל ${age})`;
    } catch {
      return "";
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

  return (
    <div
      className="min-h-screen bg-background pb-20 animate-in fade-in duration-500"
      dir="rtl"
    >
      {/* Inactive Banner */}
      {!employee.is_active && (
        <div className="bg-destructive/10 border-b border-destructive/20 text-destructive text-center py-2 px-4 font-bold text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <UserX className="w-4 h-4" />
            שים לב: תיק שוטר זה אינו פעיל
          </div>
        </div>
      )}

      <div className="px-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon={User}
            title={`${employee.first_name} ${employee.last_name}`}
            subtitle={`תיק אישי: ${employee.personal_number}`}
            category="ניהול שוטרים"
            categoryLink="/employees"
            badge={
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleToggleActiveStatus}
                  disabled={actionLoading}
                  className={cn(
                    "h-11 px-6 rounded-xl font-bold shadow-sm border-2 transition-all",
                    employee.is_active
                      ? "text-destructive border-destructive/20 hover:bg-destructive/5"
                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50",
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
                <Button
                  onClick={() => navigate(`/employees/edit/${employee.id}`)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl px-8 h-11 font-black transition-all"
                >
                  <Edit className="w-4 h-4 ml-2" />
                  עריכת כרטיס
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Sidebar Info (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <Card className="border-none shadow-lg shadow-primary/5 bg-card rounded-3xl overflow-hidden ring-1 ring-border">
              <div className="p-8 flex flex-col items-center text-center">
                {/* Avatar */}
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-5 ring-4 ring-background shadow-sm",
                    employee.is_active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {employee.first_name?.[0]}
                  {employee.last_name?.[0]}
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1">
                  {employee.first_name} {employee.last_name}
                </h2>
                <p className="text-sm font-medium text-muted-foreground font-mono">
                  {employee.personal_number || "-------"}
                </p>

                <div className="w-full h-px bg-border my-6" />

                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">סטטוס</span>
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-0.5",
                        employee.is_active ? "bg-emerald-500" : "bg-muted",
                      )}
                    >
                      {employee.is_active ? "פעיל" : "לא פעיל"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מחלקה</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(employee.department_name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">מדור</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(employee.section_name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">חוליה</span>
                    <span className="font-medium text-foreground">
                      {cleanUnitName(employee.team_name)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">סוג שירות</span>
                    <Badge variant="outline" className="text-xs">
                      {employee.service_type_name}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Mobile Profile Header (Visible on Mobile Only) */}
          <div className="lg:hidden bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 ring-4 ring-background shadow-sm",
                employee.is_active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {employee.first_name?.[0]}
              {employee.last_name?.[0]}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              {employee.first_name} {employee.last_name}
            </h2>
            <p className="text-sm font-medium text-muted-foreground font-mono mb-4">
              {employee.personal_number || "-------"}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge
                className={cn(
                  "rounded-md px-2 py-0.5",
                  employee.is_active ? "bg-emerald-500" : "bg-muted",
                )}
              >
                {employee.is_active ? "פעיל" : "לא פעיל"}
              </Badge>
              <Badge variant="outline" className="text-xs bg-muted/50">
                {cleanUnitName(employee.role_name)}
              </Badge>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            dir="rtl"
            className="w-full"
          >
            <div className="bg-muted/50 p-1 rounded-2xl mb-6 w-full mx-auto">
              <TabsList className="bg-transparent h-auto p-0 grid grid-cols-4 gap-1 w-full justify-stretch">
                <TabButton value="overview" label="פרטים אישיים" icon={User} />
                <TabButton value="org" label="שיוך יחידתי" icon={Building2} />
                <TabButton value="service" label="שירות ואבטחה" icon={Shield} />
                <TabButton
                  value="history"
                  label="היסטוריה"
                  icon={HistoryIcon}
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
                {/* TAB: PERSONAL */}
                <TabsContent
                  value="overview"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <SectionHeader
                        icon={User}
                        title="פרטים אישיים"
                        description="מידע אישי ופרטי קשר"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DetailItem
                          icon={User}
                          label="שם פרטי"
                          value={employee.first_name}
                        />
                        <DetailItem
                          icon={User}
                          label="שם משפחה"
                          value={employee.last_name}
                        />
                        <DetailItem
                          icon={BadgeCheck}
                          label="מספר אישי"
                          value={employee.personal_number}
                          className="font-mono"
                        />
                        <DetailItem
                          icon={BadgeCheck}
                          label="תעודת זהות"
                          value={employee.national_id}
                          className="font-mono"
                        />
                        <DetailItem
                          icon={Calendar}
                          label="תאריך לידה"
                          value={formatDate(employee.birth_date)}
                          subValue={calculateAge(employee.birth_date)}
                        />
                        <DetailItem
                          icon={MapPin}
                          label="עיר מגורים"
                          value={employee.city}
                        />
                      </div>

                      <div className="w-full h-px bg-border my-4" />

                      <SectionHeader
                        icon={Phone}
                        title="פרטי קשר וחירום"
                        description="דרכי התקשרות ואיש קשר למקרי חירום"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailItem
                          icon={Phone}
                          label="טלפון נייד"
                          value={employee.phone_number}
                          className="font-mono text-lg bg-primary/5 border-primary/10"
                        />
                        <DetailItem
                          icon={Mail}
                          label="כתובת אימייל"
                          value={employee.email}
                          className="font-mono text-base"
                        />

                        <div className="bg-red-50/50 p-4 sm:p-5 rounded-2xl border border-red-100/50 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <div className="bg-red-100/50 p-3 rounded-xl text-red-500 shrink-0 mx-auto sm:mx-0 shadow-sm border border-red-200/20">
                            <Siren className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-center sm:text-right">
                            {(() => {
                              const contactString =
                                employee.emergency_contact || "";
                              const contactParts = contactString.match(
                                /^(.*) \((.*)\) - (.*)$/,
                              );
                              let name = contactString;
                              let relation = "";
                              let phone = "";

                              if (contactParts) {
                                [, name, relation, phone] = contactParts;
                              } else if (!contactString) {
                                name = "";
                              }

                              return (
                                <>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest block">
                                      איש קשר
                                    </span>
                                    <span className="text-sm font-black text-foreground truncate block">
                                      {name || "---"}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest block">
                                      קרבת משפחה
                                    </span>
                                    <span className="text-sm font-black text-foreground truncate block">
                                      {relation || "---"}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest block">
                                      מספר טלפון
                                    </span>
                                    <span
                                      className="text-sm font-black text-foreground truncate block font-mono"
                                      dir="ltr"
                                    >
                                      {phone || "---"}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: ORG */}
                <TabsContent
                  value="org"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <SectionHeader
                        icon={Building2}
                        title="מבנה ארגוני"
                        description="מיקום השוטר בהיררכיה היחידתית"
                      />

                      <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 py-8">
                        {/* Line connector for desktop */}
                        <div className="hidden md:block absolute top-[60%] left-[10%] w-[80%] h-0.5 bg-gradient-to-l from-transparent via-primary/20 to-transparent -translate-y-1/2 z-0" />

                        {/* Dept */}
                        <div className="relative z-10 flex flex-col items-center bg-card border border-border p-6 rounded-2xl shadow-sm w-full md:w-56 text-center transition-all hover:border-primary/30">
                          {employee.commands_department_id && (
                            <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                              מפקד מחלקה
                            </div>
                          )}
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            מחלקה
                          </span>
                          <span className="font-black text-xl text-foreground">
                            {cleanUnitName(employee.department_name)}
                          </span>
                        </div>

                        <div className="hidden md:flex bg-background border border-border p-2 rounded-full z-10 text-muted-foreground">
                          <ArrowLeft className="w-4 h-4" />
                        </div>

                        {/* Section */}
                        <div className="relative z-10 flex flex-col items-center bg-card border border-border p-6 rounded-2xl shadow-sm w-full md:w-56 text-center transition-all hover:border-primary/30">
                          {employee.commands_section_id && (
                            <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                              מפקד מדור
                            </div>
                          )}
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            מדור
                          </span>
                          <span className="font-black text-xl text-foreground">
                            {cleanUnitName(employee.section_name)}
                          </span>
                        </div>

                        <div className="hidden md:flex bg-background border border-border p-2 rounded-full z-10 text-muted-foreground">
                          <ArrowLeft className="w-4 h-4" />
                        </div>

                        {/* Team */}
                        <div className="relative z-10 flex flex-col items-center bg-card border border-border p-6 rounded-2xl shadow-sm w-full md:w-56 text-center transition-all hover:border-primary/30">
                          {employee.commands_team_id && (
                            <div className="absolute -top-3 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                              מפקד חוליה
                            </div>
                          )}
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                            חולייה
                          </span>
                          <span className="font-black text-xl text-foreground">
                            {cleanUnitName(employee.team_name)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                        <DetailItem
                          icon={Briefcase}
                          label="תפקיד"
                          value={employee.role_name}
                        />
                        <DetailItem
                          icon={FileCheck}
                          label="סוג שירות"
                          value={employee.service_type_name}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: SERVICE */}
                <TabsContent
                  value="service"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <SectionHeader
                        icon={Calendar}
                        title="נתוני שירות ואבטחה"
                        description="ציר זמן שירות, סיווגים והרשאות"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-muted/10 rounded-2xl p-6 border border-border/50">
                          <h4 className="font-bold flex items-center gap-2 mb-6 text-foreground">
                            <Calendar className="w-5 h-5 text-primary" />
                            ציר זמן שירות
                          </h4>
                          <div className="space-y-6 relative border-r-2 border-border/60 pr-5 mr-2">
                            <div className="relative">
                              <div className="absolute -right-[27px] top-1 w-3 h-3 bg-primary rounded-full ring-4 ring-background" />
                              <span className="text-xs font-bold text-primary block mb-1">
                                גיוס
                              </span>
                              <span className="text-lg font-bold">
                                {formatDate(employee.enlistment_date)}
                              </span>
                            </div>
                            <div className="relative">
                              <div className="absolute -right-[27px] top-1 w-3 h-3 bg-primary/40 rounded-full ring-4 ring-background" />
                              <span className="text-xs font-bold text-muted-foreground block mb-1">
                                כניסה לתפקיד
                              </span>
                              <span className="text-lg font-bold">
                                {formatDate(employee.assignment_date)}
                              </span>
                            </div>
                            <div className="relative">
                              <div className="absolute -right-[27px] top-1 w-3 h-3 bg-muted-foreground/20 rounded-full ring-4 ring-background" />
                              <span className="text-xs font-bold text-muted-foreground block mb-1">
                                שחרור צפוי (תש"ש)
                              </span>
                              <span className="text-lg font-bold">
                                {formatDate(employee.discharge_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-bold flex items-center gap-2 mb-4 text-foreground">
                            <Shield className="w-5 h-5 text-primary" />
                            אבטחה והרשאות
                          </h4>

                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-primary" />
                              <span className="font-medium">סיווג ביטחוני</span>
                            </div>
                            <Badge
                              variant={
                                employee.security_clearance
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.security_clearance ? "בתוקף" : "ללא"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="flex items-center gap-3">
                              <Siren className="w-5 h-5 text-primary" />
                              <span className="font-medium">
                                רישיון נהיגה משטרתי
                              </span>
                            </div>
                            <Badge
                              variant={
                                employee.police_license
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {employee.police_license ? "בתוקף" : "ללא"}
                            </Badge>
                          </div>

                          {(employee.is_admin || employee.is_commander) && (
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                              <div className="flex items-center gap-3">
                                <BadgeCheck className="w-5 h-5 text-primary" />
                                <span className="font-medium">הרשאות ניהול</span>
                              </div>
                              <Badge variant="default">
                                {employee.is_admin
                                  ? "מנהל מערכת"
                                  : "מפקד יחידה"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: HISTORY */}
                <TabsContent
                  value="history"
                  className="mt-0 focus-visible:outline-none"
                >
                  <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-card">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-border/50 flex justify-between items-center bg-muted/10">
                        <SectionHeader
                          icon={HistoryIcon}
                          title="היסטוריית דיווחים"
                          description="תיעוד מלא של דיווחי נוכחות"
                        />
                      </div>
                      <div className="p-6">
                        <StatusHistoryList employeeId={employee.id} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
