'use client';

import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
      <SidebarProvider>
        <Sidebar variant="inset" collapsible="icon">
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col h-full">
              <AppHeader />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
