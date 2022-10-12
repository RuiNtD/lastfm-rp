#!/usr/bin/env -S deno run -A --unstable

import configedit from "https://deno.land/x/configedit@1.0.1/mod.ts";
configedit({
  configPath: "config.json",
  schemaPath: "src/schema.json",
});
