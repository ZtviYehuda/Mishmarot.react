import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";


interface Team { id: number; name: string; section_id: number; }
interface Section { id: number; name: string; department_id: number; teams: Team[]; }
interface Department { id: number; name: string; sections: Section[]; }

interface DashboardFiltersProps {
    structure: Department[];
    statuses: { status_id: number; status_name: string; color: string }[];
    selectedDeptId?: string;
    selectedSectionId?: string;
    selectedTeamId?: string;
    selectedStatusId?: string;
    onFilterChange: (type: 'department' | 'section' | 'team' | 'status' | 'reset', value?: string) => void;
    canSelectDept: boolean;
    canSelectSection: boolean;
    canSelectTeam: boolean;
}

export const DashboardFilters = ({
    structure,
    statuses,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
    selectedStatusId,
    onFilterChange,
    canSelectDept,
    canSelectSection,
    canSelectTeam
}: DashboardFiltersProps) => {

    // Prepare options based on selections
    const selectedDept = structure.find(d => d.id.toString() === selectedDeptId);
    const sections = selectedDept ? selectedDept.sections : [];

    const selectedSection = sections.find(s => s.id.toString() === selectedSectionId);
    const teams = selectedSection ? selectedSection.teams : [];

    const hasActiveFilters = !!selectedDeptId || !!selectedSectionId || !!selectedTeamId || !!selectedStatusId;

    return (
        <Card className="flex flex-col border border-border shadow-sm bg-card overflow-hidden h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2 text-foreground font-black text-sm">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Filter className="w-4 h-4" />
                    </div>
                    סינון ממוקד
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilterChange('reset')}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-2 text-xs font-bold transition-all"
                    >
                        <X className="w-3.5 h-3.5 ml-1.5" />
                        איפוס
                    </Button>
                )}
            </div>

            {/* Content - Vertical Stack */}
            <div className="p-4 flex flex-col gap-4 flex-1">

                {/* Organizational Filters Group */}
                <div className="space-y-4">
                    {/* Department */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">מחלקה</label>
                        <Select
                            value={selectedDeptId || "all"}
                            onValueChange={(val) => onFilterChange('department', val === "all" ? undefined : val)}
                            disabled={!canSelectDept && !!selectedDeptId}
                        >
                            <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/30 border-input w-full" dir="rtl">
                                <SelectValue placeholder="כל המחלקות" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {canSelectDept && <SelectItem value="all" className="font-bold">כל המחלקות</SelectItem>}
                                {structure.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Section */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">מדור</label>
                        <Select
                            value={selectedSectionId || "all"}
                            onValueChange={(val) => onFilterChange('section', val === "all" ? undefined : val)}
                            disabled={(!selectedDeptId && !canSelectDept) || (!canSelectSection && !!selectedSectionId) || (canSelectDept && !selectedDeptId)}
                        >
                            <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/30 border-input w-full" dir="rtl">
                                <SelectValue placeholder={!selectedDeptId ? "בחר מחלקה תחילה..." : "כל המדורים"} />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="all" className="font-bold">כל המדורים</SelectItem>
                                {sections.map(sec => (
                                    <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Team */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">חולייה</label>
                        <Select
                            value={selectedTeamId || "all"}
                            onValueChange={(val) => onFilterChange('team', val === "all" ? undefined : val)}
                            disabled={(!selectedSectionId && !canSelectSection) || (!canSelectTeam && !!selectedTeamId) || (canSelectSection && !selectedSectionId)}
                        >
                            <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/30 border-input w-full" dir="rtl">
                                <SelectValue placeholder={!selectedSectionId ? "בחר מדור תחילה..." : "כל החוליות"} />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="all" className="font-bold">כל החוליות</SelectItem>
                                {teams.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="my-1 border-t border-border/50" />

                {/* Status Filter */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">סינון לפי סטטוס</label>
                    <Select
                        value={selectedStatusId || "all"}
                        onValueChange={(val) => onFilterChange('status', val === "all" ? undefined : val)}
                    >
                        <SelectTrigger className="h-10 text-right bg-primary/5 border-primary/20 font-bold text-xs text-primary w-full" dir="rtl">
                            <SelectValue placeholder="בחר סטטוס..." />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all" className="font-bold text-muted-foreground">כל הסטטוסים</SelectItem>
                            {statuses.map(st => (
                                <SelectItem key={st.status_id} value={st.status_id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: st.color }} />
                                        {st.status_name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </Card>
    );
};
