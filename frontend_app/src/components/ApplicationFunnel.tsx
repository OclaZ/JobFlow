"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from "recharts";
import { useLanguage } from "./LanguageProvider";

const COLORS = ['#3b82f6', '#eab308', '#22c55e', '#ef4444']; // Blue, Yellow, Green, Red

export function ApplicationFunnel() {
    const [data, setData] = useState<any[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        apiRequest("/applications/")
            .then(apps => {
                const total = apps.length;
                const interviews = apps.filter((a: any) => a.final_status === "Entretien").length;
                const offers = apps.filter((a: any) => a.final_status === "Accepté").length;
                // const rejected = apps.filter((a: any) => a.final_status === "Refusé").length;

                // Funnel data: Applications -> Interviews -> Offers
                setData([
                    { value: total, name: t("applications"), fill: '#3b82f6' },
                    { value: interviews, name: t("interviews"), fill: '#eab308' },
                    { value: offers, name: t("accepted"), fill: '#22c55e' }
                ]);
            })
            .catch(console.error);
    }, [t]);

    if (data.length === 0) return <div>Loading...</div>;

    return (
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--foreground)'
                        }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Funnel
                        dataKey="value"
                        data={data}
                        isAnimationActive
                    >
                        <LabelList position="right" fill="var(--foreground)" stroke="none" dataKey="name" />
                        <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
                    </Funnel>
                </FunnelChart>
            </ResponsiveContainer>
        </div>
    );
}
