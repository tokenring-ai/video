import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import VideoGenerationService from "../../../VideoGenerationService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  return Promise.resolve(`Current video model: ${agent.requireService(VideoGenerationService).getModel(agent) ?? "(none)"}`);
}

export default {
  name: "video model get",
  description: "Show current video generation model",
  inputSchema,
  execute,
  help: `Show the currently active video generation model.

## Example

/video model get`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
