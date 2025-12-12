"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Briefcase, Building, ExternalLink, Calendar, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminOffersPage() {
    const { getToken, isLoaded } = useAuth();
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (!isLoaded) return;
        const fetchOffers = async () => {
            const token = await getToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://job-flow-psi.vercel.app";
            try {
                const res = await fetch(`${API_URL}/admin/offers`, { headers: { "Authorization": `Bearer ${token}` } });
                const data = await res.json();
                setOffers(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, [isLoaded, getToken]);

    const filteredOffers = offers.filter(o =>
        o.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Global Job Offers Repository</h1>
                <p className="text-muted">Monitor and manage all job offers added across the platform.</p>
            </header>

            {/* Filter Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search offers by title or company..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    {offers.length} Total Offers
                </div>
            </div>

            {/* Grid Layout for Offers */}
            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))
                ) : (
                    filteredOffers.map((offer: any) => (
                        <div key={offer.id} className="card p-5 group hover:shadow-md transition-all border bg-white rounded-xl flex flex-col justify-between" style={{ borderColor: "var(--border)" }}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Briefcase className="w-5 h-5" />
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${offer.status === 'Applied' ? 'bg-green-100 text-green-700' :
                                            offer.status === 'Interview' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>{offer.status}</span>
                                </div>
                                <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-1">{offer.position_title}</h3>
                                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                                    <Building className="w-3 h-3" />
                                    <span>{offer.company_name}</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t mt-2 flex justify-between items-center" style={{ borderColor: "var(--border)" }}>
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground">Added by</span>
                                    <span className="text-xs font-medium">{offer.user_email?.split('@')[0] || "Unknown"}</span>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {offer.created_at || "N/A"}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
