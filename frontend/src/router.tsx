import { useEffect, lazy, Suspense } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import MainLayout from "@/components/layout/MainLayout";
import { EmployeeProvider } from "@/context/EmployeeContext";

// ── Lazy-load every page so each is its own JS chunk ──────────────────────────
// Pages load only when first navigated to → smaller initial bundle
const LoginPage          = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const SupportPage        = lazy(() => import("@/pages/SupportPage"));
const TermsPage          = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage        = lazy(() => import("@/pages/PrivacyPage"));
const DashboardPage      = lazy(() => import("@/pages/DashboardPage"));
const EmployeesPage      = lazy(() => import("@/pages/EmployeesPage"));
const CreateEmployeePage = lazy(() => import("@/pages/CreateEmployeePage"));
const EditEmployeePage   = lazy(() => import("@/pages/EditEmployeePage"));
const EmployeeViewPage   = lazy(() => import("@/pages/EmployeeViewPage"));
const TransfersPage      = lazy(() => import("@/pages/TransfersPage"));
const AttendancePage     = lazy(() => import("@/pages/AttendancePage"));
const RosterPage         = lazy(() => import("@/pages/RosterPage"));
const SettingsPage       = lazy(() => import("@/pages/SettingsPage"));
const ChangePasswordPage = lazy(() => import("@/pages/ChangePasswordPage"));

// ── Page-level suspense wrapper ───────────────────────────────────────────────
// Keeps UX smooth: shows LoadingScreen while the chunk downloads
function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>;
}

// ── Protected route ───────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if (!user.must_change_password && location.pathname === "/change-password") {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === "/change-password") {
    return (
      <EmployeeProvider>
        <Outlet />
      </EmployeeProvider>
    );
  }

  const managementRoutes = ["/employees", "/transfers"];
  if (user.is_temp_commander && managementRoutes.some((r) => location.pathname.startsWith(r))) {
    return <Navigate to="/" replace />;
  }

  return (
    <EmployeeProvider>
      <MainLayout />
    </EmployeeProvider>
  );
};

// ── Router ────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: "/login",            element: <PageSuspense><LoginPage /></PageSuspense> },
  { path: "/forgot-password",  element: <PageSuspense><ForgotPasswordPage /></PageSuspense> },
  { path: "/support",          element: <PageSuspense><SupportPage /></PageSuspense> },
  { path: "/terms",            element: <PageSuspense><TermsPage /></PageSuspense> },
  { path: "/privacy",          element: <PageSuspense><PrivacyPage /></PageSuspense> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/",                    element: <PageSuspense><DashboardPage /></PageSuspense> },
      { path: "/change-password",     element: <PageSuspense><ChangePasswordPage /></PageSuspense> },
      { path: "/employees",           element: <PageSuspense><EmployeesPage /></PageSuspense> },
      { path: "/employees/new",       element: <PageSuspense><CreateEmployeePage /></PageSuspense> },
      { path: "/employees/:id",       element: <PageSuspense><EmployeeViewPage /></PageSuspense> },
      { path: "/employees/edit/:id",  element: <PageSuspense><EditEmployeePage /></PageSuspense> },
      { path: "/transfers",           element: <PageSuspense><TransfersPage /></PageSuspense> },
      { path: "/attendance",          element: <PageSuspense><AttendancePage /></PageSuspense> },
      { path: "/roster",              element: <PageSuspense><RosterPage /></PageSuspense> },
      { path: "/settings",            element: <PageSuspense><SettingsPage /></PageSuspense> },
    ],
  },
]);

export function AppRouter() {
  useEffect(() => {
    try { localStorage.removeItem("read_notifications"); } catch {}
  }, []);

  return <RouterProvider router={router} />;
}
