import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { RotateCcw, Cake, Briefcase, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

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
  isMobile?: boolean;
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
  isMobile = false,
}: DashboardFiltersProps) => {
  // Prepare options based on selections
  const selectedDept = structure.find(
    (d) => d.id.toString() === selectedDeptId,
  );
  const sections = selectedDept ? selectedDept.sections : [];

  const selectedSection = sections.find(
    (s) => s.id.toString() === selectedSectionId,
  );
  const teams = selectedSection ? selectedSection.teams : [];

  const hasActiveFilters =
    !!selectedDeptId ||
    !!selectedSectionId ||
    !!selectedTeamId ||
    !!selectedStatusId ||
    selectedServiceTypes.length > 0 ||
    !!selectedAgeRange?.min ||
    !!selectedAgeRange?.max;

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
    return allStatusTypes.find((s) => s.id.toString() === selectedStatusId);
  }, [allStatusTypes, selectedStatusId]);

  const activeParentId = useMemo(() => {
    if (!selectedStatus) return null;
    return selectedStatus.parent_status_id
      ? selectedStatus.parent_status_id.toString()
      : selectedStatus.id.toString();
  }, [selectedStatus]);

  const subStatuses = useMemo(() => {
    if (!activeParentId) return [];
    return allStatusTypes.filter(
      (s) => s.parent_status_id?.toString() === activeParentId,
    );
  }, [allStatusTypes, activeParentId]);

  const FilterContent = (
    <div className="flex flex-col w-full gap-4">
      <div
        className={cn(
          "flex items-start md:items-center gap-2",
          isMobile ? "flex-col" : "flex-col md:flex-row min-h-[56px]",
        )}
      >
        {/* Search / Context Icon */}
        {!isMobile && (
          <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/5 text-primary ml-4 shrink-0 shadow-inner">
            <Filter className="w-4 h-4" />
          </div>
        )}

        {/* Organization Selectors */}
        <div
          className={cn(
            "flex items-center gap-1 xl:gap-2 flex-wrap w-full md:w-auto",
            isMobile
              ? "flex-col w-full"
              : "flex-grow",
          )}
        >
          {/* Department */}
          <div className={cn("min-w-[130px]", isMobile && "w-full")}>
            <Select
              value={selectedDeptId || "all"}
              onValueChange={(val) =>
                onFilterChange("department", val === "all" ? undefined : val)
              }
              disabled={!canSelectDept && !!selectedDeptId}
            >
              <SelectTrigger className="border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 h-10 px-3 text-[13px] font-black focus:ring-0 focus:ring-offset-0 transition-all rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Briefcase className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  <SelectValue placeholder="מחלקה" />
                </div>
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-2xl border-primary/10 shadow-2xl backdrop-blur-xl"
              >
                <SelectItem value="all" className="font-bold">
                  כל המחלקות
                </SelectItem>
                {structure.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isMobile && (
            <Separator orientation="vertical" className="h-4 bg-primary/10" />
          )}

          {/* Section */}
          <div className={cn("min-w-[130px]", isMobile && "w-full")}>
            <Select
              value={selectedSectionId || "all"}
              onValueChange={(val) =>
                onFilterChange("section", val === "all" ? undefined : val)
              }
              disabled={
                (!selectedDeptId && !canSelectDept) ||
                (!canSelectSection && !!selectedSectionId) ||
                (canSelectDept && !selectedDeptId)
              }
            >
              <SelectTrigger className="border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 h-10 px-3 text-[13px] font-black focus:ring-0 focus:ring-offset-0 transition-all rounded-xl text-right">
                <SelectValue placeholder="מדור" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-2xl border-primary/10 shadow-2xl backdrop-blur-xl"
              >
                <SelectItem value="all" className="font-bold">
                  כל המדורים
                </SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec.id} value={sec.id.toString()}>
                    {sec.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isMobile && (
            <Separator orientation="vertical" className="h-4 bg-primary/10" />
          )}

          {/* Team */}
          <div className={cn("min-w-[130px]", isMobile && "w-full")}>
            <Select
              value={selectedTeamId || "all"}
              onValueChange={(val) =>
                onFilterChange("team", val === "all" ? undefined : val)
              }
              disabled={
                (!selectedSectionId && !canSelectSection) ||
                (!canSelectTeam && !!selectedTeamId) ||
                (canSelectSection && !selectedSectionId)
              }
            >
              <SelectTrigger className="border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 h-10 px-3 text-[13px] font-black focus:ring-0 focus:ring-offset-0 transition-all rounded-xl text-right">
                <SelectValue placeholder="חולייה" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-2xl border-primary/10 shadow-2xl backdrop-blur-xl"
              >
                <SelectItem value="all" className="font-bold">
                  כל החוליות
                </SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!isMobile && <div className="flex-grow min-w-[20px]" />}

        {/* Metadata Filters Row */}
        <div
          className={cn(
            "flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-3 flex-wrap w-full mt-4 md:mt-0",
            isMobile && "w-full mt-2",
          )}
        >
          {/* Service Type Buttons */}
          <div
            className={cn(
              "flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-2xl",
              isMobile && "w-full justify-center flex-wrap",
            )}
          >
            {serviceTypes.map((st) => {
              const isSelected = selectedServiceTypes.includes(st.name);
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    const newValue = isSelected
                      ? selectedServiceTypes.filter((name) => name !== st.name)
                      : [...selectedServiceTypes, st.name];
                    onFilterChange("serviceType", newValue);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-[14px] text-[11px] font-black transition-all",
                    isSelected
                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-primary/5"
                      : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {st.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Select */}
            <Select
              value={activeParentId || "all"}
              onValueChange={(val) =>
                onFilterChange("status", val === "all" ? undefined : val)
              }
            >
              <SelectTrigger className="h-10 min-w-[140px] border-primary/10 bg-white/50 dark:bg-slate-900 rounded-2xl text-[12px] font-black shadow-sm focus:ring-primary/20">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-2xl border-primary/10 shadow-2xl"
              >
                <SelectItem
                  value="all"
                  className="font-bold text-muted-foreground"
                >
                  כל הסטטוסים
                </SelectItem>
                {statuses.map((st) => (
                  <SelectItem
                    key={st.status_id}
                    value={st.status_id.toString()}
                    className="font-bold"
                  >
                    <div className="flex items-center gap-2 text-right">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: st.color }}
                      />
                      {st.status_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Age Select */}
            <Select
              value={currentAgeValue}
              onValueChange={(val) => onFilterChange("ageRange", val)}
            >
              <SelectTrigger className="h-10 min-w-[110px] border-primary/10 bg-primary/5 text-primary rounded-2xl text-[12px] font-black shadow-none">
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 opacity-50" />
                  <SelectValue placeholder="גיל" />
                </div>
              </SelectTrigger>
              <SelectContent
                dir="rtl"
                className="rounded-2xl border-primary/10 shadow-2xl"
              >
                {ageRanges.map((range) => (
                  <SelectItem
                    key={range.value}
                    value={range.value}
                    className="font-bold"
                  >
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onFilterChange("reset")}
                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-2xl transition-all shrink-0"
                title="איפוס"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cool Sub-status Row (3 Squares popping up) */}
      <AnimatePresence>
        {subStatuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="overflow-visible"
          >
            <div className="flex flex-wrap items-center gap-2 border-t border-primary/5 pt-3 pb-1">
              <div className="flex items-center gap-1.5 ml-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  תתי קטגוריה:
                </span>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 pt-2 px-1">
                {subStatuses.map((sub, idx) => {
                  const isSubSel = selectedStatusId === sub.id.toString();
                  return (
                    <motion.button
                      key={sub.id}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: idx * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 15,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        onFilterChange("status", sub.id.toString())
                      }
                      className={cn(
                        "px-4 py-4 rounded-2xl text-[11px] font-black transition-all flex flex-col items-center justify-center gap-2 border-2 whitespace-nowrap min-w-[110px] h-[80px]",
                        isSubSel
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                          : "bg-white/50 dark:bg-slate-800/50 border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-white dark:hover:bg-slate-800",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          isSubSel ? "bg-white" : "bg-primary/40",
                        )}
                      />
                      <span className="text-center">{sub.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const selectedTeam = teams.find((t) => t.id.toString() === selectedTeamId);

  return (
    <div className="w-full h-full">
      {isMobile ? (
        <Card className="relative border-none bg-background rounded-b-3xl p-4 shadow-none">
          <div className="relative z-10">{FilterContent}</div>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
          {/* Main Filter Action Button */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 px-3 gap-1.5 rounded-xl border transition-all font-black text-xs whitespace-nowrap",
                  hasActiveFilters
                    ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                    : "border-input bg-card text-primary hover:bg-muted/50 shadow-sm",
                )}
              >
                <Filter className="w-4 h-4" />
                <span>סינון נתונים</span>
                {hasActiveFilters && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 rounded-full px-1.5 min-w-5 flex items-center justify-center font-black bg-primary/20 text-primary hover:bg-primary/30 border-none"
                  >
                    {
                      [
                        !!selectedDeptId,
                        !!selectedSectionId,
                        !!selectedTeamId,
                        !!selectedStatusId,
                        selectedServiceTypes.length > 0,
                        !!selectedAgeRange?.min || !!selectedAgeRange?.max,
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={12}
              className="w-[95vw] md:w-[700px] lg:w-[850px] p-4 md:p-6 rounded-[2rem] border-primary/10 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl z-50 flex flex-col gap-4 overflow-y-auto max-h-[85vh] left-2 right-2 md:left-auto md:right-auto"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
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
              {FilterContent}
            </PopoverContent>
          </Popover>

          {/* Active Filter Pills (Desktop Only) */}
          <AnimatePresence>
            {/* Active Dept */}
            {selectedDept && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  מחלקה:{" "}
                  <span className="font-bold text-foreground text-[11px]">
                    {selectedDept.name}
                  </span>
                  {canSelectDept && (
                    <button
                      onClick={() => onFilterChange("department")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              </motion.div>
            )}

            {/* Active Section */}
            {selectedSection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  מדור:{" "}
                  <span className="font-bold text-foreground text-[11px]">
                    {selectedSection.name}
                  </span>
                  {canSelectSection && (
                    <button
                      onClick={() => onFilterChange("section")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              </motion.div>
            )}

            {/* Active Team */}
            {selectedTeam && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  חולייה:{" "}
                  <span className="font-bold text-foreground text-[11px]">
                    {selectedTeam.name}
                  </span>
                  {canSelectTeam && (
                    <button
                      onClick={() => onFilterChange("team")}
                      className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              </motion.div>
            )}

            {/* Active Status */}
            {selectedStatus && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  סטטוס:
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: selectedStatus.color || "currentColor",
                      }}
                    />
                    <span className="font-bold text-foreground text-[11px]">
                      {selectedStatus.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onFilterChange("status")}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            )}

            {/* Age Range */}
            {(selectedAgeRange?.min || selectedAgeRange?.max) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  גיל:{" "}
                  <span className="font-bold text-foreground text-[11px]">
                    {currentAgeValue === "all" ? "כל הגילאים" : currentAgeValue}
                  </span>
                  <button
                    onClick={() => onFilterChange("ageRange", "all")}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            )}

            {/* Service Types */}
            {selectedServiceTypes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge
                  variant="outline"
                  className="h-9 gap-1.5 rounded-full pl-2 pr-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-sm border-primary/10 hover:border-primary/30 transition-all font-medium text-[11px] text-muted-foreground"
                >
                  מעמד:{" "}
                  <span className="font-bold text-foreground text-[11px]">
                    {selectedServiceTypes.join(", ")}
                  </span>
                  <button
                    onClick={() => onFilterChange("serviceType", [])}
                    className="mr-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            )}

            {/* If has filters, a quick clear all next to pills */}
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFilterChange("reset")}
                  className="h-9 rounded-full px-3 text-[11px] font-black text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-2"
                >
                  נקה הכל
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
