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
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block md:w-64 lg:w-72">
        <div className="sticky top-0 h-screen">
          <Sidebar role={user?.role} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 space-y-4 p-8 pt-6">
          <AutoErrorWrapper user={user}>
            {children}
          </AutoErrorWrapper>
        </main>
      </div>
    </div>
  );
}
