import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateEmployeePayload } from "@/types/employee.types";
import { Loader2 } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-[32px] flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header Section */}
        <div className="p-6 sm:p-8 pb-4 border-b border-border/50 bg-muted/20 shrink-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
              <Loader2 className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight mb-1">
                הוספת שוטר חדש
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground">
                מלא את הפרטים הבאים כדי להוסיף שוטר חדש למערכת
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-6 custom-scrollbar">
          <form
            id="add-employee-form"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Essential Info Group */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center justify-center sm:justify-start gap-2">
                פרטים אישיים
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="first_name"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    שם פרטי *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    required
                    placeholder="הזן שם פרטי"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="last_name"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    שם משפחה *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    required
                    placeholder="הזן שם משפחה"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="personal_number"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    מספר אישי *
                  </Label>
                  <Input
                    id="personal_number"
                    value={formData.personal_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        personal_number: e.target.value,
                      })
                    }
                    required
                    placeholder="מ״א"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="national_id"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    תעודת זהות *
                  </Label>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) =>
                      setFormData({ ...formData, national_id: e.target.value })
                    }
                    required
                    placeholder="ת״ז"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Contact Info Group */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center justify-center sm:justify-start gap-2">
                פרטי התקשרות ומקום מגורים
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone_number"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    מספר טלפון
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData({ ...formData, phone_number: e.target.value })
                    }
                    placeholder="05x-xxxxxxx"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="city"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    עיר מגורים
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="עיר"
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="h-px bg-border/50 w-full" />

            {/* Dates Group */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-primary uppercase tracking-widest mb-4 flex items-center justify-center sm:justify-start gap-2">
                תאריכים חשובים
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="birth_date"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    תאריך לידה
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="enlistment_date"
                    className="text-[10px] font-black text-muted-foreground uppercase pr-1 tracking-wider"
                  >
                    תאריך גיוס
                  </Label>
                  <Input
                    id="enlistment_date"
                    type="date"
                    value={formData.enlistment_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enlistment_date: e.target.value,
                      })
                    }
                    className="h-11 bg-muted/30 border-input focus:ring-ring/20 focus:border-ring rounded-xl text-right font-bold text-sm"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Action Bar */}
        <div className="p-4 sm:p-6 bg-muted/30 border-t flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <Button
            form="add-employee-form"
            type="submit"
            disabled={loading}
            className="w-full sm:flex-1 h-12 sm:h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 text-sm gap-2 order-1 sm:order-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "הוסף שוטר למערכת"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto px-8 h-12 sm:h-11 border-border bg-card font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-2xl transition-all order-2 sm:order-1 text-sm"
          >
            ביטול
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
