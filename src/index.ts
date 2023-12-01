import * as lastfm from "./lastFm.ts";
import { Activity } from "discord_rpc";
import { GatewayActivityButton } from "discord-api-types/v10.ts";
import config from "./config.ts";
import chokidar from "chokidar";
import { colors } from "cliffy/ansi/colors.ts";
import { hasOtherActivity } from "./otherIDs.ts";
import { delay } from "std/async/mod.ts";
import { setActivity } from "./discord.ts";

let lastStatus = {
  status: "",
  date: new Date(),
};

const { username } = config;
if (!username) {
  console.error(colors.red("Please run editconfig to create the config"));
  Deno.exit(1);
}

(async () => {
  try {
    await Deno.remove(".kill");
  } catch {}
})();

const watcher = chokidar.watch(".kill");
watcher.on("add", async () => {
  console.warn(colors.red(`Found .kill file. ${colors.bold("Exiting...")}`));
  await delay(1000);
  try {
    await Deno.remove(".kill");
  } catch {}
  Deno.exit();
});

setActivity(await activity());
setInterval(async () => {
  setActivity(await activity());
}, 5000);

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

export function status(status = "") {
  if (lastStatus.status != status) {
    lastStatus = {
      status,
      date: new Date(),
    };
    if (status) console.log(status);
  }
}

async function activity(): Promise<Activity | undefined> {
  const otherAct = await hasOtherActivity();
  if (otherAct) {
    status(`Detected another player: ${otherAct.name}`);
    return;
  }

  const track = await lastfm.getLastTrack();
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

    assets: {
      large_image: track.image[track.image.length - 1]["#text"],
      large_text: track.album["#text"],
      small_image: smallImageKey,
      small_text: smallImageText,
    },

    timestamps: {
      start: lastStatus.date.getTime(),
    },

    buttons,
  };
}
