"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { motion } from "framer-motion";

export default function NewActivityPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        activity_date: new Date().toISOString().split('T')[0],
        activity_type: "Post",
        description: "",
        link: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest("/linkedin_activities/", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            router.push("/dashboard/activities");
        } catch (error) {
            console.error(error);
            alert("Failed to create activity");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>Add LinkedIn Activity</h1>

            <div className="card">
                <form onSubmit={handleSubmit} className="grid grid-cols-1" style={{ gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Date</label>
                        <input
                            type="date"
                            required
                            value={formData.activity_date}
                            onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Type</label>
                        <select
                            value={formData.activity_type}
                            onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        >
                            <option value="Post">Post</option>
                            <option value="Comment">Comment</option>
                            <option value="Message">Message</option>
                            <option value="Connection Request">Connection Request</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Link (Optional)</label>
                        <input
                            type="url"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <button type="submit" className="btn btn-primary">Save Activity</button>
                        <button type="button" className="btn" onClick={() => router.back()} style={{ background: "var(--card-border)" }}>Cancel</button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
