import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import { VideoGenerationState } from "../../../state/VideoGenerationState.ts";
import VideoGenerationService from "../../../VideoGenerationService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const initialModel = agent.getState(VideoGenerationState).initialConfig.model;
  if (!initialModel) throw new CommandFailedError("No initial video model configured");
  agent.requireServiceByType(VideoGenerationService).setModel(initialModel, agent);
  return Promise.resolve(`Video model reset to ${initialModel}`);
}

export default {
  name: "video model reset",
  description: "Reset to initial video generation model",
  inputSchema,
  execute,
  help: `Reset the video generation model to the initial configured value.

## Example

/video model reset`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
