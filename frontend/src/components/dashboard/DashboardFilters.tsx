import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Team { id: number; name: string; section_id: number; }
interface Section { id: number; name: string; department_id: number; teams: Team[]; }
interface Department { id: number; name: string; sections: Section[]; }

interface DashboardFiltersProps {
    structure: Department[];
    selectedDeptId?: string;
    selectedSectionId?: string;
    selectedTeamId?: string;
    onFilterChange: (type: 'department' | 'section' | 'team' | 'reset', value?: string) => void;
    canSelectDept: boolean;
    canSelectSection: boolean;
    canSelectTeam: boolean;
}

export const DashboardFilters = ({
    structure,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
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

    const hasActiveFilters = selectedDeptId || selectedSectionId || selectedTeamId;

    return (
        <Card className="p-4 border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border mt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm pl-4 border-l border-slate-200 dark:border-slate-700 min-w-fit">
                    <Filter className="w-4 h-4" />
                    סינון תצוגה:
                </div>

                <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
                    {/* Department */}
                    <Select
                        value={selectedDeptId || "all"}
                        onValueChange={(val) => onFilterChange('department', val === "all" ? undefined : val)}
                        disabled={!canSelectDept && !!selectedDeptId}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-right" dir="rtl">
                            <SelectValue placeholder="כל המחלקות" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            {canSelectDept && <SelectItem value="all" className="font-semibold">כל המחלקות</SelectItem>}
                            {structure.map(dept => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Section */}
                    <Select
                        value={selectedSectionId || "all"}
                        onValueChange={(val) => onFilterChange('section', val === "all" ? undefined : val)}
                        disabled={(!selectedDeptId && !canSelectDept) || (!canSelectSection && !!selectedSectionId) || (canSelectDept && !selectedDeptId)}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-right" dir="rtl">
                            <SelectValue placeholder={!selectedDeptId ? "בחר מחלקה תחילה" : "כל המדורים"} />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all" className="font-semibold">כל המדורים</SelectItem>
                            {sections.map(sec => (
                                <SelectItem key={sec.id} value={sec.id.toString()}>{sec.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Team */}
                    <Select
                        value={selectedTeamId || "all"}
                        onValueChange={(val) => onFilterChange('team', val === "all" ? undefined : val)}
                        disabled={(!selectedSectionId && !canSelectSection) || (!canSelectTeam && !!selectedTeamId) || (canSelectSection && !selectedSectionId)}
                    >
                        <SelectTrigger className="w-full sm:w-[180px] h-9 text-right" dir="rtl">
                            <SelectValue placeholder={!selectedSectionId ? "בחר מדור תחילה" : "כל החוליות"} />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="all" className="font-semibold">כל החוליות</SelectItem>
                            {teams.map(team => (
                                <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Clear Filters (Only if user has freedom to clear) */}
                {hasActiveFilters && canSelectDept && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFilterChange('reset')}
                        className="text-slate-500 hover:text-red-500 h-9"
                    >
                        <X className="w-4 h-4 ml-2" />
                        נקה סינון
                    </Button>
                )}
            </div>
        </Card>
    );
};
