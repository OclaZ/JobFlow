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
    Database,
    Trash2,
    Search,
    UserCheck
} from "lucide-react";

// NEW: Tabs Component
function AdminTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
    const tabs = [
        { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
        { id: "users", label: "User Management", icon: <Users className="w-4 h-4" /> },
        { id: "offers", label: "Global Offers", icon: <Briefcase className="w-4 h-4" /> },
    ];

    return (
        <div className="flex gap-2 mb-8 bg-background p-1 rounded-lg border w-fit" style={{ borderColor: "var(--border)" }}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted hover:bg-secondary"
                        }`}
                    style={activeTab === tab.id ? { backgroundColor: "var(--primary)", color: "#fff" } : {}}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const { isLoaded, userId, getToken, signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    // State
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null); // NEW: Detailed fetch
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState("");

    // Colors aligned with Global Theme
    const COLORS = ['var(--primary)', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // Fetch Main Data
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
                const [statsData, usersData] = await Promise.all([authFetch("/admin/stats"), authFetch("/admin/users")]);
                setStats(statsData);
                setUsers(usersData);
            } catch (err: any) { setError(err.message); } finally { setLoading(false); }
        };
        fetchData();
    }, [isLoaded, userId, getToken, router]);

    // Fetch User Details when Selected
    useEffect(() => {
        if (!selectedUserId) {
            setSelectedUserDetails(null);
            return;
        }

        const fetchDetails = async () => {
            setDetailsLoading(true);
            try {
                const token = await getToken();
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
                const res = await fetch(`${API_URL}/admin/users/${selectedUserId}/details`, { headers: { "Authorization": `Bearer ${token}` } });
                if (res.ok) setSelectedUserDetails(await res.json());
            } catch (e) {
                console.error(e);
            } finally {
                setDetailsLoading(false);
            }
        }
        fetchDetails();
    }, [selectedUserId, getToken]);

    const handleDeleteUser = async (id: number) => {
        if (!confirm("Are you sure you want to PERMANENTLY delete this user and all their data? This cannot be undone.")) return;

        try {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
            const res = await fetch(`${API_URL}/admin/users/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Failed to delete");

            // Remove from local list
            setUsers(prev => prev.filter(u => u.id !== id));
            setSelectedUserId(null);
            alert("User deleted successfully.");
        } catch (e) {
            alert("Error deleting user.");
        }
    };

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

    return (
        <motion.div
            className="p-8 max-w-[1600px] mx-auto min-h-screen"
            initial="hidden"
            animate="visible"
        >
            {/* Header */}
            {/* Header */}
            <header className="flex flex-col md-flex-row justify-between items-start md-items-center mb-8 gap-4">
                <div>
                    <motion.h1
                        className="text-3xl font-bold flex items-center gap-3"
                        style={{ color: "var(--foreground)" }}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                    >
                        <Shield className="w-8 h-8 text-primary" />
                        Super Admin Center
                    </motion.h1>
                    <p className="text-muted mt-2">Global ecosystem oversight and management.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md-block">
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{user?.fullName}</p>
                        <p className="text-xs text-muted">Super Admin</p>
                    </div>
                    <button
                        onClick={() => signOut(() => router.push("/"))}
                        className="p-2 bg-secondary rounded-lg text-muted"
                        title="Sign Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Top Metrics */}
                    <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Total Ecosystem Users"
                            value={stats?.total_users || 0}
                            icon={<Users className="w-6 h-6 text-primary" />}
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
                    <div className="grid grid-cols-1 lg-grid-cols-3 gap-8 mb-8">

                        {/* Platform Distribution Chart */}
                        <motion.div className="card col-span-1 lg-col-span-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2 text-base font-semibold">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Platform Insights
                                </h3>
                            </div>

                            <div className="h-[350px] w-full bg-background/50 rounded-xl p-4 flex items-center justify-center border" style={{ borderColor: "var(--border)" }}>
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
                        <motion.div className="card flex flex-col gap-6">
                            <h3 className="flex items-center gap-2 text-base font-semibold">
                                <Activity className="w-5 h-5 text-destructive" />
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

                            <div className="mt-auto p-4 bg-secondary rounded-lg border border-b" style={{ borderColor: "var(--border)" }}>
                                <h4 className="text-sm font-semibold mb-2">Backend Version</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted">v1.4.2 (Stable)</span>
                                    <span className="text-primary cursor-pointer hover:underline">View Logs</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}

            {activeTab === "users" && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-12 gap-6 h-[800px]">
                    {/* Sidebar / User List */}
                    <div className="col-span-12 md-col-span-4 card flex flex-col p-4 h-full overflow-hidden">
                        <div className="mb-4 relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-muted" />
                            <input type="text" placeholder="Search users..." className="w-full pl-9 p-2 bg-background border rounded-md text-sm outline-none" style={{ color: "var(--foreground)", borderColor: "var(--border)" }} />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {users.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedUserId === u.id ? "" : "hover:bg-secondary border-transparent"}`}
                                    style={selectedUserId === u.id ? { backgroundColor: "rgba(10, 102, 194, 0.1)", borderColor: "var(--primary)" } : {}}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-sm">{u.full_name || "Unknown User"}</p>
                                            <p className="text-xs text-muted">{u.email}</p>
                                        </div>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Content / Detail View */}
                    <div className="col-span-12 md-col-span-8 card p-6 h-full overflow-y-auto">
                        {detailsLoading ? (
                            <div className="flex justify-center items-center h-full"><div className="w-8 h-8 rounded-full border-t-2 border-b-2" style={{ borderColor: 'var(--primary)' }}></div></div>
                        ) : selectedUserDetails ? (
                            <div className="space-y-8">
                                {/* User Header */}
                                <div className="flex justify-between items-start border-b pb-6" style={{ borderColor: "var(--border)" }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold text-muted">
                                            {selectedUserDetails.full_name?.[0] || selectedUserDetails.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{selectedUserDetails.full_name || "Unknown User"}</h2>
                                            <p className="text-muted">{selectedUserDetails.email}</p>
                                            <p className="text-xs text-muted mt-1">ID: #{selectedUserDetails.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-secondary text-sm">Reset Password</button>
                                        <button onClick={() => handleDeleteUser(selectedUserDetails.id)} className="btn btn-destructive text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete User</button>
                                    </div>
                                </div>

                                {/* Deep Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-secondary rounded-xl">
                                        <h4 className="text-xs uppercase text-muted font-semibold mb-2">Total Applications</h4>
                                        <p className="text-3xl font-bold text-primary">{selectedUserDetails.total_applications}</p>
                                    </div>
                                    <div className="p-4 bg-secondary rounded-xl">
                                        <h4 className="text-xs uppercase text-muted font-semibold mb-2">Offers Saved</h4>
                                        <p className="text-3xl font-bold text-violet-500">{selectedUserDetails.total_offers}</p>
                                    </div>
                                    <div className="p-4 bg-secondary rounded-xl">
                                        <h4 className="text-xs uppercase text-muted font-semibold mb-2">Apps Today</h4>
                                        <p className="text-xl font-bold text-green-600 flex items-center gap-2"><UserCheck className="w-5 h-5" /> {selectedUserDetails.apps_today}</p>
                                        <p className="text-xs text-muted">Target: 10/day</p>
                                    </div>
                                </div>

                                {/* Activity History */}
                                <div>
                                    <h3 className="font-semibold mb-4">Recent Activity (Applications)</h3>
                                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-secondary text-muted">
                                                <tr>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3">Target</th>
                                                    <th className="p-3 text-right">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                                {selectedUserDetails.recent_history && selectedUserDetails.recent_history.length > 0 ? (
                                                    selectedUserDetails.recent_history.map((item: any, i: number) => (
                                                        <tr key={i}>
                                                            <td className="p-3">
                                                                <span className="px-2 py-1 rounded text-xs bg-gray-100">{item.status}</span>
                                                            </td>
                                                            <td className="p-3 font-medium">{item.target}</td>
                                                            <td className="p-3 text-right text-muted">{item.date}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan={3} className="p-4 text-center text-muted">No recent applications found.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center text-muted">
                                <Users className="w-16 h-16 mb-4 opacity-20" />
                                <p>Select a user from the list to monitor their activity.</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {activeTab === "offers" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center h-[400px] text-muted">
                    <p>Global Offer Management Coming Soon...</p>
                </motion.div>
            )}

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
            whileHover={{ y: -5 }}
        >
            <div className="flex justify-between items-start mb-4">
                <span className="p-2 bg-secondary rounded-lg">{icon}</span>
                {/* Optional Sparkline or Badge could go here */}
            </div>
            <div>
                <p className="text-muted text-sm font-medium uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold mt-2" style={{ color: "var(--foreground)" }}>{value}</p>
            </div>
        </motion.div>
    );
}

function HealthItem({ label, status, icon, color }: { label: string, status: string, icon: any, color: string }) {
    return (
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full bg-secondary ${color}`}>
                    {icon}
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Operational' || status === 'Synced' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-xs font-semibold text-muted">{status}</span>
            </div>
        </div>
    );
}
