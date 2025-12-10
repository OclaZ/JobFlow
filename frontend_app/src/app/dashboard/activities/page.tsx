"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { LinkedInActivity } from "@/types";
import { motion } from "framer-motion";
import { Plus, Trash2, ExternalLink } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

export default function ActivitiesPage() {
    const [activities, setActivities] = useState<LinkedInActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        apiRequest("/linkedin_activities/")
            .then(setActivities)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this activity?")) return;
        try {
            await apiRequest(`/linkedin_activities/${id}`, { method: "DELETE" });
            setActivities(activities.filter(a => a.id !== id));
        } catch (error) {
            console.error("Failed to delete activity", error);
            alert("Failed to delete activity");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>{t("linkedinActivities")}</h1>
                <button className="btn btn-primary" onClick={() => window.location.href = "/dashboard/activities/new"} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={18} /> {t("addActivity")}
                </button>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                            <th style={{ padding: "1rem" }}>{t("date")}</th>
                            <th style={{ padding: "1rem" }}>{t("type")}</th>
                            <th style={{ padding: "1rem" }}>Description</th>
                            <th style={{ padding: "1rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((activity) => (
                            <motion.tr key={activity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: "1px solid var(--card-border)" }}>
                                <td style={{ padding: "1rem" }}>{activity.activity_date}</td>
                                <td style={{ padding: "1rem" }}>
                                    <span style={{
                                        padding: "0.25rem 0.5rem",
                                        borderRadius: "999px",
                                        fontSize: "0.75rem",
                                        background: "var(--background)",
                                        border: "1px solid var(--card-border)"
                                    }}>
                                        {activity.activity_type}
                                    </span>
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <div>{activity.description}</div>
                                    {activity.link && (
                                        <a href={activity.link} target="_blank" style={{ fontSize: "0.8rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                                            {t("view")} <ExternalLink size={12} />
                                        </a>
                                    )}
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <button
                                        onClick={() => handleDelete(activity.id)}
                                        style={{ color: "var(--destructive)", background: "none", border: "none", cursor: "pointer" }}
                                        title={t("delete")}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
