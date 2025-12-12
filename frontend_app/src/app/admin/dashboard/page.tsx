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
    TrendingUp,
    Activity,
    LogOut,
    Shield,
    AlertTriangle,
    Zap,
    Server,
    Database
} from "lucide-react";

export default function AdminDashboard() {
    const { isLoaded, userId, getToken, signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    // State
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Colors aligned with Global Theme
    const COLORS = ['var(--primary)', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    useEffect(() => {
        if (!isLoaded) return;

        if (!userId) {
            router.push("/sign-in?redirect_url=/admin/dashboard");
            return;
        }

        const email = user?.primaryEmailAddress?.emailAddress;

        // Frontend check for UX only (Backend enforces security)
        if (email && email !== "hello@hamzaaslikh.com") {
            // setError("Access Denied: You are not an admin.");
        }

        const fetchData = async () => {
            try {
                const token = await getToken();
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";

                const authFetch = async (endpoint: string) => {
                    const res = await fetch(`${API_URL}${endpoint}`, {
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.detail || `Error ${res.status}`);
                    }
                    return res.json();
                };

                const [statsData, usersData] = await Promise.all([
                    authFetch("/admin/stats"),
                    authFetch("/admin/users")
                ]);

                setStats(statsData);
                setUsers(usersData);
            } catch (err: any) {
                console.error("Admin Fetch Error:", err);
                setError(err.message || "Failed to load admin data");
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }

    }, [isLoaded, userId, getToken, user, router]);

    if (!isLoaded || loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--background)]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[var(--background)] p-4 text-center">
                <AlertTriangle className="w-16 h-16 text-[var(--destructive)] mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied / Error</h1>
                <p className="text-[var(--muted-foreground)] mb-6 max-w-md">{error}</p>

                <div className="flex gap-4">
                    <button onClick={() => router.push("/")} className="btn btn-secondary">
                        Go Home
                    </button>
                    <button onClick={() => signOut()} className="btn btn-destructive">
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="p-8 max-w-[1600px] mx-auto min-h-screen"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <motion.h1
                        className="text-3xl font-bold flex items-center gap-3 text-[var(--foreground)]"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                    >
                        <Shield className="w-8 h-8 text-[var(--primary)]" />
                        Super Admin Center
                    </motion.h1>
                    <p className="text-[var(--muted-foreground)] mt-2">Global ecosystem oversight and management.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-[var(--foreground)]">{user?.fullName}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Super Admin</p>
                    </div>
                    <button
                        onClick={() => signOut(() => router.push("/"))}
                        className="p-2 bg-[var(--secondary)] hover:bg-[var(--destructive)]/20 text-[var(--muted-foreground)] hover:text-[var(--destructive)] rounded-lg transition-colors border border-[var(--border)]"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Ecosystem Users"
                    value={stats?.total_users || 0}
                    icon={<Users className="w-6 h-6 text-[var(--primary)]" />}
                    delay={0}
                />
                <MetricCard
                    title="Total Applications"
                    value={stats?.total_applications || 0}
                    icon={<FileText className="w-6 h-6 text-emerald-500" />}
                    delay={0.1}
                />
                <MetricCard
                    title="Active Job Offers"
                    value={stats?.total_offers || 0}
                    icon={<Briefcase className="w-6 h-6 text-violet-500" />}
                    delay={0.2}
                />
                <MetricCard
                    title="Companies Tracked"
                    value={stats?.total_companies || 0}
                    icon={<Building className="w-6 h-6 text-amber-500" />}
                    delay={0.3}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                {/* Platform Distribution Chart */}
                <motion.div className="card col-span-1 lg:col-span-2" variants={itemVariants}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
                            Platform Insights
                        </h3>
                    </div>

                    <div className="h-[350px] w-full bg-[var(--background)]/50 rounded-xl p-4 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.applications_by_platform || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.applications_by_platform || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card-bg)',
                                        borderColor: 'var(--card-border)',
                                        color: 'var(--foreground)',
                                        borderRadius: 'var(--radius)',
                                        boxShadow: 'var(--shadow)'
                                    }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* System Health / Status */}
                <motion.div className="card flex flex-col gap-6" variants={itemVariants}>
                    <h3 className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[var(--destructive)]" />
                        System Health
                    </h3>

                    <div className="space-y-4">
                        <HealthItem
                            label="Database (PostgreSQL)"
                            status="Operational"
                            icon={<Database className="w-4 h-4" />}
                            color="text-green-500"
                        />
                        <HealthItem
                            label="API Services"
                            status="Operational"
                            icon={<Server className="w-4 h-4" />}
                            color="text-green-500"
                        />
                        <HealthItem
                            label="Auth (Clerk)"
                            status="Synced"
                            icon={<Shield className="w-4 h-4" />}
                            color="text-blue-500"
                        />
                        <HealthItem
                            label="Response Latency"
                            status="45ms"
                            icon={<Zap className="w-4 h-4" />}
                            color="text-amber-500"
                        />
                    </div>

                    <div className="mt-auto p-4 bg-[var(--secondary)] rounded-lg border border-[var(--border)]">
                        <h4 className="text-sm font-semibold mb-2">Backend Version</h4>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--muted-foreground)]">v1.4.2 (Stable)</span>
                            <span className="text-[var(--primary)] cursor-pointer hover:underline">View Logs</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Users Table */}
            <motion.div className="card" variants={itemVariants}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[var(--accent-foreground)]" />
                        Registered Users Registry
                    </h3>
                    <button className="btn btn-secondary text-sm">Download CSV</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Remote ID</th>
                                <th className="p-4 font-medium">User Profile</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium text-center">Applications</th>
                                <th className="p-4 font-medium text-center">Offers</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-[var(--secondary)] transition-colors group">
                                    <td className="p-4 text-[var(--muted-foreground)] text-xs font-mono">#{u.id}</td>
                                    <td className="p-4">
                                        <div className="font-semibold text-[var(--foreground)]">{u.full_name || "Unknown User"}</div>
                                        <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.role === "admin"
                                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                                : "bg-gray-100 text-gray-700 border-gray-200"
                                            }`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center font-bold text-[var(--foreground)]">{u.applications_count}</td>
                                    <td className="p-4 text-center font-bold text-[var(--foreground)]">{u.offers_count}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-[var(--primary)] hover:underline text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-[var(--muted-foreground)]">
                                        No users found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Components matching "Normal" User Design
function MetricCard({ title, value, icon, delay }: { title: string; value: number; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            className="card flex flex-col justify-between h-full"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay }}
            whileHover={{ y: -5, boxShadow: 'var(--shadow-lg)' }}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="p-2 bg-[var(--secondary)] rounded-lg">{icon}</span>
                {/* Optional Sparkline or Badge could go here */}
            </div>
            <div>
                <p className="text-[var(--muted-foreground)] text-sm font-medium uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold text-[var(--foreground)] mt-2">{value}</p>
            </div>
        </motion.div>
    );
}

function HealthItem({ label, status, icon, color }: { label: string, status: string, icon: any, color: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full bg-[var(--secondary)] ${color}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Operational' || status === 'Synced' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs font-semibold text-[var(--muted-foreground)]">{status}</span>
            </div>
        </div>
    );
}
