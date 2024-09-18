import { type SetActivity, Client } from "@xhayper/discord-rpc";
import { clientID } from "./config.ts";
import chalk from "chalk";
import { getLogger } from "./logger.ts";

const log = getLogger(chalk.hex("#5865f2")("Discord"));

export const client = new Client({
  clientId: clientID,
});

// client.on("connect", () => {
//   console.log(
//     discordWord,
//     colors.bold.green("Ready!"),
//     client.user?.username + colors.gray(`#${client.user?.discriminator}`)
//   );
// });

// client.on("disconnected", () => {
//   console.log(discordWord, chalk.redBright("Disconnected"));
// });

async function plsConnect() {
  while (true) {
    try {
      if (client.isConnected) return;

      await client.connect();
      if (client.user?.discriminator != "0")
        log.info(
          chalk.bold.green("Ready!"),
          client.user?.username + chalk.gray(`#${client.user?.discriminator}`)
        );
      else
        log.info(
          chalk.bold.green("Ready!"),
          chalk.gray("@") + client.user?.username
        );
      return;
    } catch (e) {
      log.error("Failed to connect. Retrying in 5 seconds...");
      log.debug(e);

      await Bun.sleep(5000);
    }
  }
}
await plsConnect();

let retrying = false; // Debounce
async function checkRetry() {
  if (retrying) return;
  if (client.isConnected) return;
  retrying = true;
  log.error("Disconnected!");
  await plsConnect();
  retrying = false;
}
// Doesn't work :(
setInterval(checkRetry, 1_000);

export async function getDiscordUser() {
  while (!client.user) {
    await Bun.sleep(0);
  }
  return client.user;
}

export function setActivity(activity?: SetActivity): void {
  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}
