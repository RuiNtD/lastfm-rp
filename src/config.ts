import { z } from "zod";
import * as YAML from "@std/yaml";
import ConfigV1 from "./config-migrations/V1.ts";

import Config, { OtherConfig } from "./config-migrations/V2.ts";
export { Config, OtherConfig };
export type Config = z.infer<typeof Config>;
export type OtherConfig = z.infer<typeof OtherConfig>;

export const AnyConfig = z
  .object({
    _VERSION: z.number(),
  })
  .passthrough();

try {
  const json = JSON.parse(await Deno.readTextFile("config.json"));
  await Deno.writeTextFile(
    "config.yml",
    YAML.stringify(json, { skipInvalid: true }),
    { createNew: true }
  );
  await Deno.rename("config.json", "config.json.bak");
  console.log("Converted config.json to config.yml");
  console.log("Old config backed up to config.json.bak");
} catch {
  //
}

let file: string;
try {
  file = await Deno.readTextFile("config.yml");
} catch {
  console.error(
    "Config not found. Please create config.yml, using config.example.yml as reference."
  );
  Deno.exit();
}

let config: Config;
try {
  let conf = AnyConfig.parse(YAML.parse(file));
  const oldVersion = conf._VERSION;
  conf = migrate(conf, ConfigV1);
  config = Config.parse(conf);
  if (oldVersion != config._VERSION) {
    await Deno.writeTextFile(
      "config.yml",
      YAML.stringify(config, { skipInvalid: true })
    );
    await Deno.writeTextFile("config.yml.bak", file);
    console.log(`Migrated config.yml to version ${config._VERSION}`);
    console.log(`Old config (V${oldVersion}) backed up to config.yml.bak`);
  }
} catch (e) {
  console.error("Error parsing config.yml", e);
  Deno.exit();
}

export const clientID = config.discordClientId || "740140397162135563";
export default config;

function migrate<T extends z.ZodTypeAny, C>(
  config: C,
  schema: T
): z.output<typeof schema> | C {
  const out = schema.safeParse(config);
  return out.success ? out.data : config;
}
