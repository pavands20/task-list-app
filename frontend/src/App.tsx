import { NavLink, Navigate, Outlet, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";

import { Icons } from "@/lib/icons";
import { getSessionToken } from "@/lib/api";
import Tasks from "@/screens/Tasks";
import SignIn from "@/screens/SignIn";
import Register from "@/screens/Register";
import ForgotPassword from "@/screens/ForgotPassword";
import ResetPassword from "@/screens/ResetPassword";
import Account from "@/screens/Account";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-2 rounded-[var(--brand-radius)] px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-[var(--brand-hover)] text-[var(--brand-fg)]" : "text-[var(--brand-fg-muted)]",
  ].join(" ");

// The app's menu, drawn around every screen except the ones routed outside it below.
function AppShellLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="border-b"
        style={{
          backgroundColor: "var(--brand-surface)",
          borderColor: "var(--brand-border)",
        }}
      >
        <div className="flex items-center gap-6 px-6 py-2">
          <p
            className="shrink-0 text-sm font-semibold"
            style={{ fontFamily: "var(--brand-font-heading)" }}
          >
            {"TaskList"}
          </p>
          <nav aria-label="App menu" className="flex flex-wrap items-center gap-1">
            <NavLink to="/tasks" className={navLinkClass}>
              <Icons.Home size={16} />
              {"My Tasks"}
            </NavLink>
            <NavLink to="/account" className={navLinkClass}>
              <Icons.Settings size={16} />
              {"Account"}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

// Protects routes that require a signed-in user. With no session token in
// localStorage the visitor is sent to /sign-in instead of the protected screen.
function RequireAuth({ children }: { children: ReactElement }) {
  if (!getSessionToken()) {
    return <Navigate to="/sign-in" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route
          path="/tasks"
          element={
            <RequireAuth>
              <Tasks />
            </RequireAuth>
          }
        />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <Account />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}
