import * as fs from "fs/promises";
import { z } from "zod";

export const OtherConfig = z.object({
  any: z.boolean().default(false),
  listening: z.boolean().default(true),
  cider: z.boolean().default(true),
  iTRP: z.boolean().default(true),
  AMPMD: z.boolean().default(true),
  custom: z.array(z.string().regex(/^\d*$/).max(20)),
});
export type OtherConfig = z.infer<typeof OtherConfig>;

const Config = z.object({
  _VERSION: z.literal(1),
  username: z
    .string()
    .regex(/^[A-Za-z][\w-]+$/)
    .min(2)
    .max(15),
  shareName: z.boolean().default(false),
  otherEnabled: z.boolean().default(true),
  other: OtherConfig.optional(),
  advanced: z.object({
    lastFmKey: z.string().optional(),
    appId: z.string().optional(),
  }),
});

const file = await fs.readFile("config.json", { encoding: "utf8" });
const config = Config.parse(JSON.parse(file));

export const clientID = config.advanced.appId || "740140397162135563";
export default config;
