import { expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as YAML from "yaml";
import { Config } from "./index.ts";

test("example matches config", async () => {
  const example = YAML.parse(await fs.readFile("config.example.yml", "utf-8"));
  example.username = "example";
  expect(Config.parse(example)).toBeTruthy();
});
