"use client";

import AppLayout from "@/components/layout/app-layout";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({
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
                router.push("/dashboard/student");
            } else if (user.role === "faculty") {
                if (user.approved === false) {
                    router.push("/faculty/pending-approval");
                } else if (user.approved === true) {
                    router.push("/dashboard/faculty");
                }
            }
        }
    }, [user, isLoading, router, pathname]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user || user.role !== "admin") {
        return null;
    }

    return <AppLayout user={user}>{children}</AppLayout>;
}
