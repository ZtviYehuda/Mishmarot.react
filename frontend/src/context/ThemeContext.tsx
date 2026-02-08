import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type AccentColor = "blue" | "indigo" | "emerald" | "rose" | "amber";
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
  }, [theme, accentColor, fontSize]);

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
