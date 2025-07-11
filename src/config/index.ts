import { z } from "zod/v4-mini";
import * as YAML from "yaml";
import * as fs from "node:fs/promises";
import { getLogger } from "../lib/logger.ts";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { equal } from "@std/assert";
import * as process from "node:process";
import chalk from "chalk";
import { SchemaError } from "@standard-schema/utils";

import Config, { OtherConfig, ButtonType, Provider } from "./V8.ts";

export { Config, OtherConfig, ButtonType, Provider };
export type Config = z.infer<typeof Config>;
export type OtherConfig = z.infer<typeof OtherConfig>;

const log = getLogger("Config");

try {
  const json = JSON.parse(await fs.readFile("config.json", "utf-8"));
  await Bun.write("config.yml", YAML.stringify(json));
  await fs.rename("config.json", "config.json.bak");
  log.info("Converted config.json to config.yml");
  log.info("Old config backed up to config.json.bak");
} catch {
  //
}

let file: string;
try {
  file = await fs.readFile("config.yml", "utf-8");
} catch {
  log.error(
    "Config not found. Please create config.yml, using config.example.yml as reference.",
  );
  process.exit();
}

let config: Config;
try {
  const oldConf = YAML.parse(file);

  // MIGRATIONS
  const newConf = await doMigrate(oldConf, [
    await import("./V1.ts"),
    await import("./V2.ts"),
    await import("./V3.ts"),
    await import("./V4.ts"),
    await import("./V5.ts"),
    await import("./V6.ts"),
    await import("./V7.ts"),
  ]);
  config = Config.parse(newConf);

  if (!equal(oldConf, newConf)) {
    await Bun.write("config.yml", YAML.stringify(config));
    await Bun.write("config.yml.bak", file);
    log.info("Migrated config.yml to new version");
    log.info("Old config backed up to config.yml.bak");
  }
} catch (e) {
  if (e instanceof z.core.$ZodError) {
    log.error(chalk.bold("Error parsing config"));
    log.error(z.prettifyError(e));
  } else if (e instanceof SchemaError) {
    log.error(chalk.bold("Error parsing config"));
    log.error(e.message + "\n" + YAML.stringify(e.issues));
  } else log.error("Error parsing config.yml", e);
  process.exit();
}

export const lastFmApiKey =
  config.lastFmApiKey || "3b64424cee4803202edd52b060297958";
export const clientID = config.discordClientId || "740140397162135563";
export default config;

interface MigModule<T extends z.core.$ZodType = z.core.$ZodType> {
  default: z.core.$ZodType;
  check?: z.core.$ZodType;
  migrate: T;
  onSuccess?: (oldConf?: z.input<T>, newConf?: z.output<T>) => void;
}

async function doMigrate(
  input: unknown,
  migrations: MigModule[],
): Promise<unknown> {
  let conf = input;
  for (const mig of migrations) {
    const oldConf = conf;

    if (mig.check) {
      // const check = !(await standardValidate(mig.check, conf)).issues;
      const check = (await z.safeParseAsync(mig.check, conf)).success;
      if (!check) continue;
      conf = await z.parseAsync(mig.migrate, conf);
    } else {
      const out = await z.safeParseAsync(mig.migrate, conf);
      if (!out.success) continue;
      conf = out.data;
    }

    if (mig.onSuccess) mig.onSuccess(oldConf, conf);
  }
  return conf;
}

async function standardValidate<T extends StandardSchemaV1>(
  schema: T,
  input: unknown,
): Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<T>>> {
  return await schema["~standard"].validate(input);
}
