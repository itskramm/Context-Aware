import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '@/components/AppSidebar';

export default function SidebarLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
