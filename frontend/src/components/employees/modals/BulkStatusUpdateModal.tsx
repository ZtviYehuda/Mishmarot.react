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
  CheckCircle2,
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
  start_date?: string;
  end_date?: string;
}

export const BulkStatusUpdateModal: React.FC<BulkStatusUpdateModalProps> = ({
  open,
  onOpenChange,
  employees,
  onSuccess,
  initialSelectedIds = [],
  alertContext,
  onNudge,
}) => {
  const { getStatusTypes, logBulkStatus, getServiceTypes } = useEmployees();
  const [statusTypes, setStatusTypes] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterServiceType, setFilterServiceType] = useState<string>("all");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchStatusId, setBatchStatusId] = useState<string>("");

  // Local state for temporary changes before submission
  const [bulkUpdates, setBulkUpdates] = useState<Record<number, UpdateState>>(
    {},
  );

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
        if (emp.status_id) {
          initial[emp.id] = {
            status_id: emp.status_id,
            status_name: emp.status_name || "ללא סטטוס",
            color: emp.status_color || "#94a3b8",
            isChanged: false,
            touched: false,
            start_date: new Date().toISOString().split("T")[0],
          };
        }
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
      setBatchStatusId("");
    }
  }, [open, getStatusTypes, getServiceTypes, employees, initialSelectedIds]);

  const filteredList = useMemo(() => {
    return employees.filter((emp) => {
      if (showSelectedOnly && !selectedIds.includes(emp.id)) return false;

      const matchesSearch =
        `${emp.first_name} ${emp.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        emp.personal_number.includes(searchTerm);

      const matchesService =
        filterServiceType === "all" ||
        emp.service_type_id?.toString() === filterServiceType;

      return matchesSearch && matchesService;
    });
  }, [employees, searchTerm, filterServiceType, showSelectedOnly, selectedIds]);

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

      const shouldUpdate =
        isSelected || isModified || (!hasSelectionOrMod && isVisible);

      if (shouldUpdate) {
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

  const handleCloseAttempt = () => {
    const hasChanges = Object.values(bulkUpdates).some(
      (u) => u.touched || u.isChanged,
    );
    if (hasChanges) {
      if (window.confirm("אתה בטוח שברצונך לצאת מבלי לעדכן את השינויים ?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const handleNudge = () => {
    if (alertContext?.commander_phone) {
      const names = alertContext.missing_names || [];
      const commanderName = alertContext.commander_name || "המפקד";
      const unitName =
        alertContext.team_name || alertContext.section_name || "היחידה";

      let message = `שלום ${commanderName}, תזכורת למילוי דוח בוקר עבור ${unitName}.\n\n`;
      message += `טרם הושלם דיווח עבור ${names.length} שוטרים:\n`;
      names.forEach((name: string, index: number) => {
        message += `${index + 1}. ${name}\n`;
      });
      message += `\nנא לעדכן בהקדם במערכת המשמרות. תודה!`;

      const encodedMessage = encodeURIComponent(message);
      const phone = alertContext.commander_phone.replace(/\D/g, "");
      const finalPhone = phone.startsWith("0")
        ? "972" + phone.substring(1)
        : phone;

      window.open(
        `https://wa.me/${finalPhone}?text=${encodedMessage}`,
        "_blank",
      );
      toast.info(`פותח וואטסאפ לשליחת תזכורת ל${commanderName}`);
    } else if (onNudge && alertContext?.commander_id) {
      onNudge(alertContext.commander_id);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleCloseAttempt() : onOpenChange(v))}
    >
      <DialogContent
        className="max-w-[100vw] sm:max-w-7xl p-0 border-none bg-card shadow-2xl flex flex-col rounded-3xl overflow-hidden"
        dir="rtl"
      >
        <DialogHeader className="px-6 py-6 border-b border-border/50 bg-muted/20 text-right shrink-0 relative">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="text-right">
              <DialogTitle className="text-2xl font-black text-foreground mb-1 tracking-tight">
                עדכון נוכחות יחידתי
              </DialogTitle>
              <DialogDescription className="text-sm font-bold text-muted-foreground italic">
                {employees.length} שוטרים מופיעים ברשימה
              </DialogDescription>
            </div>
            <button
              onClick={handleCloseAttempt}
              className="lg:hidden p-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 transition-colors group-focus-within:text-primary" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או מספר אישי..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-11 pr-11 pl-4 bg-background border-border/50 border rounded-2xl text-sm font-black text-foreground focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>

            <div className="w-full sm:w-[200px]">
              <Select
                value={filterServiceType}
                onValueChange={setFilterServiceType}
              >
                <SelectTrigger className="h-11 bg-background border-border/50 font-black text-xs rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="סינון לפי מעמד" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all" className="font-black text-xs">כל המעמדות</SelectItem>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id.toString()} className="font-black text-xs">
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {fetching ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                טוען רשימת שוטרים...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 opacity-20" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest">לא נמצאו שוטרים התואמים לחיפוש</span>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="w-[80px] text-center px-4">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            className="w-6 h-6 border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg transition-all shadow-sm"
                            checked={
                              filteredList.length > 0 &&
                              selectedIds.length === filteredList.length
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAll(checked as boolean)
                            }
                          />
                        </div>
                      </TableHead>
                      <TableHead className="text-right min-w-[200px] font-black text-[10px] uppercase text-muted-foreground tracking-widest">
                        שוטר / מ"א
                      </TableHead>
                      <TableHead className="text-right min-w-[200px] w-[25%] font-black text-[10px] uppercase text-muted-foreground tracking-widest">
                        סטטוס דיווח
                      </TableHead>
                      <TableHead className="text-right min-w-[300px] font-black text-[10px] uppercase text-muted-foreground tracking-widest">
                        טווח תאריכים
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.map((emp) => {
                      const current = bulkUpdates[emp.id];
                      const isSelected = selectedIds.includes(emp.id);
                      return (
                        <TableRow
                          key={emp.id}
                          data-state={isSelected ? "selected" : "unchecked"}
                          className={cn(
                            "transition-all hover:bg-muted/40 border-b border-border/30 last:border-0",
                            isSelected && "bg-primary/5 hover:bg-primary/10",
                            current?.isChanged &&
                            "bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-900/10",
                          )}
                        >
                          <TableCell className="text-center px-4 py-4 align-middle">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                className={cn(
                                  "w-6 h-6 border-2 border-muted-foreground/30 rounded-lg transition-all shadow-sm",
                                  isSelected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "bg-background hover:border-primary/50",
                                )}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(emp.id, checked as boolean)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium align-middle py-4 px-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-11 h-11 rounded-2xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 shrink-0 font-black",
                                  current?.isChanged
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-muted-foreground border border-border/50",
                                )}
                              >
                                {emp.first_name[0]}{emp.last_name[0]}
                              </div>
                              <div className="flex flex-col text-right gap-0.5">
                                <span
                                  className={cn(
                                    "text-sm font-black transition-colors",
                                    isSelected
                                      ? "text-primary"
                                      : "text-foreground",
                                  )}
                                >
                                  {emp.first_name} {emp.last_name}
                                </span>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-black opacity-60">
                                  <span className="tracking-widest">
                                    {emp.personal_number}
                                  </span>
                                  {emp.service_type_name && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                      <span>{emp.service_type_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle py-4 px-4">
                            <Select
                              value={current?.status_id.toString()}
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger
                                className="h-10 text-right font-black text-xs bg-muted/30 border-border/50 hover:bg-muted/50 transition-colors rounded-xl w-full"
                                dir="rtl"
                              >
                                <SelectValue placeholder="בחר סטטוס" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {statusTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                    className="text-right font-black text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                          backgroundColor:
                                            type.color ||
                                            "var(--muted-foreground)",
                                        }}
                                      />
                                      {type.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="align-middle py-4 px-4">
                            {current?.isChanged || current?.touched || isSelected ? (
                              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                <div className="relative flex-1 max-w-[160px]">
                                  <input
                                    type="date"
                                    value={current.start_date}
                                    onChange={(e) =>
                                      handleDateChange(
                                        emp.id,
                                        "start_date",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50 rounded-xl h-10 text-xs font-black px-4 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                                  />
                                </div>
                                <ArrowLeft className="w-4 h-4 text-muted-foreground/30" />
                                <div className="relative flex-1 max-w-[160px]">
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
                                    className="w-full bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50 rounded-xl h-10 text-xs font-black px-4 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none placeholder:text-muted-foreground/30"
                                    placeholder="סיום (אופציונלי)"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest pr-4">
                                ---
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden p-4 space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all-mobile"
                      className="w-6 h-6 rounded-lg"
                      checked={
                        filteredList.length > 0 &&
                        selectedIds.length === filteredList.length
                      }
                      onCheckedChange={(checked) =>
                        handleSelectAll(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="select-all-mobile"
                      className="text-xs font-black text-muted-foreground"
                    >
                      בחר הכל
                    </label>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                    מוצגים {filteredList.length} שוטרים
                  </span>
                </div>

                {filteredList.map((emp) => {
                  const current = bulkUpdates[emp.id];
                  const isSelected = selectedIds.includes(emp.id);
                  return (
                    <div
                      key={emp.id}
                      className={cn(
                        "rounded-[24px] border transition-all duration-300 overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                          : "border-border/50 bg-card shadow-sm",
                        current?.isChanged &&
                        !isSelected &&
                        "border-blue-200 bg-blue-50/10",
                      )}
                    >
                      <div className="p-5 space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Checkbox
                              className="w-6 h-6 rounded-lg shrink-0"
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectOne(emp.id, checked as boolean)
                              }
                            />
                            <div className="flex flex-col text-right truncate">
                              <span className="text-base font-black text-foreground truncate leading-tight mb-0.5">
                                {emp.first_name} {emp.last_name}
                              </span>
                              <span className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                {emp.personal_number} <span className="mx-1 opacity-30">•</span> {emp.service_type_name}
                              </span>
                            </div>
                          </div>
                          <div
                            className="w-3.5 h-3.5 rounded-full mt-1.5 shadow-sm border-2 border-background"
                            style={{
                              backgroundColor: current?.color || "#94a3b8",
                            }}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                              סטטוס דיווח:
                            </span>
                            <Select
                              value={current?.status_id.toString()}
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger
                                className="h-11 text-right font-black text-xs bg-muted/30 border-border/50 rounded-2xl"
                                dir="rtl"
                              >
                                <SelectValue placeholder="בחר סטטוס" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {statusTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                    className="text-right font-black text-xs"
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
                          </div>

                          {(current?.isChanged || current?.touched || isSelected) && (
                            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-4">
                              <div className="space-y-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest pr-1">
                                  התחלה:
                                </span>
                                <input
                                  type="date"
                                  value={current.start_date}
                                  onChange={(e) =>
                                    handleDateChange(
                                      emp.id,
                                      "start_date",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full bg-background border border-border/50 rounded-xl h-10 text-[11px] font-black px-3 focus:border-primary outline-none"
                                />
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pr-1">
                                  סיום:
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
                                  className="w-full bg-background border border-border/50 rounded-xl h-10 text-[11px] font-black px-3 focus:border-primary outline-none"
                                  placeholder="אופציונלי"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-border/50 bg-muted/20 flex flex-col gap-4 shrink-0">
          {/* Multiple Selection Action Bar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-background border border-border/50 rounded-[28px] shadow-xl animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
                  {selectedIds.length}
                </div>
                <span className="text-xs font-black text-foreground">
                  שוטרים נבחרו
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <Select
                  value={batchStatusId}
                  onValueChange={handleBatchStatusChange}
                >
                  <SelectTrigger className="h-11 flex-1 sm:w-[220px] text-right font-black text-xs bg-muted/30 border-border/50 rounded-2xl">
                    <SelectValue placeholder="עדכון סטטוס גורף..." />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {statusTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id.toString()}
                        className="text-xs font-black"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                (!Object.values(bulkUpdates).some(
                  (u) => u.touched || u.isChanged,
                ) &&
                  batchStatusId === "")
              }
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-2xl h-14 shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-30 text-base"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin gap-3" />
              ) : (
                <Check className="w-6 h-6 gap-3" />
              )}
              שמור ועדכן את כל השינויים
            </Button>

            <Button
              variant="outline"
              onClick={handleCloseAttempt}
              className="px-10 border-border/50 bg-background rounded-2xl h-14 font-black text-muted-foreground hover:bg-muted hover:text-foreground transition-all text-base hidden sm:flex"
            >
              חזרה וביטול
            </Button>
          </div>

          {alertContext?.commander_phone && selectedIds.length === 0 && (
            <div className="pt-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNudge}
                className="rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 font-black text-[11px] gap-2.5 uppercase tracking-widest"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                שלח תזכורת דיווח למפקד בוואטסאפ
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
