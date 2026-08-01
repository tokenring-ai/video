# @tokenring-ai/video

Video generation for TokenRing media workflows.

## Overview

The `@tokenring-ai/video` package provides video generation capabilities for the
TokenRing ecosystem. It integrates with `VideoGenerationModelRegistry` from
`@tokenring-ai/ai-client` and stores generated videos through
`@tokenring-ai/media-library`.

## Features

- **AI Video Generation**: Generate videos using configurable video models
- **Guided Sizing**: Quality and shape-based sizing with automatic resolution
  determination
- **Shared Media Storage**: Saves generated videos through
  `@tokenring-ai/media-library`
- **Automatic Indexing**: Adds generated video metadata to `media_index.json`
- **Model Flexibility**: Select video models through the model registry
- **Agent-Specific Models**: Each agent can have its own video generation model
- **RPC Endpoints**: HTTP API for video generation and retrieval
- **Web Host Integration**: Static file serving is provided by
  `@tokenring-ai/media-library`

## Installation

```bash
bun add @tokenring-ai/video
```

## Chat Commands

### /video reindex

Regenerate video entries in the media library index by scanning video files.

**Usage:**

```bash
/video reindex
```

**Behavior:**

1. Delegates to `MediaLibraryService.reindex()` with the `"video"` kind filter
2. Rebuilds video entries in `media_index.json`

### /video model get

Show the currently active video generation model.

**Usage:**

```bash
/video model get
```

### /video model set <model_name>

Set the video generation model to a specific model by name.

**Usage:**

```bash
/video model set xai:grok-2-video
```

### /video model select

Open an interactive tree selector to choose a video generation model. Models are
grouped by provider and show availability status.

**Usage:**

```bash
/video model select
```

### /video model reset

Reset the video generation model to the initial configured value.

**Usage:**

```bash
/video model reset
```

**Note:** Requires an initial model to be configured in `agentDefaults.model`.
Fails with a `CommandFailedError` if no initial model is set.

## Tools

### video_generate

Generate an AI video and save it to the shared media library.

**Tool Definition:**

```typescript
import { TokenRingToolDefinition } from "@tokenring-ai/chat/schema";
import { z } from "zod";

const video_generate: TokenRingToolDefinition = {
  name: "video_generate",
  displayName: "Video Generation/generateVideo",
  description: "Generate an AI video and save it to the shared media library",
  inputSchema: z.object({
    prompt: z.string().describe("Description of the video to generate"),
    quality: z
      .enum(["ultra", "high", "standard", "low"])
      .describe("Quality of the generated video"),
    shape: z
      .enum(["square", "landscape", "portrait", "ultrawide", "ultratall"])
      .describe("Shape of the generated video"),
    duration: z
      .number()
      .positive()
      .describe("Optional video duration in seconds")
      .exactOptional(),
    fps: z
      .number()
      .int()
      .positive()
      .describe("Optional frames per second")
      .exactOptional(),
    seed: z
      .number()
      .int()
      .describe("Optional generation seed")
      .exactOptional(),
    keywords: z
      .array(z.string())
      .describe("Keywords to add to media library metadata")
      .exactOptional(),
  }),
  execute: async (input, agent) => {
    // Implementation
  },
};
```

**Parameters:**

| Parameter  | Type                                              | Required | Description                            |
|------------|---------------------------------------------------|----------|----------------------------------------|
| `prompt`   | `string`                                          | Yes      | Description of the video to generate   |
| `quality`  | `"ultra" \| "high" \| "standard" \| "low"`        | Yes      | Quality of the generated video         |
| `shape`    | `"square" \| "landscape" \| "portrait" \| "ultrawide" \| "ultratall"` | Yes | Shape of the generated video |
| `duration` | `number`                                          | No       | Video duration in seconds              |
| `fps`      | `number`                                          | No       | Frames per second                      |
| `seed`     | `number`                                          | No       | Optional generation seed               |
| `keywords` | `string[]`                                        | No       | Keywords stored in media metadata      |

**Shapes:**

- `square`: Square format (1:1)
- `landscape`: Wide format (16:9)
- `portrait`: Tall format (9:16)
- `ultrawide`: Ultrawide format (21:9)
- `ultratall`: Ultratall format (9:21)

## Configuration

Configure the video generation plugin alongside the media library plugin:

```yaml
mediaLibrary:
  agentDefaults:
    outputDirectory: ./.tokenring/media-library

videoGeneration:
  defaultModels:
    - xai:grok-2-video
    - "*"
  agentDefaults:
    model: xai:grok-2-video
```

### Configuration Schema

```typescript
import { VideoGenerationServiceConfigSchema } from "@tokenring-ai/video";

VideoGenerationServiceConfigSchema = z.object({
  defaultModels: z
    .array(z.string())
    .default([])
    .meta({
      description: "Model name patterns offered for video generation (* matches all)",
    }),
  agentDefaults: z
    .object({
      model: z
        .string()
        .exactOptional()
        .meta({ description: "Video model new agents use by default" }),
    })
    .default({})
    .meta({ label: "Agent Defaults" }),
});
```

**Configuration Options:**

