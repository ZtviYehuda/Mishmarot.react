import { useEffect } from "react";
import { User, Phone } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStatusTableProps {
  statusId: number | null;
  statusName: string;
  statusColor: string;
}

export const DashboardStatusTable = ({
  statusId,
  statusName,
  statusColor,
}: DashboardStatusTableProps) => {
  const { employees, fetchEmployees, loading } = useEmployees();

  useEffect(() => {
    if (statusId !== null && statusId !== undefined) {
      fetchEmployees(undefined, undefined, undefined, statusId);
    }
  }, [statusId, fetchEmployees]);

  if (statusId === null || statusId === undefined) return null;

  return (
    <Card className="border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] bg-white dark:bg-card dark:border-border mt-6 overflow-hidden">
      <CardHeader className="pb-4 border-b border-slate-50 dark:border-border/50">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: statusColor }}
          />
          <CardTitle className="text-lg font-black text-[#001e30] dark:text-white">
            פירוט שוטרים בסטטוס: {statusName}
          </CardTitle>
          <span className="text-xs font-bold text-slate-400 mr-auto bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {employees.length} רשומות
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-[#0074ff] rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400">טוען נתונים...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-slate-300">
            <User className="w-12 h-12 mb-2 opacity-20" />
            <p className="font-bold">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    שם מלא
                  </th>
                  <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    מ.א
                  </th>
                  <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    מחלקה
                  </th>
                  <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    מדור / חולייה
                  </th>
                  <th className="px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                    טלפון
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[#0074ff] font-black text-[10px] shrink-0">
                          {emp.first_name[0]}
                          {emp.last_name[0]}
                        </div>
                        <span className="text-sm font-bold text-[#001e30] dark:text-white">
                          {emp.first_name} {emp.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                      {emp.personal_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {emp.department_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          {emp.section_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
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
                          className="text-xs font-bold text-[#0074ff] hover:underline flex items-center gap-2"
                        >
                          <Phone className="w-3 h-3" />
                          {emp.phone_number}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
