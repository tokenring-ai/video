import { AgentNotFoundSchema } from "@tokenring-ai/agent/schema";
import { MediaLibraryEntrySchema } from "@tokenring-ai/media-library/schema";
import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

export const VideoIndexEntrySchema = MediaLibraryEntrySchema.extend({
  kind: z.literal("video"),
});

export type VideoIndexEntry = z.output<typeof VideoIndexEntrySchema>;

export default {
  name: "Video Generation RPC",
  path: "/rpc/video-generation",
  methods: {
    getVideos: {
      type: "query",
      input: z.object({
        search: z.string().exactOptional(),
        limit: z.number().int().positive().default(200).exactOptional(),
      }),
      result: z.object({
        videos: z.array(VideoIndexEntrySchema),
        count: z.number(),
      }),
    },
    generateVideo: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        prompt: z.string(),
        model: z.string().exactOptional(),
        aspectRatio: z.enum(["square", "tall", "wide"]).default("wide").exactOptional(),
        resolution: z
          .string()
          .regex(/^\d+x\d+$/)
          .exactOptional(),
        duration: z.number().positive().exactOptional(),
        fps: z.number().int().positive().exactOptional(),
        seed: z.number().int().exactOptional(),
        keywords: z.array(z.string()).exactOptional(),
      }),
      result: z.discriminatedUnion("status", [
        z.object({
          status: z.literal("success"),
          filename: z.string(),
          mimeType: z.string(),
          message: z.string(),
        }),
        AgentNotFoundSchema,
      ]),
    },
  },
} satisfies RPCSchema;
