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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import { PageHeader } from "@/components/layout/PageHeader";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { History as HistoryIcon } from "lucide-react";

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
        // Using the edit endpoint to get full details including scalar IDs if needed,
        // but usually a 'get by id' endpoint is best.
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
      // Refresh local state instead of navigating away if we want to stay on page
      // Refresh local state and clear status if reactivating
      setEmployee((prev) => {
        if (!prev) return null;
        if (newStatus) {
          // If returning to active, clear previous status fields
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

  const DetailItem = ({
    icon: Icon,
    label,
    value,
    subValue,
  }: {
    icon: any;
    label: string;
    value: string | null | undefined;
    subValue?: string;
  }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-card transition-all border border-transparent hover:border-border hover:shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground/80 mb-0.5">{label}</p>
        <p className="font-bold text-foreground">
          {value || "—"}
        </p>
        {subValue && <p className="text-xs text-muted-foreground/60 mt-1">{subValue}</p>}
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
          <div className="max-w-4xl mx-auto bg-destructive/10 backdrop-blur-md border border-destructive/20 rounded-2xl p-4 shadow-xl shadow-destructive/5 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black text-destructive leading-tight">
                    שוטר בסטטוס לא פעיל
                  </span>
                  <span className="text-[11px] font-bold text-destructive/70">
                    השוטר אינו מופיע במצבת כוח האדם הפעילה של היחידה ואינו יכול לדווח נוכחות
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleToggleActiveStatus}
                disabled={actionLoading}
                className="bg-destructive text-white hover:bg-destructive/90 rounded-lg h-9 px-4 font-black shadow-lg shadow-destructive/20 border-none shrink-0"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "החזר לפעילות"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={cn("px-6 mb-8", !employee.is_active && "mt-12")}>
        <div className="max-w-7xl mx-auto">
          <PageHeader
            icon={User}
            title={`${employee.first_name} ${employee.last_name}`}
            subtitle={`צפייה בתיק אישי מורחב • מספר אישי: ${employee.personal_number}`}
            category="ניהול שוטרים"
            categoryLink="/employees"
            iconClassName={cn(
              "from-primary/10 to-primary/5 border-primary/20",
              !employee.is_active && "from-destructive/10 to-destructive/5 border-destructive/20",
            )}
            badge={
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate(`/employees/edit/${employee.id}`)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl px-6 h-11 font-black transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Edit className="w-5 h-5 ml-2" />
                    <span>עריכה</span>
                  </div>
                </Button>
                <Button
                  onClick={handleToggleActiveStatus}
                  variant={employee.is_active ? "destructive" : "default"}
                  className={cn(
                    "rounded-xl px-5 h-11 gap-2 shadow-none font-bold",
                    employee.is_active
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/10"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20",
                  )}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserX className="w-5 h-5" />
                  )}
                  <span>
                    {employee.is_active ? "הפוך ללא פעיל" : "הפוך לפעיל"}
                  </span>
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <div
        className={cn(
          "max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8",
          !employee.is_active && "opacity-80 grayscale-[0.3]",
        )}
      >
        {/* Right Column: Profile Card & Quick Stats */}
        <div className="lg:col-span-4 space-y-6">
          <Card
            className={cn(
              "border-none shadow-lg bg-card rounded-3xl overflow-hidden ring-1 ring-border",
              !employee.is_active && "ring-destructive/20",
            )}
          >
            <div className="p-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center text-4xl font-black text-foreground/40 mb-6 ring-8 ring-background shadow-sm">
                  {employee.first_name[0]}
                  {employee.last_name[0]}
                </div>
                {!employee.is_active && (
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-destructive border-4 border-background flex items-center justify-center text-destructive-foreground shadow-lg">
                    <X className="w-4 h-4 mr-0" />
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-black text-foreground mb-1">
                {employee.first_name} {employee.last_name}
              </h2>
              <span className="font-mono text-lg font-medium text-muted-foreground tracking-wider">
                {employee.personal_number}
              </span>

              <div className="flex gap-2 mt-6">
                {employee.is_commander && (
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 rounded-lg">
                    <BadgeCheck className="w-3 h-3 mr-1.5" /> מפקד
                  </Badge>
                )}
                <Badge
                  className={cn(
                    "border-none px-3 py-1 rounded-lg",
                    !employee.is_active
                      ? "bg-destructive/10 text-destructive"
                      : employee.status_name
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {!employee.is_active
                    ? "לא פעיל"
                    : employee.status_name || "פעיל"}
                </Badge>
              </div>
            </div>
          </Card>

          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> אבטחה והרשאות
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                <span className="text-sm text-muted-foreground font-medium">
                  סיווג אבטחתי
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 h-2 rounded-full",
                        i < (employee.security_clearance || 0)
                          ? "bg-primary"
                          : "bg-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-xl">
                <span className="text-sm text-muted-foreground font-medium">
                  רישיון משטרתי
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    employee.police_license
                      ? "text-emerald-600"
                      : "text-muted-foreground/60",
                  )}
                >
                  {employee.police_license ? "יש רישיון" : "אין רישיון"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Details Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Organization Section */}
          <Card className="border border-border shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="bg-muted/30 border-b border-border p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Building2 className="w-5 h-5 text-primary" />
                מיקום ארגוני
              </h3>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {employee.department_name &&
                employee.department_name !== "מטה" && (
                  <DetailItem
                    icon={Building2}
                    label="מחלקה"
                    value={employee.department_name}
                  />
                )}
              {employee.section_name && employee.section_name !== "מטה" && (
                <DetailItem
                  icon={Building2}
                  label="מדור"
                  value={employee.section_name}
                />
              )}
              {employee.team_name && employee.team_name !== "מטה" && (
                <DetailItem
                  icon={Building2}
                  label="חולייה / צוות"
                  value={employee.team_name}
                />
              )}
              <DetailItem
                icon={BadgeCheck}
                label="תפקיד"
                value={employee.role_name}
              />
            </CardContent>
          </Card>

          {/* Contact & Personal */}
          <Card className="border border-border shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="bg-muted/30 border-b border-border p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <User className="w-5 h-5 text-primary" />
                פרטים אישיים וקשר
              </h3>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailItem
                icon={Phone}
                label="טלפון נייד"
                value={employee.phone_number}
              />
              <DetailItem
                icon={MapPin}
                label="עיר מגורים"
                value={employee.city}
              />
              <DetailItem
                icon={User}
                label="תעודת זהות"
                value={employee.national_id}
              />
              <div className="md:col-span-2">
                <DetailItem
                  icon={AlertTriangle}
                  label="איש קשר לחירום"
                  value={employee.emergency_contact}
                  subValue="במקרה חירום בלבד"
                />
              </div>
            </CardContent>
          </Card>

          {/* Service Timeline */}
          <Card className="border border-border shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="bg-muted/30 border-b border-border p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                שירות וזמנים
              </h3>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <DetailItem
                icon={Calendar}
                label="תאריך גיוס"
                value={employee.enlistment_date?.split("T")[0]}
              />
              <DetailItem
                icon={Calendar}
                label="כניסה לתפקיד"
                value={employee.assignment_date?.split("T")[0]}
              />
              <DetailItem
                icon={Calendar}
                label="שחרור צפוי (תש''ש)"
                value={employee.discharge_date?.split("T")[0]}
              />
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card className="border border-border shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="bg-muted/30 border-b border-border p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                <HistoryIcon className="w-5 h-5 text-primary" />
                היסטוריית נוכחות וסטטוסים
              </h3>
            </div>
            <CardContent className="p-6">
              <StatusHistoryList employeeId={employee.id} limit={5} />
              <div className="mt-4 pt-4 border-t border-border flex justify-center">
                <Button variant="ghost" size="sm" onClick={() => navigate('/attendance')} className="text-primary font-bold text-xs hover:bg-primary/5">
                  למעקב נוכחות מלא
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
