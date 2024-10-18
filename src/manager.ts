import chalk from "chalk";
import { StartupRun } from "startup-run";
import { select, confirm } from "@inquirer/prompts";
import fs from "fs-extra";
import { $ } from "bun";
import EnterPrompt from "./EnterPrompt";

const run = StartupRun.create("Scrobble Rich Presence", {
  command: "bun",
  args: ["./src/index.ts"],
});

while (true) {
  console.clear();
  console.log(chalk.bold.underline("Scrobble Rich Presence"));
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
        description: "Enable run on startup and start the background process",
      },
      {
        name: "Disable",
        value: "disable",
        description: "Disable run on startup and stop the background process",
      },
      {
        name: "Update",
        value: "update",
        description: "Updates the program and restarts it if running",
      },
      { name: "Quit", value: "quit" },
    ],
  });

  console.clear();
  switch (choice) {
    case "enable":
      await run.enable();
      await run.start();
      break;
    case "disable":
      await run.stop();
      await run.disable();
      break;
    case "update":
      if (!Bun.which("git")) {
        console.log(chalk.red("Git not found"));
        await pause();
        break;
      }
      if (!(await fs.exists(".git"))) {
        console.log(chalk.red("Not in a Git repository"));
        console.log(
          "Please clone the GitHub repo instead of using Download ZIP",
        );
        await pause();
        break;
      }

      if (!(await confirm({ message: "Are you sure you want to update?" })))
        break;

      await run.stop();

      try {
        console.log(chalk.gray("Updating..."));
        await $`git pull`;
        if (await fs.exists("node_modules")) {
          console.log(chalk.gray("Installing dependencies..."));
          await $`bun install`;
        }
        if (await run.isEnabled()) {
          console.log(chalk.gray("Restarting process..."));
          await run.start();
        }
        console.log(chalk.bold.green("Updated!"), "Manager will now close");
        await pause();
        process.exit();
      } catch (e) {
        console.log(chalk.bold.red("Failed to update"));
        console.log(e);
        await pause();
        break;
      }
    case "quit":
      process.exit();
  }
}

async function pause() {
  await EnterPrompt({});
}
