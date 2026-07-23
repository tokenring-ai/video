import { Buffer } from "node:buffer";
import type Agent from "@tokenring-ai/agent/Agent";
import type { AgentCreationContext } from "@tokenring-ai/agent/types";
import { VideoGenerationModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import { VideoSizingSchema } from "@tokenring-ai/ai-client/schema.client";
import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import { ConfigurationError } from "@tokenring-ai/app/types";
import MediaLibraryService from "@tokenring-ai/media-library/MediaLibraryService";
import deepClone from "@tokenring-ai/utility/object/deepClone";
import type { GenerateVideoOptions } from "./schema.ts";
import { type ParsedVideoGenerationConfig, VideoGenerationAgentConfigSchema } from "./schema.ts";
import { VideoGenerationState } from "./state/VideoGenerationState.ts";

function extensionFromMimeType(mimeType: string): string {
  const subtype = mimeType.split("/")[1]?.split(";")[0];
  if (!subtype) return "mp4";
  return subtype === "quicktime" ? "mov" : subtype;
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
    const { model = this.defaultModel, ...agentConfig } = deepClone(
      this.options.agentDefaults,
      agent.getAgentConfigSlice("videoGeneration", VideoGenerationAgentConfigSchema),
    );
    agent.initializeState(VideoGenerationState, {
      ...agentConfig,
      ...(model && {
        model,
      }),
    });

    creationContext.items.push(`Video Generation Model: ${model ?? "No model selected"}`);
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
    if (!model) throw new ConfigurationError(this.name, "No video generation model is currently selected");
    return model;
  }

  async reindex(agent: Agent): Promise<void> {
    await agent.requireServiceByType(MediaLibraryService).reindex(agent, ["video"]);
  }

  async generateVideo(
    { keywords, sizing, ...request }: GenerateVideoOptions,
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

    agent.infoMessage(`[${this.name}] Generating video: "${request.prompt}"`);

    const videoClient = videoModelRegistry.getClient(model);
    const determinedSizing = videoClient.determineBestSizing(VideoSizingSchema.parse(sizing));

    const [videoResult] = await videoClient.generateVideo(
      {
        ...request,
        ...(determinedSizing?.aspectRatio && { aspectRatio: determinedSizing.aspectRatio }),
        ...(determinedSizing?.resolution && { resolution: determinedSizing.resolution }),
      },
      agent,
    );

    const videoBuffer = Buffer.from(videoResult.uint8Array);
    const dimensions = {
      ...(determinedSizing?.width !== undefined && { width: determinedSizing.width }),
      ...(determinedSizing?.height !== undefined && { height: determinedSizing.height }),
    };
    const media = await mediaLibrary.writeMedia(
      {
        kind: "video",
        buffer: videoBuffer,
        mimeType: videoResult.mediaType,
        extension: extensionFromMimeType(videoResult.mediaType),
        duration: request.duration,
        keywords: keywords ?? [],
        prompt: request.prompt,
        ...dimensions,
      },
      agent,
    );

    return {
      mediaType: videoResult.mediaType,
      buffer: videoBuffer,
      fileName: media.filename,
      filePath: media.filePath,
      duration: request.duration,
      ...dimensions,
    };
  }
}
