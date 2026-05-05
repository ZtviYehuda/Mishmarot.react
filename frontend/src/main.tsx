import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

import { DateProvider } from "./context/DateContext";
import { FeedbackProvider } from "./context/FeedbackContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <DateProvider>
            <FeedbackProvider>
              <AppRouter />
              <Toaster richColors position="top-center" dir="rtl" />
            </FeedbackProvider>
          </DateProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
