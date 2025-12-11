"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import {
    Users,
    Briefcase,
    FileText,
    Building2,
    TrendingUp,
    Shield
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";

interface GlobalStats {
    total_users: number;
    total_applications: number;
    total_offers: number;
    total_companies: number;
    applications_by_platform: { name: string; value: number }[];
}

interface AdminUser {
    id: number;
    email: string;
    full_name: string;
    role: string;
    applications_count: number;
    offers_count: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                const statsData = await apiRequest("/admin/stats");
                setStats(statsData);

                const usersData = await apiRequest("/admin/users");
                setUsers(usersData);
            } catch (err: any) {
                setError("Access Denied or Server Error");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-10 text-white">Loading Admin Dashboard...</div>;
    if (error) return <div className="p-10 text-red-400 font-bold text-xl">{error}</div>;

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-400" />
                        Super Admin Dashboard
                    </h1>
                    <p className="text-slate-400 mt-2">Global oversight and user management.</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    icon={<Users className="w-6 h-6 text-blue-400" />}
                    color="border-blue-500/20 bg-blue-500/5"
                />
                <StatCard
                    title="Total Applications"
                    value={stats?.total_applications || 0}
                    icon={<FileText className="w-6 h-6 text-green-400" />}
                    color="border-green-500/20 bg-green-500/5"
                />
                <StatCard
                    title="Total Job Offers"
                    value={stats?.total_offers || 0}
                    icon={<Briefcase className="w-6 h-6 text-amber-400" />}
                    color="border-amber-500/20 bg-amber-500/5"
                />
                <StatCard
                    title="Companies Tracked"
                    value={stats?.total_companies || 0}
                    icon={<Building2 className="w-6 h-6 text-purple-400" />}
                    color="border-purple-500/20 bg-purple-500/5"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-slate-400" />
                        Platforms Distribution
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.applications_by_platform}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats?.applications_by_platform.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {stats?.applications_by_platform.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                {entry.name} ({entry.value})
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Leaderboard or extra chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-6">User Activity Overview</h3>
                    <div className="h-64 overflow-y-auto pr-2">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="pb-3">User</th>
                                    <th className="pb-3 text-right">Apps</th>
                                    <th className="pb-3 text-right">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {users.slice(0, 10).map(u => (
                                    <tr key={u.id} className="hover:bg-slate-800/50">
                                        <td className="py-3">
                                            <div className="font-medium text-slate-200">{u.full_name || "Unknown"}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-blue-400">{u.applications_count}</td>
                                        <td className="py-3 text-right text-slate-500">{u.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Full User Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-6">All Users Ecosystem</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs tracking-wider">
                                <th className="p-4">ID</th>
                                <th className="p-4">User Details</th>
                                <th className="p-4">Role</th>
                                <th className="p-4 text-center">Applications</th>
                                <th className="p-4 text-center">Offers</th>
                                <th className="p-4 text-center">Last Active</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 text-slate-500">#{u.id}</td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-200">{u.full_name || "N/A"}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-700/30 text-slate-400'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-slate-200">{u.applications_count}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-slate-400">{u.offers_count}</span>
                                    </td>
                                    <td className="p-4 text-center text-slate-500">
                                        {u.last_active || "-"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-blue-400 hover:text-blue-300 text-xs font-medium px-3 py-1 border border-blue-500/30 rounded">
                                            View Data
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
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
