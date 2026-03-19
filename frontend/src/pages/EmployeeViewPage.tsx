import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "@/config/api.client";
import type { Employee } from "@/types/employee.types";
import {
  Loader2, User, Phone, Calendar, Edit, UserX, BadgeCheck,
  MapPin, History as HistoryIcon, Mail, HeartPulse, Cake,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn, cleanUnitName } from "@/lib/utils";
import * as endpoints from "@/config/employees.endpoints";
import StatusHistoryList from "@/components/employees/StatusHistoryList";
import { format, differenceInYears } from "date-fns";
import { BirthdayGreetingsModal } from "@/components/dashboard/BirthdayGreetingsModal";
import { motion, AnimatePresence } from "framer-motion";

// ── Small helper: labeled field ───────────────────────────────────────────────
const Field = ({ label, value, mono = false, href }: {
  label: string; value?: string | null; mono?: boolean; href?: string;
}) => {
  if (!value) return null;
  const content = (
    <div className="flex flex-col gap-0.5 group/field">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover/field:text-primary transition-colors">{label}</span>
      <span className={cn("font-bold text-foreground text-sm transition-colors", href && "text-primary group-hover:text-primary/80", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
};

// ── Section card ──────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, children, className }: {
  title: string; icon: any; children: React.ReactNode; className?: string;
}) => (
  <div className={cn("bg-card border border-border/50 rounded-2xl overflow-hidden", className)}>
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/20">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm font-black text-foreground">{title}</span>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// ── Collapsible History section ───────────────────────────────────────────────
const HistorySection = ({ employeeId, initialDate }: { employeeId: number; initialDate?: Date }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 border-b border-border/40 bg-muted/20 active:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-primary" />
          <span className="text-sm font-black text-foreground">היסטוריית דיווחים</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <StatusHistoryList employeeId={employeeId} showControls initialDate={initialDate} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <div className="px-4 py-3 text-xs text-muted-foreground font-bold">
          לחץ להצגת היסטוריה
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Employee>(endpoints.updateEmployeeEndpoint(parseInt(id)));
        setEmployee(data);
      } catch {
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

  const displayName = employee.dominant_name
    ? `${employee.dominant_name} ${employee.last_name}`
    : `${employee.first_name} ${employee.last_name}`;

  const isBirthdayToday = (() => {
    if (!employee.birth_date) return false;
    const today = new Date();
    const bd = new Date(employee.birth_date);
    return today.getDate() === bd.getDate() && today.getMonth() === bd.getMonth();
  })();

  // Emergency contact parsing
  const contactString = employee.emergency_contact || "";
  const contactParts = contactString.match(/^(.*) \((.*)\) - (.*)$/);
  let ecName = contactString, ecRelation = "", ecPhone = "";
  if (contactParts) [, ecName, ecRelation, ecPhone] = contactParts;
  else if (!contactString) ecName = "";

  const commanderTitle = (() => {
    if (!employee.is_commander) return null;
    if (employee.commands_team_id) return `מ"ח – ${cleanUnitName(employee.team_name)}`;
    if (employee.commands_section_id) return `רמ"ד – ${cleanUnitName(employee.section_name)}`;
    if (employee.commands_department_id) return `רמ"ח – ${cleanUnitName(employee.department_name)}`;
    return "מפקד";
  })();

  return (
    <div className="animate-in fade-in duration-500" dir="rtl">
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

      {/* ── HERO SECTION ── */}
      <div className="relative bg-gradient-to-br from-primary/10 via-card to-card/80 border-b border-border/40 overflow-hidden">
        {/* Back button */}
        <button
          onClick={() => navigate("/employees")}
          className="absolute top-4 right-4 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          חזרה
        </button>

        {/* Birthday badge */}
        {isBirthdayToday && (
          <button
            onClick={() => setShowBirthdayModal(true)}
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-900 text-xs font-bold dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-200"
          >
            <Cake className="w-3.5 h-3.5" />
            יום הולדת 🎂
          </button>
        )}

        <div className="flex flex-col items-center text-center pt-12 pb-6 px-4 gap-3">
          {/* Avatar */}
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black border-4 border-card ring-1 ring-border",
            employee.is_active
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}>
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>

          {/* Name */}
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">{displayName}</h1>
            {!employee.is_active && (
              <Badge variant="destructive" className="mt-1.5 text-xs px-2">
                <UserX className="w-3 h-3 mr-1" />תיק לא פעיל
              </Badge>
            )}
          </div>

          {/* Status + badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {employee.status_name && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/60 border border-border/50 text-xs font-bold">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: employee.status_color || "#94a3b8" }} />
                {employee.status_name}
              </div>
            )}
            {employee.service_type_name && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-black text-[10px] px-2.5 rounded-full">
                {employee.service_type_name}
              </Badge>
            )}
            {commanderTitle && (
              <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 font-black text-[10px] px-2.5 rounded-full">
                <BadgeCheck className="w-3 h-3 mr-1" />{commanderTitle}
              </Badge>
            )}
          </div>

          {/* Org summary chips */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {employee.department_name && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary/70">
                {cleanUnitName(employee.department_name)}
              </span>
            )}
            {employee.section_name && (
              <span className="text-[10px] font-bold text-muted-foreground">›</span>
            )}
            {employee.section_name && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary/70">
                {cleanUnitName(employee.section_name)}
              </span>
            )}
            {employee.team_name && (
              <span className="text-[10px] font-bold text-muted-foreground">›</span>
            )}
            {employee.team_name && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-primary/70">
                {cleanUnitName(employee.team_name)}
              </span>
            )}
          </div>

          {/* Action buttons */}
          {!user?.is_temp_commander && (
            <Button
              onClick={() => navigate(`/employees/edit/${employee.id}`)}
              className="h-9 px-6 rounded-xl font-bold text-sm gap-2 mt-1 bg-primary/90 hover:bg-primary"
            >
              <Edit className="w-4 h-4" />
              עריכת כרטיס
            </Button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 space-y-3">

        {/* Personal Info */}
        <Section title="פרטים אישיים" icon={User}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <Field label="שם פרטי" value={employee.first_name} />
            <Field label="שם משפחה" value={employee.last_name} />
            {employee.dominant_name && (
              <Field label="שם תצוגה" value={employee.dominant_name} />
            )}
            <Field label="מין" value={
              employee.gender === "male" ? "גבר"
              : employee.gender === "female" ? "אישה"
              : "לא מוגדר"
            } />
            <Field label="עיר מגורים" value={employee.city} />
            {employee.birth_date && (
              <Field
                label="תאריך לידה"
                value={`${format(new Date(employee.birth_date), "dd/MM/yyyy")} (גיל ${differenceInYears(new Date(), new Date(employee.birth_date))})`}
              />
            )}
            {(employee.is_commander || employee.is_admin) && (
              <Field label="שם משתמש" value={employee.username} mono />
            )}
          </div>
        </Section>

        {/* Contact */}
        <Section title="פרטי קשר" icon={Phone}>
          <div className="grid grid-cols-1 gap-4">
            {employee.phone_number && (
              <Field label="טלפון נייד" value={employee.phone_number} mono
                href={`tel:${employee.phone_number}`} />
            )}
            {employee.email && (
              <Field label="דואר אלקטרוני" value={employee.email}
                href={`mailto:${employee.email}`} />
            )}
          </div>
        </Section>

        {/* Emergency Contact — always shown */}
        <Section title="איש קשר לחירום" icon={HeartPulse} className="border-rose-200/60 dark:border-rose-900/30">
          {contactString ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {ecName && <Field label="שם" value={ecName} />}
              {ecRelation && <Field label="קרבה" value={ecRelation} />}
              {ecPhone && (
                <div className="col-span-2">
                  <Field label="טלפון" value={ecPhone} mono href={`tel:${ecPhone}`} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground font-bold text-center py-1">לא הוזן איש קשר לחירום</p>
          )}
        </Section>

        {/* History — hidden until clicked */}
        {!user?.is_temp_commander && (
          <HistorySection employeeId={employee.id} initialDate={initialDate} />
        )}

        {/* Bottom breathing room */}
        <div className="h-4" />
      </div>
    </div>
  );
}
