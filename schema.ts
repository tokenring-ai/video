import { VideoRequestSchema, VideoSizingSchema } from "@tokenring-ai/ai-client/schema.client";
import { z } from "zod";

export const VideoGenerationAgentConfigSchema = z
  .object({
    model: z.string().exactOptional(),
  })
  .default({});

export const VideoGenerationServiceConfigSchema = z
  .object({
    defaultModels: z.array(z.string()).default([]).meta({ description: "Model name patterns offered for video generation (* matches all)" }),
    agentDefaults: z
      .object({
        model: z.string().exactOptional().meta({ description: "Video model new agents use by default" }),
      })
      .default({})
      .meta({ label: "Agent Defaults" }),
  })
  .meta({ label: "Video Generation" });

export type VideoGenerationServiceConfig = z.input<typeof VideoGenerationServiceConfigSchema>;
export type ParsedVideoGenerationConfig = z.output<typeof VideoGenerationServiceConfigSchema>;
export const GenerateVideoOptionsSchema = VideoRequestSchema.omit({
  prompt: true,
  aspectRatio: true,
  resolution: true,
}).extend({
  prompt: z.string().describe("Description of the video to generate"),
  sizing: VideoSizingSchema,
  keywords: z.array(z.string()).describe("Keywords to add to media library metadata").exactOptional(),
});
export type GenerateVideoOptions = z.input<typeof GenerateVideoOptionsSchema>;
