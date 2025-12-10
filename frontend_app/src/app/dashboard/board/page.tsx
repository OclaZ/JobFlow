"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Application } from "@/types";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { useLanguage } from "@/components/LanguageProvider";

export default function KanbanBoardPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    const COLUMNS = [
        { id: "Pending", title: t("pending"), color: "var(--secondary)", textColor: "var(--foreground)" },
        { id: "Entretien", title: t("interview"), color: "rgba(59, 130, 246, 0.1)", textColor: "var(--primary)" },
        { id: "Accepté", title: t("accepted"), color: "rgba(34, 197, 94, 0.1)", textColor: "#16a34a" },
        { id: "Refusé", title: t("rejected"), color: "rgba(239, 68, 68, 0.1)", textColor: "#ef4444" },
    ];

    useEffect(() => {
        apiRequest("/applications/")
            .then(setApplications)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const appId = parseInt(draggableId);
        const app = applications.find(a => a.id === appId);
        if (!app) return;

        const newStatus = destination.droppableId;

        // Optimistic update
        const updatedApps = applications.map(a =>
            a.id === appId ? { ...a, final_status: newStatus } : a
        );
        setApplications(updatedApps);

        try {
            await apiRequest(`/applications/${appId}`, {
                method: "PUT",
                body: JSON.stringify({ ...app, final_status: newStatus }),
            });
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status");
            // Revert
            setApplications(applications);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ height: "calc(100vh - 100px)", overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>{t("kanbanBoard")}</h1>
                <button className="btn btn-primary" onClick={() => window.location.href = "/dashboard/applications/new"}>{t("addApplication")}</button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: "flex", gap: "1.5rem", height: "calc(100% - 80px)", minWidth: "1000px" }}>
                    {COLUMNS.map(column => (
                        <div key={column.id} style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: "250px" }}>
                            <div style={{
                                padding: "1rem",
                                background: column.color,
                                color: column.textColor,
                                fontWeight: "bold",
                                borderRadius: "var(--radius)",
                                marginBottom: "1rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}>
                                {column.title}
                                <span style={{ background: "rgba(255,255,255,0.5)", padding: "0.25rem 0.5rem", borderRadius: "999px", fontSize: "0.75rem" }}>
                                    {applications.filter(a => a.final_status === column.id).length}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{
                                            flex: 1,
                                            padding: "0.5rem",
                                            background: snapshot.isDraggingOver ? "rgba(0,0,0,0.05)" : "transparent",
                                            borderRadius: "var(--radius)",
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        {applications
                                            .filter(a => a.final_status === column.id)
                                            .map((app, index) => (
                                                <Draggable key={app.id} draggableId={app.id.toString()} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="card"
                                                            style={{
                                                                marginBottom: "1rem",
                                                                ...provided.draggableProps.style,
                                                                opacity: snapshot.isDragging ? 0.8 : 1,
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: "600", marginBottom: "0.25rem" }}>{app.position}</div>
                                                            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>{app.company}</div>

                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                                {app.dm_sent_date && <div>DM: {app.dm_sent_date}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
}
