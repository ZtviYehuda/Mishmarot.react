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
  Mail,
  HeartPulse,
  Cake,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { format, differenceInYears } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import { CompactCard } from "@/components/forms/EmployeeFormComponents";

// --- Components for Tabs --- //

const PersonalTab = ({ employee }: { employee: Employee }) => {
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
      return `(גיל ${differenceInYears(new Date(), new Date(dateStr))})`;
    } catch {
      return "";
    }
  };

  // Emergency Parsing
  const contactString = employee.emergency_contact || "";
  const contactParts = contactString.match(/^(.*) \((.*)\) - (.*)$/);
  let emergencyName = contactString,
    emergencyRelation = "",
    emergencyPhone = "";
  if (contactParts) {
    [, emergencyName, emergencyRelation, emergencyPhone] = contactParts;
  } else if (!contactString) {
    emergencyName = "";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <User className="w-5 h-5" /> פרטים אישיים
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetailBox label="שם פרטי" value={employee.first_name} icon={User} />
          <DetailBox label="שם משפחה" value={employee.last_name} icon={User} />
          <DetailBox
            label="תאריך לידה"
            value={formatDate(employee.birth_date)}
            subValue={calculateAge(employee.birth_date)}
            icon={Calendar}
          />
          <DetailBox
            label="מספר אישי"
            value={employee.personal_number}
            icon={BadgeCheck}
            monospace
          />
          <DetailBox
            label="תעודת זהות"
            value={employee.national_id}
            icon={BadgeCheck}
            monospace
          />
          <DetailBox label="עיר מגורים" value={employee.city} icon={MapPin} />
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
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2 pb-2 border-b border-border/50">
              פרטי התקשרות
            </h4>
            <DetailBox
              label="טלפון נייד"
              value={employee.phone_number}
              icon={Phone}
              monospace
              highlight
            />
            <DetailBox
              label="דואר אלקטרוני"
              value={employee.email}
              icon={Mail}
            />
          </div>

          <div className="bg-red-50/60 rounded-2xl p-5 border border-red-100 dark:bg-red-950/10 dark:border-red-900/20">
            <h4 className="text-sm font-black text-red-600 flex items-center gap-2 pb-2 mb-4 border-b border-red-200/50">
              <HeartPulse className="w-4 h-4" />
              איש קשר לחירום
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-red-600/70 block mb-1">
                    שם מלא
                  </span>
                  <span className="font-bold text-foreground">
                    {emergencyName || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-red-600/70 block mb-1">
                    קרבה
                  </span>
                  <span className="font-bold text-foreground">
                    {emergencyRelation || "—"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-600/70 block mb-1">
                  טלפון
                </span>
                <span
                  className="font-black text-lg text-foreground font-mono bg-background/50 inline-block px-2 rounded-md border border-red-100/50"
                  dir="ltr"
                >
                  {emergencyPhone || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CompactCard>
    </div>
  );
};

const OrganizationTab = ({ employee }: { employee: Employee }) => {
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
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 relative">
            <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-l from-transparent via-border to-transparent -translate-y-1/2 z-0" />

            <OrgUnitBox
              title="מחלקה"
              value={employee.department_name}
              isCommander={!!employee.commands_department_id}
            />
            <ArrowLeft className="hidden md:block w-5 h-5 text-muted-foreground/40 z-10" />
            <OrgUnitBox
              title="מדור"
              value={employee.section_name}
              isCommander={!!employee.commands_section_id}
            />
            <ArrowLeft className="hidden md:block w-5 h-5 text-muted-foreground/40 z-10" />
            <OrgUnitBox
              title="חוליה"
              value={employee.team_name}
              isCommander={!!employee.commands_team_id}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-border/50">
            <DetailBox
              label="תפקיד"
              value={employee.role_name}
              icon={Briefcase}
            />
            <DetailBox
              label="מעמד"
              value={employee.service_type_name}
              icon={FileCheck}
            />
          </div>
        </div>
      </CompactCard>

      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <Shield className="w-5 h-5" /> שירות ואבטחה
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> ציר זמן שירות
            </h4>
            <div className="space-y-6 border-r-2 border-primary/10 pr-4 mr-2">
              <TimelineItem
                label="תאריך גיוס"
                date={employee.enlistment_date}
                color="bg-blue-500"
              />
              <TimelineItem
                label="כניסה לתפקיד"
                date={employee.assignment_date}
                color="bg-emerald-500"
              />
              <TimelineItem
                label="שחרור צפוי (תש''ש)"
                date={employee.discharge_date}
                color="bg-amber-500"
              />
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" /> אישורים והרשאות
            </h4>
            <div className="space-y-3">
              <SecurityBadge
                label="סיווג ביטחוני"
                isActive={employee.security_clearance}
                icon={Shield}
              />
              <SecurityBadge
                label="רישיון נהיגה משטרתי"
                isActive={employee.police_license}
                icon={Siren}
              />
              {(employee.is_admin || employee.is_commander) && (
                <SecurityBadge
                  label={employee.is_admin ? "מנהל מערכת" : "מפקד יחידה"}
                  isActive={true}
                  icon={BadgeCheck}
                  highlight
                />
              )}
            </div>
          </div>
        </div>
      </CompactCard>
    </div>
  );
};

const HistoryTab = ({ employeeId }: { employeeId: number }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <HistoryIcon className="w-5 h-5" /> היסטוריית דיווחים
          </span>
        }
      >
        <StatusHistoryList employeeId={employeeId} />
      </CompactCard>
    </div>
  );
};

