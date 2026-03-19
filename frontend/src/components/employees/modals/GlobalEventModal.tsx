import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Building2, LayoutPanelLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GlobalEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusTypes: any[];
  structure: any[];
}

export const GlobalEventModal: React.FC<GlobalEventModalProps> = ({
  isOpen,
  onClose,
  statusTypes,
  structure,
}) => {
  const { user } = useAuthContext();
  const { logScopeStatus, isUpdatingScope } = useEmployees();

  // Find the 'יום יחידה/הווי' status
  const unitDayStatus = statusTypes.find(s => s.name === "יום יחידה/הווי") || statusTypes.find(s => s.code === "UNIT_DAY");

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  const isAdmin = user?.is_admin;
  
  // Scopes the user can theoretically use
  const [scope, setScope] = useState<"team" | "section" | "department">(() => {
    if (user?.commands_department_id || (isAdmin && user?.department_id)) return "department";
    if (user?.commands_section_id || (isAdmin && user?.section_id)) return "section";
    return "team";
  });

  const [targetId, setTargetId] = useState<string>("");

  // Get available units based on scope and user permissions
  const availableUnits = useMemo(() => {
    if (!structure) return [];

    const allDepts = structure;
    const allSections = structure.flatMap(d => d.sections || []);
    const allTeams = allSections.flatMap(s => s.teams || []);

    if (scope === "department") {
      if (isAdmin) return allDepts;
      return allDepts.filter(d => d.id === user?.commands_department_id);
    }

    if (scope === "section") {
      if (isAdmin) return allSections;
      return allSections.filter(s => 
        s.id === user?.commands_section_id || 
        s.department_id === user?.commands_department_id
      );
    }

    // scope === "team"
    if (isAdmin) return allTeams;
    return allTeams.filter(t => 
      t.id === user?.commands_team_id || 
      t.section_id === user?.commands_section_id ||
      allSections.find(s => s.id === t.section_id)?.department_id === user?.commands_department_id
    );
  }, [scope, structure, user, isAdmin]);

  // Update targetId when scope or availableUnits change
  useEffect(() => {
    if (availableUnits.length > 0) {
      setTargetId(availableUnits[0].id.toString());
    } else {
      setTargetId("");
    }
  }, [scope, availableUnits]);

  const hasCommandPower = isAdmin || user?.is_commander || user?.commands_department_id || user?.commands_section_id || user?.commands_team_id;

  const handleSubmit = async () => {
    if (!unitDayStatus) {
      toast.error("סטטוס יום יחידה לא נמצא במערכת");
      return;
    }

    if (!targetId) {
      toast.error("נא לבחור יחידה לביצוע הפעולה");
      return;
    }

    const success = await logScopeStatus(
      scope,
      parseInt(targetId),
      unitDayStatus.id,
      startDate,
      endDate,
      note
    );

    if (success) {
      toast.success("אירוע היחידה עודכן בהצלחה לכלל השוטרים ביחידה שנבחרה");
      onClose();
    } else {
      toast.error("שגיאה בעדכון אירוע היחידה");
    }
  };

  const isScopeDisabled = (scopeType: "team" | "section" | "department") => {
    if (isAdmin) return false;
    
    // Can only use scopes at or below their command level
    if (scopeType === "department") return !user?.commands_department_id;
    if (scopeType === "section") return !user?.commands_department_id && !user?.commands_section_id;
    return !user?.commands_department_id && !user?.commands_section_id && !user?.commands_team_id;
  };

  const scopeLabel = scope === "department" ? "מחלקה" : scope === "section" ? "מדור" : "חוליה";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-6 text-center border-b border-border/50 bg-muted/20">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10 text-primary shadow-inner">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-3xl font-black tracking-tight text-foreground">
                הוספת אירוע יחידה
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base max-w-[320px] mx-auto">
                קביעת יום מחלקה, מדור או חוליה לכלל שרשרת הפיקוד
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          {/* Scope Selection */}
          <div className="space-y-4">
            <Label className="text-base font-bold flex items-center gap-2 justify-center mb-2">
              <Users className="w-5 h-5 text-primary" />
              היקף התפוצה (רמה פיקודית)
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                disabled={isScopeDisabled("team")}
                onClick={() => setScope("team")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                  scope === "team" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] scale-[1.02]" 
                    : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground",
                  isScopeDisabled("team") && "opacity-40 cursor-not-allowed border-dashed grayscale"
                )}
              >
                <div className={cn("p-2 rounded-lg", scope === "team" ? "bg-primary/20" : "bg-muted")}>
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-sm font-black">חוליה</span>
              </button>

              <button
                type="button"
                disabled={isScopeDisabled("section")}
                onClick={() => setScope("section")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                  scope === "section" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] scale-[1.02]" 
                    : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground",
                  isScopeDisabled("section") && "opacity-40 cursor-not-allowed border-dashed grayscale"
                )}
              >
                <div className={cn("p-2 rounded-lg", scope === "section" ? "bg-primary/20" : "bg-muted")}>
                  <LayoutPanelLeft className="w-6 h-6" />
                </div>
                <span className="text-sm font-black">מדור</span>
              </button>

              <button
                type="button"
                disabled={isScopeDisabled("department")}
                onClick={() => setScope("department")}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                  scope === "department" 
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] scale-[1.02]" 
                    : "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground",
                  isScopeDisabled("department") && "opacity-40 cursor-not-allowed border-dashed grayscale"
                )}
              >
                <div className={cn("p-2 rounded-lg", scope === "department" ? "bg-primary/20" : "bg-muted")}>
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-sm font-black">מחלקה</span>
              </button>
            </div>
            
            {/* Unit Selector (if multiple options available) */}
            {hasCommandPower && availableUnits.length > 0 && (
              <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-sm font-bold pr-1">בחר {scopeLabel} ספציפי</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-border/50 font-bold focus:ring-primary/20">
                    <SelectValue placeholder={`בחר ${scopeLabel}...`} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 shadow-xl">
                    {availableUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()} className="font-medium h-10 rounded-lg">
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!hasCommandPower && (
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-bold">אין לך הרשאות פיקודיות לביצוע פעולה זו</p>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <Label className="text-sm font-bold pr-1">תאריך התחלה</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary/20 font-medium pl-10"
                />
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label className="text-sm font-bold pr-1">תאריך סיום</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-muted/30 border-border/50 h-12 rounded-xl focus:ring-primary/20 font-medium pl-10"
                />
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2.5">
            <Label className="text-sm font-bold flex items-center gap-2 pr-1">
              תוכן האירוע / שם האירוע
              <span className="text-[11px] text-muted-foreground font-normal">(יופיע ביומן ובדיווחים)</span>
            </Label>
            <Textarea
              placeholder="לדוגמה: יום מחלקה בירושלים, גיבוש צוותי, השתלמות מקצועית..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none min-h-[110px] bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 p-4 text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="flex gap-4 p-8 pt-0 mt-2">
          <Button
            variant="ghost"
            className="flex-1 rounded-2xl h-14 font-bold text-muted-foreground hover:bg-muted transition-all"
            onClick={onClose}
          >
            ביטול
          </Button>
          <Button
            className="flex-[2] rounded-2xl h-14 font-black text-lg shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_15px_30px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleSubmit}
            disabled={isUpdatingScope || !hasCommandPower || !targetId}
          >
            {isUpdatingScope ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                מעדכן את כולם...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                עדכן אירוע לכולם
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
