import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ClipboardList,
  CheckCircle2,
  Clock,
  Sun,
  Activity,
  GraduationCap,
  Shield,
  Car,
  Plane,
  UserCheck,
  Briefcase,
  CalendarDays,
  UserPlus,
  Home,
  Building2,
  MapPin,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface StatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

const getStatusIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n === "מהבית" || n.includes("בית")) return Home;
  if (n === "מתקן חיצוני" || n.includes("מתקן") || n.includes("חיצוני"))
    return Building2;
  if (n === "בשטח" || n.includes("שטח")) return MapPin;
  if (n.includes("נוכח") || n.includes("משרד") || n.includes("ביחידה"))
    return UserCheck;
  if (n.includes("חופשה") || n.includes("חופש")) return Sun;
  if (n.includes("מחלה") || n.includes("גימל") || n.includes("ביקור רופא"))
    return Activity;
  if (n.includes("קורס") || n.includes("הדרכה")) return GraduationCap;
  if (n.includes("אבטחה") || n.includes("תורנות") || n.includes("שמירה"))
    return Shield;
  if (n.includes("חוץ") || n.includes("נסיעה") || n.includes("בתפקיד"))
    return Car;
  if (n.includes('חו"ל') || n.includes("טיסה")) return Plane;
  return Briefcase;
};

