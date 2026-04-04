"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { AddEnrichmentDialog } from "@/components/dashboard/add-data-dialogs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Medal, Trash2, Calendar, Award, BookOpen, Briefcase, FileText, Users, Code, Microscope } from "lucide-react";
import { AcademicEnrichment } from "@/types";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { calculateEnrichmentScore } from "@/lib/academic-calculations";
import { toast } from "sonner";

const Trophy = Medal;

const TYPE_ICONS: Record<string, any> = {
    "Certification": Award,
    "Competition": Trophy,
    "Workshop": BookOpen,
    "Internship": Briefcase,
    "Publication": FileText,
    "Research": Microscope,
    "Technical Club": Users,
    "Project": Code
};

export default function EnrichmentPage() {
    const { user, updateUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const handleSave = async (item: AcademicEnrichment) => {
        setIsLoading(true);
        console.log("Saving Enrichment Record:", item);

        try {
            const currentItems = user?.academicEnrichment || [];
            const updatedItems = [...currentItems, item];

            await updateUserProfile({
                academicEnrichment: updatedItems,
                enrichmentCount: updatedItems.length,
                lastUpdated: new Date().toISOString()
            });
            toast.success("Enrichment record verified and saved!");
        } catch (error) {
            console.error("Save Error:", error);
            toast.error("Failed to sync enrichment record.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            const currentItems = user?.academicEnrichment || [];
            const updated = currentItems.filter(c => c.id !== itemToDelete);
            updateUserProfile({ academicEnrichment: updated });
            setItemToDelete(null);
            setIsDeleteDialogOpen(false);
            toast.info("Entry removed.");
        }
    };

    const enrichItems = user?.academicEnrichment || [];
    const totalScore = calculateEnrichmentScore(enrichItems);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* ── Hero Header ── */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 shadow-xl p-7 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/80 mb-1">Student Intelligence Portal</p>
                        <h1 className="text-3xl font-black mb-2 tracking-tight leading-[1.15] pb-1">Academic Enrichment Index 🏆</h1>
                        <p className="text-white/85 font-medium text-sm">Unified professional readiness portfolio & achievements.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[140px]">
                            <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">Enrichment Score</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-black">{totalScore}</span>
                                <span className="text-sm opacity-60 font-bold">/ 100</span>
                            </div>
                        </div>
                        <AddEnrichmentDialog onSave={handleSave} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrichItems.map((item) => {
                    const Icon = TYPE_ICONS[item.type] || BookOpen;
                    return (
                        <Card key={item.id} className="relative group hover:shadow-2xl transition-all duration-500 border-none bg-white dark:bg-slate-900 overflow-hidden shadow-lg">
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'Winner' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                        <Icon className={`h-6 w-6 ${item.status === 'Winner' ? 'text-amber-500' : 'text-indigo-500'}`} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <Badge variant="outline" className="text-[10px] h-5 uppercase tracking-tighter font-extrabold border-slate-200 dark:border-slate-700">
                                            {item.level}
                                        </Badge>
                                        {item.isElite && (
                                            <Badge variant="secondary" className="text-[10px] h-5 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-800/50 font-black">
                                                ELITE / GOLD
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <p className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                        {item.type}
                                    </p>
                                    <CardTitle className="text-lg font-black leading-tight line-clamp-2 text-slate-800 dark:text-white tracking-tight">
                                        {item.title}
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1 mt-1 font-bold italic text-slate-500 dark:text-slate-400/80">
                                        {item.organization}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px] tracking-widest">Outcome</span>
                                        <Badge className={`font-black uppercase text-[10px] border-none ${item.status === 'Winner' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                                            {item.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-tighter">Category</p>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{item.category}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-700/50">
                                            <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-tighter">Date</p>
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(item.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full"
                                            onClick={() => {
                                                setItemToDelete(item.id);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {enrichItems.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                        <Award className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-xl font-bold">Build Your Professional Portfolio</h3>
                        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Add certifications, projects, and research to improve your Professional Readiness Index (PRI).</p>
                        <AddEnrichmentDialog onSave={handleSave} />
                    </div>
                )}
            </div>

            {/* Global Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entry?</DialogTitle>
                        <DialogDescription>
                            This will remove this enrichment record and impact your overall PRI score. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button onClick={confirmDelete} variant="destructive">Delete Permanently</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}



