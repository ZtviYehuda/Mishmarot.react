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
import { ArrowRightLeft, Send, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cleanUnitName } from "@/lib/utils";

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
  const [targetSection, setTargetSection] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sections =
    structure.find((d) => d.id.toString() === targetDept)?.sections || [];
  const teams =
    sections.find((s: any) => s.id.toString() === targetSection)?.teams || [];

  const handleSubmit = async () => {
    if (!targetDept || !targetSection || !targetTeam || !reason) {
      toast.error("נא למלא את כל השדות (מחלקה, מדור, חוליה וסיבה)");
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
      <DialogContent
        className="sm:max-w-[460px] p-0 overflow-hidden border-border bg-card  rounded-3xl"
        dir="rtl"
      >
        <DialogHeader className="p-6 pb-2 space-y-2 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-xl font-black text-foreground">
                  בקשת העברה
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground/80">
                  העברת{" "}
                  <span className="text-foreground font-bold">
                    {employeeName}
                  </span>{" "}
                  ליחידה אחרת
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-2 space-y-5">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1">
                  מחלקה
                </Label>
                <Select
                  value={targetDept}
                  onValueChange={(val) => {
                    setTargetDept(val);
                    setTargetSection("");
                    setTargetTeam("");
                  }}
                >
                  <SelectTrigger className="bg-muted/20 border-border/40 h-11 rounded-xl focus:ring-primary/20 text-right transition-all hover:bg-muted/30">
                    <SelectValue placeholder="בחר מחלקה..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {structure.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {cleanUnitName(dept.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1">
                    מדור
                  </Label>
                  <Select
                    value={targetSection}
                    onValueChange={(val) => {
                      setTargetSection(val);
                      setTargetTeam("");
                    }}
                    disabled={!targetDept}
                  >
                    <SelectTrigger className="bg-muted/20 border-border/40 h-11 rounded-xl focus:ring-primary/20 text-right transition-all hover:bg-muted/30 disabled:opacity-40">
                      <SelectValue placeholder="בחר מדור..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {sections.map((sec: any) => (
                        <SelectItem key={sec.id} value={sec.id.toString()}>
                          {cleanUnitName(sec.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider pr-1">
                    חוליה
                  </Label>
                  <Select
                    value={targetTeam}
                    onValueChange={setTargetTeam}
                    disabled={!targetSection}
                  >
                    <SelectTrigger className="bg-muted/20 border-border/40 h-11 rounded-xl focus:ring-primary/20 text-right transition-all hover:bg-muted/30 disabled:opacity-40">
                      <SelectValue placeholder="בחר חוליה..." />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {cleanUnitName(team.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground">
              סיבת ההעברה
            </Label>
            <Textarea
              placeholder="פרט את הסיבה לבקשת ההעברה..."
              className="bg-muted/30 border-border/50 min-h-[100px] rounded-xl focus:ring-primary/20 focus:border-primary/50 resize-none p-4 transition-all hover:bg-muted/50"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="bg-primary/5 rounded-xl p-4 flex gap-3 border border-primary/10">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/80 leading-relaxed font-medium">
              הבקשה תועבר לאישור הפיקוד הרלוונטי. לאחר האישור, השוטר יועבר
              אוטומטית ליחידה החדשה וההרשאות יעודכנו בהתאם.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 gap-3 sm:gap-0 bg-muted/20 border-t border-border/40 mt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-11 rounded-xl font-bold text-muted-foreground hover:bg-background hover:text-foreground"
            disabled={isLoading}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-[2] h-11 rounded-xl font-black bg-primary text-primary-foreground hover:bg-primary/90   gap-2 transition-all active:scale-95"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 ml-1" />
                שלח בקשה
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
