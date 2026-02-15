import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateEmployeePayload } from "@/types/employee.types";
import {
  Loader2,
  UserPlus2,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Check,
  ArrowLeft,
} from "lucide-react";

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (payload: CreateEmployeePayload) => Promise<boolean>;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeePayload>({
    first_name: "",
    last_name: "",
    personal_number: "",
    national_id: "",
    phone_number: "",
    email: "",
    city: "",
    birth_date: "",
    enlistment_date: "",
    team_id: undefined,
    is_commander: false,
    is_admin: false,
    security_clearance: false,
    police_license: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onAdd(formData);
    setLoading(false);
    if (success) {
      onOpenChange(false);
      setFormData({
        first_name: "",
        last_name: "",
        personal_number: "",
        national_id: "",
        phone_number: "",
        email: "",
        city: "",
        birth_date: "",
        enlistment_date: "",
        team_id: undefined,
        is_commander: false,
        is_admin: false,
        security_clearance: false,
        police_license: false,
      });
    }
  };

  const InputGroup = ({
    label,
    icon: Icon,
    children,
  }: {
    label: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1 flex items-center gap-1.5 opacity-70">
        <Icon className="w-3 h-3" />
        {label}
      </Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 border-none bg-card shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="p-6 sm:p-8 pb-6 border-b border-border/50 bg-muted/20 text-right shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0 rotate-3">
              <UserPlus2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1 text-center sm:text-right">
              <DialogTitle className="text-2xl font-black text-foreground tracking-tight mb-1">
                הוספת שוטר חדש
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                הזן את פרטי השוטר ליצירת רשומה חדשה במאגר היחידתי
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10 custom-scrollbar">
          <form
            id="add-employee-form"
            onSubmit={handleSubmit}
            className="space-y-10"
          >
            {/* Identity Block */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest leading-none">
                  פרטי זיהוי וחובה
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <InputGroup label="שם פרטי *" icon={User}>
                  <Input
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm transition-all"
                  />
                </InputGroup>
                <InputGroup label="שם משפחה *" icon={User}>
                  <Input
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm transition-all"
                  />
                </InputGroup>
                <InputGroup label="מספר אישי *" icon={ShieldCheck}>
                  <Input
                    value={formData.personal_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_number: e.target.value,
                      })
                    }
                    required
                    placeholder="מ״א"
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm font-mono tracking-widest transition-all"
                  />
                </InputGroup>
                <InputGroup label="תעודת זהות *" icon={ShieldCheck}>
                  <Input
                    value={formData.national_id}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value })
                    }
                    required
                    placeholder="ת״ז"
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm font-mono tracking-widest transition-all"
                  />
                </InputGroup>
              </div>
            </div>

            <div className="h-px bg-border/40 w-full" />

            {/* Contact Block */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                  פרטי התקשרות ומגורים
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <InputGroup label="אימייל" icon={Mail}>
                  <Input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="example@police.gov.il"
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm transition-all"
                  />
                </InputGroup>
                <InputGroup label="מספר טלפון" icon={Phone}>
                  <Input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="05x-xxxxxxx"
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm font-mono transition-all"
                  />
                </InputGroup>
                <InputGroup label="עיר מגורים" icon={MapPin}>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-sm transition-all"
                  />
                </InputGroup>
              </div>
            </div>

            <div className="h-px bg-border/40 w-full" />

            {/* History Block */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-widest leading-none">
                  תאריכים חשובים
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <InputGroup label="תאריך לידה" icon={CalendarDays}>
                  <Input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-xs transition-all"
                  />
                </InputGroup>
                <InputGroup label="תאריך גיוס" icon={CalendarDays}>
                  <Input
                    type="date"
                    value={formData.enlistment_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enlistment_date: e.target.value,
                      })
                    }
                    className="h-11 bg-muted/30 border-border/50 focus:ring-4 focus:ring-primary/10 rounded-2xl text-right font-black text-xs transition-all"
                  />
                </InputGroup>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 sm:p-8 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto px-8 h-12 font-black text-muted-foreground hover:text-foreground hover:bg-transparent rounded-2xl transition-all order-2 sm:order-1 text-xs uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 ml-2" />
            ביטול וחזרה
          </Button>

          <Button
            form="add-employee-form"
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 text-base gap-3 order-1 sm:order-2"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6" />
                הוסף שוטר למערכת
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
