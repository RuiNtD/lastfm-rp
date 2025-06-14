import { z } from "zod/v4-mini";
import ConfigV3 from "./V3.ts";

export const OtherConfig = z.object({
  any: z._default(z.boolean(), false),
  listening: z._default(z.boolean(), true),
  cider: z._default(z.boolean(), true),
  iTunesRP: z._default(z.boolean(), true),
  PreMiDAppleMusic: z._default(z.boolean(), true),
  custom: z.optional(
    z.array(z.string().check(z.regex(/^\d+$/), z.maxLength(20))),
  ),
});

export default z.pipe(
  z.object({
    _VERSION: z.literal(2),
    lastFmUsername: z
      .string()
      .check(z.regex(/^[A-Za-z][\w-]+$/), z.minLength(2), z.maxLength(15)),
    shareUsername: z._default(z.boolean(), false),
    disableOnPresence: z.optional(OtherConfig),
    lastFmApiKey: z.optional(z.string()),
    discordClientId: z.optional(z.string()),
  }),
  z.transform(
    (config): z.input<typeof ConfigV3> => ({
      ...config,
      _VERSION: 3,
      smallImage: config.shareUsername ? "profile" : "lastfm",
      button1: "song",
      button2: config.shareUsername ? "profile" : "none",
    }),
  ),
);
