import video from "./commands/video.ts";
import videoModelGet from "./commands/video/model/get.ts";
import videoModelReset from "./commands/video/model/reset.ts";
import videoModelSelect from "./commands/video/model/select.ts";
import videoModelSet from "./commands/video/model/set.ts";

export default [video, videoModelGet, videoModelSet, videoModelSelect, videoModelReset];
