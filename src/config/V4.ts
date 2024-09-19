import z, { object } from "zod";

export const Provider = z.enum(["lastfm", "listenbrainz"]);

export const OtherConfig = object({
  any: z.boolean().default(false),
  listening: z.boolean().default(false),
  custom: z.array(z.string().regex(/^\d*$/).max(20)).default([]),
});

export const ButtonType = z
  .enum(["song", "profile", "github", "none"])
  .default("none");
export type ButtonType = z.infer<typeof ButtonType>;

export default object({
  _VERSION: z.literal(4),

  provider: Provider,
  username: z.string(),

  smallImage: z.enum(["logo", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: OtherConfig.default({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
});
