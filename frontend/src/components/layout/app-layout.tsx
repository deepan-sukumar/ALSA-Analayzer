"use client";

import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { AutoErrorWrapper } from "@/components/auto-error-wrapper";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: User;
}

export default function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar role={user?.role} />
      </div>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-[68px]">
        <Header />
        <main className="flex-1 space-y-4 overflow-x-hidden px-3 py-4 sm:px-4 md:px-6 md:py-6 lg:px-8">
          <AutoErrorWrapper user={user}>
            {children}
          </AutoErrorWrapper>
        </main>
      </div>
    </div>
  );
}

