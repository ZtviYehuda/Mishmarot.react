import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/types/employee.types";

interface WhatsAppReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filteredEmployees: Employee[];
}

export const WhatsAppReportDialog: React.FC<WhatsAppReportDialogProps> = ({
  open,
  onOpenChange,
  filteredEmployees,
}) => {
  const [sendOption, setSendOption] = useState<"current" | "custom">("current");
  const [customFilters, setCustomFilters] = useState({
    departments: [] as string[],
    sections: [] as string[],
    statuses: [] as string[],
    roles: [] as string[],
  });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  // Extract unique values
  const uniqueValues = React.useMemo(() => {
    const departments = new Set<string>();
    const sections = new Set<string>();
    const statuses = new Set<string>();
    const roles = new Set<string>();

    filteredEmployees.forEach((emp) => {
      if (emp.department_name) departments.add(emp.department_name);
      if (emp.section_name) sections.add(emp.section_name);
      if (emp.status_name) statuses.add(emp.status_name);
      if (emp.role_name) roles.add(emp.role_name);
    });

    return {
      departments: Array.from(departments).sort(),
      sections: Array.from(sections).sort(),
      statuses: Array.from(statuses).sort(),
      roles: Array.from(roles).sort(),
    };
  }, [filteredEmployees]);

  // Filter employees based on custom filters
  const getEmployeesToReport = () => {
    if (sendOption === "current") {
      return filteredEmployees;
    }

    return filteredEmployees.filter((emp) => {
      if (customFilters.departments.length > 0 && !customFilters.departments.includes(emp.department_name || "")) {
        return false;
      }
      if (customFilters.sections.length > 0 && !customFilters.sections.includes(emp.section_name || "")) {
        return false;
      }
      if (customFilters.statuses.length > 0 && !customFilters.statuses.includes(emp.status_name)) {
        return false;
      }
      if (customFilters.roles.length > 0 && !customFilters.roles.includes(emp.role_name || "")) {
        return false;
      }
      return true;
    });
  };

  const handleToggleFilter = (type: keyof typeof customFilters, value: string) => {
    setCustomFilters((prev) => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter((v) => v !== value)
        : [...prev[type], value],
    }));
  };

  const generateReport = (employees: Employee[]) => {
    let report = "📋 *דוח כוח אדם*\n";
    report += `📅 ${new Date().toLocaleDateString("he-IL")}\n`;
    report += `👥 סה"כ: ${employees.length} משרתים\n\n`;

    // Group by status
    const byStatus: { [key: string]: Employee[] } = {};
    employees.forEach((emp) => {
      if (!byStatus[emp.status_name]) {
        byStatus[emp.status_name] = [];
      }
      byStatus[emp.status_name].push(emp);
    });

    report += "*לפי סטטוס:*\n";
    Object.entries(byStatus).forEach(([status, emps]) => {
      report += `• ${status}: ${emps.length}\n`;
    });

    report += "\n*פרטים:*\n";
    employees.slice(0, 20).forEach((emp) => {
      report += `${emp.first_name} ${emp.last_name} - ${emp.status_name}\n`;
    });

    if (employees.length > 20) {
      report += `\n... ועוד ${employees.length - 20} משרתים\n`;
    }

    return report;
  };

  const handleSend = async () => {
    try {
      const employees = getEmployeesToReport();

      if (employees.length === 0) {
        alert("אנא בחר עובדים להכללה בדוח");
        return;
      }

      const report = generateReport(employees);

      setLoading(true);

      // Encode the message for URL
      const encodedMessage = encodeURIComponent(report);

      // If phone number provided, send directly to that number
      if (phoneNumber.trim()) {
        // Format phone number (remove non-digits, add country code if needed)
        let formattedPhone = phoneNumber.replace(/\D/g, "");
        if (!formattedPhone.startsWith("1")) {
          // Assume Israeli number if doesn't start with country code
          if (formattedPhone.startsWith("0")) {
            formattedPhone = "972" + formattedPhone.substring(1);
          } else if (!formattedPhone.startsWith("972")) {
            formattedPhone = "972" + formattedPhone;
          }
        }
        // Open WhatsApp with the message for this contact
        window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
      } else {
        // No phone number - just copy to clipboard and open WhatsApp Web
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(report);
        } else {
          // Fallback for older browsers
          const textarea = document.createElement("textarea");
          textarea.value = report;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        // Open WhatsApp Web
        window.open("https://web.whatsapp.com", "_blank");
        alert(`✅ הדוח הועתק להעתקה!\n\nוואטסאפ ווב נפתח בחלונית חדשה.\n\nעכשיו אתה יכול להדביק את הדוח בצ'אט שלך.`);
      }

      // Reset form
      setPhoneNumber("");
      setSendOption("current");
      setCustomFilters({
        departments: [],
        sections: [],
        statuses: [],
        roles: [],
      });

      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      alert("❌ שגיאה בשליחת הדוח. אנא נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const employeesToReport = getEmployeesToReport();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-semibold text-[#001e30] dark:text-white">
            שליחת דוח לוואטסאפ
          </DialogTitle>
          <DialogDescription className="text-right text-slate-600 dark:text-slate-300">
            בחר אילו עובדים להכליל בדוח
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Send Option Selection */}
          <div className="space-y-3 text-right">
            <Label className="text-sm font-semibold text-right block text-[#001e30] dark:text-white">
              בחר אופציה
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 justify-end p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <label htmlFor="option-current" className="text-sm cursor-pointer flex-1 text-right">
                  שלח דוח על כל העובדים המוצגים כרגע ({filteredEmployees.length} משרתים)
                </label>
                <input
                  id="option-current"
                  type="radio"
                  name="send-option"
                  value="current"
                  checked={sendOption === "current"}
                  onChange={() => setSendOption("current")}
                />
              </div>

              <div className="flex items-center gap-2 justify-end p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <label htmlFor="option-custom" className="text-sm cursor-pointer flex-1 text-right">
                  בחר סינון משלי
                </label>
                <input
                  id="option-custom"
                  type="radio"
                  name="send-option"
                  value="custom"
                  checked={sendOption === "custom"}
                  onChange={() => setSendOption("custom")}
                />
              </div>
            </div>
          </div>

          {/* Custom Filters */}
          {sendOption === "custom" && (
            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
              {/* Departments */}
              {uniqueValues.departments.length > 0 && (
                <div className="space-y-2 text-right">
                  <Label className="text-sm font-medium text-right block">מחלקות</Label>
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {uniqueValues.departments.map((dept) => (
                      <div key={dept} className="flex items-center gap-2 justify-start">
                        <Checkbox
                          id={`dept-${dept}`}
                          checked={customFilters.departments.includes(dept)}
                          onCheckedChange={() => handleToggleFilter("departments", dept)}
                        />
                        <label htmlFor={`dept-${dept}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                          {dept}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              {uniqueValues.sections.length > 0 && (
                <div className="space-y-2 text-right">
                  <Label className="text-sm font-medium text-right block">מדורים</Label>
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {uniqueValues.sections.map((section) => (
                      <div key={section} className="flex items-center gap-2 justify-start">
                        <Checkbox
                          id={`section-${section}`}
                          checked={customFilters.sections.includes(section)}
                          onCheckedChange={() => handleToggleFilter("sections", section)}
                        />
                        <label htmlFor={`section-${section}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                          {section}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statuses */}
              {uniqueValues.statuses.length > 0 && (
                <div className="space-y-2 text-right">
                  <Label className="text-sm font-medium text-right block">סטטוסים</Label>
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {uniqueValues.statuses.map((status) => (
                      <div key={status} className="flex items-center gap-2 justify-start">
                        <Checkbox
                          id={`status-${status}`}
                          checked={customFilters.statuses.includes(status)}
                          onCheckedChange={() => handleToggleFilter("statuses", status)}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roles */}
              {uniqueValues.roles.length > 0 && (
                <div className="space-y-2 text-right">
                  <Label className="text-sm font-medium text-right block">תפקידים</Label>
                  <div className="grid grid-cols-2 gap-2 pr-2">
                    {uniqueValues.roles.map((role) => (
                      <div key={role} className="flex items-center gap-2 justify-start">
                        <Checkbox
                          id={`role-${role}`}
                          checked={customFilters.roles.includes(role)}
                          onCheckedChange={() => handleToggleFilter("roles", role)}
                        />
                        <label htmlFor={`role-${role}`} className="text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phone Number Input */}
          <div className="space-y-2 text-right border-t border-slate-200 dark:border-slate-700 pt-4">
            <Label htmlFor="phone" className="text-sm font-medium text-right block">
              📱 מספר טלפון של התמונה (לא חובה)
            </Label>
            <Input
              id="phone"
              placeholder="+972 50-0000000"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="text-right border-slate-200 dark:border-slate-700"
              dir="rtl"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
              אם תזין מספר - הדוח ישלח ישירות לוואטסאפ שלהם. אם תתיכו ריק - וואטסאפ ווב יפתח והדוח יהיה בלוח
            </p>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3 text-right">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              📊 <span className="font-semibold">{employeesToReport.length}</span> משרתים יוכללו בדוח
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-6 flex-row-reverse">
          <Button
            type="button"
            onClick={handleSend}
            disabled={loading || employeesToReport.length === 0}
            className="bg-[#25D366] hover:bg-[#1fa857] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ בתהליך..." : "📱 העתק לוואטסאפ"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-200 dark:border-slate-700"
            disabled={loading}
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
