import { Activity, Client } from "discord_rpc";
import { clientID } from "./config.ts";
import { colors } from "cliffy/ansi/colors.ts";
import { delay } from "std/async/mod.ts";
import { getLogger } from "./logger.ts";

const log = getLogger(colors.bold.rgb24("[Discord]", 0x5865f2));

export const client = new Client({
  id: clientID,
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
      await client.connect();
      if (client.user?.discriminator != "0")
        log.info(
          colors.bold.green("Ready!"),
          client.user?.username + colors.gray(`#${client.user?.discriminator}`)
        );
      else
        log.info(
          colors.bold.green("Ready!"),
          colors.gray("@") + client.user?.username
        );
      return;
    } catch (e) {
      log.error("Failed to connect. Retrying in 5 seconds...");
      log.debug(e);

      await delay(5000);
    }
  }
}
await plsConnect();

let retrying = false; // Debounce
async function checkRetry() {
  if (retrying) return;
  retrying = true;
  log.error("Disconnected!");
  await plsConnect();
  retrying = false;
}
// Doesn't work :(
// setInterval(checkRetry, 1_000);

export async function getDiscordUser() {
  while (!client.user) {
    await delay(0);
  }
  return client.user;
}

export function setActivity(activity?: Activity): void {
  if (activity) client.setActivity(activity);
  else client.clearActivity();
}
