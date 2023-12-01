import { Activity, Client } from "discord_rpc";
import { clientID } from "./config.ts";
import { colors } from "cliffy/ansi/colors.ts";
import { delay } from "std/async/mod.ts";

const discordWord = colors.bold.rgb24("[Discord]", 0x5865f2);

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
  // if (client.isConnected) return;
  try {
    await client.connect();
  } catch (e) {
    console.error(discordWord, "Failed to reconnect", e);
  }
}
await plsConnect();
// setInterval(plsConnect, 5000);
// setInterval(() => {
//   console.log(client.user);
// }, 10_000);

console.log(
  discordWord,
  colors.bold.green("Ready!"),
  client.user?.username + colors.gray(`#${client.user?.discriminator}`)
);

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
