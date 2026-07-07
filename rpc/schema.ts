import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { AgentNotFoundSchema, SuccessSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";

export default {
  name: "Video Generation RPC",
  path: "/rpc/video-generation",
  methods: {
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
        SuccessSchema.extend({
          filename: z.string(),
          mimeType: z.string(),
          message: z.string(),
        }),
        AgentNotFoundSchema,
      ]),
    },
  },
} satisfies RPCSchema;
