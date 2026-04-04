"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === "admin") {
                router.push("/admin/dashboard");
            } else if (user.role === "student") {
                router.push("/dashboard/student");
            } else {
                router.push("/dashboard/faculty");
            }
        } else if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading, router]);

    return null;
}
