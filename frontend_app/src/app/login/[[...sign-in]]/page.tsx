"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--background)", gap: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                <Image
                    src="/simplon_logo.png"
                    alt="SimplonJob Logo"
                    width={64}
                    height={64}
                    style={{ borderRadius: "12px" }}
                />
                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--foreground)" }}>SimplonJob</h1>
            </div>
            <SignIn />
        </div>
    );
}
