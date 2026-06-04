# @tokenring-ai/video

AI-powered video generation backed by the shared media library.

## Overview

This package provides video generation for the TokenRing ecosystem. It integrates with
`VideoGenerationModelRegistry` from `@tokenring-ai/ai-client` and stores generated videos through
`@tokenring-ai/media-library`.

## Key Features

- **AI Video Generation**: Generate videos using configurable video models
- **Shared Media Storage**: Saves generated videos through `@tokenring-ai/media-library`
- **Automatic Indexing**: Adds generated video metadata to `media_index.json`
- **Local Video Search**: Search generated videos by filename, prompt, or keywords
- **Aspect Ratio Support**: Generate square, tall, or wide videos
- **Model Flexibility**: Select video models through the model registry
- **RPC Endpoints**: HTTP API for video generation and retrieval
- **Web Host Integration**: Static file serving is provided by `@tokenring-ai/media-library`

## Installation

```bash
bun add @tokenring-ai/video
```

## Plugin Configuration

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
  defaultModels: z.array(z.string()).default([]),
  agentDefaults: z
    .object({
      model: z.string().exactOptional(),
    })
    .default({}),
});
```

**Configuration Options:**

| Field                 | Type       | Required | Description                                                                |
|-----------------------|------------|----------|----------------------------------------------------------------------------|
| `defaultModels`       | `string[]` | No       | List of model requirements to try for default selection                    |
| `agentDefaults.model` | `string`   | No       | Default video generation model for agents                                  |

## Chat Commands

### /video reindex

Regenerate video entries in the media library index by scanning video files.

**Usage:**

```bash
/video reindex
```

**Behavior:**

1. Scans the media library directory for video files
2. Reads metadata with `exiftool-vendored`
3. Rebuilds video entries in `media_index.json`

### /video model get

Show the currently active video generation model.

```bash
/video model get
```

### /video model set <model_name>

Set the video generation model to a specific model by name.

```bash
/video model set xai:grok-2-video
```

### /video model select

Open an interactive tree selector to choose a video generation model. Models are grouped by provider and show
availability status.

```bash
/video model select
```

### /video model reset

Reset the video generation model to the initial configured value.

```bash
/video model reset
```

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
    aspectRatio: z.enum(["square", "tall", "wide"]).default("wide").exactOptional(),
    resolution: z.string().regex(/^\d+x\d+$/).describe("Optional resolution such as 1280x720").exactOptional(),
    duration: z.number().positive().describe("Optional video duration in seconds").exactOptional(),
    fps: z.number().int().positive().describe("Optional frames per second").exactOptional(),
    seed: z.number().int().describe("Optional generation seed").exactOptional(),
    keywords: z.array(z.string()).describe("Keywords to add to media library metadata").exactOptional(),
  }),
  execute: async (input, agent) => {
    // Implementation
  },
};
```

**Usage Example:**

```typescript
const result = await agent.useTool("video_generate", {
  prompt: "A product demo shot on a clean studio background",
  aspectRatio: "wide",
  duration: 6,
  keywords: ["product", "demo", "studio"],
});

console.log(result);
// {
//   path: ".tokenring/media-library/bright-river.mp4",
//   fileName: "bright-river.mp4",
//   mediaType: "video/mp4",
//   duration: 6
// }
```

**Parameters:**

| Parameter     | Type                           | Required | Description                            |
|---------------|--------------------------------|----------|----------------------------------------|
| `prompt`      | `string`                       | Yes      | Description of the video to generate   |
| `aspectRatio` | `"square" \| "tall" \| "wide"` | No       | Aspect ratio. Default: `wide`          |
| `resolution`  | `string`                       | No       | Resolution such as `1280x720`          |
| `duration`    | `number`                       | No       | Video duration in seconds              |
| `fps`         | `number`                       | No       | Frames per second                      |
| `seed`        | `number`                       | No       | Optional generation seed               |
| `keywords`    | `string[]`                     | No       | Keywords stored in media metadata      |

**Aspect Ratios:**

- `square`: `1:1`
- `tall`: `9:16`
- `wide`: `16:9`

### video_search

Search generated videos in the media library.

**Tool Definition:**

```typescript
import { TokenRingToolDefinition } from "@tokenring-ai/chat/schema";
import { z } from "zod";

const video_search: TokenRingToolDefinition = {
  name: "video_search",
  displayName: "Video Generation/searchVideos",
  description: "Search for videos in the media library based on filename, prompt, or keywords",
  inputSchema: z.object({
    query: z.string().describe("Search query to match against video metadata"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").exactOptional(),
  }),
  execute: async (input, agent) => {
    // Implementation
  },
};
```

**Usage Example:**

```typescript
const searchResults = await agent.useTool("video_search", {
  query: "product demo",
  limit: 3,
});
```

**Parameters:**

| Parameter | Type     | Required | Description                                      |
|-----------|----------|----------|--------------------------------------------------|
| `query`   | `string` | Yes      | Search query to match against video metadata     |
| `limit`   | `number` | No       | Maximum number of results to return. Default: 10 |

## RPC API

The package exposes an RPC endpoint at `/rpc/video-generation`.

### getVideos

List indexed videos from the media library.

**Input:**

```typescript
{
  search?: string;
  limit?: number;
}
```

**Result:**

```typescript
{
  videos: Array<{
    kind: "video";
    filename: string;
    mimeType: string;
    keywords: string[];
    width?: number;
    height?: number;
    duration?: number;
    prompt?: string;
    createdAt?: string;
  }>;
  count: number;
}
```

### generateVideo

Generate a video for an agent.

**Input:**

```typescript
{
  agentId: string;
  prompt: string;
  model?: string;
  aspectRatio?: "square" | "tall" | "wide";
  resolution?: string;
  duration?: number;
  fps?: number;
  seed?: number;
  keywords?: string[];
}
```

**Success Result:**

```typescript
{
  status: "success";
  filename: string;
  mimeType: string;
  message: string;
}
```

## Service API

### VideoGenerationService

```typescript
import { VideoGenerationService } from "@tokenring-ai/video";

const videoService = agent.requireServiceByType(VideoGenerationService);
```

### Methods

| Method | Description |
|--------|-------------|
| `getDefaultModel()` | Return the application default video model |
| `getModel(agent)` | Return the active video model for an agent |
| `setModel(model, agent)` | Set or clear the active video model |
| `requireModel(agent)` | Return the active model or throw if none is selected |
| `generateVideo(options, agent)` | Generate a video and save it to the media library |
| `reindex(agent)` | Reindex video files in the media library |

## Related Packages

- `@tokenring-ai/media-library` - Shared media storage, indexing, search, and static serving
- `@tokenring-ai/image` - Image generation and editing package
- `@tokenring-ai/audio` - Audio recording, playback, speech, and transcription package
