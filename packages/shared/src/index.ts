import { z } from 'zod';

export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any())
});

export type Workflow = z.infer<typeof WorkflowSchema>;
