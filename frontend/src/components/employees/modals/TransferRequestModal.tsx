import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Send, Info } from "lucide-react";
import { toast } from "sonner";

interface TransferRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  structure: any[];
  onSuccess?: () => void;
}

export function TransferRequestModal({
  isOpen,
  onClose,
  employeeName,
  structure,
  onSuccess,
}: TransferRequestModalProps) {
  const [targetDept, setTargetDept] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!targetDept || !reason) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success("בקשת ההעברה נשלחה למנהל המערכת ולמפקד הרלוונטי");
      onSuccess?.();
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-primary/20 bg-gradient-to-b from-background to-primary/[0.02]">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-black text-primary">
            בקשת העברה
          </DialogTitle>
          <DialogDescription className="font-medium text-muted-foreground">
            הגשת בקשה להעברת{" "}
            <span className="text-foreground font-bold">{employeeName}</span>{" "}
            ליחידה אחרת
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-1">
              יעד ההעברה
            </Label>
            <Select value={targetDept} onValueChange={setTargetDept}>
              <SelectTrigger className="bg-background border-primary/10 h-12 rounded-xl focus:ring-primary/20">
                <SelectValue placeholder="בחר מחלקת יעד..." />
              </SelectTrigger>
              <SelectContent>
                {structure.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-1">
              סיבת ההעברה
            </Label>
            <Textarea
              placeholder="פרט את הסיבה לבקשת ההעברה (למשל: שינוי תפקיד, צרכים מבצעיים, פנייה של השוטר...)"
              className="bg-background border-primary/10 min-h-[120px] rounded-xl focus:ring-primary/20 resize-none p-4"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
              <strong>שים לב:</strong> הבקשה תועבר לאישור מנהל המערכת. לאחר
              האישור, השוטר יועבר אוטומטית ליחידה החדשה וההרשאות שלו יעודכנו
              בהתאם.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 rounded-xl font-bold hover:bg-muted"
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-[2] h-12 rounded-xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                שלח בקשה
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
