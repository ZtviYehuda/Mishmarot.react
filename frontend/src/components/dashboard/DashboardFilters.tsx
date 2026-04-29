import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RotateCcw, Cake, Briefcase, Filter, X, Users, Activity, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

interface Team {
  id: number;
  name: string;
  section_id: number;
}
interface Section {
  id: number;
  name: string;
  department_id: number;
  teams: Team[];
}
interface Department {
  id: number;
  name: string;
  sections: Section[];
}

interface DashboardFiltersProps {
  structure: Department[];
  statuses: { status_id: number; status_name: string; color: string }[];
  allStatusTypes: any[];
  selectedDeptId?: string;
  selectedSectionId?: string;
  selectedTeamId?: string;
  selectedStatusId?: string;
  serviceTypes: { id: number; name: string }[];
  selectedServiceTypes: string[];
  selectedAgeRange?: { min?: number; max?: number };
  onFilterChange: (
    type:
      | "department"
      | "section"
      | "team"
      | "status"
      | "serviceType"
      | "ageRange"
      | "reset",
    value?: any,
  ) => void;
  canSelectDept: boolean;
  canSelectSection: boolean;
  canSelectTeam: boolean;
  hasActiveFiltersExternal?: boolean;
  activeFilterCountExternal?: number;
  user?: any;
  isMobile?: boolean;
  pillsOnly?: boolean;
  className?: string;
}

