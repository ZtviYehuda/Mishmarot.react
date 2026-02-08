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
  AlertTriangle,
  ArrowLeft,
  Filter,
  BellRing,
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
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
  alertContext?: any; // New prop
  onNudge?: (commanderId: number) => void; // New prop
}

interface UpdateState {
  status_id: number;
  status_name: string;
  color: string;
  isChanged: boolean;
  touched: boolean; // Added touched flag
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
  const { user } = useAuthContext();
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
      const phone = alertContext.commander_phone.replace(/\D/g, ""); // Remove non-digits
      const finalPhone = phone.startsWith("0")
        ? "972" + phone.substring(1)
        : phone;

      window.open(
        `https://wa.me/${finalPhone}?text=${encodedMessage}`,
        "_blank",
      );
      toast.info(`פותח וואטסאפ לשליחת תזכורת ל${commanderName}`);
    } else if (onNudge && alertContext?.commander_id) {
      // Fallback to legacy nudge handler if no phone/names
      onNudge(alertContext.commander_id);
    }
  };

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
            touched: false, // Initialize touched
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

  const handleSubmit = async () => {
    setLoading(true);

    const updates: any[] = [];

    // Iterate over all employees to ensure we capture hidden but selected/modified ones
    employees.forEach((emp) => {
      const data = bulkUpdates[emp.id];
      if (!data) return;

      const isSelected = selectedIds.includes(emp.id);
      const isVisible = filteredList.some((e) => e.id === emp.id);
      const isModified = data.touched || data.isChanged;

      // Logic:
      // 1. Always update if Selected
      // 2. Always update if manually Modified (even if not selected/hidden)
      // 3. If NO selection and NO modification (global confirm mode), update all Visible

      const hasSelectionOrMod =
        selectedIds.length > 0 ||
        Object.values(bulkUpdates).some((u) => u.touched || u.isChanged);

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
          touched: true, // Mark as touched
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
      [empId]: { ...prev[empId], [field]: value, touched: true }, // Mark as touched on date change too
    }));
  };

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

  // Selection Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Selecting all currently VISIBLE employees
      const visibleIds = filteredList.map((e) => e.id);
      // Merge with existing selection to not lose hidden ones if needed?
      // Usually "Select All" determines the scope. Let's select visible ones.
      const newSelection = Array.from(new Set([...selectedIds, ...visibleIds]));
      setSelectedIds(newSelection);
    } else {
      // Deselect visible ones
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleCloseAttempt() : onOpenChange(v))}
    >
      <DialogContent
        className="max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden rounded-3xl border-none bg-card shadow-2xl flex flex-col h-[85vh] sm:h-[90vh]"
        dir="rtl"
      >
        <DialogHeader className="px-6 py-4 border-b bg-muted/10 text-right shrink-0">
          <div className="flex items-center justify-between gap-4 mb-4 text-right">
            <div>
              <DialogTitle className="text-xl font-black text-foreground mb-1 text-right">
                עדכון נוכחות יומי
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-muted-foreground text-right">
                עדכון מרוכז ומהיר לכלל היחידה
              </DialogDescription>
            </div>
          </div>



          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או מספר אישי..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pr-10 pl-4 bg-muted/50 border-input border rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-ring/20 outline-none transition-all"
              />
            </div>

            <div className="w-[160px]">
              <Select
                value={filterServiceType}
                onValueChange={setFilterServiceType}
              >
                <SelectTrigger className="h-10 bg-muted/50 border-input font-bold text-xs rounded-xl">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <SelectValue placeholder="סינון לפי מעמד" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המעמדות</SelectItem>
                  {serviceTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {fetching ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs font-bold text-muted-foreground">
                טוען נתונים...
              </span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <AlertCircle className="w-8 h-8 opacity-20" />
              <span className="text-sm font-bold">לא נמצאו שוטרים</span>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow className="hover:bg-transparent border-b">
                      <TableHead className="w-[60px] text-center px-2">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            className="w-5 h-5 border-2 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-lg transition-all shadow-sm"
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
                      <TableHead className="text-right min-w-[200px] font-black text-xs uppercase text-muted-foreground">
                        שוטר
                      </TableHead>
                      <TableHead className="text-right min-w-[200px] w-[25%] font-black text-xs uppercase text-muted-foreground">
                        סטטוס נוכחי
                      </TableHead>
                      <TableHead className="text-right min-w-[300px] font-black text-xs uppercase text-muted-foreground">
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
                            "transition-all hover:bg-muted/40 border-b last:border-0",
                            isSelected && "bg-primary/5 hover:bg-primary/10",
                            current?.isChanged &&
                            "bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-900/10",
                          )}
                        >
                          <TableCell className="text-center px-2 py-4 align-middle">
                            <div className="flex items-center justify-center">
                              <Checkbox
                                className={cn(
                                  "w-5 h-5 border-2 border-muted-foreground/30 rounded-lg transition-all shadow-sm",
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
                          <TableCell className="font-medium align-middle py-4">
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 shrink-0",
                                  current?.isChanged
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-white dark:bg-muted/50 text-muted-foreground border border-border/50",
                                )}
                              >
                                <User className="w-5 h-5" />
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
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                                  <span className="tracking-wider bg-muted/50 px-1.5 py-0.5 rounded-md">
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
                          <TableCell className="align-middle py-4">
                            <Select
                              value={current?.status_id.toString()}
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger
                                className="h-10 text-right font-bold text-xs bg-muted/40 border-input hover:bg-muted/60 transition-colors rounded-xl w-full"
                                dir="rtl"
                              >
                                <SelectValue placeholder="בחר סטטוס" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {statusTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                    className="text-right font-bold text-xs"
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
                          <TableCell className="align-top py-3">
                            {(current?.isChanged || current?.touched) ? (
                              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                <div className="relative flex-1 max-w-[140px]">
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
                                    className="w-full bg-muted/30 hover:bg-muted/50 transition-colors border border-input rounded-xl h-10 text-xs font-medium px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                  />
                                </div>
                                <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                                <div className="relative flex-1 max-w-[140px]">
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
                                    className="w-full bg-muted/30 hover:bg-muted/50 transition-colors border border-input rounded-xl h-10 text-xs font-medium px-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground/50"
                                    placeholder="סיום (אופציונלי)"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/40 font-medium">
                                --
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
                      className="w-5 h-5 rounded-md"
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
                      className="text-xs font-bold text-muted-foreground"
                    >
                      בחר את כל המוצגים
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/60">
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
                        "rounded-2xl border transition-all duration-200 overflow-hidden",
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card",
                        current?.isChanged &&
                        !isSelected &&
                        "border-blue-200 bg-blue-50/30",
                      )}
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Checkbox
                              className="w-5 h-5 rounded-md shrink-0"
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectOne(emp.id, checked as boolean)
                              }
                            />
                            <div className="flex flex-col text-right truncate">
                              <span className="text-sm font-black text-foreground truncate">
                                {emp.first_name} {emp.last_name}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {emp.personal_number} • {emp.service_type_name}
                              </span>
                            </div>
                          </div>
                          <div
                            className="w-2 h-2 rounded-full mt-2"
                            style={{
                              backgroundColor: current?.color || "#94a3b8",
                            }}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground pr-1">
                              עדכון סטטוס:
                            </span>
                            <Select
                              value={current?.status_id.toString()}
                              onValueChange={(val) =>
                                handleUpdateIndividual(emp.id, val)
                              }
                            >
                              <SelectTrigger
                                className="h-10 text-right font-bold text-xs bg-muted/40 border-input rounded-xl"
                                dir="rtl"
                              >
                                <SelectValue placeholder="בחר סטטוס" />
                              </SelectTrigger>
                              <SelectContent dir="rtl">
                                {statusTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id.toString()}
                                    className="text-right font-bold text-xs"
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

                          {(current?.isChanged || current?.touched) && (
                            <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 tracking-tighter">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-primary pr-1">
                                  תאריך התחלה:
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
                                  className="w-full bg-white dark:bg-muted/50 border border-primary/20 rounded-lg h-9 text-[11px] font-bold px-2 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-muted-foreground pr-1">
                                  תאריך סיום:
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
                                  className="w-full bg-white dark:bg-muted/50 border border-border rounded-lg h-9 text-[11px] font-bold px-2 outline-none"
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

        <div className="p-4 border-t bg-muted/20 flex flex-col gap-3 shrink-0">
          {/* Batch Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-card border rounded-xl shadow-sm animate-in slide-in-from-bottom-2">
            <span className="text-xs font-black text-muted-foreground whitespace-nowrap px-2">
              נבחרו {selectedIds.length} שוטרים:
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={batchStatusId}
                onValueChange={handleBatchStatusChange}
              >
                <SelectTrigger className="h-9 flex-1 sm:w-[180px] text-right font-bold text-xs bg-muted/30 border-input rounded-lg">
                  <SelectValue placeholder="בחר סטטוס לכולם..." />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {statusTypes.map((type) => (
                    <SelectItem
                      key={type.id}
                      value={type.id.toString()}
                      className="text-xs font-bold"
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

          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !Object.values(bulkUpdates).some(
                  (u) => u.touched || u.isChanged,
                )
              }
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-12 sm:h-10 shadow-lg shadow-primary/10 transition-all active:scale-95 disabled:opacity-50 text-xs sm:text-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              שמור ועדכן את כל השינויים
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseAttempt}
              className="px-6 border-input bg-card rounded-xl h-10 sm:h-10 font-bold text-muted-foreground hover:bg-muted transition-all text-xs"
            >
              ביטול
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
