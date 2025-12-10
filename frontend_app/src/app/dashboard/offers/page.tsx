"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { JobOffer, Application } from "@/types";
import { motion } from "framer-motion";
import { Search, Plus, ExternalLink, CheckCircle, Clock, Trash2, Send } from "lucide-react";

import { useLanguage } from "@/components/LanguageProvider";

export default function JobOffersPage() {
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const { t } = useLanguage();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [offersData, appsData] = await Promise.all([
                apiRequest("/job_offers/"),
                apiRequest("/applications/")
            ]);
            setOffers(offersData);
            setApplications(appsData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getApplicationForOffer = (offer: JobOffer) => {
        if (!offer.offer_link) return undefined;
        return applications.find(app => app.offer_link === offer.offer_link);
    };

    const handleTrack = async (offer: JobOffer) => {
        try {
            const newApp = await apiRequest(`/job_offers/${offer.id}/track`, { method: "POST" });
            setApplications([...applications, newApp]);
        } catch (error) {
            console.error("Failed to track offer", error);
            alert("Failed to track offer");
        }
    };

    const handleStatusChange = async (offer: JobOffer, newStatus: string) => {
        try {
            await apiRequest(`/job_offers/${offer.id}`, {
                method: "PUT",
                body: JSON.stringify({ ...offer, status: newStatus }),
            });
            // Optimistic update
            setOffers(offers.map(o => o.id === offer.id ? { ...o, status: newStatus } : o));
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this offer?")) return;
        try {
            await apiRequest(`/job_offers/${id}`, { method: "DELETE" });
            setOffers(offers.filter(o => o.id !== id));
        } catch (error) {
            console.error("Failed to delete offer", error);
            alert("Failed to delete offer");
        }
    };

    const filteredOffers = offers.filter(o => {
        const matchesSearch = o.offer_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.platform.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>{t("jobOffers")}</h1>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={() => window.location.href = "/dashboard/offers/new"}
                    style={{ gap: "0.5rem" }}
                >
                    <Plus size={18} /> {t("addOffer")}
                </motion.button>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                {/* Search and Filters */}
                <div style={{ position: "relative", flex: 1 }}>
                    <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        type="text"
                        placeholder={t("search")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--card-border)",
                            background: "var(--background)",
                            color: "var(--foreground)"
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: "0.75rem",
                        borderRadius: "var(--radius)",
                        border: "1px solid var(--card-border)",
                        background: "var(--background)",
                        color: "var(--foreground)"
                    }}
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">{t("pending")}</option>
                    <option value="Accepté">{t("accepted")}</option>
                    <option value="Refusé">{t("rejected")}</option>
                </select>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                            <th style={{ padding: "1rem" }}>Title</th>
                            <th style={{ padding: "1rem" }}>Platform</th>
                            <th style={{ padding: "1rem" }}>Status (Owner)</th>
                            <th style={{ padding: "1rem" }}>My Application</th>
                            <th style={{ padding: "1rem" }}>Date</th>
                            <th style={{ padding: "1rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOffers.map((offer) => {
                            const myApp = getApplicationForOffer(offer);
                            return (
                                <motion.tr
                                    key={offer.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ borderBottom: "1px solid var(--card-border)" }}
                                >
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ fontWeight: "500" }}>{offer.offer_title}</div>
                                        {offer.offer_link && (
                                            <a href={offer.offer_link} target="_blank" style={{ fontSize: "0.8rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                                                {t("view")} <ExternalLink size={12} />
                                            </a>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem" }}>{offer.platform}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <select
                                            value={offer.status}
                                            onChange={(e) => handleStatusChange(offer, e.target.value)}
                                            style={{
                                                padding: "0.25rem 0.5rem",
                                                borderRadius: "999px",
                                                fontSize: "0.75rem",
                                                border: "none",
                                                background: offer.status === "Accepté" ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)",
                                                color: offer.status === "Accepté" ? "#166534" : "#374151",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <option value="Pending">{t("pending")}</option>
                                            <option value="Accepté">{t("accepted")}</option>
                                            <option value="Refusé">{t("rejected")}</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        {myApp ? (
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "green" }}>
                                                <CheckCircle size={16} />
                                                <span>Sent ({myApp.final_status})</span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleTrack(offer)}
                                                style={{
                                                    padding: "0.25rem 0.5rem",
                                                    borderRadius: "var(--radius)",
                                                    border: "1px solid var(--primary)",
                                                    background: "transparent",
                                                    color: "var(--primary)",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.25rem",
                                                    fontSize: "0.8rem"
                                                }}
                                            >
                                                <Send size={14} /> My App Sent
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem" }}>{offer.application_date || "-"}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            style={{ color: "var(--destructive)", background: "none", border: "none", cursor: "pointer" }}
                                            title={t("delete")}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredOffers.length === 0 && (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                        No offers found matching your criteria.
                    </div>
                )}
            </div>
        </motion.div>
    );
}
