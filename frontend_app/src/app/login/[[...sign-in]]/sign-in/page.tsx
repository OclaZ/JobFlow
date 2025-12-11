"use client";

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
    return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
            <SignIn />
        </div>
    );
}
