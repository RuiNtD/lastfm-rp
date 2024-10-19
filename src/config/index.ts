import * as v from "valibot";
import * as YAML from "yaml";
import * as fs from "fs/promises";
import { getLogger } from "../logger.ts";

import Config, { OtherConfig, ButtonType, Provider } from "./V4.ts";
export { Config, OtherConfig, ButtonType, Provider };
export type Config = v.InferOutput<typeof Config>;
export type OtherConfig = v.InferOutput<typeof OtherConfig>;

const log = getLogger("Config");

export const AnyConfig = v.looseObject({
  _VERSION: v.number(),
});
export type AnyConfig = v.InferOutput<typeof AnyConfig>;

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
    "Config not found. Please create config.yml, using config.example.yml as reference.",
  );
  process.exit();
}

let config: Config;
try {
  let conf = v.parse(AnyConfig, YAML.parse(file));
  const oldVersion = conf._VERSION;

  // MIGRATIONS
  config = v.parse(
    Config,
    await doMigrate(conf, [
      await import("./V1.ts"),
      await import("./V2.ts"),
      await import("./V3.ts"),
    ]),
  );

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

interface MigModule {
  default: v.GenericSchema;
  onSuccess?: () => void;
}

async function doMigrate(
  input: unknown,
  migrations: MigModule[],
): Promise<unknown> {
  let conf = input;
  for (const mig of migrations) {
    const out = v.safeParse(mig.default, conf);
    if (!out.success) continue;
    if (mig.onSuccess) mig.onSuccess();
    conf = out.output;
  }
  return conf;
}
