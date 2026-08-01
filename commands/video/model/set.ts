import { CommandFailedError } from "@tokenring-ai/agent/AgentError";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import VideoGenerationService from "../../../VideoGenerationService.ts";

const inputSchema = {
  args: {},
  positionals: [
    {
      name: "modelName",
      description: "The video model name to set",
      required: true,
    },
  ],
} as const satisfies AgentCommandInputSchema;

function execute({ args, agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const modelName = args.modelName;
  if (!modelName) throw new CommandFailedError("Model name required. Usage: /video model set <model_name>");
  agent.requireService(VideoGenerationService).setModel(modelName, agent);
  return Promise.resolve(`Video model set to ${modelName}`);
}

export default {
  name: "video model set",
  description: "Set the video generation model",
  inputSchema,
  execute,
  help: `Set the video generation model to a specific model by name.

## Example

/video model set xai:grok-2-image-1212`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
