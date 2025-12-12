"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-4 gap-8">
            <div className="flex flex-col items-center gap-2 text-center animate-in fade-in zoom-in duration-500">
                <Image
                    src="/simplon_logo.png"
                    alt="SimplonJob Logo"
                    width={80}
                    height={80}
                    className="rounded-2xl shadow-lg mb-2"
                />
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">SimplonJob</h1>
                <p className="text-[var(--muted-foreground)] text-sm">Sign in to manage your career journey</p>
            </div>
            <div className="w-full max-w-sm">
                <SignIn
                    appearance={{
                        elements: {
                            card: "shadow-xl border border-[var(--border)] rounded-2xl",
                            rootBox: "w-full",
                        }
                    }}
                />
            </div>
        </div>
    );
}
