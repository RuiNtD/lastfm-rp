import * as lastfm from "./lastFm.js";
import { Client, SetActivity } from "@xhayper/discord-rpc";
import { GatewayActivityButton } from "discord-api-types/v10";
import { exit } from "process";
import config, { clientID } from "./config.js";
import chokidar from "chokidar";
import chalk from "chalk";
import * as fs from "fs/promises";
import { hasOtherActivity } from "./otherIDs.js";
import { scheduler } from "timers/promises";

export const discordWord = chalk.bold.hex("#5865f2")("[Discord]");
export const lastFmWord = chalk.bold.hex("#ba0000")("[Last.fm]");
export const lanyardWord = chalk.bold.hex("#d7bb87")("[Lanyard]");

let lastStatus = {
  status: "",
  date: new Date(),
};

const { username } = config;
const client = new Client({
  clientId: clientID,
});

if (!username) {
  console.error(chalk.red("Please run editconfig to create the config"));
  exit(1);
}

(async () => {
  try {
    await fs.rm(".kill");
  } catch {}
})();

const watcher = chokidar.watch(".kill");
watcher.on("add", async () => {
  console.warn(chalk.red(`Found .kill file. ${chalk.bold("Exiting...")}`));
  await scheduler.wait(1000);
  try {
    await fs.rm(".kill");
  } catch {}
  exit();
});

client.on("connected", () => {
  console.log(discordWord, chalk.greenBright("Connected"));
});

client.on("disconnected", async () => {
  console.log(discordWord, chalk.redBright("Disconnected"));
  await plsConnect();
});

async function plsConnect() {
  if (client.isConnected) return;
  while (true) {
    try {
      await client.connect();
      break;
    } catch (e) {
      // console.error(discordWord, "Failed to reconnect", e);
    }
    await scheduler.wait(5000);
  }
}

console.log(discordWord, "Connecting...");
await plsConnect();

console.log(
  discordWord,
  chalk.bold.green("Ready!"),
  client.user?.username + chalk.gray(`#${client.user?.discriminator}`)
);

setActivity(await activity());
setInterval(async () => {
  setActivity(await activity());
}, 5000);

export async function getDiscordUser() {
  while (!client.user) {
    await scheduler.yield();
  }
  return client.user;
}

/*
try {
  if (textOnly) return await genPlayText();
  else {
    const image = await genPlayImage();
    const arrayBuffer = await image.arrayBuffer();
    const file = new File([Buffer.from(arrayBuffer)], "lastfm.png", {
      type: "image/png",
    });
    promptToUpload([file], ctx.channel, 0);
  }
} catch (e) {
  send("❌ Error: " + e);
}
});*/

function status(status: string = "") {
  if (lastStatus.status != status) {
    lastStatus = {
      status,
      date: new Date(),
    };
    if (status) console.log(status);
  }
}

function setActivity(activity?: SetActivity): void {
  if (!client.isConnected) return;

  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}

async function activity(): Promise<SetActivity | undefined> {
  if (!client.isConnected) {
    status();
    return;
  }

  const otherAct = await hasOtherActivity();
  if (otherAct) {
    status(`Detected another player: ${otherAct.name}`);
    return;
  }

  let track = await lastfm.getLastTrack();
  if (!track || !track["@attr"]?.nowplaying) {
    status("Nothing playing");
    return;
  }

  status(`Now playing: ${track.name}`);

  const buttons: GatewayActivityButton[] = [];
  let smallImageKey = "lastfm";
  let smallImageText = "Scrobbling now ";

  const user = await lastfm.getUser();
  if (config.shareName && user) {
    buttons.push({
      label: "Last.fm Profile",
      url: user.url,
    });
    smallImageText += `as ${user.name} `;
    smallImageKey = user.image[user.image.length - 1]["#text"];
  }

  smallImageText += "on Last.fm";
  buttons.push({
    label: "View Song",
    url: track.url,
  });

  return {
    details: track.name,
    state: `by ${track.artist["#text"]}`,

    largeImageKey: track.image[track.image.length - 1]["#text"],
    smallImageKey,
    largeImageText: track.album["#text"],
    smallImageText,

    startTimestamp: lastStatus.date,

    buttons,
  };
}
