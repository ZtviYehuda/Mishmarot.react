import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";

import { DateProvider } from "./context/DateContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <DateProvider>
          <AppRouter />
          <Toaster richColors position="top-center" dir="rtl" />
        </DateProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
);
