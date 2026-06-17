import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { z } from "zod";

const name = "video_search";
const displayName = "Video Generation/searchVideos";

async function execute({ query, limit  }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const mediaLibrary = agent.requireServiceByType(MediaLibraryService);
  const results = await mediaLibrary.search(query, { kind: "video", limit }, agent);

  return JSON.stringify({
    results,
    message: `Found ${results.length} videos matching "${query}"`,
  });
}

const description = "Search for videos in the media library based on filename, prompt, or keywords";

const inputSchema = z.object({
  query: z.string().describe("Search query to match against video metadata"),
  limit: z.number().int().positive().default(10).describe("Maximum number of results to return"),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
