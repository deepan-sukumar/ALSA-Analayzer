"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AcademicEnrichment, PlacementMetrics } from "@/types";
import { PlusCircle, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

// --- Add Academic Enrichment Dialog (Unified Model) ---
export function AddEnrichmentDialog({ onSave }: { onSave: (item: AcademicEnrichment) => Promise<void> | void }) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<AcademicEnrichment>>({
        type: "Certification",
        status: "Completed",
        level: "College",
        category: "Cloud Computing",
        isElite: false,
        duration: 0
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.organization) {
            toast.error("Please fill in required fields (Title, Organization).");
            return;
        }

        setIsSaving(true);
        try {
            const newItem: AcademicEnrichment = {
                id: Date.now().toString(),
                type: formData.type as any,
                status: formData.status as any,
                level: formData.level as any,
                category: formData.category || "General",
                duration: Number(formData.duration) || 0,
                score: formData.score ? Number(formData.score) : undefined,
                isElite: !!formData.isElite,
                title: formData.title,
                organization: formData.organization,
                date: new Date().toISOString(),
            };

            await onSave(newItem);

            setOpen(false);
            setFormData({
                type: "Certification",
                status: "Completed",
                level: "College",
                category: "Cloud Computing",
                isElite: false,
                duration: 0
            });
        } catch (error) {
            // Error handled by parent handleSave
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Academic Enrichment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Academic Enrichment</DialogTitle>
                    <DialogDescription>Structured record for professional and academic activities.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Enrichment Type</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, type: val as any })} defaultValue={formData.type}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {["Certification", "Competition", "Workshop", "Internship", "Publication", "Research", "Technical Club", "Project"].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Achievement / Status</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, status: val as any })} defaultValue={formData.status}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    {["Completed", "Winner", "Runner-up", "Participated", "Ongoing"].map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Impact Level</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, level: val as any })} defaultValue={formData.level}>
                                <SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                                <SelectContent>
                                    {["College", "Intercollege", "State", "National", "International"].map(i => (
                                        <SelectItem key={i} value={i}>{i}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Domain / Category</Label>
                            <Input
                                placeholder="e.g. Web Dev, Robotics"
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Title</Label>
                        <Input
                            className="col-span-3"
                            placeholder="Activity Title (e.g. AWS Certified Cloud Practitioner)"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Organization</Label>
                        <Input
                            className="col-span-3"
                            placeholder="Platform, College, or Company"
                            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-2 items-center gap-4">
                            <Label className="text-right">Duration (Hrs)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                            />
                        </div>
                        <div className="grid grid-cols-2 items-center gap-4">
                            <Label className="text-right">Score %</Label>
                            <Input
                                type="number"
                                placeholder="Optional"
                                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 justify-end">
                        <Switch id="elite" checked={formData.isElite} onCheckedChange={(val) => setFormData({ ...formData, isElite: val })} />
                        <Label htmlFor="elite" className="text-amber-600 font-semibold">Elite / Gold Certified?</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Academic Enrichment"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Add Extra-Curricular Dialog (Professional Structure) ---
export function AddEngagementDialog({ onSave }: { onSave: (item: AcademicEnrichment) => Promise<void> | void }) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<AcademicEnrichment>>({
        type: "Technical Club",
        category: "Leadership",
        level: "College",
        status: "Participated"
    });

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.error("Please fill in Activity Title.");
            return;
        }

        setIsSaving(true);
        try {
            const newItem: AcademicEnrichment = {
                id: Date.now().toString(),
                type: formData.type as any,
                category: formData.category || "General",
                status: formData.status as any,
                level: formData.level as any,
                title: formData.title,
                organization: formData.organization || "College",
                date: new Date().toISOString(),
                isElite: false
            };

            await onSave(newItem);
            setOpen(false);
            setFormData({
                type: "Technical Club",
                category: "Leadership",
                level: "College",
                status: "Participated"
            });
        } catch (error) {
            // Handled by parent
        } finally {
            setIsSaving(true);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Extra-Curricular
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Extra-Curricular Activity</DialogTitle>
                    <DialogDescription>Structured record for leadership, sports, and social contributions.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, category: val })} defaultValue={formData.category}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {["Sports", "Cultural", "Leadership", "Social Service", "NSS / NCC", "Club Management", "Public Speaking", "Entrepreneurship", "Volunteering"].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Participation Level</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, status: val as any })} defaultValue={formData.status}>
                                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent>
                                    {["Participated", "Ongoing", "Completed"].map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, type: val as any })} defaultValue={formData.type}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {["Technical Club", "Workshop", "Research"].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Impact Scale</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, level: val as any })} defaultValue={formData.level}>
                                <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
                                <SelectContent>
                                    {["College", "Intercollege", "State", "National", "International"].map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Activity Title</Label>
                        <Input
                            placeholder="e.g. Winner of Intercollege Football, Club Coordinator"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Extra-Curricular"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Add Applied Knowledge Dialog (Professional Structure) ---
export function AddAppliedKnowledgeDialog({ onSave }: { onSave: (item: AcademicEnrichment) => Promise<void> | void }) {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<AcademicEnrichment>>({
        type: "Project",
        level: "College",
        status: "Participated",
        category: "Hackathon"
    });

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.error("Please fill in Event Title.");
            return;
        }

        setIsSaving(true);
        try {
            const newItem: AcademicEnrichment = {
                id: Date.now().toString(),
                type: formData.type as any,
                level: formData.level as any,
                status: formData.status as any,
                category: formData.category || "General",
                title: formData.title,
                organization: formData.organization || "Hackathon Host",
                date: new Date().toISOString(),
                isElite: false
            };

            await onSave(newItem);
            setOpen(false);
            setFormData({
                type: "Project",
                level: "College",
                status: "Participated",
                category: "Hackathon"
            });
        } catch (error) {
            // Handled by parent
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <PlusCircle className="h-4 w-4" /> Add Applied Knowledge
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Applied Knowledge Event</DialogTitle>
                    <DialogDescription>Record hackathons, coding contests, and innovation challenges.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Event Category</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, category: val })} defaultValue={formData.category}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    {["Hackathon", "Coding Contest", "Paper Presentation", "Project Expo", "Innovation Challenge", "Technical Quiz", "Startup Pitch", "Research Conference", "Sports", "Cultural"].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Level</Label>
                            <Select onValueChange={(val) => setFormData({ ...formData, level: val as any })} defaultValue={formData.level}>
                                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                                <SelectContent>
                                    {["College", "Intercollege", "State", "National", "International"].map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Achievement Status</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, status: val as any })} defaultValue={formData.status}>
                            <SelectTrigger><SelectValue placeholder="Select outcome" /></SelectTrigger>
                            <SelectContent>
                                {["Participated", "Runner-up", "Winner", "Completed"].map(a => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Event Title</Label>
                        <Input
                            placeholder="e.g. Smart India Hackathon 2024, Coding Pro Challenge"
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} className="w-full" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Record"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


