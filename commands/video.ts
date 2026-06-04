import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import VideoGenerationService from "../VideoGenerationService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const videoService = agent.requireServiceByType(VideoGenerationService);
  await videoService.reindex(agent);
  return "Video media re-indexed successfully.";
}

export default {
  name: "video reindex",
  description: "Reindex videos in the media library directory",
  inputSchema,
  execute,
  help: `Regenerate the media_index.json file by scanning all videos in the media library directory and reading their metadata.

## Example

/video reindex`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
