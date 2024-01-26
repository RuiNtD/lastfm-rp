#!/usr/bin/env -S deno run -A

import configedit from "https://deno.land/x/configedit@1.0.4/mod.ts";
configedit({
  configPath: "config.json",
  schemaPath: "src/schema.json",
  editorOptions: { show_opt_in: true },
});
