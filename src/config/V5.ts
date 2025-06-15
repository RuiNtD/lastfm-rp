import { z, object } from "zod/v4";

import { Provider, OtherConfig, ButtonType } from "./V4.ts";
export { Provider, OtherConfig, ButtonType };

export default object({
  _VERSION: z.literal(5),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  useNintendoMusicArt: z.boolean().default(true),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
