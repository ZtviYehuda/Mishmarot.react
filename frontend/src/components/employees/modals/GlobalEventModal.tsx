import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import {
  Calendar,
  Users,
  Building2,
  LayoutPanelLeft,
  AlertCircle,
} from "lucide-react";
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

  const unitDayStatus =
    statusTypes.find((s) => s.name === "יום יחידה") ||
    statusTypes.find((s) => s.code === "UNIT_DAY");

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState("");

  const isAdmin = user?.is_admin;

  const [scope, setScope] = useState<"team" | "section" | "department">(() => {
    if (user?.commands_department_id || isAdmin) return "department";
    if (user?.commands_section_id) return "section";
    return "team";
  });

  const [targetId, setTargetId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // Reset targetId when scope changes
  useEffect(() => {
    setTargetId("");
  }, [scope]);

  // --- Accessible lists per scope (flat, no cascading UI needed) ---
  const departments = useMemo(() => {
    if (isAdmin) return structure;
    if (user?.commands_department_id)
      return structure.filter((d: any) => d.id === user.commands_department_id);
    return [];
  }, [structure, isAdmin, user]);

  // All accessible sections (flat list with parent dept name for grouping display)
  const allSections = useMemo(() => {
    const result: any[] = [];
    for (const d of structure) {
      const secs: any[] = d.sections || [];
      for (const s of secs) {
        const commandsDept = user?.commands_department_id === d.id;
        const commandsSec = user?.commands_section_id === s.id;
        const commandsAnyTeamInSection = (s.teams || []).some(
          (t: any) => user?.commands_team_id === t.id,
        );

        if (
          !isAdmin &&
          !commandsDept &&
          !commandsSec &&
          !commandsAnyTeamInSection
        )
          continue;

        result.push({ ...s, dept_id: d.id, dept_name: d.name });
      }
    }
    return result;
  }, [structure, isAdmin, user]);

  // All accessible teams (flat list with parent section name)
  const allTeams = useMemo(() => {
    const result: any[] = [];
    for (const d of structure) {
      for (const s of d.sections || []) {
        for (const t of s.teams || []) {
          const commandsDept = user?.commands_department_id === d.id;
          const commandsSec = user?.commands_section_id === s.id;
          const commandsTeam = user?.commands_team_id === t.id;
          if (!isAdmin && !commandsDept && !commandsSec && !commandsTeam)
            continue;
          result.push({ ...t, section_id: s.id, section_name: s.name });
        }
      }
    }
    return result;
  }, [structure, isAdmin, user]);

  const availableSections = useMemo(() => {
    if (!selectedDeptId) return [];
    return allSections.filter((s) => s.dept_id === parseInt(selectedDeptId));
  }, [allSections, selectedDeptId]);

  const availableTeams = useMemo(() => {
    if (!selectedSectionId) return [];
    return allTeams.filter((t) => t.section_id === parseInt(selectedSectionId));
  }, [allTeams, selectedSectionId]);

  // Auto-select when only one option
  useEffect(() => {
    if (scope === "department" && departments.length === 1) {
      setTargetId(departments[0].id.toString());
    } else if (scope === "section" && allSections.length === 1) {
      setTargetId(allSections[0].id.toString());
    } else if (scope === "team" && allTeams.length === 1) {
      setTargetId(allTeams[0].id.toString());
    } else {
      setTargetId("");
    }
  }, [scope, departments, allSections, allTeams]);

  const isScopeDisabled = (scopeType: "team" | "section" | "department") => {
    if (isAdmin) return false;
    if (scopeType === "department") return !user?.commands_department_id;
    if (scopeType === "section")
      return !user?.commands_department_id && !user?.commands_section_id;
    return (
      !user?.commands_department_id &&
      !user?.commands_section_id &&
      !user?.commands_team_id
    );
  };

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
      note,
    );
    if (success) {
      toast.success("אירוע היחידה עודכן בהצלחה לכלל השוטרים ביחידה שנבחרה");
      onClose();
    } else {
      toast.error("שגיאה בעדכון אירוע היחידה");
    }
  };

  const hasCommandPower =
    isAdmin ||
    user?.is_commander ||
    user?.commands_department_id ||
    user?.commands_section_id ||
    user?.commands_team_id;

  // Shared card base styles
  const cardBase =
    "flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 w-full text-right";
  const cardActive =
    "border-primary bg-primary/10 text-primary shadow-sm scale-[1.02]";
  const cardInactive =
    "border-border/50 hover:border-border hover:bg-muted/50 text-muted-foreground";
  const cardDisabled =
    "opacity-40 cursor-not-allowed border-dashed grayscale pointer-events-none";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden bg-background border-border/40 shadow-2xl rounded-[2rem] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/40 bg-muted/20 relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0 text-right">
              <DialogTitle className="text-xl font-black tracking-tight truncate">
                הוספת אירוע יחידה
              </DialogTitle>
              <DialogDescription className="text-xs font-bold text-muted-foreground/60 truncate">
                קביעת יום מחלקה, מדור או חוליה לכלל שרשרת הפיקוד
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {hasCommandPower ? (
            <>
              {/* Scope + Unit Selection — combined into 3 cards */}
              {/* Scope Selection (Toggle Cards) */}
              {/* Level Selection Cards */}
              {(isAdmin ||
                user?.commands_department_id ||
                user?.commands_section_id) && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pr-1">
                      <Users className="w-4 h-4 text-primary" />
                      1. בחר רמה פיקודית לעדכון
                    </Label>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setScope("department")}
                        disabled={isScopeDisabled("department")}
                        className={cn(
                          cardBase,
                          scope === "department" ? cardActive : cardInactive,
                          isScopeDisabled("department") && cardDisabled,
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-lg",
                            scope === "department"
                              ? "bg-primary/20"
                              : "bg-muted",
                          )}
                        >
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black">מחלקה</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScope("section")}
                        disabled={isScopeDisabled("section")}
                        className={cn(
                          cardBase,
                          scope === "section" ? cardActive : cardInactive,
                          isScopeDisabled("section") && cardDisabled,
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-lg",
                            scope === "section" ? "bg-primary/20" : "bg-muted",
                          )}
                        >
                          <LayoutPanelLeft className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black">מדור</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScope("team")}
                        disabled={isScopeDisabled("team")}
                        className={cn(
                          cardBase,
                          scope === "team" ? cardActive : cardInactive,
                          isScopeDisabled("team") && cardDisabled,
                        )}
                      >
                        <div
                          className={cn(
                            "p-1.5 rounded-lg",
                            scope === "team" ? "bg-primary/20" : "bg-muted",
                          )}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-black">חוליה</span>
                      </button>
                    </div>
                  </div>

                  {/* Cascading Dropdowns */}
                  <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border/40 animate-in fade-in zoom-in duration-300">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-4">
                      2. הגדרת היחידה הנבחרת
                    </Label>

                    <div className="space-y-4">
                      {/* Department Select (Always shown for filtering) */}
                      <div className="space-y-1.5 text-right">
                        <Label className="text-[11px] font-bold text-muted-foreground/80 pr-1">
                          מחלקה
                        </Label>
                        <Select
                          value={selectedDeptId}
                          onValueChange={(val) => {
                            setSelectedDeptId(val);
                            setSelectedSectionId("");
                            setSelectedTeamId("");
                            if (scope === "department") setTargetId(val);
                          }}
                        >
                          <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl font-bold text-sm">
                            <SelectValue placeholder="בחירת מחלקה..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border/40 shadow-xl scrollbar-none">
                            {departments.map((d: any) => (
                              <SelectItem key={d.id} value={d.id.toString()}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Section Select - Shown if scope is section or team */}
                      {(scope === "section" || scope === "team") && (
                        <div className="space-y-1.5 text-right animate-in slide-in-from-top-2 duration-200">
                          <Label className="text-[11px] font-bold text-muted-foreground/80 pr-1">
                            מדור
                          </Label>
                          <Select
                            value={selectedSectionId}
                            onValueChange={(val) => {
                              setSelectedSectionId(val);
                              setSelectedTeamId("");
                              if (scope === "section") setTargetId(val);
                            }}
                            disabled={!selectedDeptId}
                          >
                            <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl font-bold text-sm">
                              <SelectValue placeholder="בחירת מדור..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl scrollbar-none">
                              {availableSections.map((s: any) => (
                                <SelectItem key={s.id} value={s.id.toString()}>
                                  {s.name}
                                </SelectItem>
                              ))}
                              {availableSections.length === 0 && (
                                <SelectItem value="_" disabled>
                                  אין מדורים זמינים
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Team Select - Shown if scope is team */}
                      {scope === "team" && (
                        <div className="space-y-1.5 text-right animate-in slide-in-from-top-2 duration-200">
                          <Label className="text-[11px] font-bold text-muted-foreground/80 pr-1">
                            חוליה
                          </Label>
                          <Select
                            value={selectedTeamId}
                            onValueChange={(val) => {
                              setSelectedTeamId(val);
                              setTargetId(val);
                            }}
                            disabled={!selectedSectionId}
                          >
                            <SelectTrigger className="h-11 bg-background border-border/40 rounded-xl font-bold text-sm">
                              <SelectValue placeholder="בחירת חוליה..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/40 shadow-xl scrollbar-none">
                              {availableTeams.map((t: any) => (
                                <SelectItem key={t.id} value={t.id.toString()}>
                                  {t.name}
                                </SelectItem>
                              ))}
                              {availableTeams.length === 0 && (
                                <SelectItem value="_" disabled>
                                  אין חוליות זמינות
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive animate-in fade-in zoom-in duration-300">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">
                אין לך הרשאות פיקודיות לביצוע פעולה זו
              </p>
            </div>
          )}

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
              <span className="text-[11px] text-muted-foreground font-normal">
                (יופיע ביומן ובדיווחים)
              </span>
            </Label>
            <Textarea
              placeholder="לדוגמה: יום מחלקה בירושלים, גיבוש צוותי, השתלמות מקצועית..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none min-h-[110px] bg-muted/30 border-border/50 rounded-xl focus:ring-primary/20 p-4 text-sm leading-relaxed"
            />
          </div>
        </div>

        <div className="p-5 border-t border-border/40 bg-muted/10 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative z-20 flex gap-3">
          <Button
            variant="ghost"
            className="flex-1 rounded-xl h-12 font-bold text-muted-foreground hover:bg-muted transition-all"
            onClick={onClose}
          >
            ביטול
          </Button>
          <Button
            className="flex-[2] rounded-xl h-12 font-black text-base shadow-[0_10px_20px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_15px_30px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleSubmit}
            disabled={isUpdatingScope || !hasCommandPower || !targetId}
          >
            {isUpdatingScope ? (
              <span className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                מעדכן את כולם...
              </span>
            ) : (
              <span className="flex items-center gap-2">עדכן אירוע לכולם</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
