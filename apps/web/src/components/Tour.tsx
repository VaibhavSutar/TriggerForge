"use client";

import React, { useState, useEffect } from "react";

interface Step {
    target: string;
    content: string;
    title: string;
}

const TOUR_STEPS: Step[] = [
    {
        target: "body",
        title: "Welcome to TriggerForge",
        content: "Let's build your first workflow. This tool allows you to automate tasks by connecting different apps."
    },
    {
        target: ".react-flow__controls",
        title: "Navigation Controls",
        content: "Use these controls to zoom in, zoom out, and fit your workflow to the screen."
    },
    {
        target: "#add-node-button",
        title: "Add Logic",
        content: "Click the '+' button to add new Triggers (when to run) or Actions (what to do)."
    },
    {
        target: "#ai-assistant-button",
        title: "AI Power",
        content: "Stuck? Ask our AI Assistant to build the entire workflow for you from a simple sentence."
    }
];

export const Tour = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("triggerforge_tour_seen");
        if (!seen) {
            setIsVisible(true);
            setCurrentStepIndex(0);
        }
    }, []);

    const handleNext = () => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("triggerforge_tour_seen", "true");
    };

    if (!isVisible || currentStepIndex === -1) return null;

    const step = TOUR_STEPS[currentStepIndex];

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto"
        }}>
            <div style={{
                background: "#1e1e1e",
                color: "#fff",
                padding: "24px",
                borderRadius: "12px",
                maxWidth: "400px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                border: "1px solid #333"
            }}>
                <div style={{ float: "right", cursor: "pointer", opacity: 0.7 }} onClick={handleClose}>
                    ✕
                </div>
                <h3 style={{ marginTop: 0, marginBottom: "12px", fontSize: "1.2rem" }}>
                    {step.title}
                    <span style={{ fontSize: "0.8rem", opacity: 0.5, marginLeft: "10px" }}>
                        ({currentStepIndex + 1}/{TOUR_STEPS.length})
                    </span>
                </h3>
                <p style={{ lineHeight: "1.5", opacity: 0.9, marginBottom: "20px" }}>
                    {step.content}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "transparent",
                            border: "1px solid #555",
                            color: "#ccc",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleNext}
                        style={{
                            background: "#007bff",
                            border: "none",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        {currentStepIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
};
