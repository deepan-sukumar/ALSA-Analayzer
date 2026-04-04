"use client";

import React, { ReactNode } from "react";
import { logSystemIssue } from "@/lib/issue-logger";
import { toast } from "sonner";
import { UserRole } from "@/lib/issue-logger";

interface Props {
    children: ReactNode;
    user?: {
        id?: string;
        name?: string;
        role?: string;
        department?: string;
    } | null;
}

interface State {
    hasError: boolean;
}

/**
 * A Next.js global error boundary designed to wrap high-level layouts (Student/Faculty).
 * Intercepts unhandled React tree rendering errors, pushes them silently to Firestore,
 * and maintains the UI theme without exposing raw stack traces to the end user.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(_: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught runtime error:", error, errorInfo);

        // Map the NextAuth/Firebase context user over to the logger if provided
        const { user } = this.props;

        // Determine if it was a UI or Calculation error roughly by message content
        const errorType = error.message.toLowerCase().includes("calculate") || error.message.toLowerCase().includes("pri")
            ? "CALCULATION_ERROR"
            : "UI_ERROR";

        // Push to the new Centralized System Issues logger
        logSystemIssue({
            role: (user?.role as UserRole) || "SYSTEM",
            userId: user?.id,
            userName: user?.name,
            department: user?.department,
            page: typeof window !== "undefined" ? window.location.pathname : "unknown",
            errorType,
            errorMessage: `${error.name}: ${error.message} \n\n Stack: ${error.stack?.substring(0, 500)}`
        });

        // Trigger the unobtrusive toast
        toast.error("An issue has been reported to Admin.", {
            description: "Our system monitors have securely logged this error. Please refresh the page.",
            duration: 8000
        });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 space-y-4">
                    <div className="h-16 w-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-2xl mb-4">
                        ⚠️
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h2>
                    <p className="text-muted-foreground max-w-md">
                        A rendering error was encountered on this page. Our central monitors have been automatically notified and an administrator is looking into it.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
