import z, { object } from "zod";

export const OtherConfig = object({
  any: z.boolean().default(false),
  listening: z.boolean().default(false),
  custom: z.array(z.string().regex(/^\d*$/).max(20)).default([]),
});

export const ButtonType = z
  .enum(["song", "artist", "profile", "github", "none"])
  .default("none");
export type ButtonType = z.infer<typeof ButtonType>;

export default object({
  _VERSION: z.literal(3),
  lastFmUsername: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),

  smallImage: z.enum(["lastfm", "profile", "none"]).default("none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: OtherConfig.default({}),

  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
});
