import * as lastfm from "./lastFm.ts";
import { Activity } from "discord_rpc";
import { GatewayActivityButton } from "discord-api-types/v10.ts";
import config from "./config.ts";
import chokidar from "chokidar";
import { colors } from "cliffy/ansi/colors.ts";
import { hasOtherActivity } from "./otherIDs.ts";
import { delay } from "std/async/mod.ts";
import { setActivity } from "./discord.ts";
import { getLogger } from "./logger.ts";

const log = getLogger();

let lastStatus = {
  status: "",
  date: new Date(),
};

const { username } = config;
if (!username) {
  log.error(colors.red("Please run editconfig to create the config"));
  Deno.exit(1);
}

(async () => {
  try {
    await Deno.remove(".kill");
    // deno-lint-ignore no-empty
  } catch {}
})();

const watcher = chokidar.watch(".kill");
watcher.on("add", async () => {
  log.info(colors.red(`Found .kill file. ${colors.bold("Exiting...")}`));
  await delay(1000);
  try {
    await Deno.remove(".kill");
    // deno-lint-ignore no-empty
  } catch {}
  Deno.exit();
});

setActivity(await activity());
setInterval(async () => {
  setActivity(await activity());
}, 1000);

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
    if (status) log.info(status);
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

  status(`Now playing: ${track.name} by ${track.artist}`);

  const buttons: GatewayActivityButton[] = [
    {
      label: "View Song",
      url: track.url,
    },
  ];
  let smallImageKey = "lastfm";
  let smallImageText = "Scrobbling now ";

  const user = await lastfm.getUser();
  if (config.shareName && user) {
    buttons.push({
      label: "Last.fm Profile",
      url: user.url,
    });
    smallImageText += `as ${user.name} `;
    smallImageKey = user.image.extralarge;
  }

  smallImageText += "on Last.fm";

  return {
    details: track.name,
    state: `by ${track.artist}`,

    assets: {
      large_image: track.image.extralarge,
      large_text: track.album,
      small_image: smallImageKey,
      small_text: smallImageText,
    },

    timestamps: {
      start: lastStatus.date.getTime(),
    },

    buttons,
  };
}
