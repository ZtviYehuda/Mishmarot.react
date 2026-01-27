import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
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
import MainLayout from "@/components/layout/MainLayout";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();

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

  return user ? <MainLayout /> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/employees", element: <EmployeesPage /> },
      { path: "/employees/new", element: <CreateEmployeePage /> },
      { path: "/employees/:id", element: <EmployeeViewPage /> },
      { path: "/employees/edit/:id", element: <EditEmployeePage /> },
      { path: "/transfers", element: <TransfersPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
