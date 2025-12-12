"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Server, Building, Database, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminAnalyticsPage() {
    const { getToken, isLoaded } = useAuth();
    const [topCompanies, setTopCompanies] = useState<any[]>([]);
    const [systemHealth, setSystemHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;
        const fetchData = async () => {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
            try {
                const [companiesData, healthData] = await Promise.all([
                    fetch(`${API_URL}/admin/analytics/top-companies`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
                    fetch(`${API_URL}/admin/system/health`, { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json())
                ]);
                setTopCompanies(companiesData);
                setSystemHealth(healthData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isLoaded, getToken]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">System Analytics & Health</h1>
                <p className="text-muted">Deep dive into platform usage metrics and infrastructure status.</p>
            </header>

            <div className="grid grid-cols-1 md-grid-cols-2 gap-8">
                {/* Top Companies Leaderboard */}
                <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold">Top Target Companies</h3>
                    </div>
                    <div className="space-y-4">
                        {topCompanies.length > 0 ? (
                            topCompanies.map((company: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--secondary)] transition-colors border" style={{ borderColor: "var(--border)" }}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                                                index === 1 ? "bg-gray-100 text-gray-700" :
                                                    index === 2 ? "bg-orange-100 text-orange-700" :
                                                        "bg-blue-50 text-blue-600"
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <span className="font-semibold">{company.name}</span>
                                    </div>
                                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                        {company.count} Apps
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted text-center py-8">Not enough data yet.</p>
                        )}
                    </div>
                </div>

                {/* System Health & Tools */}
                <div className="flex flex-col gap-8">
                    {/* Health Status */}
                    <div className="bg-white p-6 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: systemHealth?.status === 'healthy' ? '#22c55e' : '#ef4444', borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Server className="w-5 h-5" />
                                System Status
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${systemHealth?.status === 'healthy' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                {systemHealth?.status || "Checking..."}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--secondary)] rounded-lg text-center">
                                <p className="text-sm text-muted rounded-md mb-1">Database Latency</p>
                                <p className="text-2xl font-mono font-bold">{systemHealth?.db_latency_ms || 0}<span className="text-sm font-normal text-muted ml-1">ms</span></p>
                            </div>
                            <div className="p-4 bg-[var(--secondary)] rounded-lg text-center">
                                <p className="text-sm text-muted rounded-md mb-1">Server Time</p>
                                <p className="text-lg font-mono font-bold">{systemHealth ? new Date(systemHealth.timestamp * 1000).toLocaleTimeString() : "..."}</p>
                            </div>
                        </div>
                    </div>

                    {/* Data Export Tools */}
                    <div className="bg-white p-6 rounded-xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                            <Database className="w-5 h-5" />
                            Data Export
                        </h3>
                        <button className="w-full py-3 border border-dashed border-primary text-primary hover:bg-primary/5 rounded-lg flex items-center justify-center gap-2 transition-all">
                            <FileText className="w-4 h-4" />
                            Download User List (CSV)
                        </button>
                        <p className="text-xs text-muted mt-2 text-center">Generates a generic CSV report of all registered users.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
