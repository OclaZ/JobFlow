"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageProvider";
import { ApplicationFunnel } from "@/components/ApplicationFunnel";
import { ActivityHeatmap } from "@/components/ActivityHeatmap";

interface Stats {
    total_dm_sent: number;
    total_responses: number;
    response_rate: number;
    total_applications: number;
    interviews: number;
    evolution: { name: string; applications: number; responses: number }[];
    platforms: { name: string; value: number }[];
    upcoming_followups: { company: string; position: string; date: string; type: string }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        apiRequest("/dashboard/stats")
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>{t("dashboardOverview")}</motion.h1>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={() => {
                        const token = localStorage.getItem("token");
                        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/me/report`, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                            .then(res => res.blob())
                            .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = "report.pdf";
                                a.click();
                            });
                    }}
                >
                    {t("exportPdf")}
                </motion.button>
            </div>

            <div className="grid grid-cols-4">
                {[
                    { title: t("totalDmsSent"), value: stats?.total_dm_sent },
                    { title: t("responsesReceived"), value: stats?.total_responses },
                    { title: t("responseRate"), value: `${stats?.response_rate.toFixed(1)}%` },
                    { title: t("interviews"), value: stats?.interviews, color: "var(--primary)" }
                ].map((item, index) => (
                    <motion.div key={index} variants={itemVariants} className="card">
                        <h3 style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{item.title}</h3>
                        <p style={{ fontSize: "2rem", fontWeight: "bold", marginTop: "0.5rem", color: item.color }}>{item.value}</p>
                    </motion.div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "2rem", marginTop: "2rem" }}>
                <div className="card">
                    <h3 style={{ marginBottom: "1rem" }}>Application Funnel</h3>
                    <ApplicationFunnel />
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: "1rem" }}>Activity Heatmap</h3>
                    <ActivityHeatmap />
                </div>
            </div>

            <div style={{ marginTop: "2rem" }} className="grid grid-cols-2">
                <motion.div variants={itemVariants} className="card" style={{ minHeight: "350px" }}>
                    <h3>{t("performanceTrends")}</h3>
                    <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={stats?.evolution || []}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                                <YAxis stroke="var(--muted-foreground)" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="applications" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="responses" stroke="var(--destructive)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card" style={{ minHeight: "350px" }}>
                    <h3>{t("platformDistribution")}</h3>
                    <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.platforms || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.platforms || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', borderRadius: 'var(--radius)', color: 'var(--foreground)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            <motion.div variants={itemVariants} className="card" style={{ marginTop: "2rem" }}>
                <h3>{t("upcomingFollowups")}</h3>
                <div style={{ marginTop: "1rem" }}>
                    {stats?.upcoming_followups && stats.upcoming_followups.length > 0 ? (
                        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                                    <th style={{ padding: "0.5rem" }}>{t("company")}</th>
                                    <th style={{ padding: "0.5rem" }}>{t("position")}</th>
                                    <th style={{ padding: "0.5rem" }}>{t("date")}</th>
                                    <th style={{ padding: "0.5rem" }}>{t("type")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.upcoming_followups.map((task: { company: string; position: string; date: string; type: string }, i: number) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--card-border)" }}>
                                        <td style={{ padding: "0.5rem" }}>{task.company}</td>
                                        <td style={{ padding: "0.5rem" }}>{task.position}</td>
                                        <td style={{ padding: "0.5rem", color: "var(--primary)", fontWeight: "bold" }}>{task.date}</td>
                                        <td style={{ padding: "0.5rem" }}>{task.type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ color: "var(--text-muted)" }}>{t("noFollowups")}</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
