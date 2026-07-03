import type Agent from "@tokenring-ai/agent/Agent";
import type { AgentCreationContext } from "@tokenring-ai/agent/types";
import { VideoGenerationModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import { Buffer } from "node:buffer";
import { type ParsedVideoGenerationConfig, VideoGenerationAgentConfigSchema } from "./schema.ts";
import { VideoGenerationState } from "./state/VideoGenerationState.ts";

export type VideoAspectRatio = "square" | "tall" | "wide";

export type GenerateVideoOptions = {
  prompt: string;
  aspectRatio?: VideoAspectRatio | undefined;
  resolution?: string | undefined;
  duration?: number | undefined;
  fps?: number | undefined;
  seed?: number | undefined;
  n?: number | undefined;
  keywords?: string[] | undefined;
};

function mapAspectRatio(aspectRatio: VideoAspectRatio | undefined): `${number}:${number}` {
  switch (aspectRatio ?? "wide") {
    case "square":
      return "1:1";
    case "tall":
      return "9:16";
    case "wide":
    default:
      return "16:9";
  }
}

function extensionFromMimeType(mimeType: string): string {
  const subtype = mimeType.split("/")[1]?.split(";")[0];
  if (!subtype) return "mp4";
  return subtype === "quicktime" ? "mov" : subtype;
}

function parseResolution(resolution: string | undefined): { width?: number; height?: number } {
  if (!resolution) return {};
  const [width, height] = resolution.split("x").map(value => Number.parseInt(value, 10));
  return {
    ...(Number.isFinite(width) && { width }),
    ...(Number.isFinite(height) && { height }),
  };
}

export default class VideoGenerationService implements TokenRingService {
  readonly name = "VideoGenerationService";
  description = "Video generation backed by the shared media library";

  defaultModel: string | null = null;

  constructor(
    private app: TokenRingApp,
    private options: ParsedVideoGenerationConfig,
  ) {}

  start() {
    const videoModelRegistry = this.app.requireService(VideoGenerationModelRegistry);

    for (const modelName of this.options.defaultModels) {
      const foundModels = Object.keys(videoModelRegistry.getModelSpecsByRequirements(modelName));
      if (foundModels[0]) {
        this.defaultModel = foundModels[0];
        break;
      }
    }

    if (this.defaultModel) {
      this.app.serviceOutput(this, `Selected ${this.defaultModel} as default video generation model`);
    } else {
      this.app.serviceError(this, `No default video generation model was configured`);
    }
  }

  attach(agent: Agent, creationContext: AgentCreationContext): void {
    const agentConfig = deepClone(this.options.agentDefaults, agent.getAgentConfigSlice("videoGeneration", VideoGenerationAgentConfigSchema));
    const initialState = agent.initializeState(VideoGenerationState, agentConfig);

    const selectedModel = initialState.model ?? this.defaultModel;
    creationContext.items.push(`Video Generation Model: ${selectedModel ?? "No model selected"}`);
  }

  getDefaultModel(): string | null {
    return this.defaultModel;
  }

  getModel(agent: Agent): string | null {
    return agent.getState(VideoGenerationState).model ?? this.defaultModel;
  }

  setModel(model: string | null, agent: Agent): void {
    agent.mutateState(VideoGenerationState, state => {
      state.model = model;
    });
  }

  requireModel(agent: Agent): string {
    const model = this.getModel(agent);
    if (!model) throw new Error("No video generation model is currently selected");
    return model;
  }

  async reindex(agent: Agent): Promise<void> {
    await agent.requireServiceByType(MediaLibraryService).reindex(agent, ["video"]);
  }

  async generateVideo(
    options: GenerateVideoOptions,
    agent: Agent,
  ): Promise<{
    mediaType: string;
    fileName: string;
    filePath: string;
    duration?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    buffer: Buffer;
  }> {
    const videoModelRegistry = agent.requireServiceByType(VideoGenerationModelRegistry);
    const mediaLibrary = agent.requireServiceByType(MediaLibraryService);
    const model = this.requireModel(agent);

    agent.infoMessage(`[${this.name}] Generating video: "${options.prompt}"`);

    const videoClient = videoModelRegistry.getClient(model);
    const aspectRatio = mapAspectRatio(options.aspectRatio);
    const [videoResult] = await videoClient.generateVideo(
      {
        prompt: options.prompt,
        aspectRatio,
        ...(options.resolution && { resolution: options.resolution as `${number}x${number}` }),
        ...(options.duration !== undefined && { duration: options.duration }),
        ...(options.fps !== undefined && { fps: options.fps }),
        ...(options.seed !== undefined && { seed: options.seed }),
        ...(options.n !== undefined && { n: options.n }),
      },
      agent,
    );

    const videoBuffer = Buffer.from(videoResult.uint8Array);
    const dimensions = parseResolution(options.resolution);
    const media = await mediaLibrary.writeMedia(
      {
        kind: "video",
        buffer: videoBuffer,
        mimeType: videoResult.mediaType,
        extension: extensionFromMimeType(videoResult.mediaType),
        duration: options.duration,
        keywords: options.keywords ?? [],
        prompt: options.prompt,
        ...dimensions,
      },
      agent,
    );

    agent.infoMessage(`[${this.name}] Video saved: ${media.filePath}`);

    return {
      mediaType: videoResult.mediaType,
      buffer: videoBuffer,
      fileName: media.filename,
      filePath: media.filePath,
      duration: options.duration,
      ...dimensions,
    };
  }
}
