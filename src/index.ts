import * as lastfm from "./lastFm.js";
import { Client, SetActivity } from "@xhayper/discord-rpc";
import { GatewayActivityButton } from "discord-api-types/v10";
import { exit } from "process";
import config, { clientID } from "./config.js";
import chokidar from "chokidar";
import chalk from "chalk";
import * as fs from "fs/promises";
import { hasOtherActivity } from "./otherIDs.js";

export const discordWord = chalk.bold.hex("#5865f2")("[Discord]");
export const lastFmWord = chalk.bold.hex("#ba0000")("[Last.fm]");
export const lanyardWord = chalk.bold.hex("#d7bb87")("[Lanyard]");

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

await client.connect();
console.log(
  discordWord,
  chalk.green("Ready!"),
  client.user?.username + chalk.gray(`#${client.user?.discriminator}`)
);

if (!client.user) throw "This shouldn't happen.";
export const clientUser = client.user;

const watcher = chokidar.watch(".kill");
watcher.on("add", async () => {
  console.warn(chalk.red(`Found .kill file. ${chalk.bold("Exiting...")}`));
  setTimeout(async () => {
    try {
      await fs.rm(".kill");
    } catch {}
    exit();
  }, 1000);
});

client.on("connected", () => {
  console.log(discordWord, chalk.greenBright("Connected"));
});

client.on("disconnected", () => {
  console.log(discordWord, chalk.redBright("Disconnected"));
});

/*const removeCommand = cumcord.commands.addCommand({
  name: "lastfm",
  description: "Send your Last.fm status",
  args: [
    {
      name: "textOnly",
      description: "Sends text instead of an image.",
      type: "bool",
      required: false,
    },
  ],
  handler: async (ctx, send) => {
    const { textOnly } = ctx.args;

    const username = store.username;
    if (!username) {
      send(
        "❌ Please add your Last.fm username in the Last.fm Rich Presence settings"
      );
      return;
    }

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
  },
});*/

let lastStatus = {
  status: "",
  date: new Date(),
};

setInterval(async () => {
  setActivity(await activity());
}, 5000);

function status(status: string) {
  if (lastStatus.status != status) {
    lastStatus = {
      status,
      date: new Date(),
    };
    console.log(status);
  }
}

function setActivity(activity?: SetActivity): void {
  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}

async function activity(): Promise<SetActivity | undefined> {
  if (await hasOtherActivity()) {
    status("Detected another player's Rich Presence");
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
