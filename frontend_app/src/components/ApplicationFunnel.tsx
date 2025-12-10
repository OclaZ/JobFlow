"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Tooltip, Cell } from "recharts";
import { useLanguage } from "./LanguageProvider";



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
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--card-border)" />
                    <XAxis type="number" stroke="var(--muted-foreground)" hide />
                    <YAxis type="category" dataKey="name" stroke="var(--foreground)" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--card-border)',
                            borderRadius: 'var(--radius)',
                            color: 'var(--foreground)'
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="value" position="right" fill="var(--foreground)" />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
