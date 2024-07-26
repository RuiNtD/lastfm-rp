import { z } from "zod";

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(true),
  cider: z.boolean().default(true),
  iTunesRP: z.boolean().default(true),
  PreMiDAppleMusic: z.boolean().default(true),
  custom: z.array(z.string().regex(/^\d*$/).max(20)).optional(),
});

export default z.object({
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
});
