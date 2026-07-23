import type { RPCSchema } from "@tokenring-ai/rpc/types";
import { AgentNotFoundSchema, SuccessSchema } from "@tokenring-ai/rpc/types";
import { z } from "zod";
import { GenerateVideoOptionsSchema } from "../schema.ts";

export default {
  name: "Video Generation RPC",
  path: "/rpc/video-generation",
  methods: {
    generateVideo: {
      type: "mutation",
      input: z.object({
        agentId: z.string(),
        model: z.string().exactOptional(),
        request: GenerateVideoOptionsSchema,
      }),
      result: z.discriminatedUnion("status", [
        SuccessSchema.extend({
          filename: z.string(),
          mimeType: z.string(),
          message: z.string(),
          width: z.number().exactOptional(),
          height: z.number().exactOptional(),
          duration: z.number().exactOptional(),
        }),
        AgentNotFoundSchema,
      ]),
    },
  },
} satisfies RPCSchema;
