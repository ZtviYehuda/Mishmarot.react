import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "@/config/api.client";
import type { Employee } from "@/types/employee.types";
import {
  Loader2,
  User,
  Phone,
  Calendar,
  Edit,
  UserX,
  BadgeCheck,
  MapPin,
  History as HistoryIcon,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
          <DetailBox
            label="שם מלא (פרטי ומשפחה)"
            value={`${employee.first_name} ${employee.last_name}`}
            icon={User}
            highlight
          />
          <DetailBox
            label="מין"
            value={
              employee.gender === "male"
                ? "גבר"
                : employee.gender === "female"
                  ? "אישה"
                  : "לא מוגדר"
            }
            icon={User}
          />
          <DetailBox label="עיר מגורים" value={employee.city} icon={MapPin} />

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
          <DetailBox
            label="תאריך לידה"
            value={formatDate(employee.birth_date)}
            subValue={calculateAge(employee.birth_date)}
            icon={Calendar}
          />
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
                    שם מלא (פרטי ומשפחה)
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

const HistoryTab = ({
  employeeId,
  initialDate,
}: {
  employeeId: number;
  initialDate?: Date;
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CompactCard
        title={
          <span className="flex items-center gap-2 text-primary font-black text-lg">
            <HistoryIcon className="w-5 h-5" /> היסטוריית דיווחים
          </span>
        }
      >
        <StatusHistoryList
          employeeId={employeeId}
          showControls
          initialDate={initialDate}
        />
      </CompactCard>
    </div>
  );
};

// --- Main Page Component --- //

export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const initialDate = useMemo(() => {
    if (!dateParam) return undefined;
    const parts = dateParam.split("-");
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
      );
    }
    return undefined;
  }, [dateParam]);
  const { user } = useAuthContext();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (user?.is_temp_commander && user.id !== Number(id)) {
      toast.error("אין לך הרשאה לצפות בפרופיל שוטר");
      navigate("/employees");
    }
  }, [user, id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

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
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/60 py-8 shadow-sm sticky top-0 z-10">
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

      <div className="max-w-[1600px] mx-auto px-6 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* RIGHT SIDEBAR (Sticky) */}
          <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-6 order-2">
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
                {(() => {
                  if (employee.commands_department_id)
                    return (
                      <div className="mb-4">
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 font-black text-xs shadow-sm uppercase tracking-wider"
                        >
                          רמ"ח - {cleanUnitName(employee.department_name)}
                        </Badge>
                      </div>
                    );
                  if (employee.commands_section_id)
                    return (
                      <div className="mb-4">
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 font-black text-xs shadow-sm uppercase tracking-wider"
                        >
                          רמ"ד - {cleanUnitName(employee.section_name)}
                        </Badge>
                      </div>
                    );
                  if (employee.commands_team_id)
                    return (
                      <div className="mb-4">
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-1.5 font-black text-xs shadow-sm uppercase tracking-wider"
                        >
                          מ"ח - {cleanUnitName(employee.team_name)}
                        </Badge>
                      </div>
                    );
                  return null;
                })()}
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
                <div className="pr-2 py-4 space-y-6 relative">
                  {/* Subtle vertical line */}
                  <div className="absolute right-[11px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

                  <div className="relative pr-6">
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider">
                      מחלקה
                    </span>
                    <span className="font-bold text-sm text-foreground block">
                      {cleanUnitName(employee.department_name)}
                    </span>
                  </div>

                  <div className="relative pr-6">
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary/60 ring-4 ring-primary/5" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider">
                      מדור
                    </span>
                    <span className="font-bold text-sm text-foreground block">
                      {cleanUnitName(employee.section_name)}
                    </span>
                  </div>

                  <div className="relative pr-6">
                    <div className="absolute right-0 top-1.5 w-2.5 h-2.5 rounded-full bg-primary/30 ring-4 ring-primary/5" />
                    <span className="text-[10px] font-bold text-muted-foreground block mb-0.5 uppercase tracking-wider">
                      חוליה
                    </span>
                    <span className="font-bold text-sm text-foreground block">
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
          <div className="lg:col-span-9 space-y-8 order-1 min-h-[500px]">
            {/* Main Content - Stacked Cards */}
            <div className="space-y-8">
              <PersonalTab employee={employee} />
              {!user?.is_temp_commander && (
                <HistoryTab
                  employeeId={employee.id}
                  initialDate={initialDate}
                />
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
