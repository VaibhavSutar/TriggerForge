# Solution Design: Trust & Ethics

## Problem Statement
**Issue**: Explainability, bias, and lack of governance.
**Context**: As AI models generate workflows and content, there is a "black box" problem. Users cannot easily see *why* a model made a specific decision, nor is there a systematic way to detect if the outputs are biased or unsafe. There is currently no audit trail for AI interactions within TriggerForge.

## Proposed Solution: Transparent AI Node Logging & Bias Reports

### 1. AI Interaction Logging (The "Black Box" Recorder)

We will implement a middleware layer within the `AIService` to transparently log every interaction with the AI provider (Gemini/OpenAI).

#### Schema Design (`ai_logs` table)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier for the transaction. |
| `workflow_id` | UUID | Link to the specific workflow execution. |
| `node_id` | String | The specific AI node in the workflow. |
| `provider` | String | e.g., "gemini", "openai". |
| `model` | String | e.g., "gemini-2.0-flash". |
| `input_prompt` | Text | The full prompt sent to the model (including system instructions). |
| `system_prompt` | Text | The system prompt used. |
| `output_response` | Text | The raw text response from the model. |
| `metadata` | JSONB | Token usage, latency, finish reason. |
| `timestamp` | Timestamp | When the request occurred. |

#### Implementation Strategy
- **Service Layer**: Decorate `generateText` and `generateWorkflow` methods in `AIService` to push logs to the database asynchronously.
- **Safety**: ensure sensitive keys (PII) are masked before logging if necessary.

### 2. Bias & Safety Analysis Reports

A background job system (e.g., using BullMQ) will periodically analyze the `ai_logs` table.

#### Analysis Metrics
- **Sentiment Analysis**: Score interaction outputs for negative/toxic sentiment.
- **Keyword Flagging**: detailed regex matching for biased language (gender, race, political).
- **Refusal Rate**: Track how often the model refuses to answer (indicates safety guardrails triggering).

#### Reporting
- Generate a generic "Safety Score" for each workflow run.
- Flag specific nodes that consistently produce potentially biased or unsafe output.

### 3. Governance Dashboard

A new UI section in the TriggerForge dashboard (`/governance`) to visualize these insights.

#### Features
- **Timeline View**: See a history of all AI decisions in a workflow run.
- **Diff View**: Compare the "Prompt" vs "Response" side-by-side.
- **Audit Export**: Download logs as CSV/JSON for compliance purposes.
- **Human Feedback**: Allow users to "Thumbs Up/Down" a log entry to fine-tune future prompts.

## Implementation Steps

1.  **Database Migration**: Create `ai_logs` table.
2.  **Backend**: Update `AIService` to write to `ai_logs`.
3.  **Backend**: Create `GovernanceService` to aggregate stats.
4.  **Frontend**: Build the Governance Dashboard page.
