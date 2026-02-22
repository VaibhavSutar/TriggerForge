# TriggerForge Evaluation Pipeline

This package contains the automated evaluation pipeline ("LLM-as-a-Judge") for the TriggerForge AI Workflow Generation feature.

To ensure we are testing a real-world scenario, this script does **not** mock the AI response. It actively sends HTTP POST requests to the local TriggerForge Backend Server to evaluate the exact JSON output that a real user would receive.

## Prerequisites

1.  **Environment Variables**: Ensure you have a `.env` file properly configured in the `apps/server` directory. The pipeline looks for `GEMINI_API_KEY` (or `GOOGLE_API_KEY` as a fallback).
2.  **Running Server**: The TriggerForge backend server **must** be running locally on port 4000. 

## How to Verify Manually (The Real-world Solution)

To see the Data & Eval solution working for yourself, follow these precise steps:

1.  **Start the Backend API Server**:
    Open a terminal at the root of the project and run:
    ```bash
    pnpm --filter @triggerforge/server run dev
    ```
    This spins up the TriggerForge backend API at `http://localhost:4000`. Leave this terminal open.

2.  **Run the Pipeline**:
    Open a *second* terminal, navigate to the eval-pipeline app, and run the evaluation script:
    ```bash
    cd apps/eval-pipeline
    pnpm run eval
    ```

## How It Works Under The Hood

1.  **Prompt Dispatch**: The script iterates through a `GOLDEN_SET` of predefined, complex test cases (Prompts + Expected Strategies).
2.  **Real End-to-End API Hit**: It sends the prompt to the actively running server endpoint (`POST /ai/generate-workflow`).
3.  **JSON Capture**: It captures the complex workflow JSON graph array returned by the server.
4.  **Judging context**: It constructs an evaluation prompt containing the User Request, Expected Strategy, and the raw parsed JSON.
5.  **Score Assignment**: A secondary LLM call ("The Judge") reads the generated nodes and evaluates the JSON against the strategy, assigning a score from 0 to 10 based on accuracy of the inferred intent.
6.  **Report**: Any workflow scoring 7 or higher is considered passing. It generates a tabular report directly in your console upon completion.
