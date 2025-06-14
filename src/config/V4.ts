import { z } from "zod/v4-mini";

export const Provider = z.enum(["lastfm", "listenbrainz"]);

export const OtherConfig = z.object({
  any: z._default(z.boolean(), false),
  listening: z._default(z.boolean(), false),
  custom: z._default(
    z.array(
      z.string('"" are required for app IDs in disableOnPresence.custom'),
    ),
    [],
  ),
});

export const ButtonType = z._default(
  z.enum(["song", "profile", "github", "none"]),
  "none",
);
export type ButtonType = z.infer<typeof ButtonType>;

export default z.object({
  _VERSION: z.literal(4),

  provider: Provider,
  username: z.string(),

  smallImage: z._default(z.enum(["logo", "profile", "none"]), "none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: z.prefault(OtherConfig, {}),

  lastFmApiKey: z.optional(z.string()),
  discordClientId: z.optional(z.string()),
  listenBrainzAPIURL: z.optional(z.string()),
});
