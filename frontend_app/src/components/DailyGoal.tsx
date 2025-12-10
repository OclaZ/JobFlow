"use client";

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

export function DailyGoal() {
    const { t } = useLanguage();
    const [count, setCount] = useState(0);
    const goal = 5;

    useEffect(() => {
        const fetchDailyGoal = () => {
            const today = new Date().toISOString().split('T')[0];
            apiRequest("/applications/")
                .then(apps => {
                    // Check both application_date and dm_sent_date
                    const todayApps = apps.filter((a: any) =>
                        (a.application_date && a.application_date.startsWith(today)) ||
                        (a.dm_sent_date && a.dm_sent_date.startsWith(today))
                    ).length;
                    setCount(todayApps);
                })
                .catch(console.error);
        };

        fetchDailyGoal(); // Initial fetch
        const interval = setInterval(fetchDailyGoal, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: "flex", alignItems: "center", marginLeft: "1.5rem", gap: "0.75rem", background: "var(--card-bg)", padding: "0.25rem 0.75rem", borderRadius: "999px", border: "1px solid var(--card-border)" }} title={`${count}/${goal} Daily Goal`}>
            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--muted-foreground)" }}>Daily Goal:</span>
            <div style={{ width: 45, height: 45 }}>
                <CircularProgressbar
                    value={count}
                    maxValue={goal}
                    text={`${count}/${goal}`}
                    styles={buildStyles({
                        textSize: '28px',
                        pathColor: count >= goal ? '#22c55e' : 'var(--primary)',
                        textColor: 'var(--foreground)',
                        trailColor: 'var(--secondary)',
                    })}
                />
            </div>
        </div>
    );
}
