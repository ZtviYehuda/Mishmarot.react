import { useEffect } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

// Placeholder pages (build these next; use ShadCN components)
import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import SupportPage from "@/pages/SupportPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import DashboardPage from "@/pages/DashboardPage";
import EmployeesPage from "@/pages/EmployeesPage";
import CreateEmployeePage from "@/pages/CreateEmployeePage";
import EditEmployeePage from "@/pages/EditEmployeePage";
import EmployeeViewPage from "@/pages/EmployeeViewPage";
import TransfersPage from "@/pages/TransfersPage";
import AttendancePage from "@/pages/AttendancePage";
import SettingsPage from "@/pages/SettingsPage";
import ChangePasswordPage from "@/pages/ChangePasswordPage";
import MainLayout from "@/components/layout/MainLayout";
import { EmployeeProvider } from "@/context/EmployeeContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";

const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to change-password if required
  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  // Prevent going to change-password if not required
  if (!user.must_change_password && location.pathname === "/change-password") {
    return <Navigate to="/" replace />;
  }

  // If on change-password, don't show the sidebar/layout
  if (location.pathname === "/change-password") {
    return (
      <EmployeeProvider>
        <Outlet />
      </EmployeeProvider>
    );
  }

  return (
    <EmployeeProvider>
      <MainLayout />
    </EmployeeProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/support",
    element: <SupportPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/change-password", element: <ChangePasswordPage /> },
      { path: "/employees", element: <EmployeesPage /> },
      { path: "/employees/new", element: <CreateEmployeePage /> },
      { path: "/employees/:id", element: <EmployeeViewPage /> },
      { path: "/employees/edit/:id", element: <EditEmployeePage /> },
      { path: "/transfers", element: <TransfersPage /> },
      { path: "/attendance", element: <AttendancePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);

export function AppRouter() {
  // Clean up old localStorage notification reads (migration)
  useEffect(() => {
    try {
      localStorage.removeItem("read_notifications");
    } catch (e) {
      console.error("Failed to cleanup notification storage:", e);
    }
  }, []);

  return <RouterProvider router={router} />;
}
