import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { getAccessType } from "@/lib/authValidations";

// Route guard for role-based pages. The pages behind this gate also verify the
// access type on the backend before returning any data, so hiding the page is
// not the only line of defense.
export default function RoleRoute({ allow = [] }) {
  const { user, isLoadingAuth, authChecked } = useAuth();

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!allow.includes(getAccessType(user))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}