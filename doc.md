# TriggerForge Documentation

This document explains how the project works in very simple terms.

---

## 1. System Blocks Explained

TriggerForge is made of four main parts (blocks). 

### A. Web Dashboard (Frontend)
*   **Significance & Work:** This is the website where you build automations by dragging and dropping boxes (steps) and connecting them.
*   **Input (i/p):** You clicking, typing settings, and drawing lines between boxes.
*   **Output (o/p):** A digital blueprint that saves exactly how your automation should run.

### B. The Server (Backend)
*   **Significance & Work:** This is the manager. It takes your blueprint, saves it securely, and tells the system when to start running it.
*   **Input (i/p):** The digital blueprint sent from the dashboard.
*   **Output (o/p):** It updates the database and tells the Engine to start working.

### C. The Engine (Core)
*   **Significance & Work:** This is the brain. It reads your blueprint step-by-step and makes sure things happen in the correct order.
*   **Input (i/p):** The blueprint and any starting information.
*   **Output (o/p):** The final results after finishing all the steps, plus a history log of everything it did.

### D. The Connectors (Actions)
*   **Significance & Work:** These are the actual workers. They do the specific jobs, like sending an email, searching Google, or talking to an AI.
*   **Input (i/p):** Specific instructions for that one job (like an email address and a message).
*   **Output (o/p):** The result of the job (like "Email Sent Successfully!").

---

## 2. How the Engine Works (Algorithm)

When you press "Run", the Engine follows a simple set of rules to process your automation. Think of it like a to-do list where tasks get added as you go.

### The Steps (The Algorithm)

1.  **Find the Start:** The Engine looks at your whole automation. It finds the very first step that starts everything.
2.  **Get in Line:** It puts that first step into a **Waiting Line**.
3.  **Do the Work:** As long as there are steps in the **Waiting Line**, the Engine does the following:
    *   Take the next step out of the line.
    *   Give it any **Saved Data** it needs from previous steps.
    *   Do the actual job (like sending an email).
    *   Save any new information it gets back into the **Saved Data**.
    *   Look at what step comes next, and put it at the back of the **Waiting Line**.
4.  **Finish:** When there are no more steps left in the **Waiting Line**, the automation is done!

---

## 3. Results & Discussion

### The Framework and Cases
Our system handles different workflow situations (cases) perfectly:
1.  **Straight Line Flow:** Step 1 connects to Step 2. The Engine just moves the data straight across automatically.
2.  **Making Choices (Conditions):** If we have an "If/Else" step (for example, checking if a sale is over $10), the Engine makes a choice. If it's True, it only follows the "True" path. If False, it goes down the "False" path.
3.  **Repeating Tasks (Loops):** If we have 5 emails to send, the system automatically loops and puts the "Send Email" step into the **Waiting Line** 5 separate times.

### Discussion: Why does this work so well?
*Why are we getting these results?* 
You get reliable results because of the **Waiting Line**. Instead of the system trying to do every single step at the exact same time and getting confused, it forces every step to wait its turn. By the time it's a step's turn to run, all the work from the previous steps is already finished and safely kept in the **Saved Data**.

### Conclusion
*What do we conclude?* 
We conclude that using a step-by-step **Waiting Line** method is the absolute best way to run automations. It ensures we never lose information, allows us to handle complex "Yes/No" choices easily, and prevents the system from breaking or getting stuck.
