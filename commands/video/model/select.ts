import type { TreeLeaf } from "@tokenring-ai/agent/question";
import type { AgentCommandInputSchema, AgentCommandInputType, TokenRingAgentCommand } from "@tokenring-ai/agent/types";
import { VideoGenerationModelRegistry } from "@tokenring-ai/ai-client/ModelRegistry";
import VideoGenerationService from "../../../VideoGenerationService.ts";

const inputSchema = {} as const satisfies AgentCommandInputSchema;

async function execute({ agent }: AgentCommandInputType<typeof inputSchema>): Promise<string> {
  const registry = agent.requireServiceByType(VideoGenerationModelRegistry);
  const videoService = agent.requireServiceByType(VideoGenerationService);
  const modelsByProvider = await agent.busyWithActivity("Checking online status of models...", registry.getModelsByProvider());
  const tree: TreeLeaf[] = Object.entries(modelsByProvider)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provider, providerModels]) => {
      const sorted = Object.entries(providerModels).sort(([, a], [, b]) =>
        a.status === b.status ? a.modelSpec.modelId.localeCompare(b.modelSpec.modelId) : a.status.localeCompare(b.status),
      );
      const onlineCount = Object.values(providerModels).filter(m => m.status === "online").length;
      return {
        name: `${provider} (${onlineCount}/${Object.keys(providerModels).length} online)`,
        children: sorted.map(([modelName, model]) => ({
          value: modelName,
          name: model.status === "online" ? model.modelSpec.modelId : `${model.modelSpec.modelId} (${model.status})`,
        })),
      };
    });
  const selection = await agent.askQuestion({
    message: "Choose a video generation model:",
    question: {
      type: "treeSelect",
      label: "Model Selection",
      key: "result",
      minimumSelections: 1,
      maximumSelections: 1,
      tree,
    },
  });
  if (selection) {
    videoService.setModel(selection[0], agent);
    return `Video model set to ${selection[0]}`;
  }
  return "Model selection cancelled. No changes made.";
}

export default {
  name: "video model select",
  description: "Interactively select a video generation model",
  inputSchema,
  execute,
  help: `Open an interactive tree-based selector to choose a video generation model. Models are grouped by provider with availability status.

## Example

/video model select`,
} satisfies TokenRingAgentCommand<typeof inputSchema>;
