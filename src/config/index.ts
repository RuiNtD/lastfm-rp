import z, { object } from "zod";
import * as YAML from "yaml";
import * as fs from "fs/promises";
import { getLogger } from "../logger.ts";

import ConfigV1 from "./V1.ts";
import ConfigV2 from "./V2.ts";
import ConfigV3 from "./V3.ts";
import Config, { OtherConfig, ButtonType, Provider } from "./V4.ts";
export { Config, OtherConfig, ButtonType, Provider };
export type Config = z.infer<typeof Config>;
export type OtherConfig = z.infer<typeof OtherConfig>;

const log = getLogger("Config");

export const AnyConfig = object({
  _VERSION: z.number(),
}).passthrough();
export type AnyConfig = z.input<typeof AnyConfig>;

try {
  const json = await Bun.file("config.json").json();
  await Bun.write("config.yml", YAML.stringify(json));
  await fs.rename("config.json", "config.json.bak");
  log.info("Converted config.json to config.yml");
  log.info("Old config backed up to config.json.bak");
} catch {
  //
}

let file: string;
try {
  file = await Bun.file("config.yml").text();
} catch {
  log.error(
    "Config not found. Please create config.yml, using config.example.yml as reference."
  );
  process.exit();
}

let config: Config;
try {
  let conf = AnyConfig.parse(YAML.parse(file));
  const oldVersion = conf._VERSION;

  // MIGRATIONS
  conf = migrate(conf, ConfigV1);
  conf = migrate(conf, ConfigV2, () => {
    log.warn(
      'Most disableOnPresence options have been removed in favor of "listening"'
    );
  });
  conf = migrate(conf, ConfigV3);
  config = Config.parse(conf);

  if (oldVersion != config._VERSION) {
    await Bun.write("config.yml", YAML.stringify(config));
    await Bun.write("config.yml.bak", file);
    log.info(`Migrated config.yml to V${config._VERSION}`);
    log.info(`Old config (V${oldVersion}) backed up to config.yml.bak`);
  }
} catch (e) {
  log.error("Error parsing config.yml", e);
  process.exit();
}

export const lastFmApiKey =
  config.lastFmApiKey || "3b64424cee4803202edd52b060297958";
export const clientID = config.discordClientId || "740140397162135563";
export default config;

function migrate<T extends z.ZodTypeAny, C>(
  config: C,
  schema: T,
  onSuccess = () => {}
): z.output<typeof schema> | C {
  const out = schema.safeParse(config);
  if (!out.success) return config;
  onSuccess();
  return out.data;
}
