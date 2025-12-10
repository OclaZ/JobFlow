"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { motion } from "framer-motion";

export default function NewRecruiterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        linkedin_profile: "",
        sector: "",
        connection_request_sent: false,
        connection_status: "Pending",
        dm_sent: false,
        response_received: false,
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest("/recruiters/", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            router.push("/dashboard/recruiters");
        } catch (error) {
            console.error(error);
            alert("Failed to create recruiter");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Add Recruiter</h1>

            <div className="card">
                <form onSubmit={handleSubmit} className="grid grid-cols-1">
                    <div className="grid grid-cols-2" style={{ gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "0.5rem" }}>Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                            />
                        </div>
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
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>LinkedIn Profile</label>
                        <input
                            type="url"
                            value={formData.linkedin_profile}
                            onChange={(e) => setFormData({ ...formData, linkedin_profile: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Sector</label>
                        <input
                            type="text"
                            value={formData.sector}
                            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={formData.connection_request_sent}
                                onChange={(e) => setFormData({ ...formData, connection_request_sent: e.target.checked })}
                            />
                            Connection Sent?
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={formData.dm_sent}
                                onChange={(e) => setFormData({ ...formData, dm_sent: e.target.checked })}
                            />
                            DM Sent?
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={formData.response_received}
                                onChange={(e) => setFormData({ ...formData, response_received: e.target.checked })}
                            />
                            Response Received?
                        </label>
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
                        <button type="submit" className="btn btn-primary">Save Recruiter</button>
                        <button type="button" className="btn" onClick={() => router.back()} style={{ background: "var(--card-border)" }}>Cancel</button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
