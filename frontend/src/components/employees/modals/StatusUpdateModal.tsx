import React, { useState, useEffect } from "react";
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

interface StatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

const getStatusIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("נוכח") || n.includes("משרד") || n.includes("ביחידה"))
    return UserCheck;
  if (n.includes("חופשה") || n.includes("בית") || n.includes("חופש"))
    return Sun;
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

  const [delegationResult, setDelegationResult] = useState<{
    delegateName: string;
    personalNumber: string;
    tempPassword: string;
    phoneNumber?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
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
      setDelegationResult(null);

      // Fetch delegation candidates if user is updating themselves and is a commander
      if (user?.is_commander && employee?.id === user.id) {
        getDelegationCandidates().then(setCandidates);
      }
    }
  }, [open, getStatusTypes, user, employee, getDelegationCandidates]);

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
          personalNumber: delegate?.personal_number || "",
          tempPassword: result.delegation.temp_password,
          phoneNumber: delegate?.phone_number,
        });
        toast.success("המינוי בוצע בהצלחה");
      } else {
        toast.success("הסטטוס עודכן בהצלחה");
        onOpenChange(false);
      }

      if (isDelegating && delegateId) {
        await refreshUser();
      }
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[95vw] sm:w-full max-w-lg p-0 border-none bg-card shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-5 sm:p-6 border-b border-border/50 bg-muted/20 text-right">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0">
              <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-black text-foreground mb-1">
                עדכון סטטוס
              </DialogTitle>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-background rounded-full border border-border shadow-sm">
                <span className="text-xs font-black text-foreground">
                  {employee.first_name} {employee.last_name}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] font-bold text-muted-foreground font-mono">
                  {employee.personal_number}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {delegationResult ? (
          <div className="p-8 space-y-8 animate-in zoom-in-95 duration-500 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10 border-2 border-emerald-500/20">
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

            <div className="p-6 bg-muted/40 rounded-3xl border border-border/50 space-y-4 relative overflow-hidden group">
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
                      מספר אישי
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
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nמספר אישי: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;

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
                className="w-full h-14 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/20 gap-2"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                שלח בוואטסאפ
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  const text = `שלום ${delegationResult.delegateName}, מונית כממלא מקום מפקד החוליה.\n\nפרטי התחברות למערכת:\nמספר אישי: ${delegationResult.personalNumber}\nסיסמה זמנית: ${delegationResult.tempPassword}\n\nבהצלחה!`;
                  navigator.clipboard.writeText(text);
                  toast.success("הפרטים הועתקו ללוח");
                  onOpenChange(false);
                }}
                className="w-full h-14 rounded-2xl font-black text-sm border-2 gap-2"
              >
                העתק וסגור
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Compact Grid of Statuses */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                  בחר סטטוס חדש
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {fetching ? (
                    <div className="col-span-2 py-8 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary/30" />
                    </div>
                  ) : (
                    statusTypes.map((type: any) => {
                      const Icon = getStatusIcon(type.name);
                      const isSelected =
                        formData.status_type_id === type.id.toString();

                      return (
                        <Button
                          key={type.id}
                          type="button"
                          variant={isSelected ? "default" : "secondary"}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              status_type_id: type.id.toString(),
                            }))
                          }
                          className={cn(
                            "flex items-center justify-start gap-3 p-2.5 sm:p-3 h-auto rounded-xl sm:rounded-2xl border-2 transition-all text-right group",
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:border-border/50",
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300",
                              isSelected
                                ? "bg-primary-foreground/20"
                                : "bg-background shadow-sm",
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-3.5 h-3.5 sm:w-4 sm:h-4",
                                isSelected
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground group-hover:text-primary",
                              )}
                            />
                          </div>
                          <span className="text-[10px] sm:text-[11px] font-black leading-tight flex-1">
                            {type.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 opacity-60 ml-1" />
                          )}
                        </Button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Inputs Area */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                      מתאריך
                    </Label>
                    <div className="relative group">
                      <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            start_date: e.target.value,
                          }))
                        }
                        className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-xl sm:rounded-2xl text-right pr-10 pl-3 text-xs font-bold transition-all w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                      עד תאריך
                    </Label>
                    <div className="relative group">
                      <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            end_date: e.target.value,
                          }))
                        }
                        placeholder="לא חובה"
                        className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-xl sm:rounded-2xl text-right pr-10 pl-3 text-xs font-bold transition-all w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                    הערה אישית
                  </Label>
                  <div className="relative group">
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors pointer-events-none" />
                    <Input
                      value={formData.note}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      placeholder="הוסף הערה..."
                      className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-xl sm:rounded-2xl text-right pr-10 pl-3 text-xs font-bold placeholder:text-muted-foreground/50 transition-all w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Delegation Section - Show ONLY if:
                  1. User is a permanent Commander (Temporary commanders cannot delegate further)
                  2. Updating OWN status
               */}
              {user?.is_commander &&
                !user?.is_temp_commander &&
                employee?.id === user.id && (
                  <div className="pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-transparent rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-primary/10 space-y-4 sm:space-y-5 shadow-inner">
                      {employee.active_delegate_id ? (
                        // Case: Already delegated
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <Label className="text-sm font-bold text-amber-600 flex items-center gap-2">
                              <div className="p-1.5 bg-amber-100 rounded-lg">
                                <UserPlus className="w-4 h-4" />
                              </div>
                              פיקוד מואצל פעיל
                            </Label>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                              האצלת ל:{" "}
                              <span className="font-black text-foreground underline decoration-amber-500/30 underline-offset-2">
                                {candidates.find(
                                  (c) => c.id === employee.active_delegate_id,
                                )?.first_name || "ממלא מקום"}
                              </span>
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-amber-600/20 bg-amber-600/10 text-amber-700 hover:bg-amber-600 hover:text-white transition-all text-[11px] font-black shadow-lg shadow-amber-600/5 active:scale-95 whitespace-nowrap"
                            onClick={handleRevokeDelegation}
                            disabled={loading}
                          >
                            ביטול
                          </Button>
                        </div>
                      ) : (
                        // Case: Not delegated, show option if status implies absence
                        (() => {
                          const status = statusTypes.find(
                            (s) => s.id.toString() === formData.status_type_id,
                          );
                          if (!status) return null;
                          const n = status.name.toLowerCase();

                          // Show for ANY status except specific "Present" ones
                          // If it's "Office" or "Present", DO NOT show.
                          // Everything else (Vacation, Course, Sick, Abroad, etc.) SHOULD show.
                          const isPresent =
                            n.includes("משרד") ||
                            n.includes("נוכח") ||
                            n.includes("ביחידה");

                          if (isPresent) return null;

                          // Also ensure we have candidates
                          if (candidates.length === 0) return null;

                          return (
                            <>
                              <div className="flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <Label className="text-sm font-black text-primary flex items-center gap-2 tracking-tight">
                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                      <UserPlus className="w-4 h-4" />
                                    </div>
                                    מינוי מפקד מחליף
                                  </Label>
                                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-[200px] sm:max-w-none">
                                    מינוי נציג מהחוליה שיחליף אותך?
                                  </p>
                                </div>
                                <Switch
                                  checked={isDelegating}
                                  onCheckedChange={setIsDelegating}
                                  className="scale-90 sm:scale-100 data-[state=checked]:bg-primary shadow-lg shadow-primary/20 shrink-0"
                                />
                              </div>

                              {isDelegating && candidates.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                                    בחר מחליף מהחוליה
                                  </Label>
                                  <Select
                                    value={delegateId}
                                    onValueChange={setDelegateId}
                                    dir="rtl"
                                  >
                                    <SelectTrigger className="h-11 rounded-xl bg-background border-primary/20 focus:ring-primary/20 text-right">
                                      <SelectValue placeholder="בחר חבר צוות..." />
                                    </SelectTrigger>
                                    <SelectContent>
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
                                              ({c.personal_number})
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

            {/* Action Footer */}
            <div className="p-5 sm:p-6 bg-muted/20 border-t border-border/50 flex flex-col gap-3 sticky bottom-0 z-20 backdrop-blur-sm">
              <Button
                onClick={handleSubmit}
                disabled={loading || !formData.status_type_id}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl sm:rounded-2xl h-11 sm:h-12 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 gap-2 text-sm"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                עדכן סטטוס שוטר
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-10 text-[10px] font-black text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors uppercase tracking-widest"
              >
                ביטול סגור
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
