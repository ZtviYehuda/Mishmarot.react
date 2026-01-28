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
        <Card className="p-4 border border-border shadow-sm bg-card mt-4 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1 h-full bg-primary/10" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                {/* Header Section */}
                <div className="flex items-center gap-2 text-foreground font-black text-sm pl-6 lg:border-l border-border min-w-fit shrink-0">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Filter className="w-4 h-4" />
                    </div>
                    סינון ממוקד
                </div>

                {/* Filters Content Area */}
                <div className="flex-1 flex flex-col gap-5 w-full">
                    {/* Top Row: Organizational Filters */}
                    <div className="flex flex-wrap gap-4 w-full">
                        {/* Department */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">מחלקה</label>
                            <Select
                                value={selectedDeptId || "all"}
                                onValueChange={(val) => onFilterChange('department', val === "all" ? undefined : val)}
                                disabled={!canSelectDept && !!selectedDeptId}
                            >
                                <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/50 border-input" dir="rtl">
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
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">מדור</label>
                            <Select
                                value={selectedSectionId || "all"}
                                onValueChange={(val) => onFilterChange('section', val === "all" ? undefined : val)}
                                disabled={(!selectedDeptId && !canSelectDept) || (!canSelectSection && !!selectedSectionId) || (canSelectDept && !selectedDeptId)}
                            >
                                <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/50 border-input" dir="rtl">
                                    <SelectValue placeholder={!selectedDeptId ? "בחר מחלקה..." : "כל המדורים"} />
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
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">חולייה</label>
                            <Select
                                value={selectedTeamId || "all"}
                                onValueChange={(val) => onFilterChange('team', val === "all" ? undefined : val)}
                                disabled={(!selectedSectionId && !canSelectSection) || (!canSelectTeam && !!selectedTeamId) || (canSelectSection && !selectedSectionId)}
                            >
                                <SelectTrigger className="h-10 text-right font-bold text-xs bg-muted/50 border-input" dir="rtl">
                                    <SelectValue placeholder={!selectedSectionId ? "בחר מדור..." : "כל החוליות"} />
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

                    {/* Bottom Row: Status Filter */}
                    <div className="flex items-end justify-between gap-4 w-full pt-2 border-t border-border">
                        <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mr-1">פילוח לפי סטטוס נוכחות</label>
                            <Select
                                value={selectedStatusId || "all"}
                                onValueChange={(val) => onFilterChange('status', val === "all" ? undefined : val)}
                            >
                                <SelectTrigger className="h-10 text-right bg-primary/5 border-primary/20 font-bold text-sm text-primary" dir="rtl">
                                    <SelectValue placeholder="בחר סטטוס לפירוט..." />
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

                        {/* Clear Filters Action */}
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onFilterChange('reset')}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 px-6 font-bold transition-all border border-border"
                            >
                                <X className="w-4 h-4 ml-2" />
                                איפוס כלל הסינונים
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
