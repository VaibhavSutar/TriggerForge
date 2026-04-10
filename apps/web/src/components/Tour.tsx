"use client";

import React, { useState, useEffect } from "react";
import { Walkthrough, WalkthroughStep } from "./workflow/Walkthrough";

const GLOBAL_TOUR_STEPS: WalkthroughStep[] = [
    {
        target: "nav",
        title: "Welcome to TriggerForge",
        content: "Let's take a quick guided tour of your workspace. This is your main dashboard.",
        position: "bottom",
        route: "/dashboard"
    },
    {
        target: "button:has(.lucide-plus)",
        title: "Create Worflows",
        content: "You can click this button to start a blank workflow automation.",
        position: "bottom",
        route: "/dashboard"
    },
    {
        target: ".grid",
        title: "Your Workflows",
        content: "All your created automations and drafts will appear here in this grid.",
        position: "top",
        route: "/dashboard"
    }
];

export const Tour = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("triggerforge_global_tour_seen_v2");
        if (!seen) {
            setIsVisible(true);
        }

        const handleStartTour = () => setIsVisible(true);
        window.addEventListener("triggerforge:start-tour", handleStartTour);
        return () => window.removeEventListener("triggerforge:start-tour", handleStartTour);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("triggerforge_global_tour_seen_v2", "true");
    };

    return (
        <Walkthrough 
            isOpen={isVisible} 
            onClose={handleClose} 
            steps={GLOBAL_TOUR_STEPS} 
        />
    );
};
