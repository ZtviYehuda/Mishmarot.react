import React from "react";
import { useEmployeeContext } from "@/context/EmployeeContext";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/employee.types";

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
    </button>
  );
};
