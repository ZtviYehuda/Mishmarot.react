import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  collapsed?: boolean;
  className?: string; // Standardize prop name for external styling
  theme?: string;
  setTheme?: (theme: any) => void;
  showLabels?: boolean;
}

export function ThemeToggle({
  collapsed = false,
  className,
  theme: propTheme,
  setTheme: propSetTheme,
  showLabels = false,
}: ThemeToggleProps) {
  const context = useTheme();
  const theme = propTheme || context.theme;
  const setTheme = propSetTheme || context.setTheme;

  if (collapsed) {
    // Elegant mini-toggle for collapsed state
    return (
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm border border-transparent",
          theme === "dark"
            ? "bg-slate-800 text-blue-400 hover:bg-slate-700 border-slate-700"
            : "bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200",
          className,
        )}
        title={
          theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
        }
      >
        {theme === "dark" ? (
          <Moon className="w-5 h-5 fill-current opacity-90" />
        ) : (
          <Sun className="w-5 h-5 fill-current opacity-90" />
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex items-center w-full p-1 rounded-full cursor-pointer select-none border transition-colors",
        "bg-slate-100 border-slate-200 dark:bg-slate-950 dark:border-slate-800",
        showLabels ? "h-12" : "h-10",
        className,
      )}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      dir="ltr"
    >
      {/* Sliding Background Indicator */}
      <div
        className={cn(
          "absolute inset-y-1 w-[calc(50%-4px)] rounded-full shadow-md transition-all duration-300 ease-spring",
          theme === "dark"
            ? "translate-x-[calc(100%+4px)] bg-slate-800"
            : "translate-x-0 ml-1 bg-white",
        )}
      />

      {/* Light Option */}
      <div
        className={cn(
          "flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300",
          theme === "light"
            ? "text-slate-800"
            : "text-slate-400 dark:text-slate-500",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setTheme("light");
        }}
        title="Light Mode"
      >
        <Sun
          className={cn(
            "w-5 h-5 transition-all duration-300",
            theme === "light" && "fill-amber-500 text-amber-500 scale-110",
          )}
        />
        {showLabels && (
          <span className="text-sm font-bold tracking-wide">Light</span>
        )}
      </div>

      {/* Dark Option */}
      <div
        className={cn(
          "flex-1 flex items-center justify-center gap-2 z-10 transition-colors duration-300",
          theme === "dark"
            ? "text-slate-100"
            : "text-slate-400 dark:text-slate-500",
        )}
        onClick={(e) => {
          e.stopPropagation();
          setTheme("dark");
        }}
        title="Dark Mode"
      >
        <Moon
          className={cn(
            "w-5 h-5 transition-all duration-300",
            theme === "dark" && "fill-blue-400 text-blue-400 scale-110",
          )}
        />
        {showLabels && (
          <span className="text-sm font-bold tracking-wide">Dark</span>
        )}
      </div>
    </div>
  );
}
