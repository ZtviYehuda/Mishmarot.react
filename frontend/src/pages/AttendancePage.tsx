import { useState, useEffect, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Search,
  Filter,
  ClipboardCheck,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  BulkStatusUpdateModal,
  StatusUpdateModal,
} from "@/components/employees/modals";
import { PageHeader } from "@/components/layout/PageHeader";
import type { Employee } from "@/types/employee.types";

export default function AttendancePage() {
  const {} = useAuthContext();
  const {
    employees,
    loading,
    fetchEmployees,
    getStructure,
    getDashboardStats,
  } = useEmployees();

  const [searchTerm, setSearchTerm] = useState("");
  const [structure, setStructure] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  // Modal states
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );

  useEffect(() => {
    const init = async () => {
      const struct = await getStructure();
      if (struct) setStructure(struct);

      const dashboardStats = await getDashboardStats();
      if (dashboardStats && dashboardStats.stats) {
        setStats(dashboardStats.stats);
      }
    };
    init();
  }, [getStructure, getDashboardStats]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Basic Search
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const searchMatch =
        fullName.includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm);
      if (!searchMatch) return false;

      // Organizational Filters
      if (
        selectedDeptId !== "all" &&
        emp.department_id !== parseInt(selectedDeptId)
      )
        return false;
      if (
        selectedSectionId !== "all" &&
        emp.section_id !== parseInt(selectedSectionId)
      )
        return false;
      if (selectedTeamId !== "all" && emp.team_id !== parseInt(selectedTeamId))
        return false;

      return true;
    });
  }, [
    employees,
    searchTerm,
    selectedDeptId,
    selectedSectionId,
    selectedTeamId,
  ]);

  const departments = structure;
  const sections =
    departments.find((d: any) => d.id.toString() === selectedDeptId)
      ?.sections || [];

  const handleOpenStatusModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStatusModalOpen(true);
  };

  const updatedTodayCount = employees.filter(
    (emp) =>
      emp.last_status_update &&
      new Date(emp.last_status_update).toDateString() ===
        new Date().toDateString(),
  ).length;

  const totalCount = employees.length;
  const progressPercent =
    totalCount > 0 ? (updatedTodayCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      <PageHeader
        icon={CalendarDays}
        title="מעקב נוכחות יומי"
        subtitle="ניהול ודיווח סטטוס נוכחות לכלל שוטרי היחידה"
        category="נוכחות"
        categoryLink="/attendance"
        iconClassName="from-emerald-50 to-emerald-100 border-emerald-200"
        badge={
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-10 sm:h-11 rounded-xl border-slate-200 gap-2 font-bold text-slate-600 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ייצוא דוח יומי</span>
              <span className="sm:hidden">ייצוא</span>
            </Button>
            <Button
              className="h-10 sm:h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 px-4 sm:px-6 gap-2 font-black flex-1 sm:flex-none"
              onClick={() => setBulkModalOpen(true)}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">עדכון נוכחות מרוכז</span>
              <span className="sm:hidden">עדכון מרוכז</span>
            </Button>
          </div>
        }
      />

      {/* Summary Stats & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm font-black text-slate-800 dark:text-white">
                סיכום התייצבות יחידתי
              </span>
              <span className="text-xs text-slate-400 font-bold">
                מעקב דיווחים ליום{" "}
                {new Date().toLocaleDateString("he-IL", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600">
                {updatedTodayCount}/{totalCount}
              </span>
              <span className="text-[10px] block font-black text-slate-400 uppercase tracking-tighter">
                שוטרים מדווחים
              </span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats
              .filter((s: any) => s.status_id)
              .slice(0, 4)
              .map((s: any) => (
                <div
                  key={s.status_id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1"
                >
                  <span className="text-xl font-black text-slate-800 dark:text-white">
                    {s.count}
                  </span>
                  <span
                    className="text-[10px] font-bold text-slate-400 uppercase"
                    style={{ color: s.color }}
                  >
                    {s.status_name}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between">
          <div className="space-y-2">
            <Clock className="w-8 h-8 opacity-50" />
            <h3 className="text-xl font-black">תזכורת דיווח</h3>
            <p className="text-sm text-indigo-100 font-medium leading-relaxed opacity-80">
              יש להשלים את דיווחי הנוכחות של כלל השוטרים במחלקה עד השעה 09:00.
            </p>
          </div>
          <div className="pt-4 flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl flex-1 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-indigo-50">
                נותרו לדווח: {totalCount - updatedTodayCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2 text-right">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            חיפוש מהיר
          </label>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <Input
              placeholder="שם שוטר או מספר אישי..."
              className="h-11 pr-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            מחלקה
          </label>
          <Select
            value={selectedDeptId}
            onValueChange={(val) => {
              setSelectedDeptId(val);
              setSelectedSectionId("all");
              setSelectedTeamId("all");
            }}
          >
            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold">
              <SelectValue placeholder="כל המחלקות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המחלקות</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48 space-y-2 text-right">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">
            מדור
          </label>
          <Select
            value={selectedSectionId}
            onValueChange={(val) => {
              setSelectedSectionId(val);
              setSelectedTeamId("all");
            }}
            disabled={!selectedDeptId}
          >
            <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold">
              <SelectValue placeholder="כל המדורים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל המדורים</SelectItem>
              {sections.map((s: any) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          className="h-11 text-slate-400 hover:text-slate-600 gap-2"
          onClick={() => {
            setSelectedDeptId("all");
            setSelectedSectionId("all");
            setSelectedTeamId("all");
            setSearchTerm("");
          }}
        >
          <Filter className="w-4 h-4" />
          נקה סינון
        </Button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 h-14">
              <TableRow>
                <TableHead className="text-right px-6 font-black text-slate-500 uppercase text-[10px] tracking-widest">
                  שוטר
                </TableHead>
                <TableHead className="text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">
                  שיוך ארגוני
                </TableHead>
                <TableHead className="text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">
                  סטטוס נוכחות
                </TableHead>
                <TableHead className="text-right font-black text-slate-500 uppercase text-[10px] tracking-widest">
                  עדכון אחרון
                </TableHead>
                <TableHead className="text-center font-black text-slate-500 uppercase text-[10px] tracking-widest">
                  פעולות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-400"
                  >
                    טוען נתונים...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-400 font-medium"
                  >
                    לא נמצאו שוטרים התואמים את הסינון
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => {
                  const isUpdatedToday =
                    emp.last_status_update &&
                    new Date(emp.last_status_update).toDateString() ===
                      new Date().toDateString();

                  return (
                    <TableRow
                      key={emp.id}
                      className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 font-black text-[10px] uppercase shadow-sm">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {emp.first_name} {emp.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {emp.personal_number}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {emp.department_name || "מטה"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {emp.section_name || "ללא מדור"} •{" "}
                            {emp.team_name || "ללא חולייה"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: emp.status_color || "#94a3b8",
                            }}
                          />
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold border-none bg-slate-100 dark:bg-slate-900 py-0.5 px-2"
                          >
                            {emp.status_name || "לא מדווח"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {isUpdatedToday ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">
                              היום,{" "}
                              {new Date(
                                emp.last_status_update!,
                              ).toLocaleTimeString("he-IL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">
                            טרם עודכן היום
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 rounded-lg gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
                            onClick={() => handleOpenStatusModal(emp)}
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            עדכן סטטוס
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <BulkStatusUpdateModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        employees={filteredEmployees}
        onSuccess={() => fetchEmployees()}
      />

      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        employee={selectedEmployee}
        onSuccess={() => fetchEmployees()}
      />
    </div>
  );
}
