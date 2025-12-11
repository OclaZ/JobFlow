"use client";

import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--background)" }}>
            <SignUp />
        </div>
    );
}
