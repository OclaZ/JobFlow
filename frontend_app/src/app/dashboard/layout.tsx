import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: "flex", minHeight: "100vh" }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: "var(--sidebar-width)",
                background: "var(--background)",
                display: "flex",
                flexDirection: "column"
            }}>
                <Header />
                <div style={{ padding: "2rem", flex: 1, overflowY: "auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
