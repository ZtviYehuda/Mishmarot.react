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

export function getHexColor(color: string) {
  switch (color) {
    case "blue":
      return "#0074ff";
    case "indigo":
      return "#6366f1";
    case "emerald":
      return "#10b981";
    case "rose":
      return "#f43f5e";
    case "amber":
      return "#f59e0b";
    default:
      return "#0074ff";
  }
}
