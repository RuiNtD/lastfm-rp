#!/usr/bin/env -S deno run -A

import configedit from "@ruintd/configedit";
configedit({
  configPath: "config.json",
  schemaPath: "src/schema.json",
  editorOptions: { show_opt_in: true },
});
