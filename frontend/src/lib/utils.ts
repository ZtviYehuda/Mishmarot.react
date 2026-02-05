import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanUnitName(name?: string | null): string {
  if (!name) return "—";
  return (
    name
      .replace(/מחלקת|מחלקה/g, "")
      .replace(/מדור/g, "")
      .replace(/חוליית|חולייה/g, "")
      .replace(/צוות/g, "")
      .trim() || "—"
  );
}