// --- Main Page Component --- //

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

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

      {/* Header */}
      <div className="bg-background border-b border-border/60 py-8 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6">
          <PageHeader
            icon={User}
            title={`${employee.first_name} ${employee.last_name}`}
            subtitle={`תיק אישי: ${employee.personal_number}`}
            category="ניהול שוטרים"
            categoryLink="/employees"
            badge={
              !employee.is_active && (
                <Badge variant="destructive" className="mr-4 text-sm px-3 py-1">
                  <UserX className="w-4 h-4 mr-2" />
                  תיק לא פעיל
                </Badge>
              )
            }
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

                {/* Prominent Birthday Button - Only shows on birthday */}
                {(() => {
                  if (!employee.birth_date) return null;
                  const today = new Date();
                  const birthDate = new Date(employee.birth_date);
                  const isBirthdayToday =
                    today.getDate() === birthDate.getDate() &&
                    today.getMonth() === birthDate.getMonth();

                  if (!isBirthdayToday) return null;

                  return (
                    <div
                      className="absolute top-4 left-4 group cursor-pointer"
                      onClick={() => setShowBirthdayModal(true)}
                      title="שלח ברכת יום הולדת"
                    >
                      <div className="relative">
                        {/* Badge Container */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-2 border-amber-200 dark:border-amber-800/50 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
                          <Cake className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            יום הולדת
                          </span>
                        </div>

                        {/* Subtle shimmer effect */}
                        <div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 animate-shimmer pointer-events-none"
                          style={{
                            backgroundSize: "200% 100%",
                            animation: "shimmer 3s infinite",
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="px-6 pb-8 text-center -mt-12 relative">
                <div
                  className={cn(
                    "w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black mb-4 mx-auto shadow-md border-4 border-card transition-transform hover:scale-105 duration-300 cursor-default",
                    employee.is_active
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {employee.first_name?.[0]}
                  {employee.last_name?.[0]}
                </div>
                <h2 className="text-xl font-black text-foreground mb-1">
                  {employee.first_name} {employee.last_name}
                </h2>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Badge variant="outline" className="font-mono bg-muted/50">
                    {employee.personal_number}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {employee.service_type_name}
                  </Badge>
                </div>
                <div className="space-y-3 text-sm text-right bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex justify-between items-center py-1 border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">מחלקה</span>
                    <span className="font-bold">
                      {cleanUnitName(employee.department_name)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">מדור</span>
                    <span className="font-bold">
                      {cleanUnitName(employee.section_name)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">חוליה</span>
                    <span className="font-bold">
                      {cleanUnitName(employee.team_name)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!user?.is_temp_commander && (
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/employees/edit/${employee.id}`)}
                  className="w-full h-12 rounded-xl font-bold shadow-sm text-base"
                >
                  <Edit className="w-4 h-4 ml-2" /> עריכת כרטיס
                </Button>
              </div>
            )}
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
                  { id: "history", label: "היסטוריה", icon: HistoryIcon },
                ]
                  .filter(
                    (tab) => !(tab.id === "history" && user?.is_temp_commander),
                  )
                  .map((item) => {
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
              {activeTab === "personal" && <PersonalTab employee={employee} />}
              {activeTab === "organization" && (
                <OrganizationTab employee={employee} />
              )}
              {activeTab === "history" && (
                <HistoryTab employeeId={employee.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
const DetailBox = ({
  label,
  value,
  subValue,
  icon: Icon,
  monospace,
  highlight,
}: any) => (
  <div
    className={cn(
      "p-3 rounded-xl border border-transparent transition-colors",
      highlight
        ? "bg-primary/5 border-primary/10"
        : "bg-muted/30 hover:bg-muted/50",
    )}
  >
    <div className="flex items-center gap-2 mb-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="text-xs font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "font-bold text-foreground text-sm",
          monospace && "font-mono text-base",
        )}
      >
        {value || "—"}
      </span>
      {subValue && (
        <span className="text-xs text-muted-foreground">{subValue}</span>
      )}
    </div>
  </div>
);
const OrgUnitBox = ({ title, value, isCommander }: any) => (
  <div className="relative z-10 flex-1 bg-card border border-border p-4 rounded-xl shadow-sm hover:border-primary/40 transition-all text-center min-w-[140px]">
    {isCommander && (
      <div className="absolute -top-2.5 right-1/2 translate-x-1/2 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm whitespace-nowrap">
        מפקד יחידה
      </div>
    )}
    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
      {title}
    </span>
    <span className="font-bold text-base text-foreground block truncate">
      {cleanUnitName(value)}
    </span>
  </div>
);
const TimelineItem = ({ label, date, color }: any) => (
  <div className="relative">
    <div
      className={cn(
        "absolute -right-[21px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-background",
        color,
      )}
    />
    <span className="text-xs font-semibold text-muted-foreground block mb-0.5">
      {label}
    </span>
    <span className="font-bold font-mono text-sm">
      {date ? format(new Date(date), "dd/MM/yyyy") : "לא מוגדר"}
    </span>
  </div>
);
const SecurityBadge = ({ label, isActive, icon: Icon, highlight }: any) => (
  <div
    className={cn(
      "flex items-center justify-between p-3 rounded-xl border",
      isActive
        ? highlight
          ? "bg-primary/10 border-primary/20"
          : "bg-emerald-500/10 border-emerald-500/20"
        : "bg-muted/30 border-border/50",
    )}
  >
    <div className="flex items-center gap-3">
      <Icon
        className={cn(
          "w-4 h-4",
          isActive
            ? highlight
              ? "text-primary"
              : "text-emerald-600"
            : "text-muted-foreground",
        )}
      />
      <span className="font-medium text-sm">{label}</span>
    </div>
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn("text-xs", !isActive && "text-muted-foreground")}
    >
      {isActive ? "פעיל" : "לא פעיל"}
    </Badge>
  </div>
);
