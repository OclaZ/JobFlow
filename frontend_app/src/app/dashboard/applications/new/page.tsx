"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { motion } from "framer-motion";

export default function NewApplicationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        company: "",
        position: "",
        company_link: "",
        offer_link: "",
        recruiter_name: "",
        dm_sent_date: "",
        follow_up_5_date: "",
        follow_up_15_date: "",
        follow_up_30_date: "",
        final_status: "Pending",
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Clean up empty dates
            const dataToSend = { ...formData };
            ['dm_sent_date', 'follow_up_5_date', 'follow_up_15_date', 'follow_up_30_date'].forEach(key => {
                if (!dataToSend[key as keyof typeof dataToSend]) {
                    delete dataToSend[key as keyof typeof dataToSend];
                }
            });

            await apiRequest("/applications/", {
                method: "POST",
                body: JSON.stringify(dataToSend),
            });
            router.push("/dashboard/applications");
        } catch (error) {
            console.error(error);
            alert("Failed to create application");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Add Application</h1>

            <div className="card">
                <form onSubmit={handleSubmit} className="grid grid-cols-1">
                    <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Company</label>
                            <input
                                type="text"
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Position</label>
                            <input
                                type="text"
                                required
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Status</label>
                        <select
                            value={formData.final_status}
                            onChange={(e) => setFormData({ ...formData, final_status: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        >
                            <option value="Pending">Pending</option>
                            <option value="Entretien">Interview</option>
                            <option value="Accepté">Accepted</option>
                            <option value="Refusé">Rejected</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Company Link</label>
                            <input
                                type="url"
                                value={formData.company_link}
                                onChange={(e) => setFormData({ ...formData, company_link: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Offer Link</label>
                            <input
                                type="url"
                                value={formData.offer_link}
                                onChange={(e) => setFormData({ ...formData, offer_link: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Recruiter Name</label>
                        <input
                            type="text"
                            value={formData.recruiter_name}
                            onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>DM Sent Date</label>
                            <input
                                type="date"
                                value={formData.dm_sent_date}
                                onChange={(e) => setFormData({ ...formData, dm_sent_date: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Follow-up J+5</label>
                            <input
                                type="date"
                                value={formData.follow_up_5_date}
                                onChange={(e) => setFormData({ ...formData, follow_up_5_date: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <button type="submit" className="btn btn-primary">Save Application</button>
                        <button type="button" className="btn" onClick={() => router.back()} style={{ background: "var(--card-border)" }}>Cancel</button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
