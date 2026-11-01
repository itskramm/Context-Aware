import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';

export default function SidebarLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
