import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-semibold  text-right text-[#001e30] dark:text-white">
            הוספת שוטר חדש
          </DialogTitle>
          <DialogDescription className="text-right">
            מלא את הפרטים הבאים כדי להוסיף שוטר חדש למערכת
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label
                htmlFor="first_name"
                className="text-sm font-medium text-right"
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
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label
                htmlFor="last_name"
                className="text-sm font-medium text-right"
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
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label
                htmlFor="personal_number"
                className="text-sm font-medium text-right"
              >
                מספר אישי *
              </Label>
              <Input
                id="personal_number"
                value={formData.personal_number}
                onChange={(e) =>
                  setFormData({ ...formData, personal_number: e.target.value })
                }
                required
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label
                htmlFor="national_id"
                className="text-sm font-medium text-right"
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
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label
                htmlFor="phone_number"
                className="text-sm font-medium text-right"
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
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label htmlFor="city" className="text-sm font-medium text-right">
                עיר
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label
                htmlFor="birth_date"
                className="text-sm font-medium text-right"
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
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
            <div className="space-y-2 text-right">
              <Label
                htmlFor="enlistment_date"
                className="text-sm font-medium text-right"
              >
                תאריך גיוס
              </Label>
              <Input
                id="enlistment_date"
                type="date"
                value={formData.enlistment_date}
                onChange={(e) =>
                  setFormData({ ...formData, enlistment_date: e.target.value })
                }
                className="border-slate-200 focus:border-[#0074ff] text-right"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-slate-200"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0074ff] hover:bg-[#0060d5] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מוסיף...
                </>
              ) : (
                "הוסף שוטר"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
