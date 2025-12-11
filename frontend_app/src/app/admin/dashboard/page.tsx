"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
    AlertTriangle
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

    // Colors
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

    useEffect(() => {
        if (!isLoaded) return;

        if (!userId) {
            router.push("/sign-in?redirect_url=/admin/dashboard");
            return;
        }

        // Check Hardcoded Admin Email on Client Side for immediate feedback
        // (Backend verifies this securely, this is just for UX)
        const email = user?.primaryEmailAddress?.emailAddress;
        if (email && email !== "hello@hamzaaslikh.com") {
            // Optional: You can block here, but let backend describe the error
            // setError("Access Denied: You are not an admin.");
        }

        const fetchData = async () => {
            try {
                const token = await getToken();
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";

                // Helper for fetch
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
                    authFetch("/admin/stats"), // Uses depends(get_current_admin)
                    authFetch("/admin/users")  // Uses depends(get_current_admin)
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
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!userId) return null; // Router will handle redirect

    // Access Denied UI
    if (error.includes("Access Denied") || error.includes("403")) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-4">
                <Shield className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-400 mb-6 text-center max-w-md">
                    Your account ({user?.primaryEmailAddress?.emailAddress}) is not authorized to view this page.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => router.push("/")} className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600">
                        Go Home
                    </button>
                    <button onClick={() => signOut()} className="px-4 py-2 bg-red-600 rounded hover:bg-red-500">
                        Sign Out
                    </button>
                </div>
                <p className="mt-8 text-xs text-gray-500">Error Detail: {error}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h2 className="text-xl">Something went wrong</h2>
                <p className="text-gray-400 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 rounded">Retry</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">System Overview & Analytics</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-white">{user?.fullName}</p>
                        <p className="text-xs text-slate-400">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                    <button
                        onClick={() => signOut(() => router.push("/"))}
                        className="p-2 bg-slate-800/50 hover:bg-red-900/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-slate-700"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    icon={<Users className="w-6 h-6 text-blue-400" />}
                    color="bg-blue-500/10 border-blue-500/20"
                />
                <MetricCard
                    title="Total Applications"
                    value={stats?.total_applications || 0}
                    icon={<FileText className="w-6 h-6 text-emerald-400" />}
                    color="bg-emerald-500/10 border-emerald-500/20"
                />
                <MetricCard
                    title="Active Job Offers"
                    value={stats?.total_offers || 0}
                    icon={<Briefcase className="w-6 h-6 text-violet-400" />}
                    color="bg-violet-500/10 border-violet-500/20"
                />
                <MetricCard
                    title="Companies Tracked"
                    value={stats?.total_companies || 0}
                    icon={<Building className="w-6 h-6 text-amber-400" />}
                    color="bg-amber-500/10 border-amber-500/20"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Platform Distribution */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        Platform Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.applications_by_platform || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(stats?.applications_by_platform || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity / Placeholder */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-pink-400" />
                        System Status
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                            <span>Database Status</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Operational</span>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                            <span>Server Region</span>
                            <span className="text-slate-400 text-sm">Vercel (Europe-West)</span>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center justify-between">
                            <span>API Latency</span>
                            <span className="text-slate-400 text-sm">~45ms</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-sky-400" />
                        Registered Users
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Remote ID</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium text-center">Applications</th>
                                <th className="p-4 font-medium text-center">Offers</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-500 text-xs font-mono">{u.id}</td>
                                    <td className="p-4 text-slate-200">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === "admin"
                                            ? "bg-purple-500/20 text-purple-300"
                                            : "bg-slate-700 text-slate-300"
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">{u.applications_count}</td>
                                    <td className="p-4 text-center">{u.offers_count}</td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No users found or check database connection.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}

function MetricCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className={`rounded-xl border p-5 ${color} flex items-center justify-between`}>
            <div>
                <p className="text-slate-400 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
                {icon}
            </div>
        </div>
    );
}
