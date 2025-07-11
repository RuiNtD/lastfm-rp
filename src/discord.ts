import { type SetActivity, Client } from "@xhayper/discord-rpc";
import { clientID } from "./config/index.ts";
import chalk from "chalk";
import { getLogger } from "./lib/logger.ts";
import { delay, retry } from "@std/async";
import { SECOND } from "@std/datetime/constants";

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
  await retry(
    async () => {
      try {
        if (client.isConnected) return;

        await client.connect();
        let username = chalk.dim("@") + client.user?.username;
        if (client.user?.discriminator != "0")
          username =
            client.user?.username + chalk.dim(`#${client.user?.discriminator}`);
        log.info(chalk.bold.green("Ready!"), username);
      } catch (e) {
        log.error("Failed to connect.");
        log.debug(e);
        throw e;
      }
    },
    {
      maxAttempts: Number.POSITIVE_INFINITY,
      minTimeout: SECOND * 5,
      maxTimeout: SECOND * 15,
    },
  );
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
  while (!client.user) await delay(0);
  return client.user;
}

export function setActivity(activity?: SetActivity | null): void {
  // Do nothing if null
  if (activity === null) return;

  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}
