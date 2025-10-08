import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavbar } from "./TopNavbar";
import { SearchProvider } from "@/context/SearchContext";
import { ThemeProvider } from "@/context/ThemeContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col">
              <TopNavbar />
              <main className="flex-1 p-6 overflow-auto">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}