import { executeWorkflowFromJson } from "./src/workflow";

const workflowJson = {
    "nodes": [
        {
            "id": "2",
            "data": {
                "label": "Generate Blog Draft"
            },
            "type": "action",
            "config": {
                "something": "..."
            }
        },
        {
            "id": "4",
            "data": {
                "label": "Append Content"
            },
            "type": "action",
            "config": {
                "content": "{{ $node[\"Generate Blog Draft\"].output.text }}",
                "operation": "append_text",
                "documentId": "123"
            }
        }
    ],
    "edges": [
        {
            "source": "2",
            "target": "4"
        }
    ]
};

// ... Wait, we can't easily run executeWorkflowFromJson because connectors make real API calls.
