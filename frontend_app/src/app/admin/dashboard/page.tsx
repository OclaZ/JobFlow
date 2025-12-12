"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    Users,
    FileText,
    Briefcase,
    Building,
    Activity,
    UserCheck,
    Database,
    Search,
    Zap
} from "lucide-react";

export default function AdminDashboard() {
    const { isLoaded, userId, getToken } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    // State
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const COLORS = ['var(--primary)', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        if (!isLoaded) return;
        if (!userId) { router.push("/sign-in?redirect_url=/admin/dashboard"); return; }

        const fetchData = async () => {
            try {
                const token = await getToken();
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
                const authFetch = async (endpoint: string) => {
                    const res = await fetch(`${API_URL}${endpoint}`, { headers: { "Authorization": `Bearer ${token}` } });
                    if (!res.ok) throw new Error((await res.json()).detail || `Error ${res.status}`);
                    return res.json();
                };
                const [statsData, activityData] = await Promise.all([
                    authFetch("/admin/stats"),
                    authFetch("/admin/activity")
                ]);
                setStats(statsData);
                setActivities(activityData);
            } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        };
        fetchData();
    }, [isLoaded, userId, getToken, router]);


    if (!isLoaded || loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh] bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error loading dashboard: {error}</div>;
    }

    return (
        <motion.div
            className="max-w-[1600px] mx-auto"
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Admin Command Center</h1>
                <p className="text-muted">Live overview of the SimplonJob ecosystem.</p>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-6 mb-8">
                <MetricCard title="Total Users" value={stats?.total_users || 0} icon={<Users className="w-6 h-6 text-primary" />} delay={0} />
                <MetricCard title="Total Applications" value={stats?.total_applications || 0} icon={<FileText className="w-6 h-6 text-primary" />} delay={0.1} />
                <MetricCard title="Global Offers" value={stats?.total_offers || 0} icon={<Briefcase className="w-6 h-6 text-primary" />} delay={0.2} />
                <MetricCard title="Companies Tracked" value={stats?.total_companies || 0} icon={<Building className="w-6 h-6 text-primary" />} delay={0.3} />
            </div>

            {/* Charts & Activity */}
            <div className="grid grid-cols-1 lg-grid-cols-3 gap-8 mb-8">
                {/* Applications by Platform */}
                <motion.div className="card lg-col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <h3 className="text-lg font-bold mb-6">Applications Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.applications_by_platform || []}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {stats?.applications_by_platform?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Live Activity Feed */}
                <motion.div className="card h-full flex flex-col" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            Live Activity
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 animate-pulse"></span>
                            Real-time
                        </div>
                    </div>

                    <div className="space-y-6 relative pl-2 flex-1 overflow-y-auto max-h-[400px]">
                        {/* Timeline Line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[var(--secondary)]" />

                        {activities && activities.length > 0 ? (
                            activities.map((event: any, i: number) => {
                                let Icon = FileText;
                                let colorClass = "text-blue-500";

                                if (event.icon_type === 'user') { Icon = UserCheck; colorClass = "text-green-500"; }
                                else if (event.icon_type === 'briefcase') { Icon = Briefcase; colorClass = "text-violet-500"; }
                                else if (event.icon_type === 'file-text') { Icon = FileText; colorClass = "text-blue-500"; }

                                return (
                                    <div key={i} className="relative flex items-center gap-4 z-10">
                                        <div className="w-6 h-6 rounded-full bg-background border flex items-center justify-center shrink-0" style={{ borderColor: 'var(--border)' }}>
                                            <Icon className={`w-3 h-3 ${colorClass}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-tight">{event.text}</p>
                                            <p className="text-xs text-muted mt-0.5">{event.time}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center text-sm text-muted py-4">No recent activity found</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

function MetricCard({ title, value, icon, delay }: { title: string; value: number; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            className="card flex flex-col justify-between h-full bg-white p-6 rounded-xl border shadow-sm"
            style={{ borderColor: "var(--border)" }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay }}
            whileHover={{ y: -5 }}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="p-2 bg-[var(--secondary)] rounded-lg">{icon}</span>
            </div>
            <div>
                <p className="text-muted text-sm font-medium uppercase tracking-wide">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
        </motion.div>
    );
}
