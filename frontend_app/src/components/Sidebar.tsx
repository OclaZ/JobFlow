"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Briefcase,
    Users,
    Linkedin,
    FileText,
    KanbanSquare,
    Calendar
} from "lucide-react";

import { useLanguage } from "./LanguageProvider";

export default function Sidebar() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const links = [
        { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/dashboard/offers", label: t("jobOffers"), icon: Briefcase },
        { href: "/dashboard/recruiters", label: t("recruiters"), icon: Users },
        { href: "/dashboard/activities", label: t("linkedinActivities"), icon: Linkedin },
        { href: "/dashboard/applications", label: t("applications"), icon: FileText },
        { href: "/dashboard/board", label: t("kanbanBoard"), icon: KanbanSquare },
        { href: "/dashboard/calendar", label: t("calendar"), icon: Calendar },
    ];

    return (
        <aside style={{
            width: "var(--sidebar-width)",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--card-border)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            zIndex: 50
        }}>
            <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Image
                    src="/simplon_logo.png"
                    alt="SimplonJob Logo"
                    width={32}
                    height={32}
                    style={{ borderRadius: "8px" }}
                />
                <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--foreground)" }}>
                    SimplonJob
                </span>
            </div>

            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link key={link.href} href={link.href} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            borderRadius: "var(--radius)",
                            background: isActive ? "var(--primary)" : "transparent",
                            color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                            textDecoration: "none",
                            transition: "all 0.2s",
                            fontWeight: isActive ? 500 : 400
                        }}>
                            <Icon size={20} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
