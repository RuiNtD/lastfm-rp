import chalk from "chalk";
import { StartupRun } from "startup-run";
import { select } from "@inquirer/prompts";

const run = StartupRun.create("Scrobble Rich Presence", {
  command: "bun",
  args: ["./src/index.ts"],
});

console.log(chalk.bold.underline("Scrobble Rich Presence"));

while (true) {
  console.log();
  console.log(
    "Run on startup is currently:",
    (await run.isEnabled()) ? chalk.green("Enabled") : chalk.red("Disabled"),
  );

  const choice = await select({
    message: "What do you want to do?",
    choices: [
      {
        name: "Enable",
        value: "enable",
        description: "Enable run on startup and start the background program",
      },
      {
        name: "Disable",
        value: "disable",
        description: "Disable run on startup and stop the background program",
      },
      { name: "Quit", value: "quit" },
    ],
  });

  switch (choice) {
    case "enable":
      await run.enable();
      await run.start();
      break;
    case "disable":
      await run.disable();
      await run.stop();
      break;
    case "quit":
      process.exit();
  }
}
