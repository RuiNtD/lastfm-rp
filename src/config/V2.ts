import * as v from "valibot";
import ConfigV3 from "./V3.ts";

export const OtherConfig = v.object({
  any: v.optional(v.boolean(), false),
  listening: v.optional(v.boolean(), true),
  cider: v.optional(v.boolean(), true),
  iTunesRP: v.optional(v.boolean(), true),
  PreMiDAppleMusic: v.optional(v.boolean(), true),
  custom: v.optional(v.array(v.pipe(v.string(), v.digits(), v.maxLength(20)))),
});

export default v.pipe(
  v.object({
    _VERSION: v.literal(2),
    lastFmUsername: v.pipe(
      v.string(),
      v.regex(/^[A-Za-z][\w-]+$/),
      v.minLength(2),
      v.maxLength(15),
    ),
    shareUsername: v.optional(v.boolean(), false),
    disableOnPresence: v.optional(OtherConfig),
    lastFmApiKey: v.optional(v.string()),
    discordClientId: v.optional(v.string()),
  }),
  v.transform(
    (config): v.InferInput<typeof ConfigV3> => ({
      ...config,
      _VERSION: 3,
      smallImage: config.shareUsername ? "profile" : "lastfm",
      button1: "song",
      button2: config.shareUsername ? "profile" : "none",
    }),
  ),
);
