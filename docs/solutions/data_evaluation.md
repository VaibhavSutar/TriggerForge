# Solution Design: Data & Evaluation

## Problem Statement
**Issue**: Limited benchmarks and synthetic data reliance.
**Context**: We currently rely on simple ad-hoc testing ("does it crash?") to verify AI performance. There is no rigorous way to measure if a new model version or prompt strategy is actually better at understanding user intent. We lack a diverse, real-world dataset to benchmark against.

## Proposed Solution: Real-World Evaluation Pipelines

### 1. TriggerForge Eval Pipeline

We will build a dedicated testing framework (`apps/eval-pipeline`) that treats AI workflow generation as a measurable software artifact.

#### Architecture
- **Eval Runner**: A script that iterates through a dataset of Prompt -> Expected Workflow pairs.
- **LLM-as-a-Judge**: Use a stronger model (e.g., GPT-4o or Gemini 1.5 Pro) to grade the output of smaller/faster models.
- **Reporting**: Generate a pass/fail report with granular metrics.

### 2. Datasets & Golden Set

We will move beyond synthetic data to real-world scenarios.

#### Data Sources
- **Golden Set (Internal)**: Curate 100+ high-quality examples of complex user requests and their *perfect* workflow implementations.
    - *Example*: "Every Monday at 9am, check my Gmail for invoices, save them to Drive, and Slack me the summary."
- **Open Datasets (External)**: Integrate with Hugging Face datasets like **ToolBench** or **Gorilla** to test general tool-use capabilities.
- **User Feedback Loop**: Anonymized logs from the `trust_ethics` module can be (with consent) added to the Golden Set to cover edge cases.

### 3. Metric Definitions

We will track three levels of success:

1.  **Syntactic Correctness (Hard Pass/Fail)**:
    - Is the JSON valid?
    - Do the edges connect?
    - Are required fields present?
2.  **Semantic Similarity (LLM Judge)**:
    - Does the generated workflow *actually do* what the user asked?
    - Are the correct tools selected? (e.g., chose "Gmail" instead of "Outlook").
    - Are the conditions logical? (e.g., "if > 100" vs "if < 100").
3.  **Execution Success (Sandbox)**:
    - Can we spin up this workflow in a sandbox environment and have it run tailored test events without error?

## Implementation Steps

1.  **Repo Setup**: Create `apps/eval-pipeline`.
2.  **Data Collection**: Write a script to fetch ToolBench data and convert it to TriggerForge format.
3.  **Pipeline Logic**: Implement the `EvalRunner` class with parallel execution.
4.  **CI Integration**: Add a GitHub Action to run a subset (Smoke Test) of evals on every PR affecting `apps/server-ai`.
