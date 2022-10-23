import * as lastfm from "./lastFm.js";
import { Client, SetActivity } from "@xhayper/discord-rpc";
import { GatewayActivity } from "discord-api-types/v10";
import { exit } from "process";
import { getRecentTracks } from "lastfm-typed/dist/interfaces/userInterface.js";
import config from "./config.js";
import chokidar from "chokidar";
import chalk from "chalk";
import * as fs from "fs";
const fsp = fs.promises;

const { username } = config;
const clientID = config.advanced.appId || "740140397162135563";
const client = new Client({
  clientId: clientID,
});

if (!username) {
  console.error(chalk.red("Please run editconfig to create the config"));
  exit(1);
}

(async () => {
  try {
    await fsp.rm(".kill");
  } catch {}
})();

client.on("ready", async () => {
  console.log(
    chalk.green("Ready!"),
    client.user?.username + chalk.gray(`#${client.user?.discriminator}`)
  );

  setInterval(async () => {
    setActivity(await activity());
  }, 5000);
  setActivity(await activity());

  const watcher = chokidar.watch(".kill");
  watcher.on("add", async () => {
    console.warn(chalk.red(`Found .kill file. ${chalk.bold("Exiting...")}`));
    setTimeout(async () => {
      try {
        await fsp.rm(".kill");
      } catch {}
      exit();
    }, 1000);
  });
});

const discordWord = chalk.hex("5865F2")("Discord");

client.on("connected", () => {
  console.log(chalk.greenBright(`Connected to ${discordWord}`));
});

client.on("disconnected", () => {
  console.log(chalk.redBright(`Disconnected from ${discordWord}`));
});

client.login();

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

function status(status: string) {
  if (lastStatus.status != status) {
    lastStatus = {
      status,
      date: new Date(),
    };
    console.log(status);
  }
}

const OtherAppIDs: { [appName: string]: string[] } = {
  cider: [
    "911790844204437504", // Cider
    "886578863147192350", // Apple Music
  ],
  iTRP: [
    // iTunes Rich Presence
    // https://itunesrichpresence.com/
    "383816327850360843", // iTunes
    "529435150472183819", // Apple Music
  ],
  AMPMD: ["842112189618978897"], // Apple Music PreMiD
};

function getActAppIDs(activities: GatewayActivity[]) {
  const appIDs: string[] = [];
  for (const { application_id: appID } of activities) {
    if (!appID) continue;
    if (appID == clientID) continue;
    appIDs.push(appID);
  }
  for (const id of config.other.custom) appIDs.push(id);
  return appIDs;
}

function hasOtherActivity(): boolean {
  if (!config.otherEnabled) return false;
  const activities = client.user?.presence?.activities;
  if (!activities) return false;

  if (config.other.any) {
    for (const { type, application_id: appID } of activities) {
      if (appID != clientID) return true;
    }
    return false;
  }

  if (config.other.listening) {
    for (const { type, application_id: appID } of activities) {
      if (appID == clientID) continue;
      if (type == 2) return true;
    }
  }

  const actAppIDs = getActAppIDs(activities);
  for (const appName in OtherAppIDs) {
    if (!config.other[appName]) continue;
    const appIDs = OtherAppIDs[appName];
    for (const appID of appIDs) {
      if (actAppIDs.includes(appID)) return true;
    }
  }

  return false;
}

function setActivity(activity?: SetActivity): void {
  if (activity) client.user?.setActivity(activity);
  else client.user?.clearActivity();
}

async function activity(): Promise<SetActivity | undefined> {
  if (hasOtherActivity()) {
    status("Detected another player's Rich Presence");
    return;
  }

  let recent: getRecentTracks;
  try {
    recent = await lastfm.getLastTrack();
  } catch (e) {
    console.error(chalk.red("Error from Last.fm"));
    console.log(chalk.red(e));
    return;
  }

  const track = recent.tracks[0];
  if (!track || !track.nowplaying) {
    status("Nothing playing");
    return;
  }

  status(`Now playing: ${track.name}`);

  const buttons: any[] = [];
  let small_image = "lastfm";
  let small_text = "Scrobbling now ";

  if (config.shareName) {
    const user = await lastfm.getUser();
    buttons.push({
      label: "Last.fm Profile",
      url: user.url,
    });
    small_text += `as ${user.name} `;
    small_image = user.image[user.image.length - 1].url;
  }

  small_text += "on Last.fm";
  buttons.push({
    label: "View Song",
    url: track.url,
  });

  return {
    details: track.name,
    state: `by ${track.artist.name}`,

    largeImageKey: track.image[track.image.length - 1].url,
    smallImageKey: small_image,
    largeImageText: track.album.name,
    smallImageText: small_text,

    startTimestamp: lastStatus.date,

    buttons,
  };
}
