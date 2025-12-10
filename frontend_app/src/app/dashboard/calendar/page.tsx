"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Application } from "@/types";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from "framer-motion";
import "./calendar.css"; // Custom styles

import { useLanguage } from "@/components/LanguageProvider";
import frLocale from '@fullcalendar/core/locales/fr';

export default function CalendarPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

    useEffect(() => {
        apiRequest("/applications/")
            .then(setApplications)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Transform applications into calendar events
    const events = applications.flatMap(app => {
        const appEvents = [];

        // Application Sent Event (use dm_sent_date)
        const appDate = app.dm_sent_date;
        if (appDate) {
            appEvents.push({
                id: `app-${app.id}`,
                title: `${t("application")}: ${app.company}`,
                start: appDate,
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                extendedProps: { type: 'Application', position: app.position }
            });
        }

        // Interview
        // If we have a specific interview date field, use it. 
        // For now, we'll check if status is Interview and use follow_up_5_date as a fallback if no specific date exists, 
        // BUT ideally we should have an interview_date field. 
        // Let's assume for now that if status is Interview, the user might have set a date in notes or we use the next follow up.
        // IMPROVEMENT: If status is 'Entretien', we highlight it.
        if (app.final_status === "Entretien") {
            // If there's a follow-up date that is likely the interview, we use it.
            // Or we can add a specific visual cue if it's today.
            if (app.follow_up_5_date) {
                appEvents.push({
                    id: `interview-${app.id}`,
                    title: `🎤 ${t("interview")}: ${app.company}`,
                    start: app.follow_up_5_date,
                    backgroundColor: '#8b5cf6', // Violet for interviews
                    borderColor: '#8b5cf6',
                    extendedProps: { type: 'Interview', position: app.position }
                });
            }
        }

        // Follow-ups (Only if status is Pending or similar, to avoid clutter if Rejected/Accepted?)
        // Actually, let's keep them but maybe style differently if closed.
        if (app.final_status === "Pending" || app.final_status === "Entretien") {
            if (app.follow_up_5_date && app.final_status !== "Entretien") { // Don't duplicate if used for interview
                appEvents.push({
                    id: `f5-${app.id}`,
                    title: `Follow-up (J+5): ${app.company}`,
                    start: app.follow_up_5_date,
                    backgroundColor: '#eab308', // Yellow
                    borderColor: '#eab308',
                    extendedProps: { type: 'Follow-up', position: app.position }
                });
            }
            if (app.follow_up_15_date) {
                appEvents.push({
                    id: `f15-${app.id}`,
                    title: `Follow-up (J+15): ${app.company}`,
                    start: app.follow_up_15_date,
                    backgroundColor: '#f97316', // Orange
                    borderColor: '#f97316',
                    extendedProps: { type: 'Follow-up', position: app.position }
                });
            }
            if (app.follow_up_30_date) {
                appEvents.push({
                    id: `f30-${app.id}`,
                    title: `Follow-up (J+30): ${app.company}`,
                    start: app.follow_up_30_date,
                    backgroundColor: '#ef4444', // Red
                    borderColor: '#ef4444',
                    extendedProps: { type: 'Follow-up', position: app.position }
                });
            }
        }

        return appEvents;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ height: "calc(100vh - 140px)", padding: "1rem" }}
        >
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={language === 'fr' ? frLocale : 'en'}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                height="100%"
                eventClick={(info) => {
                    alert(`Event: ${info.event.title}\nPosition: ${info.event.extendedProps.position}`);
                }}
            />
        </motion.div>
    );
}
