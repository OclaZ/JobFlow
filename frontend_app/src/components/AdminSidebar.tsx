"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useClerk } from "@clerk/nextjs";
import {
    LayoutDashboard,
    LogOut,
    Shield,
    Users,
    Briefcase,
    Activity
} from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut } = useClerk();

    const links = [
        { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/admin/users", label: "User Management", icon: Users },
        { href: "/admin/offers", label: "Global Offers", icon: Briefcase },
        { href: "/admin/analytics", label: "Analytics & System", icon: Activity },
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
                <div className="flex flex-col">
                    <span style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--foreground)" }}>
                        SimplonJob
                    </span>
                    <span className="text-xs text-primary font-semibold tracking-wider">ADMIN</span>
                </div>
            </div>

            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="text-xs font-semibold text-muted-foreground mb-2 px-4 uppercase tracking-wider">Command Center</div>
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

            <div className="mt-auto border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <button
                    onClick={async () => {
                        await signOut();
                        window.location.href = "/";
                    }}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "var(--radius)",
                        background: "rgba(239, 68, 68, 0.1)", // destructive/10
                        color: "var(--destructive)",
                        width: "100%",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: 500
                    }}
                >
                    <LogOut size={20} />
                    Secure Logout
                </button>
            </div>
        </aside>
    );
}
