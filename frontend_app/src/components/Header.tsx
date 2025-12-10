"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LiveClock } from "./LiveClock";
import { useLanguage } from "./LanguageProvider";
import { DailyGoal } from "./DailyGoal";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function Header() {
    const pathname = usePathname();
    const { language, setLanguage } = useLanguage();
    const [avatar, setAvatar] = useState<string | null>(null);

    useEffect(() => {
        // Fetch users avatar
        apiRequest("/users/me")
            .then(user => {
                if (user.avatar_url) setAvatar(user.avatar_url);
            })
            .catch(() => { }); // Ignore error on header
    }, []);

    // Helper to get a readable title from the path
    const getTitle = () => {
        const path = pathname.split("/").pop();
        if (!path || path === "dashboard") return "Dashboard";
        return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
    };

    return (
        <header style={{
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 2rem",
            borderBottom: "1px solid var(--card-border)",
            background: "var(--background)",
            position: "sticky",
            top: 0,
            zIndex: 40
        }}>
            <div style={{ display: "flex", alignItems: "center" }}>
                <h2 style={{ textTransform: "capitalize", marginRight: "1rem" }}>{getTitle()}</h2>
                <DailyGoal />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <LiveClock />

                <div style={{ display: "flex", background: "var(--secondary)", borderRadius: "20px", padding: "2px", border: "1px solid var(--card-border)" }}>
                    <button
                        onClick={() => setLanguage('en')}
                        style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            border: "none",
                            background: language === 'en' ? "var(--primary)" : "transparent",
                            color: language === 'en' ? "white" : "var(--muted-foreground)",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('fr')}
                        style={{
                            padding: "4px 12px",
                            borderRadius: "16px",
                            border: "none",
                            background: language === 'fr' ? "var(--primary)" : "transparent",
                            color: language === 'fr' ? "white" : "var(--muted-foreground)",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                    >
                        FR
                    </button>
                </div>

                <div style={{ width: "1px", height: "24px", background: "var(--card-border)" }}></div>
                <ThemeToggle />

                <Link href="/dashboard/profile" style={{ display: "block", textDecoration: "none" }}>
                    <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        border: "2px solid var(--primary)", overflow: "hidden",
                        background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer"
                    }}>
                        {avatar ? (
                            <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: "1rem" }}>👤</span>
                        )}
                    </div>
                </Link>
            </div>
        </header>
    );
}
