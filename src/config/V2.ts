import z, { object } from "zod";
import ConfigV3 from "./V3.ts";

export const OtherConfig = object({
  any: z.boolean().default(false),
  listening: z.boolean().default(true),
  cider: z.boolean().default(true),
  iTunesRP: z.boolean().default(true),
  PreMiDAppleMusic: z.boolean().default(true),
  custom: z.array(z.string().regex(/^\d*$/).max(20)).optional(),
});

export default object({
  _VERSION: z.literal(2),
  lastFmUsername: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),
  shareUsername: z.boolean().default(false),
  disableOnPresence: OtherConfig.optional(),
  lastFmApiKey: z.string().optional(),
  discordClientId: z.string().optional(),
}).transform(
  (config): z.input<typeof ConfigV3> => ({
    ...config,
    _VERSION: 3,
    smallImage: config.shareUsername ? "profile" : "lastfm",
    button1: "song",
    button2: config.shareUsername ? "profile" : "none",
  })
);
