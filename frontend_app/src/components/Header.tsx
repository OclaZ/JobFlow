"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { LiveClock } from "./LiveClock";
import { useLanguage } from "./LanguageProvider";
import { DailyGoal } from "./DailyGoal";

export default function Header() {
    const pathname = usePathname();
    const { language, setLanguage } = useLanguage();

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
            </div>
        </header>
    );
}
