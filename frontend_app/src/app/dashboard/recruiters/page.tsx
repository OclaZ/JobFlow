"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Recruiter } from "@/types";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

export default function RecruitersPage() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        apiRequest("/recruiters/")
            .then(setRecruiters)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleUpdate = async (recruiter: Recruiter, updates: Partial<Recruiter>) => {
        try {
            await apiRequest(`/recruiters/${recruiter.id}`, {
                method: "PUT",
                body: JSON.stringify({ ...recruiter, ...updates }),
            });
            setRecruiters(recruiters.map(r => r.id === recruiter.id ? { ...r, ...updates } : r));
        } catch (error) {
            console.error("Failed to update recruiter", error);
            alert("Failed to update recruiter");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this recruiter?")) return;
        try {
            await apiRequest(`/recruiters/${id}`, { method: "DELETE" });
            setRecruiters(recruiters.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to delete recruiter", error);
            alert("Failed to delete recruiter");
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>{t("recruiters")}</h1>
                <button className="btn btn-primary" onClick={() => window.location.href = "/dashboard/recruiters/new"} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={18} /> {t("addRecruiter")}
                </button>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                            <th style={{ padding: "1rem" }}>{t("name")}</th>
                            <th style={{ padding: "1rem" }}>{t("company")}</th>
                            <th style={{ padding: "1rem" }}>{t("status")}</th>
                            <th style={{ padding: "1rem" }}>DM Sent</th>
                            <th style={{ padding: "1rem" }}>Response</th>
                            <th style={{ padding: "1rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recruiters.map((recruiter) => (
                            <motion.tr key={recruiter.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderBottom: "1px solid var(--card-border)" }}>
                                <td style={{ padding: "1rem" }}>
                                    <div style={{ fontWeight: "500" }}>{recruiter.name}</div>
                                    {recruiter.linkedin_profile && <a href={recruiter.linkedin_profile} target="_blank" style={{ fontSize: "0.8rem", color: "var(--primary)" }}>LinkedIn</a>}
                                </td>
                                <td style={{ padding: "1rem" }}>{recruiter.company}</td>
                                <td style={{ padding: "1rem" }}>
                                    <select
                                        value={recruiter.connection_status}
                                        onChange={(e) => handleUpdate(recruiter, { connection_status: e.target.value })}
                                        style={{ padding: "0.25rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                                    >
                                        <option value="Pending">{t("pending")}</option>
                                        <option value="Connected">{t("connected")}</option>
                                        <option value="Rejected">{t("rejected")}</option>
                                    </select>
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={recruiter.dm_sent}
                                        onChange={(e) => handleUpdate(recruiter, { dm_sent: e.target.checked })}
                                    />
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={recruiter.response_received}
                                        onChange={(e) => handleUpdate(recruiter, { response_received: e.target.checked })}
                                    />
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <button
                                        onClick={() => handleDelete(recruiter.id)}
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
