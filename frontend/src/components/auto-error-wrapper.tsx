"use client";

import React, { useEffect } from "react";
import { logSystemIssue } from "@/lib/firebase/issue-logger";
import { toast } from "sonner";
import { UserRole } from "@/lib/firebase/issue-logger";
import { GlobalErrorBoundary } from "./global-error-boundary";

interface AutoErrorWrapperProps {
    children: React.ReactNode;
    user?: any;
}

export function AutoErrorWrapper({ children, user }: AutoErrorWrapperProps) {
    useEffect(() => {
        // Catch uncaught runtime/async errors (e.g. event handlers)
        const handleWindowError = (event: ErrorEvent) => {
            logSystemIssue({
                role: (user?.role as UserRole) || "SYSTEM",
                userId: user?.id,
                userName: user?.name,
                department: user?.department,
                page: window.location.pathname,
                errorType: "UNKNOWN",
                errorMessage: `Window Error: ${event.message} \n\n Stack: ${event.error?.stack?.substring(0, 500) || "No Stack"}`
            });

            // Prevent default console explosion and stop crash loops
            toast.error("An issue has been reported to Admin.", {
                description: "Our remote monitors captured an application fault.",
                duration: 5000
            });
        };

        // Catch unhandled Promise rejections (e.g. Firebase API failures or calculations failing silently)
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            let errorMessage = "Unknown Promise Rejection";

            if (reason instanceof Error) {
                errorMessage = `${reason.name}: ${reason.message} \n\n Stack: ${reason.stack?.substring(0, 500)}`;
            } else if (typeof reason === "string") {
                errorMessage = reason;
            } else {
                errorMessage = JSON.stringify(reason);
            }

            const errorType = errorMessage.toLowerCase().includes("auth") || errorMessage.toLowerCase().includes("permission")
                ? "AUTH_ERROR"
                : "API_ERROR";

            logSystemIssue({
                role: (user?.role as UserRole) || "SYSTEM",
                userId: user?.id,
                userName: user?.name,
                department: user?.department,
                page: window.location.pathname,
                errorType,
                errorMessage: `Promise Rejection: ${errorMessage}`
            });

            toast.error("An issue has been reported to Admin.", {
                description: "Our remote monitors captured a network or sync failure.",
                duration: 5000
            });
        };

        window.addEventListener("error", handleWindowError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        return () => {
            window.removeEventListener("error", handleWindowError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, [user]);

    return (
        <GlobalErrorBoundary user={user}>
            {children}
        </GlobalErrorBoundary>
    );
}

