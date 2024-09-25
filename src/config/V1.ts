import * as v from "valibot";
import ConfigV2 from "./V2.ts";

export const OtherConfig = v.object({
  any: v.optional(v.boolean(), false),
  listening: v.optional(v.boolean(), true),
  cider: v.optional(v.boolean(), true),
  iTRP: v.optional(v.boolean(), true),
  AMPMD: v.optional(v.boolean(), true),
  custom: v.array(v.pipe(v.string(), v.digits(), v.maxLength(20))),
});

export default v.pipe(
  v.object({
    _VERSION: v.literal(1),
    username: v.pipe(
      v.string(),
      v.regex(/^[A-Za-z][\w-]+$/),
      v.minLength(2),
      v.maxLength(15)
    ),
    shareName: v.optional(v.boolean(), false),
    otherEnabled: v.optional(v.boolean(), true),
    other: v.optional(OtherConfig),
    advanced: v.object({
      lastFmKey: v.optional(v.string()),
      appId: v.optional(v.string()),
    }),
  }),
  v.transform(
    (config): v.InferInput<typeof ConfigV2> => ({
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
    })
  )
);
