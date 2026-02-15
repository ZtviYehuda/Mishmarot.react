import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  User,
  AlertCircle,
  ArrowLeft,
  Filter,
  Check,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface BulkStatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSuccess?: () => void;
  initialSelectedIds?: number[];
  alertContext?: any;
  onNudge?: (commanderId: number) => void;
}

interface UpdateState {
  status_id: number;
  status_name: string;
  color: string;
  isChanged: boolean;
  touched: boolean;
  start_date?: string | null;
  end_date?: string | null;
}

export const BulkStatusUpdateModal: React.FC<BulkStatusUpdateModalProps> = ({
  open,
  onOpenChange,
  employees,
  onSuccess,
  initialSelectedIds = [],
}) => {
  const { user } = useAuthContext();
  const { getStatusTypes, logBulkStatus, getServiceTypes } = useEmployees();
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [filterTeamId, setFilterTeamId] = useState<string>("all");
  const [filterSectionId, setFilterSectionId] = useState<string>("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchStatusId, setBatchStatusId] = useState<string>("");

  // Local state for temporary changes before submission
  const [bulkUpdates, setBulkUpdates] = useState<Record<number, UpdateState>>(
    {},
  );
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setFetching(true);
        const [sTypes, servTypes] = await Promise.all([
          getStatusTypes(),
          getServiceTypes(),
        ]);
        setStatusTypes(sTypes);
        setServiceTypes(servTypes || []);
        setFetching(false);
      };
      fetchData();

      // Initialize bulkUpdates with current statuses
      const initial: Record<number, UpdateState> = {};
      employees.forEach((emp) => {
        initial[emp.id] = {
          status_id: emp.status_id || 0,
          status_name: emp.status_name || "ללא סטטוס",
          color: emp.status_color || "#e2e8f0",
          isChanged: false,
          touched: false,
          start_date: emp.start_date
            ? emp.start_date.split("T")[0]
            : new Date().toISOString().split("T")[0],
          end_date: emp.end_date ? emp.end_date.split("T")[0] : null,
        };
      });
      setBulkUpdates(initial);

      // Handle Initial Selection
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
        setShowSelectedOnly(true);
      } else {
        setSelectedIds([]);
        setShowSelectedOnly(false);
      }

      setFilterServiceType("all");
      setFilterSectionId("all");
      setFilterTeamId("all");
      setBatchStatusId("");
    }
  }, [open, getStatusTypes, getServiceTypes, employees, initialSelectedIds]);

  const uniqueSections = useMemo(() => {
    const sectionsMap = new Map();
    employees.forEach((e) => {
      if (e.section_id && e.section_name) {
        sectionsMap.set(e.section_id, e.section_name);
      }
    });
    return Array.from(sectionsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const uniqueTeams = useMemo(() => {
    const teamsMap = new Map();
    employees.forEach((e) => {
      if (e.team_id && e.team_name) {
        teamsMap.set(e.team_id, e.team_name);
      }
    });
    return Array.from(teamsMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      if (showSelectedOnly && !selectedIds.includes(emp.id)) return false;

      const matchesSearch =
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(emp.personal_number).includes(searchTerm);

      const matchesService =
        filterServiceType === "all" ||
        emp.service_type_id?.toString() === filterServiceType;

      const matchesSection =
        filterSectionId === "all" ||
        emp.section_id?.toString() === filterSectionId;

      const matchesTeam =
        filterTeamId === "all" || emp.team_id?.toString() === filterTeamId;

      return matchesSearch && matchesService && matchesSection && matchesTeam;
    });
  }, [
    employees,
    searchTerm,
    filterServiceType,
    filterSectionId,
    filterTeamId,
    showSelectedOnly,
    selectedIds,
  ]);

  const handleSubmit = async () => {
    setLoading(true);

    const updates: any[] = [];
    const hasSelectionOrMod =
      selectedIds.length > 0 ||
      Object.values(bulkUpdates).some((u) => u.touched || u.isChanged);

    employees.forEach((emp) => {
      const data = bulkUpdates[emp.id];
      if (!data) return;

      const isSelected = selectedIds.includes(emp.id);
      const isVisible = filteredList.some((e) => e.id === emp.id);
      const isModified = data.touched || data.isChanged;
      // Skip updates for unselected/unmodified if they have no valid status (id 0)
      if (data.status_id === 0 && !isModified) return;

      const shouldUpdate =
        isSelected || isModified || (!hasSelectionOrMod && isVisible);

      if (shouldUpdate && data.status_id !== 0) {
        updates.push({
          employee_id: emp.id,
          status_type_id: data.status_id,
          start_date: data.start_date,
          end_date: data.end_date,
        });
      }
    });

    if (updates.length === 0) {
      toast.error("אין עדכונים לביצוע");
      setLoading(false);
      return;
    }

    const success = await logBulkStatus(updates);

    if (success) {
      toast.success("כלל הסטטוסים עודכנו בהצלחה");
      if (onSuccess) onSuccess();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const handleUpdateIndividual = (empId: number, statusId: string) => {
    const type = statusTypes.find((t) => t.id.toString() === statusId);
    const original = employees.find((e) => e.id === empId);

    if (type) {
      setBulkUpdates((prev) => ({
        ...prev,
        [empId]: {
          ...prev[empId],
          status_id: type.id,
          status_name: type.name,
          color: type.color,
          isChanged: type.id !== original?.status_id,
          touched: true,
        },
      }));
    }
  };

  const handleDateChange = (
    empId: number,
    field: "start_date" | "end_date",
    value: string,
  ) => {
    setBulkUpdates((prev) => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value, touched: true },
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = filteredList.map((e) => e.id);
      const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(newSelection);
    } else {
      const visibleIds = filteredList.map((e) => e.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleBatchStatusChange = (val: string) => {
    setBatchStatusId(val);
    if (!val || selectedIds.length === 0) return;

    const type = statusTypes.find((t) => t.id.toString() === val);
    if (!type) return;

    setBulkUpdates((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const original = employees.find((e) => e.id === id);
        next[id] = {
          ...next[id],
          status_id: type.id,
          status_name: type.name,
          color: type.color,
          isChanged: type.id !== original?.status_id,
          touched: true,
          start_date:
            next[id]?.start_date || new Date().toISOString().split("T")[0],
        };
      });
      return next;
    });
  };

  const handleBatchDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    if (selectedIds.length === 0) return;

    setBulkUpdates((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = {
          ...next[id],
          [field]: value,
          touched: true,
        };
      });
      return next;
    });
  };

  const handleRevert = (empId: number) => {
    const original = employees.find((e) => e.id === empId);
    if (!original) return;

    // Strict parsing of original status
    const originalStatusId = original.status_id
      ? Number(original.status_id)
      : 0;

    setBulkUpdates((prev) => ({
      ...prev,
      [empId]: {
        status_id: originalStatusId,
        status_name: originalStatusId === 0 ? "" : original.status_name || "",
        color: originalStatusId === 0 ? "" : original.status_color || "",
        start_date: original.start_date
          ? original.start_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
        end_date: original.end_date ? original.end_date.split("T")[0] : null,
        isChanged: false,
        touched: false,
      },
    }));

    if (selectedIds.includes(empId)) {
      handleSelectOne(empId, false);
    }
  };

  const handleCloseAttempt = () => {
    const hasChanges = Object.values(bulkUpdates).some(
      (u) => u.touched || u.isChanged,
    );
    if (hasChanges) {
      setShowWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => (!v ? handleCloseAttempt() : onOpenChange(v))}
      >
        <DialogContent
          className="w-[100vw] h-[100dvh] sm:h-[85vh] sm:w-[95vw] sm:max-w-7xl p-0 border-none bg-background shadow-2xl flex flex-col sm:rounded-3xl overflow-hidden"
          dir="rtl"
        >
          {/* Sticky Header */}
          <div className="flex-none p-4 sm:p-6 border-b border-border/40 bg-background/80 backdrop-blur-xl z-20">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-2xl font-black text-foreground tracking-tight">
                    ניהול ועדכון נוכחות
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm font-bold text-muted-foreground mt-0.5">
                    {filteredList.length} מתוך {employees.length} שוטרים מופיעים
                    {selectedIds.length > 0 && ` • ${selectedIds.length} נבחרו`}
                  </DialogDescription>
                </div>
              </div>

              <button
                onClick={handleCloseAttempt}
                className="sm:hidden p-2 rounded-xl hover:bg-muted active:bg-muted/80 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או מ''א..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-10 bg-muted/20 border border-border/40 rounded-xl pr-10 pl-4 text-sm font-bold focus:bg-background focus:ring-4 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all shadow-inner"
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-10 px-3 rounded-xl border-dashed flex items-center gap-2 font-bold text-xs transition-all",
                        (filterServiceType !== "all" ||
                          filterSectionId !== "all" ||
                          filterTeamId !== "all") &&
                          "bg-primary/5 border-primary/30 text-primary",
                      )}
                    >
                      <Filter className="w-4 h-4" />
                      סינון
                      {(filterServiceType !== "all" ||
                        filterSectionId !== "all" ||
                        filterTeamId !== "all") && (
                        <div className="w-4 h-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                          {
                            [
                              filterServiceType !== "all",
                              filterSectionId !== "all",
                              filterTeamId !== "all",
                            ].filter(Boolean).length
                          }
                        </div>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-72 p-4 rounded-2xl shadow-2xl border-border/40"
                    align="end"
                    dir="rtl"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                          פילטרים
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] font-bold"
                          onClick={() => {
                            setFilterServiceType("all");
                            setFilterSectionId("all");
                            setFilterTeamId("all");
                          }}
                        >
                          נקה הכל
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {/* Service Type Filter */}
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                            מעמד
                          </Label>
                          <Select
                            value={filterServiceType}
                            onValueChange={setFilterServiceType}
                          >
                            <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs group-focus:ring-2">
                              <SelectValue placeholder="כל המעמדות" />
                            </SelectTrigger>
                            <SelectContent
                              dir="rtl"
                              className="max-h-[250px] rounded-xl"
                            >
                              <SelectItem
                                value="all"
                                className="text-xs font-bold"
                              >
                                כל המעמדות
                              </SelectItem>
                              {serviceTypes.map((t) => (
                                <SelectItem
                                  key={t.id}
                                  value={t.id.toString()}
                                  className="text-xs font-bold"
                                >
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Section Filter - Visible for Admin and Dept Commanders */}
                        {(user?.is_admin ||
                          (user?.is_commander && !user?.section_id)) &&
                          uniqueSections.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                                מדור
                              </Label>
                              <Select
                                value={filterSectionId}
                                onValueChange={setFilterSectionId}
                              >
                                <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs">
                                  <SelectValue placeholder="כל המדורים" />
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px] rounded-xl"
                                >
                                  <SelectItem
                                    value="all"
                                    className="text-xs font-bold"
                                  >
                                    כל המדורים
                                  </SelectItem>
                                  {uniqueSections.map((s) => (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      {s.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                        {/* Team Filter - Visible if not locked to one team */}
                        {(user?.is_admin ||
                          (user?.is_commander && !user?.team_id)) &&
                          uniqueTeams.length > 0 && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-black mr-1 text-muted-foreground/60 uppercase">
                                חוליה
                              </Label>
                              <Select
                                value={filterTeamId}
                                onValueChange={setFilterTeamId}
                              >
                                <SelectTrigger className="h-9 bg-muted/30 border-border/40 rounded-xl font-bold text-xs">
                                  <SelectValue placeholder="כל החוליות" />
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px] rounded-xl"
                                >
                                  <SelectItem
                                    value="all"
                                    className="text-xs font-bold"
                                  >
                                    כל החוליות
                                  </SelectItem>
                                  {uniqueTeams.map((t) => (
                                    <SelectItem
                                      key={t.id}
                                      value={t.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <button
                  onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                  className={cn(
                    "px-3 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
                    showSelectedOnly
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-muted/30 text-muted-foreground border border-border/40 hover:bg-muted/50",
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {showSelectedOnly ? "נבחרים" : "הכל"}
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/5">
            {fetching ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary/30" />
                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  טוען...
                </span>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4 py-20">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 opacity-20" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">
                  לא נמצאו תוצאות
                </span>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden lg:block w-full overflow-hidden rounded-2xl border border-border/40 shadow-sm bg-background/50">
                  <Table className="table-fixed w-full">
                    <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[50px] text-center px-4">
                          <Checkbox
                            className="w-5 h-5 rounded-[6px] border-muted-foreground/40"
                            checked={
                              filteredList.length > 0 &&
                              selectedIds.length === filteredList.length
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked as boolean)
                            }
                          />
                        </TableHead>
                        <TableHead className="w-[25%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          שוטר
                        </TableHead>
                        <TableHead className="w-[30%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          סטטוס
                        </TableHead>
                        <TableHead className="w-[45%] text-right font-black text-[11px] text-muted-foreground uppercase tracking-wider px-4">
                          תאריכים
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredList.map((emp) => {
                        const current = bulkUpdates[emp.id];
                        const isSelected = selectedIds.includes(emp.id);

                        // Safe guard for desktop as well
                        if (!current) return null;

                        const hasStatus = current.status_id !== 0;

                        return (
                          <TableRow
                            key={emp.id}
                            className={cn(
                              "group transition-all duration-300 border-b border-border/[0.06] last:border-0 relative",
                              isSelected
                                ? "bg-primary/[0.02] hover:bg-primary/[0.04] shadow-[inset_4px_0_0_0_rgb(var(--primary))]"
                                : "hover:bg-muted/40",
                              !hasStatus && !isSelected && "bg-amber-[50]/10",
                            )}
                          >
                            <TableCell className="text-center px-4 py-3 align-middle relative overflow-hidden">
                              {isSelected && (
                                <div className="absolute top-0 right-0 w-1 h-full bg-primary animate-in fade-in slide-in-from-right-1 duration-500" />
                              )}
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(emp.id, checked as boolean)
                                }
                                className={cn(
                                  "w-5 h-5 rounded-lg border-muted-foreground/30 transition-all duration-300 scale-110",
                                  isSelected &&
                                    "data-[state=checked]:bg-primary data-[state=checked]:border-primary shadow-lg shadow-primary/20",
                                )}
                              />
                            </TableCell>
                            <TableCell className="py-3 px-4 align-middle">
                              <div className="flex items-center gap-3">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[11px] shrink-0 shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-3",
                                    current?.isChanged
                                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110"
                                      : "bg-white border border-border/80 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary group-hover:bg-primary/5",
                                  )}
                                >
                                  {emp.first_name[0]}
                                  {emp.last_name[0]}
                                </div>
                                <div className="flex flex-col justify-center">
                                  <span
                                    className={cn(
                                      "font-bold text-sm leading-tight transition-colors",
                                      isSelected
                                        ? "text-primary"
                                        : "text-foreground",
                                    )}
                                  >
                                    {emp.first_name} {emp.last_name}
                                  </span>
                                  <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                    <span className="bg-muted/50 px-1.5 py-0.5 rounded-md tracking-wider font-mono">
                                      {emp.personal_number}
                                    </span>
                                    {emp.service_type_name && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span>{emp.service_type_name}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 align-middle">
                              <Select
                                value={
                                  current.status_id !== 0
                                    ? current.status_id.toString()
                                    : undefined
                                }
                                onValueChange={(val) =>
                                  handleUpdateIndividual(emp.id, val)
                                }
                              >
                                <SelectTrigger
                                  dir="rtl"
                                  className={cn(
                                    "h-10 w-full bg-background border border-border/60 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-xs font-bold transition-all shadow-sm",
                                    current.status_id !== 0 &&
                                      "border-primary/30 bg-primary/5",
                                  )}
                                >
                                  <div className="flex items-center justify-start gap-2.5 w-full truncate">
                                    <SelectValue placeholder="בחר סטטוס" />
                                  </div>
                                </SelectTrigger>
                                <SelectContent
                                  dir="rtl"
                                  className="max-h-[250px]"
                                >
                                  {statusTypes.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id.toString()}
                                      className="text-xs font-bold"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-2 h-2 rounded-full"
                                          style={{
                                            backgroundColor: type.color,
                                          }}
                                        />
                                        {type.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="py-3 px-4 align-middle min-w-[320px]">
                              {hasStatus &&
                              (current.isChanged || current.touched) ? (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
                                  <button
                                    type="button"
                                    onClick={() => handleRevert(emp.id)}
                                    className="h-10 px-3 flex items-center gap-2 rounded-xl bg-destructive/[0.06] text-destructive border border-destructive/10 hover:bg-destructive/10 hover:border-destructive/20 transition-all active:scale-95 group/rev"
                                    title="בטל שינויים לשורה זו"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="group-hover/rev:-rotate-90 transition-transform duration-500"
                                    >
                                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                                      <path d="M3 3v9h9" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden xl:inline">
                                      ביטול
                                    </span>
                                  </button>

                                  <div className="flex-1 grid grid-cols-2 gap-2">
                                    <div className="relative group/input">
                                      <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-black text-muted-foreground/60 bg-background z-10 scale-90 group-focus-within/input:text-primary transition-colors">
                                        התחלה
                                      </span>
                                      <input
                                        type="date"
                                        value={current.start_date || ""}
                                        onChange={(e) =>
                                          handleDateChange(
                                            emp.id,
                                            "start_date",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full h-10 rounded-xl border border-border/60 bg-background/50 hover:bg-background hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-[11px] font-black px-3 outline-none transition-all shadow-sm"
                                      />
                                    </div>
                                    <div className="relative group/input">
                                      <span className="absolute -top-2 right-3 px-1.5 text-[9px] font-black text-muted-foreground/60 bg-background z-10 scale-90 group-focus-within/input:text-primary transition-colors">
                                        סיום
                                      </span>
                                      <input
                                        type="date"
                                        value={current.end_date || ""}
                                        onChange={(e) =>
                                          handleDateChange(
                                            emp.id,
                                            "end_date",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full h-10 rounded-xl border border-border/60 bg-background/50 hover:bg-background hover:border-primary/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 text-[11px] font-black px-3 outline-none transition-all shadow-sm placeholder:text-muted-foreground/30"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : hasStatus ? (
                                <div className="flex items-center justify-start h-10 animate-in fade-in zoom-in duration-500">
                                  <div className="group/badge px-4 py-2 rounded-2xl bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-default shadow-sm hover:shadow-emerald-100/50">
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative">
                                        <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur-sm group-hover/badge:opacity-100 opacity-0 transition-opacity" />
                                        <div className="relative w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="12"
                                            height="12"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-emerald-600"
                                          >
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                        </div>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none">
                                          דווח בהצלחה
                                        </span>
                                        <span className="text-[9px] font-bold text-emerald-600/60 mt-0.5 leading-none">
                                          הנתונים מסונכרנים
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-amber-500/50 px-2 group/empty">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/empty:animate-ping" />
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/empty:opacity-100 transition-opacity">
                                    טרם דווח
                                  </span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card List View - Compact & Clean - FIXED LAYOUT */}
                {/* Mobile Card List View - High-End Redesign */}
                <div className="lg:hidden flex flex-col p-4 gap-4 pb-32">
                  <div className="flex items-center justify-between px-1">
                    <div
                      className="flex items-center gap-3 py-2 px-4 rounded-2xl bg-primary/[0.04] border border-primary/20 active:scale-95 transition-all cursor-pointer shadow-sm"
                      onClick={() =>
                        handleSelectAll(
                          selectedIds.length !== filteredList.length,
                        )
                      }
                    >
                      <Checkbox
                        checked={
                          filteredList.length > 0 &&
                          selectedIds.length === filteredList.length
                        }
                        onCheckedChange={(c) => handleSelectAll(!!c)}
                        className="w-5 h-5 rounded-lg"
                      />
                      <span className="text-xs font-black text-primary uppercase tracking-widest">
                        בחר הכל ({filteredList.length})
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] pr-2">
                      רשימת שוטרים
                    </span>
                  </div>

                  {filteredList.map((emp) => {
                    const current = bulkUpdates[emp.id];
                    const isSelected = selectedIds.includes(emp.id);
                    if (!current) return null;

                    const statusColor = current.color || "#e2e8f0";
                    const hasStatus = current.status_id !== 0;

                    return (
                      <div
                        key={emp.id}
                        className={cn(
                          "group rounded-[2rem] border transition-all duration-500 relative bg-background overflow-hidden",
                          isSelected
                            ? "border-primary/40 shadow-xl shadow-primary/10 ring-1 ring-primary/20 -translate-y-1"
                            : "border-border/40 shadow-sm",
                        )}
                      >
                        {/* Compact Header */}
                        <div className="p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={cn(
                                "w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs transition-transform duration-500",
                                isSelected
                                  ? "bg-primary text-primary-foreground rotate-3"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {emp.first_name[0]}
                              {emp.last_name[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h4
                                className={cn(
                                  "font-black text-[15px] leading-tight truncate px-0.5",
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground",
                                )}
                              >
                                {emp.first_name} {emp.last_name}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-muted-foreground/60 tracking-tighter">
                                  {emp.personal_number}
                                </span>
                                {hasStatus && (
                                  <div
                                    className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest animate-in fade-in zoom-in"
                                    style={{
                                      backgroundColor: `${statusColor}15`,
                                      color: statusColor,
                                      border: `1px solid ${statusColor}30`,
                                    }}
                                  >
                                    {current.status_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(c) =>
                              handleSelectOne(emp.id, !!c)
                            }
                            className="w-6 h-6 rounded-xl border-muted-foreground/20 data-[state=checked]:bg-primary transition-all duration-300 scale-110 shadow-sm"
                          />
                        </div>

                        {/* Editor Content */}
                        <div
                          className={cn(
                            "px-4 pb-4 space-y-3 transition-all duration-300",
                            isSelected
                              ? "bg-primary/5 border-t border-primary/10 pt-4"
                              : "bg-muted/[0.03] pt-0 border-none",
                          )}
                        >
                          <div className="relative">
                            <Select
                              value={
                                current.status_id !== 0
                                  ? current.status_id.toString()
                                  : undefined
                              }
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger
                                dir="rtl"
                                className="h-12 w-full bg-background border-border/60 rounded-2xl text-xs font-black shadow-sm"
                              >
                                <SelectValue placeholder="עדכן סטטוס..." />
                              </SelectTrigger>
                              <SelectContent
                                dir="rtl"
                                className="rounded-2xl shadow-2xl"
                              >
                                {statusTypes.map((t) => (
                                  <SelectItem
                                    key={t.id}
                                    value={t.id.toString()}
                                    className="text-xs font-bold py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: t.color }}
                                      />
                                      {t.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-muted-foreground/60 uppercase mr-1">
                                התחלה
                              </label>
                              <input
                                type="date"
                                value={current.start_date || ""}
                                onChange={(e) =>
                                  handleDateChange(
                                    emp.id,
                                    "start_date",
                                    e.target.value,
                                  )
                                }
                                className="w-full h-10 bg-background border border-border/40 rounded-xl px-3 text-[11px] font-black shadow-sm outline-none focus:border-primary/50"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-muted-foreground/60 uppercase mr-1">
                                סיום
                              </label>
                              <input
                                type="date"
                                value={current.end_date || ""}
                                onChange={(e) =>
                                  handleDateChange(
                                    emp.id,
                                    "end_date",
                                    e.target.value,
                                  )
                                }
                                className="w-full h-10 bg-background border border-border/40 rounded-xl px-3 text-[11px] font-black shadow-sm outline-none focus:border-primary/50 placeholder:text-muted-foreground/30"
                              />
                            </div>
                          </div>

                          {current.isChanged && (
                            <button
                              onClick={() => handleRevert(emp.id)}
                              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-destructive/[0.05] text-destructive text-[10px] font-black uppercase tracking-widest border border-destructive/10 active:scale-95 transition-all mt-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                                <path d="M3 3v9h9" />
                              </svg>
                              אפס שינויים
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Floating Action Bar (Sticky Footer) */}
          <div className="flex-none p-4 sm:p-6 border-t border-border/40 bg-background/91 backdrop-blur-xl z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] focus-within:shadow-[0_-10px_50px_rgba(0,105,255,0.08)] transition-all duration-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              {/* Batch Selection Controls */}
              {selectedIds.length > 0 ? (
                <div className="flex items-center gap-4 bg-primary/[0.04] px-4 py-2.5 rounded-2xl border border-primary/20 animate-in slide-in-from-bottom-4 duration-500 shadow-sm">
                  <div className="relative group/num">
                    <div className="absolute -inset-1.5 bg-primary/20 rounded-full blur-md opacity-0 group-hover/num:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground text-xs font-black rounded-full shadow-lg shadow-primary/20 ring-4 ring-primary/10 transition-transform group-hover/num:rotate-12">
                      {selectedIds.length}
                    </div>
                  </div>

                  <div className="w-px h-6 bg-primary/10 mx-0.5 hidden sm:block" />

                  <div className="flex-1 sm:flex-none flex items-center gap-3">
                    <Select
                      value={batchStatusId}
                      onValueChange={handleBatchStatusChange}
                    >
                      <SelectTrigger
                        dir="rtl"
                        className="h-10 min-w-[170px] bg-background border-primary/20 text-xs font-black rounded-xl hover:border-primary/40 focus:ring-4 focus:ring-primary/5 shadow-sm transition-all pr-4"
                      >
                        <SelectValue placeholder="עדכון סטטוס מרוכז..." />
                      </SelectTrigger>
                      <SelectContent
                        dir="rtl"
                        className="max-h-[300px] rounded-2xl shadow-2xl border-primary/10"
                      >
                        {statusTypes.map((t) => (
                          <SelectItem
                            key={t.id}
                            value={t.id.toString()}
                            className="text-xs font-bold py-2.5"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-2.5 h-2.5 rounded-full shadow-sm"
                                style={{ backgroundColor: t.color }}
                              />
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="hidden lg:flex items-center gap-2 animate-in fade-in duration-500">
                      <div className="w-px h-6 bg-border/60 mx-1" />
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                        תאריכים:
                      </span>
                      <input
                        type="date"
                        className="h-10 w-[140px] bg-background border border-border/40 rounded-xl px-3 text-xs font-black shadow-sm outline-none focus:border-primary/40 transition-all"
                        onChange={(e) =>
                          handleBatchDateChange("start_date", e.target.value)
                        }
                      />
                      <span className="text-muted-foreground/30 font-light">
                        -
                      </span>
                      <input
                        type="date"
                        className="h-10 w-[140px] bg-background border border-border/40 rounded-xl px-3 text-xs font-black shadow-sm outline-none focus:border-primary/40 transition-all"
                        placeholder="סיום"
                        onChange={(e) =>
                          handleBatchDateChange("end_date", e.target.value)
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectedIds.forEach((id) => handleRevert(id))
                      }
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-destructive/[0.06] text-destructive border border-destructive/10 hover:bg-destructive/10 hover:border-destructive/20 transition-all hover:rotate-12 active:scale-90"
                      title="אפס בחירה"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" />
                        <path d="M3 3v9h9" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-3 py-2 px-4 rounded-full bg-muted/30 border border-border/40 animate-in fade-in duration-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 animate-pulse" />
                  <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                    לא נבחרו שוטרים לעדכון
                  </span>
                </div>
              )}

              <div className="flex gap-3 mt-2 sm:mt-0">
                {selectedIds.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleSelectAll(true)}
                    className="flex-1 sm:flex-none border-dashed border-primary/30 text-primary hover:bg-primary/5 h-11 sm:h-10 rounded-xl text-xs font-black group transition-all"
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5 group-hover:scale-125 transition-transform" />
                    בחר הכל
                  </Button>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    (!Object.values(bulkUpdates).some(
                      (u) => u.touched || u.isChanged,
                    ) &&
                      batchStatusId === "")
                  }
                  className="flex-1 sm:flex-none h-11 sm:h-10 px-8 rounded-xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all order-last sm:order-none bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      מעדכן...
                    </div>
                  ) : (
                    "שמור שינויים"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCloseAttempt}
                  className="flex-1 sm:flex-none sm:hidden h-11 rounded-xl font-black text-xs border-border/60 hover:bg-muted/50 transition-all"
                >
                  ביטול
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-destructive/20 shadow-2xl z-[100] gap-0">
          <div className="bg-destructive/5 p-6 flex flex-col items-center justify-center text-center gap-2 border-b border-destructive/10">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2 animate-in zoom-in duration-300">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-black text-destructive">
              יש שינויים שלא נשמרו!
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              אם תצא עכשיו, כל השינויים שביצעת יאבדו.
              <br />
              האם אתה בטוח שברצונך לצאת ללא שמירה?
            </DialogDescription>
          </div>
          <div className="p-4 bg-background flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowWarning(false)}
              className="font-bold flex-1 sm:flex-none"
            >
              המשך עריכה
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowWarning(false);
                onOpenChange(false);
              }}
              className="font-bold gap-2 flex-1 sm:flex-none"
            >
              צא ללא שמירה
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
