"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "./LanguageProvider";

interface InterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (date: string) => void;
    companyName: string;
}

export function InterviewModal({ isOpen, onClose, onSave, companyName }: InterviewModalProps) {
    const [date, setDate] = useState("");
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                backdropFilter: "blur(5px)"
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="card"
                    style={{ width: "400px", padding: "2rem", background: "var(--card-bg)" }}
                >
                    <h2 style={{ marginBottom: "1rem" }}>📅 {t("interview")}!</h2>
                    <p style={{ marginBottom: "1.5rem", color: "var(--muted-foreground)" }}>
                        Congratulations on getting an interview with <strong>{companyName}</strong>! Let&apos;s schedule it.
                    </p>

                    <label style={{ display: "block", marginBottom: "0.5rem" }}>Interview Date & Time</label>
                    <input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "var(--radius)",
                            border: "1px solid var(--card-border)",
                            marginBottom: "1.5rem",
                            background: "var(--background)",
                            color: "var(--foreground)"
                        }}
                    />

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                        <button
                            className="btn"
                            onClick={onClose}
                            style={{ background: "transparent", border: "1px solid var(--card-border)" }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (date) onSave(date);
                            }}
                            disabled={!date}
                        >
                            Save to Calendar
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