export const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  open,
  onOpenChange,
  employee,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuthContext();
  const {
    getStatusTypes,
    logStatus,
    getDelegationCandidates,
    cancelDelegation,
  } = useEmployees();
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Delegation State
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateId, setDelegateId] = useState("");

  const [formData, setFormData] = useState({
    status_type_id: "",
    start_date: "",
    end_date: "",
    note: "",
  });

  // Build parent/child hierarchy from flat status types list
  const parentStatuses = useMemo(
    () => statusTypes.filter((s: any) => !s.parent_status_id),
    [statusTypes],
  );

  const subStatusMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    statusTypes.forEach((s: any) => {
      if (s.parent_status_id) {
        const key = s.parent_status_id.toString();
        if (!map[key]) map[key] = [];
        map[key].push(s);
      }
    });
    return map;
  }, [statusTypes]);

  const isWeekendDay = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 5 || day === 6; // 5=Fri, 6=Sat
  };

  const isWeekend = isWeekendDay(formData.start_date);

  const visibleParents = useMemo(() => {
    let list: any[] = [];
    const officeParent = parentStatuses.find(
      (p: any) => p.name === "משרד" && !p.parent_status_id,
    );
    if (officeParent) {
      list.push(officeParent);
    }
    parentStatuses.forEach((p: any) => {
      if (p.name !== "משרד") {
        list.push(p);
      }
    });

    if (isWeekend) {
      return list.filter(
        (t: any) => t.name.includes("תגבור") || t.name.includes("אחר"),
      );
    }
    return list;
  }, [parentStatuses, isWeekend]);

  const selectedType = useMemo(
    () =>
      statusTypes.find((s: any) => s.id.toString() === formData.status_type_id),
    [statusTypes, formData.status_type_id],
  );

  const activeParentId = useMemo(() => {
    if (!selectedType) return null;
    return selectedType.parent_status_id
      ? selectedType.parent_status_id.toString()
      : selectedType.id.toString();
  }, [selectedType]);

  const [delegationResult, setDelegationResult] = useState<{
    delegateName: string;
    personalNumber: string;
    tempPassword: string;
    phoneNumber?: string;
  } | null>(null);

  useEffect(() => {
    if (open && !delegationResult) {
      const fetchTypes = async () => {
        setFetching(true);
        const types = await getStatusTypes();
        setStatusTypes(types);
        setFetching(false);
      };
      fetchTypes();

      const today = new Date().toISOString().split("T")[0];
      setFormData({
        status_type_id: "",
        start_date: today,
        end_date: "",
        note: "",
      });
      setIsDelegating(false);
      setDelegateId("");

      if (user?.is_commander && employee?.id === user.id) {
        getDelegationCandidates().then(setCandidates);
      }
    }
  }, [open, user?.id, employee?.id]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => setDelegationResult(null), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleRevokeDelegation = async () => {
    setLoading(true);
    const ok = await cancelDelegation();
    if (ok) {
      toast.success("סמכויות הפיקוד הוחזרו אליך");
      await refreshUser();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } else {
      toast.error("ביטול ההאצלה נכשל");
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!employee || !formData.status_type_id) {
      toast.error("אנא בחר סטטוס");
      return;
    }

    setLoading(true);
    const result = await logStatus({
      employee_id: employee.id,
      status_type_id: parseInt(formData.status_type_id),
      start_date: formData.start_date || undefined,
      end_date: formData.end_date || undefined,
      note: formData.note || undefined,
      delegation:
        isDelegating && delegateId
          ? { delegate_id: parseInt(delegateId) }
          : undefined,
    });

    if (result && result.success) {
      if (result.delegation) {
        const delegate = candidates.find((c) => c.id.toString() === delegateId);
        setDelegationResult({
          delegateName: `${delegate?.first_name} ${delegate?.last_name}`,
          personalNumber: delegate?.username || "",
          tempPassword: result.delegation.temp_password,
          phoneNumber: delegate?.phone_number,
        });
        toast.success("המינוי בוצע בהצלחה");
      } else {
        toast.success("הסטטוס עודכן בהצלחה");
        onOpenChange(false);
      }

      if (isDelegating && delegateId) await refreshUser();
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  if (!employee) return null;

  // Get the currently selected status for the footer button
  const selectedStatus = statusTypes.find(
    (s) => s.id.toString() === formData.status_type_id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-[95vw] sm:w-full max-w-md p-0 border-none bg-card dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl overflow-hidden",
          delegationResult ? "sm:max-w-md" : "sm:max-w-md",
        )}
        dir="rtl"
        showCloseButton={!delegationResult}
      >
        {delegationResult ? (
          // View 2: Delegation Result
          <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 border-2 border-emerald-500/20">
                <Shield className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-foreground">
                  המפקד עודכן!
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  פרטי גישה זמניים נוצרו עבור המחליף
                </p>
              </div>
            </div>

            <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="space-y-4 relative z-10">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center w-full">
                    שם המחליף
                  </span>
                  <span className="text-lg font-black text-foreground">
                    {delegationResult.delegateName}
                  </span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      שם משתמש
                    </span>
                    <span className="text-xl font-mono font-black text-primary">
                      {delegationResult.personalNumber}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
                      סיסמה זמנית
                    </span>
                    <span className="text-xl font-mono font-black text-primary tabular-nums tracking-widest bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                      {delegationResult.tempPassword}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-right">
              <div className="p-2 bg-amber-500/10 rounded-xl h-fit">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                שים לב: פרטי הגישה יהיו בתוקף אך ורק בטווח התאריכים שהגדרת. לאחר
                מכן, הגישה תיחסם אוטומטית.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nשם משתמש: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;
                  if (delegationResult.phoneNumber) {
                    const cleanPhone = delegationResult.phoneNumber.replace(
                      /\D/g,
                      "",
                    );
                    const finalPhone = cleanPhone.startsWith("0")
                      ? "972" + cleanPhone.slice(1)
                      : cleanPhone;
                    window.open(
                      `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`,
                      "_blank",
                    );
                    toast.success("פותח וואטסאפ...");
                  } else {
                    navigator.clipboard.writeText(text);
                    toast.success("אין מספר טלפון - הפרטים הועתקו ללוח");
                  }
                  onOpenChange(false);
                }}
                className="w-full h-14 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                שלח בוואטסאפ
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nשם משתמש: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;
                  navigator.clipboard.writeText(text);
                  toast.success("הפרטים הועתקו ללוח");
                  onOpenChange(false);
                }}
                className="w-full h-14 rounded-2xl font-black text-sm border-2 gap-2 hover:bg-muted/50"
              >
                העתק וסגור
              </Button>
            </div>
          </div>
        ) : (
          // View 1: Status Update Form
          <>
            {/* ── Compact Header ── */}
            <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/40 text-right">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 w-11 h-11 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-sm font-black text-primary">
                  {employee.first_name[0]}
                  {employee.last_name[0]}
                  {employee.status_color && (
                    <span
                      className="absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-background"
                      style={{ backgroundColor: employee.status_color }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-black text-foreground leading-none mb-1">
                    {employee.first_name} {employee.last_name}
                  </DialogTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {employee.username}
                    </span>
                    {employee.status_name && (
                      <>
                        <span className="text-muted-foreground/30">•</span>
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              (employee.status_color || "#94a3b8") + "22",
                            color: employee.status_color || "#94a3b8",
                          }}
                        >
                          {employee.status_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-4 h-4 text-primary" />
                </div>
              </div>
            </DialogHeader>

            {/* ── Scrollable Body ── */}
            <div className="overflow-y-auto max-h-[62vh] custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Unified Status Picker Section */}
                {fetching ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                    <span className="text-xs text-muted-foreground font-bold italic">
                      טוען סטטוסים...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {isWeekend ? 'אפשרויות לסופ"ש' : "בחירת סטטוס דיווח"}
                      </p>
                      {user?.is_commander && (
                        <span className="text-[9px] font-bold text-primary/60 italic">
                          לבחירה מהירה
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {visibleParents.map((type: any) => {
                        const Icon = getStatusIcon(type.name);
                        const sel = activeParentId === type.id.toString();
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                status_type_id: type.id.toString(),
                              }))
                            }
                            className={cn(
                              "flex flex-col items-center justify-center gap-2.5 p-3 rounded-[28px] border-2 transition-all text-center h-full min-h-[105px] group relative overflow-visible",
                              sel
                                ? "border-transparent text-white scale-[1.02]"
                                : "bg-background dark:bg-slate-900 border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30",
                            )}
                            style={
                              sel
                                ? {
                                    backgroundColor: type.color,
                                    boxShadow: `0 10px 25px -5px ${type.color}44`,
                                  }
                                : {}
                            }
                          >
                            <div
                              className={cn(
                                "w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                                sel
                                  ? "bg-white/20 rotate-12"
                                  : "bg-muted/70 group-hover:bg-primary/10 group-hover:scale-110",
                              )}
                            >
                              <Icon
                                className={cn(
                                  "w-5.5 h-5.5 transition-colors",
                                  sel
                                    ? "text-white"
                                    : "text-muted-foreground group-hover:text-primary",
                                )}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span
                                className={cn(
                                  "text-[11px] font-black leading-tight tracking-tight px-1",
                                  sel ? "text-white" : "text-foreground/80",
                                )}
                              >
                                {type.name}
                              </span>
                            </div>
                            {sel &&
                              formData.status_type_id ===
                                type.id.toString() && (
                                <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Sub Statuses Grid - Cool Popping Submenu */}
                    <AnimatePresence mode="wait">
                      {activeParentId &&
                        subStatusMap[activeParentId] &&
                        subStatusMap[activeParentId].length > 0 && (
                          <motion.div
                            key={`sub-${activeParentId}`}
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{
                              type: "spring",
                              damping: 20,
                              stiffness: 300,
                            }}
                            className="mt-6 p-4 bg-primary/[0.03] dark:bg-primary/[0.02] border border-primary/20 rounded-[2rem] shadow-xl shadow-primary/5 backdrop-blur-md relative overflow-visible"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
                            <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] mb-4 px-1 text-center relative z-10">
                              בחר הרחבה לסטטוס
                            </p>
                            <div className="grid grid-cols-3 gap-3 relative z-10">
                              {subStatusMap[activeParentId].map(
                                (sub: any, idx: number) => {
                                  const SubIcon = getStatusIcon(sub.name);
                                  const isSubSel =
                                    formData.status_type_id ===
                                    sub.id.toString();
                                  return (
                                    <motion.button
                                      key={sub.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      type="button"
                                      onClick={() =>
                                        setFormData((p) => ({
                                          ...p,
                                          status_type_id: sub.id.toString(),
                                        }))
                                      }
                                      className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all text-center h-full min-h-[85px] group relative",
                                        isSubSel
                                          ? "bg-white dark:bg-slate-800 border-primary shadow-lg shadow-primary/10 scale-[1.05] z-10"
                                          : "bg-background/50 border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-white dark:hover:bg-slate-800",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "p-2 rounded-xl transition-all duration-300",
                                          isSubSel
                                            ? "bg-primary/10 text-primary rotate-6"
                                            : "bg-muted/50 text-muted-foreground/60 group-hover:bg-primary/5 group-hover:text-primary group-hover:-rotate-6",
                                        )}
                                      >
                                        <SubIcon className="w-5 h-5" />
                                      </div>
                                      <span
                                        className={cn(
                                          "text-[10px] font-black leading-tight tracking-tight px-1 transition-colors",
                                          isSubSel
                                            ? "text-primary"
                                            : "text-foreground/70 group-hover:text-primary",
                                        )}
                                      >
                                        {sub.name}
                                      </span>
                                      {isSubSel && (
                                        <motion.div
                                          layoutId="sub-sel-check"
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
                                        >
                                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                        </motion.div>
                                      )}
                                    </motion.button>
                                  );
                                },
                              )}
                            </div>
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="h-px bg-border/40" />

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      מתאריך
                    </Label>
                    <div className="relative">
                      <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            start_date: e.target.value,
                          }))
                        }
                        className="h-9 bg-background dark:bg-slate-900 rounded-xl text-right pr-8 pl-2 text-xs font-bold border-border/60 dark:border-white/20 w-full dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      עד תאריך
                    </Label>
                    <div className="relative">
                      <CalendarDays className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/30 pointer-events-none" />
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            end_date: e.target.value,
                          }))
                        }
                        className="h-9 bg-background dark:bg-slate-900 rounded-xl text-right pr-8 pl-2 text-xs font-bold border-border/60 dark:border-white/20 w-full dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    הערה
                  </Label>
                  <div className="relative">
                    <Clock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
                    <Input
                      value={formData.note}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, note: e.target.value }))
                      }
                      placeholder="הוסף הערה אופציונלית..."
                      className="h-9 bg-background dark:bg-slate-900 rounded-xl text-right pr-8 pl-2 text-xs font-bold border-border/60 placeholder:text-muted-foreground/40 w-full dark:text-white"
                    />
                  </div>
                </div>

                {/* Delegation Section */}
                {user?.is_commander &&
                  !user?.is_temp_commander &&
                  employee?.id === user.id && (
                    <div className="pt-1 border-t border-border/40">
                      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-2xl p-4 border border-primary/10 space-y-4">
                        {employee.active_delegate_id ? (
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-bold text-amber-600 flex items-center gap-2">
                                <div className="p-1.5 bg-amber-100 rounded-lg">
                                  <UserPlus className="w-4 h-4" />
                                </div>
                                פיקוד מואצל פעיל
                              </Label>
                              <p className="text-[11px] text-muted-foreground font-medium">
                                האצלת ל:{" "}
                                <span className="font-black text-foreground">
                                  {candidates.find(
                                    (c) => c.id === employee.active_delegate_id,
                                  )?.first_name || "ממלא מקום"}
                                </span>
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-4 rounded-xl border-amber-600/20 bg-amber-600/10 text-amber-700 hover:bg-amber-600 hover:text-white transition-all text-[11px] font-black whitespace-nowrap"
                              onClick={handleRevokeDelegation}
                              disabled={loading}
                            >
                              ביטול
                            </Button>
                          </div>
                        ) : (
                          (() => {
                            const status = statusTypes.find(
                              (s) =>
                                s.id.toString() === formData.status_type_id,
                            );
                            if (!status) return null;
                            const n = status.name.toLowerCase();
                            const isPresent =
                              n.includes("משרד") ||
                              n.includes("נוכח") ||
                              n.includes("ביחידה");
                            if (isPresent || candidates.length === 0)
                              return null;
                            return (
                              <>
                                <div className="flex items-center justify-between gap-4">
                                  <div className="space-y-0.5">
                                    <Label className="text-sm font-black text-primary flex items-center gap-2 tracking-tight">
                                      <div className="p-1.5 bg-primary/10 rounded-lg">
                                        <UserPlus className="w-4 h-4" />
                                      </div>
                                      מינוי מפקד מחליף
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                      מינוי נציג מהחוליה שיחליף אותך?
                                    </p>
                                  </div>
                                  <Switch
                                    checked={isDelegating}
                                    onCheckedChange={setIsDelegating}
                                    className="scale-90 data-[state=checked]:bg-primary shrink-0"
                                  />
                                </div>
                                {isDelegating && candidates.length > 0 && (
                                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                      בחר מחליף
                                    </Label>
                                    <Select
                                      value={delegateId}
                                      onValueChange={setDelegateId}
                                      dir="rtl"
                                    >
                                      <SelectTrigger className="h-10 rounded-xl bg-background border-primary/20 text-right dark:bg-slate-900 dark:text-white">
                                        <SelectValue placeholder="בחר חבר צוות..." />
                                      </SelectTrigger>
                                      <SelectContent dir="rtl">
                                        {candidates.map((c) => (
                                          <SelectItem
                                            key={c.id}
                                            value={c.id.toString()}
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold">
                                                {c.first_name} {c.last_name}
                                              </span>
                                              <span className="text-xs text-muted-foreground font-mono">
                                                ({c.username})
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* ── Sticky Footer ── */}
            <div className="px-4 py-3 border-t border-border/40 bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col gap-2">
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.status_type_id}
                className="w-full h-11 rounded-xl font-black text-sm gap-2 transition-all active:scale-[0.98] disabled:opacity-30 text-white"
                style={
                  selectedStatus
                    ? {
                        backgroundColor: selectedStatus.color,
                        boxShadow: `0 4px 14px ${selectedStatus.color}44`,
                      }
                    : { backgroundColor: "hsl(var(--primary))" }
                }
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {selectedStatus
                  ? `עדכן ל${selectedStatus.name}`
                  : "בחר סטטוס תחילה"}
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-[11px] font-black text-muted-foreground/60 hover:text-muted-foreground transition-colors uppercase tracking-widest py-1"
              >
                ביטול
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
