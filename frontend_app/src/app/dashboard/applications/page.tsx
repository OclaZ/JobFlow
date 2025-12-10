"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Application } from "@/types";
import { motion } from "framer-motion";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { InterviewModal } from "@/components/InterviewModal";

import { useLanguage } from "@/components/LanguageProvider";

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    useEffect(() => {
        apiRequest("/applications/")
            .then(setApplications)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = async (app: Application, updates: Partial<Application>) => {
        // Auto-Calendar Logic
        if (updates.final_status === "Entretien") {
            setSelectedApp(app);
            setIsModalOpen(true);
            return; // Wait for modal to save
        }

        await performUpdate(app, updates);
    };

    const performUpdate = async (app: Application, updates: Partial<Application>) => {
        try {
            await apiRequest(`/applications/${app.id}`, {
                method: "PUT",
                body: JSON.stringify({ ...app, ...updates }),
            });
            setApplications(applications.map(a => a.id === app.id ? { ...a, ...updates } : a));
        } catch (error) {
            console.error("Failed to update application", error);
            alert("Failed to update application");
        }
    };

    const handleSaveInterview = async (date: string) => {
        if (selectedApp) {
            // Save status AND date (using follow_up_5_date as interview date for now)
            // Note: Backend expects YYYY-MM-DD, so we strip the time if present
            await performUpdate(selectedApp, {
                final_status: "Entretien",
                follow_up_5_date: date.split('T')[0]
            });
            setIsModalOpen(false);
            setSelectedApp(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this application?")) return;
        try {
            await apiRequest(`/applications/${id}`, { method: "DELETE" });
            setApplications(applications.filter(a => a.id !== id));
        } catch (error) {
            console.error("Failed to delete application", error);
            alert("Failed to delete application");
        }
    };

    const isStale = (app: Application) => {
        if (app.final_status !== "Pending") return false;
        const date = app.dm_sent_date;
        if (!date) return false;

        const days = (new Date().getTime() - new Date(date).getTime()) / (1000 * 3600 * 24);
        return days > 14;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InterviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveInterview}
                companyName={selectedApp?.company || ""}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>{t("applications")}</h1>
                <button className="btn btn-primary" onClick={() => window.location.href = "/dashboard/applications/new"} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={18} /> {t("addApplication")}
                </button>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                            <th style={{ padding: "1rem" }}>{t("company")}</th>
                            <th style={{ padding: "1rem" }}>{t("position")}</th>
                            <th style={{ padding: "1rem" }}>{t("type")}</th>
                            <th style={{ padding: "1rem" }}>Follow-up J+5</th>
                            <th style={{ padding: "1rem" }}>Follow-up J+15</th>
                            <th style={{ padding: "1rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map((app) => (
                            <motion.tr key={app.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: "1px solid var(--card-border)" }}>
                                <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <div style={{ fontWeight: "500" }}>{app.company}</div>
                                    {isStale(app) && (
                                        <div title="Stale: No activity for 14+ days. Send a follow-up!" style={{ color: "var(--destructive)", cursor: "help" }}>
                                            <AlertCircle size={16} />
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: "1rem" }}>{app.position}</td>
                                <td style={{ padding: "1rem" }}>
                                    <select
                                        value={app.final_status}
                                        onChange={(e) => handleUpdate(app, { final_status: e.target.value })}
                                        style={{
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "999px",
                                            fontSize: "0.75rem",
                                            border: "none",
                                            background: app.final_status === "Entretien" ? "#dbeafe" : "#f3f4f6",
                                            color: app.final_status === "Entretien" ? "#1e40af" : "#374151",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <option value="Pending">{t("pending")}</option>
                                        <option value="Entretien">{t("interview")}</option>
                                        <option value="Accepté">{t("accepted")}</option>
                                        <option value="Refusé">{t("rejected")}</option>
                                    </select>
                                </td>
                                <td style={{ padding: "1rem" }}>{app.follow_up_5_date || "-"}</td>
                                <td style={{ padding: "1rem" }}>{app.follow_up_15_date || "-"}</td>
                                <td style={{ padding: "1rem" }}>
                                    <button
                                        onClick={() => handleDelete(app.id)}
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
