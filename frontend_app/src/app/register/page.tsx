"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { motion } from "framer-motion";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "collaborateur"
    });
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await apiRequest("/users/", {
                method: "POST",
                body: JSON.stringify(formData),
            });
            // Auto login or redirect to login
            router.push("/login?registered=true");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Registration failed. Email might be taken.");
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--background)" }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}
            >
                <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Create Account</h1>

                {error && <div style={{ color: "var(--destructive)", marginBottom: "1rem", textAlign: "center" }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Full Name</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "0.5rem" }}>Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius)", border: "1px solid var(--card-border)" }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Register</button>
                </form>

                <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>
                    Already have an account? <a href="/login" style={{ color: "var(--primary)" }}>Login</a>
                </div>
            </motion.div>
        </div>
    );
}
