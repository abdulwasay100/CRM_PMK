import { useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { SearchProvider } from "@/context/SearchContext";

export function AppLayout() {
  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <TopNavbar />
            <main className="flex-1 p-6 overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </SearchProvider>
  );
}