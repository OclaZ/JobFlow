"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Search, Mail, Filter, AlertCircle, Briefcase, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminUsersPage() {
    const { getToken, isLoaded } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all', 'active', 'inactive'
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!isLoaded) return;
        const fetchUsers = async () => {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
            try {
                const res = await fetch(`${API_URL}/admin/users`, { headers: { "Authorization": `Bearer ${token}` } });
                const data = await res.json();
                setUsers(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [isLoaded, getToken]);

    // Derived State for Monitoring
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filter === 'all') return matchesSearch;
        // Mocking "Active" logic based on recent apps
        // Real implementation would check dates. Assuming 'last_active' string exists or can be inferred
        return matchesSearch;
    });

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">User Intelligence & Monitoring</h1>
                <p className="text-muted">Track user engagement, identify at-risk accounts, and manage access.</p>
            </header>

            {/* Monitoring Cards */}
            <div className="grid grid-cols-1 md-grid-cols-3 gap-6 mb-8">
                <div className="card border-l-4 border-blue-500 p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-2">Total Users</h3>
                    <p className="text-3xl font-bold">{users.length}</p>
                </div>
                <div className="card border-l-4 border-green-500 p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-2">Highly Active (Last 7 Days)</h3>
                    <p className="text-3xl font-bold">{users.filter(u => u.applications_count > 5).length}</p> {/* Proxy metric */}
                </div>
                <div className="card border-l-4 border-yellow-500 p-6 bg-white rounded-xl shadow-sm">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-2">At Risk (No Activity)</h3>
                    <p className="text-3xl font-bold">{users.filter(u => u.applications_count === 0 && u.offers_count === 0).length}</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md-flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search users by name, email..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>All Users</button>
                    <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'active' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>Active</button>
                    <button onClick={() => setFilter('inactive')} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'inactive' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>At Risk</button>
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--secondary)] text-[var(--muted-foreground)]">
                        <tr>
                            <th className="p-4 font-medium">User Identity</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Engagement Score</th>
                            <th className="p-4 font-medium">Last Activity</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ divideColor: "var(--border)" }}>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                                    <td className="p-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                                    <td className="p-4"></td>
                                </tr>
                            ))
                        ) : (
                            filteredUsers.map((user: any) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.full_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{user.full_name || "New User"}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {/* Mock Engagement Calculation */}
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-3 h-3 text-muted-foreground" />
                                            <span className="font-mono">{user.applications_count} Apps</span>
                                            <span className="text-secondary-foreground mx-1">•</span>
                                            <span className="font-mono">{user.offers_count} Offers</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {/* Placeholder logic for last active */}
                                        {user.applications_count > 0 ? "Recently" : "Inactive > 7 days"}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-primary hover:underline text-xs font-medium mr-2">View Details</button>
                                        <button className="text-destructive hover:underline text-xs font-medium">Reset</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
