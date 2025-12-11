"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function RegisterPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--background)", gap: "2rem", padding: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <Image
                    src="/jobflow_logo.png"
                    alt="JobFlow Logo"
                    width={64}
                    height={64}
                    style={{ borderRadius: "12px" }}
                />
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--foreground)" }}>JobFlow</h1>
            </div>
            <SignUp />
        </div>
    );
}
