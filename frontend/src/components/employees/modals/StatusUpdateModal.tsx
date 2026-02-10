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
  const { getStatusTypes, logStatus, getDelegationCandidates } = useEmployees();
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

      // Fetch delegation candidates if user is updating themselves and is a commander
      if (user?.is_commander && employee?.id === user.id) {
        getDelegationCandidates().then(setCandidates);
      }
    }
  }, [open, getStatusTypes, user, employee, getDelegationCandidates]);

  const handleSubmit = async () => {
    if (!employee || !formData.status_type_id) {
      toast.error("אנא בחר סטטוס");
      return;
    }

    setLoading(true);
    const success = await logStatus({
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

    if (success) {
      toast.success("הסטטוס עודכן בהצלחה");
      // Refresh user to get updated active_delegate_id if delegation was set
      if (isDelegating && delegateId) {
        await refreshUser();
      }
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 border-none bg-card shadow-2xl rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-6 border-b border-border/50 bg-muted/20 text-right">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-foreground mb-1">
                עדכון סטטוס
              </DialogTitle>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-background rounded-full border border-border shadow-sm">
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

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Compact Grid of Statuses */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
              בחר סטטוס חדש
            </span>
            <div className="grid grid-cols-2 gap-2.5">
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
                        "flex items-center justify-start gap-3 p-3 h-auto rounded-2xl border-2 transition-all text-right group",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:border-border/50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-300",
                          isSelected
                            ? "bg-primary-foreground/20"
                            : "bg-background shadow-sm",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4",
                            isSelected
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-primary",
                          )}
                        />
                      </div>
                      <span className="text-[11px] font-black leading-tight flex-1">
                        {type.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 opacity-60" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                  מתאריך
                </Label>
                <div className="relative group">
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-2xl text-right pr-10 pl-3 text-xs font-black transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                  עד תאריך
                </Label>
                <div className="relative group">
                  <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
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
                    className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-2xl text-right pr-10 pl-3 text-xs font-black transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                הערה אישית
              </Label>
              <div className="relative group">
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                <Input
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  placeholder="הוסף הערה..."
                  className="h-11 bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary rounded-2xl text-right pr-10 pl-3 text-xs font-black placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Delegation Section - Only for Commanders updating themselves with Non-Office status */}
          {user?.is_commander &&
            employee?.id === user.id &&
            candidates.length > 0 &&
            (() => {
              const status = statusTypes.find(
                (s) => s.id.toString() === formData.status_type_id,
              );
              if (!status) return false;
              const n = status.name.toLowerCase();
              // Show if status implies absence
              return !(
                n.includes("משרד") ||
                n.includes("נוכח") ||
                n.includes("ביחידה") ||
                n.includes("רגיל")
              );
            })() && (
              <div className="pt-2 border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-black text-primary flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        מינוי מפקד מחליף
                      </Label>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        האם תרצה למנות נציג מהחוליה שיחליף אותך בהיעדרותך?
                      </p>
                    </div>
                    <Switch
                      checked={isDelegating}
                      onCheckedChange={setIsDelegating}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>

                  {isDelegating && (
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
                            <SelectItem key={c.id} value={c.id.toString()}>
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
                      <p className="text-[10px] text-amber-600/80 font-medium pr-1">
                        * למחליף תינתן הרשאת צפייה ודיווח עבור החוליה בלבד
                        לתקופת ההיעדרות.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-muted/20 border-t border-border/50 flex flex-col gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.status_type_id}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-12 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 gap-2 text-sm"
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
            ביטול חזרה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
