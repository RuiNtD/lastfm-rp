import { z } from "zod/v4";
import ConfigV7 from "./V7.ts";

import { Provider, OtherConfig, ButtonType } from "./V5.ts";
export { Provider, OtherConfig, ButtonType };

export const check = z.object({ _VERSION: z.literal(6) });
export const ConfigV6 = z.object({
  _VERSION: z.literal(6),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  useNintendoMusicArt: z.boolean().default(true),
  useNintendoMusicFormat: z.boolean().default(true),

  disableOnPresence: OtherConfig.prefault({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
  listenBrainzAPIURL: z.string().optional(),
});
export default ConfigV6;

export const migrate = ConfigV6.transform(
  (config): z.input<typeof ConfigV7> => ({
    ...config,
    _VERSION: 7,
    showDuration: false,
  }),
);
