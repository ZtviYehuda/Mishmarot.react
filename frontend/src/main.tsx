import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";

import { DateProvider } from "./context/DateContext";
import { EmployeeProvider } from "./context/EmployeeContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <DateProvider>
          <EmployeeProvider>
            <AppRouter />
            <Toaster />
          </EmployeeProvider>
        </DateProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
