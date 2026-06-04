import { AgentCommandService } from "@tokenring-ai/agent";
import type { TokenRingPlugin } from "@tokenring-ai/app";
import { ChatService } from "@tokenring-ai/chat";
import { RpcService } from "@tokenring-ai/rpc";
import { z } from "zod";
import agentCommands from "./commands.ts";
import packageJSON from "./package.json" with { type: "json" };
import videoGenerationRPC from "./rpc/videoGeneration.ts";
import { VideoGenerationServiceConfigSchema } from "./schema.ts";
import tools from "./tools.ts";
import VideoGenerationService from "./VideoGenerationService.ts";

const packageConfigSchema = z.object({
  videoGeneration: VideoGenerationServiceConfigSchema,
});

export default {
  name: packageJSON.name,
  displayName: "Video Generation",
  version: packageJSON.version,
  description: packageJSON.description,
  install(app, config) {
    app.addServices(new VideoGenerationService(app, config.videoGeneration));
    app.waitForService(ChatService, chatService => chatService.addTools(...tools));
    app.waitForService(AgentCommandService, agentCommandService => agentCommandService.addAgentCommands(agentCommands));
    app.waitForService(RpcService, rpcService => {
      rpcService.registerEndpoint(videoGenerationRPC);
    });
  },
  config: packageConfigSchema,
} satisfies TokenRingPlugin<typeof packageConfigSchema>;
