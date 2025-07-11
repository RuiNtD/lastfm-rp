import { z } from "zod/v4";

import { Provider, OtherConfig, ButtonType } from "./V7.ts";
export { Provider, OtherConfig, ButtonType };

export const check = z.object({ _VERSION: z.literal(8) });
export const ConfigV8 = z.object({
  _VERSION: z.literal(8),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  showElapsedTime: z.boolean().default(false),
  showRemainingTime: z.boolean().default(false),

  button1: ButtonType.default("none"),
  button2: ButtonType.default("none"),

  useNintendoMusicArt: z.boolean().default(false),
  useNintendoMusicFormat: z.boolean().default(false),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV8;
