import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuthContext } from "./AuthContext";
import { useEmployees } from "@/hooks/useEmployees";

type Theme = "dark" | "light";
type AccentColor =
  | "blue"
  | "indigo"
  | "emerald"
  | "rose"
  | "amber"
  | "zinc"
  | "violet";
type FontSize = "small" | "normal" | "large";

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { updatePreferences } = useEmployees();

  // Track synchronization state to prevent infinite loops or redundant calls
  const lastSyncedUser = useRef<number | null>(null);
  const isSyncingRef = useRef(false);

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem("accentColor");
    return (saved as AccentColor) || "blue";
  });

  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const saved = localStorage.getItem("fontSize");
    return (saved as FontSize) || "normal";
  });

  // 1. Initial Load from User Object when user profile is loaded or changed
  useEffect(() => {
    if (user && user.id !== lastSyncedUser.current) {
      // We are loading a new user, flag that we shouldn't sync these initial values back
      isSyncingRef.current = true;

      if (user.theme) setTheme(user.theme as Theme);
      if (user.accent_color) setAccentColor(user.accent_color as AccentColor);
      if (user.font_size) setFontSize(user.font_size as FontSize);

      lastSyncedUser.current = user.id;

      // Use a timeout to ensure state updates have processed before allowing sync
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 100);
    }
  }, [user]);

  // 2. Apply theme to document and save to local storage + Sync to server
  useEffect(() => {
    const root = window.document.documentElement;

    // Theme class
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Accent Color class
    root.classList.forEach((cls) => {
      if (cls.startsWith("accent-")) root.classList.remove(cls);
    });
    root.classList.add(`accent-${accentColor}`);
    localStorage.setItem("accentColor", accentColor);

    // Font Size style
    const sizeMap = {
      small: "14px",
      normal: "16px",
      large: "18px",
    };
    root.style.fontSize = sizeMap[fontSize];
    localStorage.setItem("fontSize", fontSize);

    // 3. Sync with server if user is logged in and we aren't in the middle of a profile load
    if (user && !isSyncingRef.current) {
      // Check if values actually changed from what's in the user object to avoid redundant calls
      const hasChanged =
        theme !== user.theme ||
        accentColor !== user.accent_color ||
        fontSize !== user.font_size;

      if (hasChanged) {
        updatePreferences({
          theme,
          accent_color: accentColor,
          font_size: fontSize,
        });
      }
    }
  }, [theme, accentColor, fontSize, user, updatePreferences]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accentColor,
        fontSize,
        toggleTheme,
        setTheme,
        setAccentColor,
        setFontSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
