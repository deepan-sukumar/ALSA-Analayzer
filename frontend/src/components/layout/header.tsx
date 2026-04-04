"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, UserCircle, Sun, Moon } from "lucide-react";
import { ProfileDialog } from "@/components/profile-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

export function Header() {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();

    const getAvatar = (): string | undefined => {
        if (user?.gender === "MALE") return "https://avatar.iran.liara.run/public/boy";
        if (user?.gender === "FEMALE") return "https://avatar.iran.liara.run/public/girl";
        return undefined;
    };

    const userName = user?.name || "Guest";
    const userRole = user?.role || "guest";
    const userEmail = user?.email || "";

    const [profileOpen, setProfileOpen] = useState(false);

    const isDark = theme === "dark";

    return (
        <header className="relative z-30 flex h-16 items-center gap-4 bg-transparent px-6 shadow-none">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Access dashboard navigation and user settings</SheetDescription>
                    </SheetHeader>
                    <Sidebar
                        role={
                            userRole === "faculty" || userRole === "student" || userRole === "admin"
                                ? userRole
                                : "student"
                        }
                        isMobile
                    />
                </SheetContent>
            </Sheet>

            <div className="flex w-full justify-end items-center gap-3">

                {/* ── Theme Toggle ── */}
                <button
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className={`
                        group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border font-bold text-xs
                        transition-all duration-300 select-none
                        ${isDark
                            ? "bg-slate-800 border-slate-700 text-yellow-300 hover:bg-slate-700 hover:border-slate-600 shadow-inner"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 shadow-sm"
                        }
                    `}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {/* Track */}
                    <div className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${isDark ? "bg-indigo-600" : "bg-slate-200"}`}>
                        {/* Thumb */}
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${isDark ? "translate-x-5 bg-yellow-300" : "translate-x-0.5 bg-white"}`}>
                            {isDark
                                ? <Moon className="h-2.5 w-2.5 text-indigo-700" />
                                : <Sun className="h-2.5 w-2.5 text-amber-500" />
                            }
                        </div>
                    </div>
                    <span className="hidden sm:block">{isDark ? "Dark" : "Light"}</span>
                </button>

                {/* ── User Profile ── */}
                <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-none text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{userRole}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10 border-2 border-primary/10 ring-2 ring-transparent hover:ring-indigo-300 transition-all">
                                    {getAvatar() && <AvatarImage src={getAvatar()} alt={userName} />}
                                    <AvatarFallback className="font-black text-sm">{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{userName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                                <UserCircle className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            {userRole === "admin" && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/settings" className="w-full cursor-pointer">
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 dark:text-red-400 focus:text-red-600 dark:text-red-400" onClick={logout}>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
        </header>
    );
}
