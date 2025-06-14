import { z } from "zod/v4-mini";
import ConfigV2 from "./V2.ts";

export const OtherConfig = z.object({
  any: z._default(z.boolean(), false),
  listening: z._default(z.boolean(), true),
  cider: z._default(z.boolean(), true),
  iTRP: z._default(z.boolean(), true),
  AMPMD: z._default(z.boolean(), true),
  custom: z.array(z.string().check(z.regex(/^\d+$/), z.maxLength(20))),
});

export default z.pipe(
  z.object({
    _VERSION: z.literal(1),
    username: z
      .string()
      .check(z.regex(/^[A-Za-z][\w-]+$/), z.minLength(2), z.maxLength(15)),
    shareName: z._default(z.boolean(), false),
    otherEnabled: z._default(z.boolean(), true),
    other: z.optional(OtherConfig),
    advanced: z.object({
      lastFmKey: z.optional(z.string()),
      appId: z.optional(z.string()),
    }),
  }),
  z.transform(
    (config): z.input<typeof ConfigV2> => ({
      _VERSION: 2,
      lastFmUsername: config.username,
      shareUsername: config.shareName,
      disableOnPresence: config.otherEnabled
        ? {
            any: config.other?.any,
            listening: config.other?.listening,
            cider: config.other?.cider,
            iTunesRP: config.other?.iTRP,
            PreMiDAppleMusic: config.other?.AMPMD,
            custom: config.other?.custom,
          }
        : undefined,
      lastFmApiKey: config.advanced.lastFmKey,
      discordClientId: config.advanced.appId,
    }),
  ),
);
