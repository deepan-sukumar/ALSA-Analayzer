"use client";

import AppLayout from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            if (user.role === "student") {
                // Let auth-context handle the profile/grades setup redirection. 
                // Just ensure they are generally in the student area.
                if (
                    !pathname.startsWith("/dashboard/student") &&
                    !pathname.startsWith("/complete-profile") &&
                    !pathname.startsWith("/dashboard/settings")
                ) {
                    router.push("/dashboard/student");
                }
            } else if (user.role === "faculty") {
                if (user.approved === false) {
                    router.push("/faculty/pending-approval");
                } else if (user.approved === true && !pathname.startsWith("/dashboard/faculty") && !pathname.startsWith("/complete-profile")) {
                    router.push("/dashboard/faculty");
                }
            } else if (user.role === "admin") {
                if (!pathname.startsWith("/admin") && !pathname.startsWith("/dashboard/settings")) {
                    router.push("/admin/dashboard");
                }
            }
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return null;
    }

    return <AppLayout user={user}>{children}</AppLayout>;
}

