"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { ResponsiveContainer, Tooltip, Layer, Rectangle } from "recharts";
import { Sankey } from "recharts";
import { useLanguage } from "./LanguageProvider";

export function SankeyChart() {
    const [data, setData] = useState<any>(null);
    const { t } = useLanguage();

    useEffect(() => {
        apiRequest("/applications/")
            .then(apps => {
                const applied = apps.length;
                const interviews = apps.filter((a: any) => a.final_status === "Entretien").length;
                const offers = apps.filter((a: any) => a.final_status === "Accepté").length;
                const rejected = apps.filter((a: any) => a.final_status === "Refusé").length;
                const pending = apps.filter((a: any) => a.final_status === "Pending").length;

                setData({
                    nodes: [
                        { name: t("applications") },
                        { name: t("interview") },
                        { name: t("rejected") },
                        { name: t("pending") },
                        { name: t("accepted") }
                    ],
                    links: [
                        { source: 0, target: 1, value: interviews + 0.1 }, // Add small value to avoid 0 width
                        { source: 0, target: 2, value: rejected + 0.1 },
                        { source: 0, target: 3, value: pending + 0.1 },
                        { source: 1, target: 4, value: offers + 0.1 }
                    ]
                });
            })
            .catch(console.error);
    }, [t]);

    if (!data) return <div>Loading...</div>;

    return (
        <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={{ stroke: 'var(--card-border)', strokeWidth: 0 }}
                    nodePadding={50}
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    link={{ stroke: 'var(--primary)', strokeOpacity: 0.3 }}
                >
                    <Tooltip />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}
