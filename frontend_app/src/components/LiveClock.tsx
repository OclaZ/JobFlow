"use client";

import { useState, useEffect } from "react";

export function LiveClock() {
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!time) return null;

    return (
        <div style={{
            fontFamily: "monospace",
            fontSize: "0.9rem",
            fontWeight: "bold",
            color: "var(--foreground)",
            padding: "0.25rem 0.5rem",
            borderRadius: "4px",
            background: "var(--secondary)",
            border: "1px solid var(--card-border)"
        }}>
            {time.toLocaleTimeString()}
        </div>
    );
}
