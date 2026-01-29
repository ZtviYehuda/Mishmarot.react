import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";

// Placeholder pages (build these next; use ShadCN components)
import LoginPage from "@/pages/LoginPage";
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
import { Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6f9]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#003d7e] animate-spin" />
          <span className="text-sm font-bold text-slate-500 animate-pulse">
            מאמת פרטי גישה...
          </span>
        </div>
      </div>
    );

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
    return <Outlet />;
  }

  return <MainLayout />;
};

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
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
  return <RouterProvider router={router} />;
}
