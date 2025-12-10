"use client";

import { useEffect, useState } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { apiRequest } from "@/lib/api";
import { Tooltip } from "react-tooltip";
export function ActivityHeatmap() {
    const [values, setValues] = useState<{ date: string; count: number }[]>([]);

    useEffect(() => {
        apiRequest("/applications/")
            .then(apps => {
                const dateMap = new Map<string, number>();
                apps.forEach((app: any) => {
                    const date = app.application_date; // Assuming YYYY-MM-DD
                    if (date) {
                        dateMap.set(date, (dateMap.get(date) || 0) + 1);
                    }
                });

                const heatmapData = Array.from(dateMap.entries()).map(([date, count]) => ({
                    date,
                    count
                }));
                setValues(heatmapData);
            })
            .catch(console.error);
    }, []);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // Start of current year

    return (
        <div style={{ width: "100%" }}>
            <CalendarHeatmap
                startDate={startDate}
                endDate={today}
                values={values}
                classForValue={(value) => {
                    if (!value) {
                        return "color-empty";
                    }
                    return `color-scale-${Math.min(value.count, 4)}`;
                }}
                tooltipDataAttrs={(value: any) => {
                    if (!value || !value.date) {
                        return { "data-tooltip-id": "heatmap-tooltip", "data-tooltip-content": "No applications" } as any;
                    }
                    return {
                        "data-tooltip-id": "heatmap-tooltip",
                        "data-tooltip-content": `${value.date}: ${value.count} applications`,
                    } as any;
                }}
                showWeekdayLabels
            />
            <Tooltip id="heatmap-tooltip" />
            <style jsx global>{`
                .react-calendar-heatmap text {
                    font-size: 10px;
                    fill: var(--muted-foreground);
                }
                .react-calendar-heatmap .color-empty {
                    fill: var(--secondary);
                }
                .react-calendar-heatmap .color-scale-1 { fill: #dbeafe; }
                .react-calendar-heatmap .color-scale-2 { fill: #93c5fd; }
                .react-calendar-heatmap .color-scale-3 { fill: #3b82f6; }
                .react-calendar-heatmap .color-scale-4 { fill: #1e40af; }
            `}</style>
        </div>
    );
}
