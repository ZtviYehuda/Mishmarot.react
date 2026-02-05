import { useState, useMemo } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppReportDialog = ({
  open,
  onOpenChange,
}: WhatsAppReportDialogProps) => {
  const { employees } = useEmployees();
  const { user } = useAuthContext();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [includeAllStatuses, setIncludeAllStatuses] = useState(true);

  // Get unique statuses from employees
  const availableStatuses = useMemo(() => {
    const statuses = new Map<string, string>();
    employees.forEach((emp) => {
      const name = emp.status_name || "Unknown";
      if (!statuses.has(name)) {
        statuses.set(name, emp.status_color || "#ccc");
      }
    });
    return Array.from(statuses.entries()).map(([name, color]) => ({
      name,
      color,
    }));
  }, [employees]);

  // Prepare report data
  const reportData = useMemo(() => {
    let filtered = employees;

    if (!includeAllStatuses && selectedStatuses.length > 0) {
      filtered = filtered.filter((emp) =>
        selectedStatuses.includes(emp.status_name || "Unknown"),
      );
    }

    // Group by status
    const grouped = new Map<
      string,
      { count: number; color: string; employees: any[] }
    >();
    filtered.forEach((emp) => {
      const status = emp.status_name || "Unknown";
      if (!grouped.has(status)) {
        grouped.set(status, {
          count: 0,
          color: emp.status_color || "#ccc",
          employees: [],
        });
      }
      const group = grouped.get(status)!;
      group.count++;
      group.employees.push(emp);
    });

    // Convert map to array
    const byStatusArray = Array.from(grouped.entries()).map(
      ([name, { count, color, employees: emps }]) => ({
        name,
        count,
        color,
        employees: emps,
      }),
    );

    return {
      total: filtered.length,
      byStatus: byStatusArray,
    };
  }, [employees, includeAllStatuses, selectedStatuses]);

  const generateWhatsAppMessage = () => {
    const commander = user ? `${user.first_name} ${user.last_name}` : "מפקד";
    let message = `📊 *דוח מצבת כוח אדם*\n`;
    message += `\n*מפקד:* ${commander}\n`;
    message += `*תאריך:* ${new Date().toLocaleDateString("he-IL")}\n`;
    message += `*סך הכל שוטרים:* ${reportData.total}\n\n`;

    message += `*פילוח לפי סטטוס:*\n`;
    reportData.byStatus.forEach(({ name, count }) => {
      const percentage =
        reportData.total > 0 ? Math.round((count / reportData.total) * 100) : 0;
      message += `• ${name}: ${count} (${percentage}%)\n`;
    });

    if (selectedStatuses.length > 0 && !includeAllStatuses) {
      message += `\n*סינון:* ${selectedStatuses.join(", ")}\n`;
    }

    return message;
  };

  const handleSendWhatsApp = () => {
    const message = encodeURIComponent(generateWhatsAppMessage());
    const whatsappUrl = `https://wa.me/?text=${message}`;

    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    onOpenChange(false);
  };

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>שלח דוח בווטסאפ</DialogTitle>
          <DialogDescription>
            בחר את הסטטוסים שברצונך להציג בדוח
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Include All Statuses Option */}
          <div className="flex items-center space-x-3 space-x-reverse pb-4 border-b">
            <Checkbox
              id="all-statuses"
              checked={includeAllStatuses}
              onCheckedChange={(checked) => {
                setIncludeAllStatuses(checked as boolean);
                if (checked) {
                  setSelectedStatuses([]);
                }
              }}
            />
            <Label htmlFor="all-statuses" className="cursor-pointer flex-1">
              <span className="font-semibold">כל הסטטוסים</span>
            </Label>
          </div>

          {/* Individual Status Selection */}
          {!includeAllStatuses && (
            <div className="space-y-3">
              {availableStatuses.map(({ name, color }) => (
                <div
                  key={name}
                  className="flex items-center space-x-3 space-x-reverse"
                >
                  <Checkbox
                    id={`status-${name}`}
                    checked={selectedStatuses.includes(name)}
                    onCheckedChange={() => handleStatusToggle(name)}
                  />
                  <Label
                    htmlFor={`status-${name}`}
                    className="cursor-pointer flex-1 flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>{name}</span>
                  </Label>
                </div>
              ))}
            </div>
          )}

          {/* Report Preview */}
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">תצוגה מקדימה:</p>
            <div className="text-xs text-muted-foreground space-y-1 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {generateWhatsAppMessage()}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            ביטול
          </Button>
          <WhatsAppButton
            onClick={handleSendWhatsApp}
            label="שליחת דוח ל-WhatsApp"
            skipDirectLink={true}
            className="flex-1"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
