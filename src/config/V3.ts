import { z } from "zod/v4-mini";
import ConfigV4 from "./V4.ts";

export const OtherConfig = z.object({
  any: z._default(z.boolean(), false),
  listening: z._default(z.boolean(), false),
  custom: z._default(
    z.array(z.string().check(z.regex(/^\d+$/), z.maxLength(20))),
    [],
  ),
});

export const ButtonType = z._default(
  z.enum(["song", "artist", "profile", "github", "none"]),
  "none",
);
export type ButtonType = z.infer<typeof ButtonType>;

export default z.pipe(
  z.object({
    _VERSION: z.literal(3),
    lastFmUsername: z
      .string()
      .check(z.regex(/^[A-Za-z][\w-]+$/), z.minLength(2), z.maxLength(15)),

    smallImage: z._default(z.enum(["lastfm", "profile", "none"]), "none"),

    button1: ButtonType,
    button2: ButtonType,

    disableOnPresence: z.prefault(OtherConfig, {}),

    lastFmApiKey: z.optional(z.string()),
    discordClientId: z.optional(z.string()),
  }),
  z.transform(
    (config): z.input<typeof ConfigV4> => ({
      ...config,
      _VERSION: 4,
      provider: "lastfm",
      username: config.lastFmUsername,
      smallImage: config.smallImage == "lastfm" ? "logo" : config.smallImage,
      button1: config.button1 == "artist" ? "none" : config.button1,
      button2: config.button2 == "artist" ? "none" : config.button2,
    }),
  ),
);
