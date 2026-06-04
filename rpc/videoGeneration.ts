import { AgentManager } from "@tokenring-ai/agent";
import type TokenRingApp from "@tokenring-ai/app";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import VideoGenerationService from "../VideoGenerationService.ts";
import VideoGenerationRpcSchema from "./schema.ts";

export default createRPCEndpoint(VideoGenerationRpcSchema, {
  async getVideos(args, app: TokenRingApp) {
    const mediaLibrary = app.requireService(MediaLibraryService);
    const videos = await mediaLibrary.getEntriesFromDirectory(mediaLibrary.getDefaultOutputDirectory(), {
      kind: "video",
      search: args.search,
    });
    const limitedVideos = videos.slice(0, args.limit ?? 200);

    return {
      videos: limitedVideos.map(video => ({
        kind: "video" as const,
        filename: video.filename,
        mimeType: video.mimeType,
        keywords: video.keywords,
        ...(video.width !== undefined && { width: video.width }),
        ...(video.height !== undefined && { height: video.height }),
        ...(video.duration !== undefined && { duration: video.duration }),
        ...(video.prompt !== undefined && { prompt: video.prompt }),
        ...(video.createdAt !== undefined && { createdAt: video.createdAt }),
      })),
      count: videos.length,
    };
  },

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
