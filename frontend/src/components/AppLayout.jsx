import React from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import InactivityLogout from "@/components/InactivityLogout";

// Shared layout for all authenticated pages: header, inactivity auto-logout,
// and the page content below.
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <InactivityLogout />
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}