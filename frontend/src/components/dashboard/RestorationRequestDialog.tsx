import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";

interface RestorationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: Date;
}

export function RestorationRequestDialog({
  open,
  onOpenChange,
  targetDate,
}: RestorationRequestDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { createRestoreRequest } = useEmployees();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("נא להזין סיבת בקשה");
      return;
    }

    setLoading(true);
    try {
      const formattedDate = format(targetDate, "yyyy-MM-dd");
      await createRestoreRequest(formattedDate, reason);
      toast.success("בקשת השחזור הוגשה בהצלחה וממתינה לאישור");
      onOpenChange(false);
      setReason("");
    } catch (err) {
      console.error("Failed to submit restore request", err);
      toast.error("שגיאה בהגשת בקשת השחזור");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            בקשת שחזור נתונים מהארכיון
          </DialogTitle>
          <DialogDescription className="text-right pt-2">
            הנתונים לתאריך <strong>{format(targetDate, "dd/MM/yyyy")}</strong> הועברו לארכיון.
            על מנת לצפות בהם, עליך להגיש בקשת שחזור שתאושר על ידי המפקד הרלוונטי.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason" className="text-right font-bold">
              סיבת הבקשה
            </Label>
            <Textarea
              id="reason"
              placeholder="לדוגמה: צורך בבירור משמעתי, השלמת דוחות חודשיים..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none h-32"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0 sm:flex-row-reverse">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="font-bold"
          >
            {loading ? "מגיש בקשה..." : "הגש בקשה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
