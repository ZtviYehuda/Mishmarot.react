import React from "react";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee.types";
import { toast } from "sonner";
import { Cake, ShieldCheck } from "lucide-react";

interface EmployeeLinkProps {
  employee: Employee | number;
  name?: string;
  className?: string;
  showIcon?: boolean;
}

export const EmployeeLink: React.FC<EmployeeLinkProps> = ({
  employee,
  name,
  className,
  showIcon = false,
}) => {
  const { openProfile } = useEmployeeContext();
  const { user } = useAuthContext();

  const displayName =
    name ||
    (typeof employee === "object"
      ? `${employee.first_name} ${employee.last_name}`
      : `שוטר #${employee}`);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        if (user?.is_temp_commander) {
          toast.error("אין לך הרשאה לצפות בפרופיל שוטר");
          return;
        }

        openProfile(employee);
      }}
      className={cn(
        "text-primary hover:text-primary/80 hover:underline font-bold transition-all text-right items-center gap-1 inline-flex",
        className,
      )}
    >
      {showIcon && (
        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
          👤
        </span>
      )}
      <span>{displayName}</span>
      {typeof employee === "object" && (
        <div className="flex items-center gap-1 mr-1">
          {employee.is_commander && (
            <span title="מפקד">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 drop-shadow-sm" />
            </span>
          )}
          {employee.birth_date &&
            new Date(employee.birth_date).getDate() === new Date().getDate() &&
            new Date(employee.birth_date).getMonth() ===
              new Date().getMonth() && (
              <span title="יום הולדת שמח!">
                <Cake className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400 drop-shadow-sm animate-bounce" />
              </span>
            )}
        </div>
      )}
    </button>
  );
};
