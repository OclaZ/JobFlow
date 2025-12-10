"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { RECRUITMENT_PLATFORMS } from "@/lib/constants";

export default function NewJobOfferPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        offer_title: "",
        platform: "",
        status: "Pending",
        offer_link: "",
        application_sent: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiRequest("/job_offers/", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            router.push("/dashboard/offers");
        } catch (error) {
            console.error(error);
            alert("Failed to create offer");
        }
    };

    return (
        <div style={{ maxWidth: "600px" }}>
            <h1 style={{ marginBottom: "2rem" }}>Add Job Offer</h1>

            <div className="card">
                <form onSubmit={handleSubmit} className="grid grid-cols-1">
                    <div>
                        <label className="label">Offer Title</label>
                        <input
                            type="text"
                            required
                            value={formData.offer_title}
                            onChange={(e) => setFormData({ ...formData, offer_title: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Platform</label>
                        <input
                            list="platforms"
                            type="text"
                            required
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                            className="input"
                            placeholder="Select or type platform..."
                        />
                        <datalist id="platforms">
                            {RECRUITMENT_PLATFORMS.map((category) => (
                                <optgroup key={category.category} label={category.category}>
                                    {category.items.map((item) => (
                                        <option key={item} value={item} />
                                    ))}
                                </optgroup>
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="label">Link</label>
                        <input
                            type="url"
                            value={formData.offer_link}
                            onChange={(e) => setFormData({ ...formData, offer_link: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                                type="checkbox"
                                checked={formData.application_sent}
                                onChange={(e) => setFormData({ ...formData, application_sent: e.target.checked })}
                            />
                            Application Sent?
                        </label>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                        <button type="submit" className="btn btn-primary">Save Offer</button>
                        <button type="button" className="btn" onClick={() => router.back()} style={{ background: "var(--card-border)" }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
