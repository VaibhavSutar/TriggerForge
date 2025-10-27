import { executeWorkflowFromJson } from "./workflow.js";

const wf = {
  name: "TriggerForge Test Flow",
  nodes: [
    {
      id: "n1",
      type: "print",
      config: { message: "🚀 Starting TriggerForge workflow" },
      next: "n2"
    },
    {
      id: "n2",
      type: "random",
      config: { min: 1, max: 10 },
      next: "n3"
    },
    {
      id: "n3",
      type: "condition",
      config: { expression: "{{state.n2}} > 5" },
      next: "n4"
    },
    {
      id: "n4",
      type: "delay",
      config: { ms: 1000 },
      next: "n5"
    },
    {
      id: "n5",
      type: "http",
      config: { url: "https://jsonplaceholder.typicode.com/todos/{{state.n2}}" },
      next: "n6"
    },
    {
      id: "n6",
      type: "print",
      config: { message: "✅ Task title: {{state.n5.title}}" }
    }
  ]
};

(async () => {
  console.log("🧠 Running test workflow...\n");
  const result = await executeWorkflowFromJson(JSON.stringify(wf), { user: "Vaibhav" });
  console.log("\n=== Workflow Logs ===");
  console.log(result.logs.join("\n"));
  console.log("\n=== Final Output ===");
  console.log(result.output);
})();
