import z, { object } from "zod";
import * as YAML from "yaml";
import ConfigV1 from "./configs/V1.ts";
import ConfigV2 from "./configs/V2.ts";
import Config, { OtherConfig, ButtonType } from "./configs/V3.ts";
import * as fs from "fs/promises";
import { getLogger } from "./logger.ts";

export { Config, OtherConfig, ButtonType };
export type Config = z.infer<typeof Config>;
export type OtherConfig = z.infer<typeof OtherConfig>;

const log = getLogger("Config");

export const AnyConfig = object({
  _VERSION: z.number(),
}).passthrough();

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
  conf = migrate(conf, ConfigV1);
  conf = migrate(conf, ConfigV2, () => {
    log.warn(
      'Most disableOnPresence options have been removed in favor of "listening"'
    );
  });
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
