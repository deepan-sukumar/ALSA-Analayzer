"use client";

import { FacultyIntegrityHub } from "@/components/faculty-integrity-hub";
import { ShieldAlert } from "lucide-react";

export default function FacultyIntegrityPage() {
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                            <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight italic">
                            DEPARTMENT INTEGRITY HUB
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                        Monitor verification attendance, scores, and manage unlock requests in one central place.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <FacultyIntegrityHub />
            </div>

            <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/30 to-white dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40">
                <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-300 mb-2 uppercase tracking-widest">Helpful Summary</h3>
                <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
                    This hub provides real-time visibility into student verification sessions. 
                    <br /><br />
                    • Use the <span className="font-black italic">Dynamic Logs</span> tab to see attendee names, attempt numbers, and precise scores.
                    <br />
                    • Use the <span className="font-black italic">Unlocks</span> tab to approve or reject requests from students who have exhausted their test attempts.
                </p>
            </div>
        </div>
    );
}