export const DashboardFilters = ({
  structure,
  statuses,
  allStatusTypes,
  selectedDeptId,
  selectedSectionId,
  selectedTeamId,
  selectedStatusId,
  serviceTypes,
  selectedServiceTypes,
  selectedAgeRange,
  onFilterChange,
  canSelectDept,
  canSelectSection,
  canSelectTeam,
  hasActiveFiltersExternal,
  activeFilterCountExternal,
  user,
  isMobile = false,
  pillsOnly = false,
  className,
}: DashboardFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    org: false,
    status: false,
    service: false,
    age: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = useMemo(() => {
    if (!selectedDeptId) return [];
    const dept = structure.find((d) => d.id.toString() === selectedDeptId);
    return dept ? dept.sections : [];
  }, [selectedDeptId, structure]);

  const teams = useMemo(() => {
    if (!selectedSectionId) return [];
    const sec = sections.find((s) => s.id.toString() === selectedSectionId);
    return sec ? sec.teams : [];
  }, [selectedSectionId, sections]);

  const ageRanges = [
    { label: "כל הגילאים", value: "all" },
    { label: "18-21", value: "18-21" },
    { label: "22-25", value: "22-25" },
    { label: "26-30", value: "26-30" },
    { label: "31-35", value: "31-35" },
    { label: "36-40", value: "36-40" },
    { label: "41-50", value: "41-50" },
    { label: "50+", value: "50+" },
  ];

  const currentAgeValue = selectedAgeRange?.min
    ? selectedAgeRange.max
      ? `${selectedAgeRange.min}-${selectedAgeRange.max}`
      : `${selectedAgeRange.min}+`
    : "all";

  // Sub-status logic
  const selectedStatus = useMemo(() => {
    if (!selectedStatusId) return null;
    const s = statuses.find((st) => st.status_id.toString() === selectedStatusId);
    if (s) return { id: s.status_id, name: s.status_name, color: s.color };
    return null;
  }, [selectedStatusId, statuses]);

  const selectedDept = structure.find((d) => d.id.toString() === selectedDeptId);
  const selectedSection = sections.find((s) => s.id.toString() === selectedSectionId);
  const selectedTeam = teams.find((t) => t.id.toString() === selectedTeamId);

  // Determine if organizational filters are "active" based on user's command level
  const isDeptActive = useMemo(() => {
    if (!selectedDeptId || selectedDeptId === "all") return false;
    if (user?.is_admin) return true;
    // For commanders, if it matches their assigned/commanded unit, it's not an "active" filter (it's their default constraint)
    if (user?.commands_department_id?.toString() === selectedDeptId) return false;
    if (user?.assigned_department_id?.toString() === selectedDeptId) return false;
    return true; 
  }, [selectedDeptId, user]);

  const isSectionActive = useMemo(() => {
    if (!selectedSectionId || selectedSectionId === "all") return false;
    if (user?.is_admin) return true;
    if (user?.commands_section_id?.toString() === selectedSectionId) return false;
    if (user?.assigned_section_id?.toString() === selectedSectionId) return false;
    // If it's a dept commander and they haven't selected a section, it's not active.
    // But here we check equality.
    return true;
  }, [selectedSectionId, user]);

  const isTeamActive = useMemo(() => {
    if (!selectedTeamId || selectedTeamId === "all") return false;
    if (user?.is_admin) return true;
    if (user?.commands_team_id?.toString() === selectedTeamId) return false;
    if (user?.assigned_team_id?.toString() === selectedTeamId) return false;
    return true;
  }, [selectedTeamId, user]);

  const hasActiveFilters = 
    hasActiveFiltersExternal !== undefined 
      ? hasActiveFiltersExternal 
      : (isDeptActive ||
         isSectionActive ||
         isTeamActive ||
         !!selectedStatusId ||
         selectedServiceTypes.length > 0 ||
         !!selectedAgeRange?.min ||
         !!selectedAgeRange?.max);

  const FilterContent = (
    <div className="space-y-2 pt-10 sm:pt-0">
      {/* Organizational Units */}
      {(canSelectDept || canSelectSection || canSelectTeam) && (
        <div className="overflow-hidden border-b border-primary/5">
          <button 
            onClick={() => toggleSection('org')}
            className="w-full flex items-center justify-between py-3 px-1 sm:p-4 hover:bg-primary/5 transition-colors group"
          >
            <h5 className="text-[11px] sm:text-xs font-black text-primary/70 group-hover:text-primary uppercase tracking-widest flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              יחידות ארגוניות
            </h5>
            <ChevronDown className={cn("w-4 h-4 text-primary/30 transition-transform duration-300", expandedSections.org && "rotate-180")} />
          </button>
          <AnimatePresence>
            {expandedSections.org && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-1 pb-4 pt-1 sm:p-4 sm:pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="w-full">
                      <Select
                        value={selectedDeptId || "all"}
                        onValueChange={(val) => onFilterChange("department", val === "all" ? undefined : val)}
                        disabled={!canSelectDept && !!selectedDeptId}
                      >
                        <SelectTrigger className="h-10 px-3 text-[13px] font-bold rounded-xl border border-primary/10 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors focus:ring-0 text-right bg-white dark:bg-slate-900">
                          <SelectValue placeholder="מחלקה" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl border-border/40 backdrop-blur-xl">
                          <SelectItem value="all" className="font-bold">כל המחלקות</SelectItem>
                          {structure.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <Select
                        value={selectedSectionId || "all"}
                        onValueChange={(val) => onFilterChange("section", val === "all" ? undefined : val)}
                        disabled={(!selectedDeptId && !canSelectDept) || (!canSelectSection && !!selectedSectionId) || (canSelectDept && !selectedDeptId)}
                      >
                        <SelectTrigger className="h-10 px-3 text-[13px] font-bold rounded-xl border border-primary/10 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors focus:ring-0 text-right bg-white dark:bg-slate-900">
                          <SelectValue placeholder="מדור" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl border-border/40 backdrop-blur-xl">
                          <SelectItem value="all" className="font-bold">כל המדורים</SelectItem>
                          {sections.map((sec) => (
                            <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full">
                      <Select
                        value={selectedTeamId || "all"}
                        onValueChange={(val) => onFilterChange("team", val === "all" ? undefined : val)}
                        disabled={(!selectedSectionId && !canSelectSection) || (!canSelectTeam && !!selectedTeamId) || (canSelectSection && !selectedSectionId)}
                      >
                        <SelectTrigger className="h-10 px-3 text-[13px] font-bold rounded-xl border border-primary/10 hover:bg-white/50 dark:hover:bg-slate-800 transition-colors focus:ring-0 text-right bg-white dark:bg-slate-900">
                          <SelectValue placeholder="חוליה" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="rounded-xl border-border/40 backdrop-blur-xl">
                          <SelectItem value="all" className="font-bold">כל החוליות</SelectItem>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main Filter Groups Grid */}
      <div className="space-y-1">
        {/* Statuses Group */}
        <div className="overflow-hidden border-b border-primary/5">
          <button 
            onClick={() => toggleSection('status')}
            className="w-full flex items-center justify-between py-3 px-1 sm:p-4 hover:bg-primary/5 transition-colors group"
          >
            <h5 className="text-[11px] sm:text-xs font-black text-primary/70 group-hover:text-primary uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              סטטוסים
            </h5>
            <ChevronDown className={cn("w-4 h-4 text-primary/30 transition-transform duration-300", expandedSections.status && "rotate-180")} />
          </button>
          <AnimatePresence>
            {expandedSections.status && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-1 pb-4 pt-1 sm:p-4 sm:pt-0">
                  <div className="flex flex-wrap gap-2">
                    {allStatusTypes.map((type) => (
                      <Button
                        key={type.id}
                        variant="outline"
                        size="sm"
                        onClick={() => onFilterChange("status", type.id.toString())}
                        className={cn(
                          "h-8 px-3 rounded-full text-[11px] font-bold border-primary/10 transition-all bg-white dark:bg-slate-900",
                          selectedStatusId === type.id.toString()
                            ? "bg-primary text-white border-primary hover:bg-primary/90"
                            : "hover:bg-primary/5 hover:border-primary/30"
                        )}
                      >
                        <div 
                          className="w-2 h-2 rounded-full ml-1.5" 
                          style={{ backgroundColor: type.color || "currentColor" }} 
                        />
                        {type.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Service Types */}
        <div className="overflow-hidden border-b border-primary/5">
          <button 
            onClick={() => toggleSection('service')}
            className="w-full flex items-center justify-between py-3 px-1 sm:p-4 hover:bg-primary/5 transition-colors group"
          >
            <h5 className="text-[11px] sm:text-xs font-black text-primary/70 group-hover:text-primary uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              מעמד
            </h5>
            <ChevronDown className={cn("w-4 h-4 text-primary/30 transition-transform duration-300", expandedSections.service && "rotate-180")} />
          </button>
          <AnimatePresence>
            {expandedSections.service && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-1 pb-4 pt-1 sm:p-4 sm:pt-0">
                  <div className="flex flex-wrap gap-2">
                    {serviceTypes.map((type) => {
                      const isActive = selectedServiceTypes.includes(type.name);
                      return (
                        <Button
                          key={type.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newTypes = isActive
                              ? selectedServiceTypes.filter((t) => t !== type.name)
                              : [...selectedServiceTypes, type.name];
                            onFilterChange("serviceType", newTypes);
                          }}
                          className={cn(
                            "h-8 px-3 rounded-full text-[11px] font-bold border-primary/10 transition-all bg-white dark:bg-slate-900",
                            isActive
                              ? "bg-primary text-white border-primary hover:bg-primary/90"
                              : "hover:bg-primary/5 hover:border-primary/30"
                          )}
                        >
                          {type.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Age Range */}
        <div className="overflow-hidden">
          <button 
            onClick={() => toggleSection('age')}
            className="w-full flex items-center justify-between py-3 px-1 sm:p-4 hover:bg-primary/5 transition-colors group"
          >
            <h5 className="text-[11px] sm:text-xs font-black text-primary/70 group-hover:text-primary uppercase tracking-widest flex items-center gap-2">
              <Cake className="w-3.5 h-3.5" />
              גילאים
            </h5>
            <ChevronDown className={cn("w-4 h-4 text-primary/30 transition-transform duration-300", expandedSections.age && "rotate-180")} />
          </button>
          <AnimatePresence>
            {expandedSections.age && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-1 pb-4 pt-1 sm:p-4 sm:pt-0">
                  <div className="flex flex-wrap gap-2">
                    {ageRanges.map((range) => (
                      <Button
                        key={range.value}
                        variant="outline"
                        size="sm"
                        onClick={() => onFilterChange("ageRange", range.value)}
                        className={cn(
                          "h-8 px-3 rounded-full text-[11px] font-bold border-primary/10 transition-all bg-white dark:bg-slate-900",
                          currentAgeValue === range.value
                            ? "bg-primary text-white border-primary hover:bg-primary/90"
                            : "hover:bg-primary/5 hover:border-primary/30"
                        )}
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {isMobile ? (
        <Card className="relative border-none bg-background rounded-b-3xl p-4">
          <div className="relative z-10">{FilterContent}</div>
        </Card>
      ) : pillsOnly ? (
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-wrap items-center gap-2 py-1"
            >
              {selectedDept && isDeptActive && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  מחלקה:{" "}<span className="font-bold text-foreground">{selectedDept.name}</span>
                  {canSelectDept && <button onClick={() => onFilterChange("department")} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>}
                </Badge>
              )}
              {selectedSection && isSectionActive && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  מדור:{" "}<span className="font-bold text-foreground">{selectedSection.name}</span>
                  {canSelectSection && <button onClick={() => onFilterChange("section")} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>}
                </Badge>
              )}
              {selectedTeam && isTeamActive && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  חולייה:{" "}<span className="font-bold text-foreground">{selectedTeam.name}</span>
                  {canSelectTeam && <button onClick={() => onFilterChange("team")} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>}
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  סטטוס:
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedStatus.color || "currentColor" }} />
                    <span className="font-bold text-foreground">{selectedStatus.name}</span>
                  </div>
                  <button onClick={() => onFilterChange("status")} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {(selectedAgeRange?.min || selectedAgeRange?.max) && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  גיל:{" "}<span className="font-bold text-foreground">{currentAgeValue === "all" ? "כל הגילאים" : currentAgeValue}</span>
                  <button onClick={() => onFilterChange("ageRange", "all")} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {selectedServiceTypes.length > 0 && (
                <Badge variant="outline" className="h-7 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-primary/10 font-medium text-[11px] text-muted-foreground">
                  מעמד:{" "}<span className="font-bold text-foreground">{selectedServiceTypes.join(", ")}</span>
                  <button onClick={() => onFilterChange("serviceType", [])} className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={() => onFilterChange("reset")} className="h-7 rounded-full px-3 text-[11px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                נקה הכל
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className={cn("flex flex-wrap items-center justify-end gap-2 w-full", className)}>
            <Popover>
              <div className="relative group">
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-9 px-3.5 gap-2 rounded-xl border border-border/40 transition-all font-black text-[11px] whitespace-nowrap backdrop-blur-xl",
                      hasActiveFilters
                        ? "bg-primary/5 text-primary hover:bg-primary/10 border-primary/20"
                        : "bg-card/40 text-primary hover:bg-primary/5",
                    )}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="hidden xl:inline">סינון נתונים</span>
                    {hasActiveFilters && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 rounded-full px-1.5 min-w-5 flex items-center justify-center font-black bg-primary/20 text-primary hover:bg-primary/30 border-none"
                      >
                        {activeFilterCountExternal !== undefined 
                          ? activeFilterCountExternal 
                          : [
                            isDeptActive,
                            isSectionActive,
                            isTeamActive,
                            !!selectedStatusId,
                            selectedServiceTypes.length > 0,
                            !!selectedAgeRange?.min || !!selectedAgeRange?.max,
                          ].filter(Boolean).length
                        }
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>

                {hasActiveFilters && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFilterChange("reset");
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background transition-all hover:scale-110 active:scale-90 z-20 group-hover:-translate-y-1"
                    title="נקה הכל"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
              <PopoverContent
                align="end"
                sideOffset={12}
                className="w-[95vw] md:w-[700px] lg:w-[850px] p-4 md:p-6 rounded-[2rem] border-primary/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl z-50 flex flex-col gap-4 overflow-y-auto max-h-[85vh]"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    אפשרויות סינון
                  </h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFilterChange("reset")}
                      className="h-8 text-[11px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <RotateCcw className="w-3.5 h-3.5 ml-1.5" />
                      נקה הכל
                    </Button>
                  )}
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-1.5 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest ml-1">פעיל:</span>
                    {selectedDept && isDeptActive && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        {selectedDept.name}
                        {canSelectDept && <button onClick={() => onFilterChange("department")} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>}
                      </Badge>
                    )}
                    {selectedSection && isSectionActive && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        {selectedSection.name}
                        {canSelectSection && <button onClick={() => onFilterChange("section")} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>}
                      </Badge>
                    )}
                    {selectedTeam && isTeamActive && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        {selectedTeam.name}
                        {canSelectTeam && <button onClick={() => onFilterChange("team")} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>}
                      </Badge>
                    )}
                    {selectedStatus && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedStatus.color || "currentColor" }} />
                        {selectedStatus.name}
                        <button onClick={() => onFilterChange("status")} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>
                      </Badge>
                    )}
                    {(selectedAgeRange?.min || selectedAgeRange?.max) && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        גיל: {currentAgeValue}
                        <button onClick={() => onFilterChange("ageRange", "all")} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>
                      </Badge>
                    )}
                    {selectedServiceTypes.length > 0 && (
                      <Badge variant="outline" className="h-6 gap-1 rounded-full pl-2 pr-1.5 bg-white dark:bg-slate-900 border-primary/20 font-medium text-[10px] text-foreground">
                        {selectedServiceTypes.join(", ")}
                        <button onClick={() => onFilterChange("serviceType", [])} className="hover:text-destructive transition-colors"><X className="w-2.5 h-2.5" /></button>
                      </Badge>
                    )}
                  </div>
                )}

                {FilterContent}
              </PopoverContent>
            </Popover>
        </div>
      )}
    </div>
  );
};
