import { useEffect } from "react";
import { User, Phone } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmployeeLink } from "@/components/common/EmployeeLink";

interface DashboardStatusTableProps {
  statusId: number | null;
  statusName: string;
  statusColor: string;
  departmentId?: string;
  sectionId?: string;
  teamId?: string;
  date?: string;
}

export const DashboardStatusTable = ({
  statusId,
  statusName,
  statusColor,
  departmentId,
  sectionId,
  teamId,
  date,
}: DashboardStatusTableProps) => {
  const { employees, fetchEmployees, loading } = useEmployees();

  useEffect(() => {
    if (statusId !== null && statusId !== undefined) {
      fetchEmployees(
        undefined,
        departmentId && departmentId !== ""
          ? parseInt(departmentId)
          : undefined,
        undefined,
        statusId,
        sectionId && sectionId !== "" ? parseInt(sectionId) : undefined,
        teamId && teamId !== "" ? parseInt(teamId) : undefined,
        date,
      );
    }
  }, [statusId, departmentId, sectionId, teamId, date, fetchEmployees]);

  if (statusId === null || statusId === undefined) return null;

  return (
    <Card className="border border-border bg-card mt-6 overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: statusColor }}
          />
          <CardTitle className="text-lg font-black text-foreground">
            פירוט שוטרים בסטטוס: {statusName}
          </CardTitle>
          <span className="text-xs font-bold text-muted-foreground mr-auto bg-muted px-2 py-0.5 rounded-full">
            {employees.length} רשומות
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-muted-foreground">
              טוען נתונים...
            </p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-muted-foreground/30">
            <User className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-bold">אין נתונים להצגה</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      שם מלא
                    </th>
                    <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      מ.א
                    </th>
                    <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      מחלקה
                    </th>
                    <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      מדור / חולייה
                    </th>
                    <th className="px-6 py-3 text-xs font-black text-muted-foreground uppercase tracking-wider">
                      טלפון
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0">
                            {emp.first_name[0]}
                            {emp.last_name[0]}
                          </div>
                          <EmployeeLink
                            employee={emp}
                            className="text-sm font-bold text-foreground"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                        {emp.personal_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-muted-foreground">
                          {emp.department_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-muted-foreground">
                            {emp.section_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-medium">
                            {emp.team_name && emp.team_name !== "מטה"
                              ? emp.team_name
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.phone_number ? (
                          <a
                            href={`tel:${emp.phone_number}`}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-2"
                          >
                            <Phone className="w-3 h-3" />
                            {emp.phone_number}
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground/30">
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col divide-y divide-border">
              {employees.map((emp) => (
                <div key={emp.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                    {emp.first_name[0]}
                    {emp.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {emp.first_name} {emp.last_name}
                      </h4>
                      <span className="text-[10px] font-mono bg-muted px-1.5 rounded text-muted-foreground">
                        {emp.personal_number}
                      </span>
                    </div>
                    <div className="flex flex-col text-xs text-muted-foreground mt-0.5">
                      <span className="truncate">
                        {emp.department_name}{" "}
                        {emp.section_name ? `• ${emp.section_name}` : ""}
                      </span>
                    </div>
                  </div>
                  {emp.phone_number && (
                    <a
                      href={`tel:${emp.phone_number}`}
                      className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors shrink-0"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
