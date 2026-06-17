import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import VideoGenerationService from "../VideoGenerationService.ts";

const name = "video_generate";
const displayName = "Video Generation/generateVideo";

async function execute(args: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const videoService = agent.requireServiceByType(VideoGenerationService);
  const result = await videoService.generateVideo(args, agent);

  return JSON.stringify({
    path: result.filePath,
    fileName: result.fileName,
    mediaType: result.mediaType,
    duration: result.duration,
    width: result.width,
    height: result.height,
  });
}

const description = "Generate an AI video and save it to the shared media library";

const inputSchema = z.object({
  prompt: z.string().describe("Description of the video to generate"),
  aspectRatio: z.enum(["square", "tall", "wide"]).default("wide"),
  resolution: z
    .string()
    .regex(/^\d+x\d+$/)
    .describe("Optional resolution such as 1280x720")
    .exactOptional(),
  duration: z.number().positive().describe("Optional video duration in seconds").exactOptional(),
  fps: z.number().int().positive().describe("Optional frames per second").exactOptional(),
  seed: z.number().int().describe("Optional generation seed").exactOptional(),
  keywords: z.array(z.string()).describe("Keywords to add to media library metadata").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