| Field                 | Type       | Required | Description                                   |
|-----------------------|------------|----------|-----------------------------------------------|
| `defaultModels`       | `string[]` | No       | List of model requirements to try for default |
|                       |            |          | selection (`*` matches all)                   |
| `agentDefaults.model` | `string`   | No       | Default video generation model for agents     |

## RPC API

The package exposes an RPC endpoint at `/rpc/video-generation`.

### generateVideo

Generate a video for an agent.

**Input:**

```typescript
{
  agentId: string;
  model?: string;
  request: {
    prompt: string;
    sizing: {
      method: "guided";
      quality: "ultra" | "high" | "standard" | "low";
      shape: "square" | "landscape" | "portrait" | "ultrawide" | "ultratall";
    };
    duration?: number;
    fps?: number;
    seed?: number;
    keywords?: string[];
  };
}
```

**Success Result:**

```typescript
{
  status: "success";
  filename: string;
  mimeType: string;
  message: string;
  width?: number;
  height?: number;
  duration?: number;
}
```

**Error Result:**

```typescript
{
  status: "agentNotFound";
}
```

**Notes:**

- If `model` is provided, it is temporarily set for the duration of the request
- The previous model is restored after generation completes

## Service API

### VideoGenerationService (Service Layer)

```typescript
import { VideoGenerationService } from "@tokenring-ai/video";

const videoService = agent.requireService(VideoGenerationService);
```

### Methods

| Method | Description |
|--------|-------------|
| `getModel(agent)` | Return the active video model for an agent |
| `setModel(model, agent)` | Set or clear the active video model |
| `requireModel(agent)` | Return the active model or throw if none is selected |
| `generateVideo(options, agent)` | Generate a video and save it to the media library |
| `reindex(agent)` | Reindex video files in the media library |

### generateVideo Options

The `generateVideo` method accepts the following options:

```typescript
export type GenerateVideoOptions = {
  prompt: string;
  sizing: {
    method: "guided";
    quality: "ultra" | "high" | "standard" | "low";
    shape: "square" | "landscape" | "portrait" | "ultrawide" | "ultratall";
  };
  duration?: number | undefined;
  fps?: number | undefined;
  seed?: number | undefined;
  keywords?: string[] | undefined;
};
```

**Parameters:**

| Parameter  | Type                                              | Required | Description                            |
|------------|---------------------------------------------------|----------|----------------------------------------|
| `prompt`   | `string`                                          | Yes      | Description of the video to generate   |
| `sizing`   | `VideoSizing`                                     | Yes      | Guided sizing with quality and shape   |
| `duration` | `number`                                          | No       | Video duration in seconds              |
| `fps`      | `number`                                          | No       | Frames per second                      |
| `seed`     | `number`                                          | No       | Optional generation seed               |
| `keywords` | `string[]`                                        | No       | Keywords stored in media metadata      |

**Return Value:**

```typescript
{
  mediaType: string;
  fileName: string;
  filePath: string;
  duration?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  buffer: Buffer;
}
```

**File Extension Mapping:**

The generated video file extension is derived from the MIME type returned by
the model:

- `video/mp4` -> `.mp4`
- `video/quicktime` -> `.mov`
- Other types use the MIME subtype (e.g., `video/webm` -> `.webm`)

## Developer Reference

### Core Components

- **VideoGenerationService**: Main service class that manages video generation
  operations and model selection
- **VideoGenerationState**: Agent state slice for persisting the selected video
  model
- **Plugin**: TokenRing plugin that registers services, tools, commands, and RPC
  endpoints

### Services

#### VideoGenerationService (Core Service)

The primary service for video generation operations. Implements the
`TokenRingService` interface.

**Constructor:**

```typescript
constructor(app: TokenRingApp, options: ParsedVideoGenerationConfig)
```

**Lifecycle:**

- `start()`: Initializes the default video model by scanning available models
  against configured requirements. Logs the selected model or an error if no
  model is configured.
- `attach(agent, creationContext)`: Attaches to agents, initializing state and
  reporting the selected model in the agent creation context.

**State Management:**

The service uses `VideoGenerationState` to persist the selected video model per
agent. This allows individual agents to have different video models while
falling back to the application default.

### RPC Endpoints

**Path:** `/rpc/video-generation`

**Methods:**

- `generateVideo`: Generate a video for a specific agent with optional model
  override

The RPC endpoint temporarily sets the model for the duration of the request and
restores the previous model afterward.

### Exports

```typescript
export * from "./schema.ts";
export { VideoGenerationState } from "./state/VideoGenerationState.ts";
export { default as VideoGenerationService } from "./VideoGenerationService.ts";
```

**Exported Types:**

- `GenerateVideoOptions`: Options for video generation (includes `prompt`,
  `sizing`, `duration`, `fps`, `seed`, `keywords`)
- `VideoGenerationServiceConfig`: Configuration input type
- `ParsedVideoGenerationConfig`: Configuration output type
- `VideoGenerationState`: Agent state slice for persisting video model selection

### Testing

```bash
cd plugin/video
bun run test
```

## Related Packages

- `@tokenring-ai/media-library` - Shared media storage, indexing, search, and
  static serving
- `@tokenring-ai/image` - Image generation and editing package
- `@tokenring-ai/audio` - Audio recording, playback, speech, and transcription
  package

## License

MIT License - see LICENSE file for details.
