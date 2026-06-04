import { z } from "zod";

export const VideoGenerationAgentConfigSchema = z
  .object({
    model: z.string().exactOptional(),
  })
  .default({});

export const VideoGenerationServiceConfigSchema = z.object({
  defaultModels: z.array(z.string()).default([]),
  agentDefaults: z
    .object({
      model: z.string().exactOptional(),
    })
    .default({}),
});

export type VideoGenerationServiceConfig = z.input<typeof VideoGenerationServiceConfigSchema>;
export type ParsedVideoGenerationConfig = z.output<typeof VideoGenerationServiceConfigSchema>;
