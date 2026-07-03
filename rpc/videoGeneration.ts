import { AgentManager } from "@tokenring-ai/agent";
import type TokenRingApp from "@tokenring-ai/app";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import VideoGenerationService from "../VideoGenerationService.ts";
import VideoGenerationRpcSchema from "./schema.ts";

export default createRPCEndpoint(VideoGenerationRpcSchema, {
  async generateVideo(args, app: TokenRingApp) {
    const agent = app.requireService(AgentManager).getAgent(args.agentId);
    if (!agent) {
      return { status: "agentNotFound" };
    }

    const videoService = app.requireService(VideoGenerationService);
    const previousModel = videoService.getModel(agent);
    if (args.model) {
      videoService.setModel(args.model, agent);
    }

    try {
      const result = await videoService.generateVideo(
        {
          prompt: args.prompt,
          aspectRatio: args.aspectRatio,
          resolution: args.resolution,
          duration: args.duration,
          fps: args.fps,
          seed: args.seed,
          keywords: args.keywords,
        },
        agent,
      );

      return {
        status: "success" as const,
        filename: result.fileName,
        mimeType: result.mediaType,
        message: `Generated: ${result.fileName}`,
      };
    } finally {
      if (args.model) {
        videoService.setModel(previousModel, agent);
      }
    }
  },
});
