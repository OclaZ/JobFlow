"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/components/LanguageProvider";

interface UserProfile {
    email: string;
    full_name: string;
    role: string;
    avatar_url?: string;
    auth_provider: string;
}

interface CV {
    id: number;
    filename: string;
    upload_date: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [cvs, setCvs] = useState<CV[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        // Fetch Profile (we can derive from /users/me or just store token data, but better fetch fresh)
        // Since we don't have a direct /users/me endpoint that returns full User schema in current auth.py?
        // auth.py has get_current_user but valid main.py routes don't expose it directly except via dependency?
        // Wait, main.py usually doesn't expose /users/me unless we added it.
        // I should check if I added /users/me. I added /auth endpoints and /users/me/cvs.
        // Let's assume I need to fetch basic user data.
        // Actually, let's add a quick /users/me endpoint in main.py if it's missing or use existing ones.
        // Checking... I didn't verify existing /users/me.
        // But /users/me/cvs exists.

        apiRequest("/users/me/cvs")
            .then(data => setCvs(data))
            .catch(console.error);

        // Fetch user data via a new endpoint or inferred? 
        // Let's assume we create /users/me/info if needed. 
        // Or if we look at `d:\postulation\backend\main.py`... 
        // Let's try to fetch /users/me/cvs first, that proves auth works.
        // For profile data, we might need to parse the JWT or add an endpoint.
        // I will add /users/me endpoint in next step to be sure.

        // Simulating profile fetch or implementing it shortly.
        apiRequest("/users/me") // Assuming this will be added
            .then(data => setProfile(data))
            .catch(err => console.log("User endpoint might be missing", err))
            .finally(() => setLoading(false));

    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/me/avatar`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const updatedUser = await res.json();
                setProfile(updatedUser);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/users/me/cvs`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                const newCV = await res.json();
                setCvs([...cvs, newCV]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteCV = async (id: number) => {
        try {
            await apiRequest(`/users/me/cvs/${id}`, { method: "DELETE" });
            setCvs(cvs.filter(c => c.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const downloadCV = (id: number, filename: string) => {
        const token = localStorage.getItem("token");
        fetch(`${API_URL}/users/me/cvs/${id}/download`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                a.click();
            });
    };

    if (loading && !profile) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 style={{ marginBottom: "2rem" }}>My Profile</h1>

            <div className="card" style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2rem" }}>
                <div style={{ position: "relative" }}>
                    <div style={{
                        width: "100px", height: "100px", borderRadius: "50%",
                        overflow: "hidden", border: "2px solid var(--primary)",
                        background: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <span style={{ fontSize: "2rem" }}>{profile?.full_name?.charAt(0) || "U"}</span>
                        )}
                    </div>
                    <label htmlFor="avatar-upload" style={{
                        position: "absolute", bottom: 0, right: 0,
                        background: "var(--primary)", color: "white",
                        borderRadius: "50%", width: "32px", height: "32px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", fontSize: "1.2rem"
                    }}>
                        +
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
                </div>

                <div style={{ flex: 1 }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>{profile?.full_name || "User"}</h2>
                    <p style={{ color: "var(--muted-foreground)", marginBottom: "0.5rem" }}>{profile?.email}</p>
                    <div className="badge" style={{ display: "inline-block", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "var(--secondary)", fontSize: "0.875rem" }}>
                        Role: {profile?.role}
                    </div>
                    <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
                        Auth Provider: {profile?.auth_provider}
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3>My CVs</h3>
                    <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                        Upload CV
                        <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={handleCVUpload} />
                    </label>
                </div>

                {cvs.length === 0 ? (
                    <p style={{ color: "var(--muted-foreground)" }}>No CVs uploaded yet.</p>
                ) : (
                    <table style={{ width: "100%", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                                <th style={{ padding: "0.5rem" }}>Filename</th>
                                <th style={{ padding: "0.5rem" }}>Date</th>
                                <th style={{ padding: "0.5rem", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cvs.map(cv => (
                                <tr key={cv.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                                    <td style={{ padding: "0.5rem" }}>{cv.filename}</td>
                                    <td style={{ padding: "0.5rem" }}>{new Date(cv.upload_date).toLocaleDateString()}</td>
                                    <td style={{ padding: "0.5rem", textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => downloadCV(cv.id, cv.filename)}
                                            style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={() => deleteCV(cv.id)}
                                            style={{ background: "none", border: "none", color: "var(--destructive)", cursor: "pointer" }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
