import { AgentStateSlice } from "@tokenring-ai/agent/types";
import { z } from "zod";
import type { ParsedVideoGenerationConfig } from "../schema.ts";

const serializationSchema = z.object({
  model: z.string().nullable(),
});

export class VideoGenerationState extends AgentStateSlice<typeof serializationSchema> {
  model: string | null;

  constructor(readonly initialConfig: ParsedVideoGenerationConfig["agentDefaults"]) {
    super("VideoGenerationState", serializationSchema);
    this.model = initialConfig.model ?? null;
  }

  serialize(): z.output<typeof serializationSchema> {
    return { model: this.model };
  }

  deserialize(data: z.output<typeof serializationSchema>): void {
    this.model = data.model;
  }

  show(): string {
    return `Video Model: ${this.model ?? "(none)"}`;
  }
}
