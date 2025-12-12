import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <AdminSidebar />
            <main style={{
                flex: 1,
                marginLeft: "var(--sidebar-width)",
                background: "var(--background)",
                display: "flex",
                flexDirection: "column"
            }}>
                <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
