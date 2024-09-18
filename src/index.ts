import * as lastfm from "./lastFm.ts";
import { type SetActivity } from "@xhayper/discord-rpc";
import {
  type GatewayActivityButton,
  ActivityType,
} from "discord-api-types/v10";
import config from "./config.ts";
import chokidar from "chokidar";
import chalk from "chalk";
import { hasOtherActivity } from "./otherIDs.ts";
import { setActivity } from "./discord.ts";
import { getLogger } from "./logger.ts";
import * as fs from "fs/promises";

const log = getLogger();

let lastStatus = {
  status: "",
  date: new Date(),
};

await fs.rm(".kill", { force: true });

const watcher = chokidar.watch(".kill", {});
watcher.on("add", async () => {
  log.info(chalk.red(`Found .kill file. ${chalk.bold("Exiting...")}`));
  await Bun.sleep(1000);
  await fs.rm(".kill", { force: true });
  process.exit();
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

async function activity(): Promise<SetActivity | undefined> {
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
  if (config.shareUsername && user) {
    buttons.push({
      label: "Last.fm Profile",
      url: user.url,
    });
    smallImageText += `as ${user.name} `;
    smallImageKey = user.image.extralarge;
  }

  smallImageText += "on Last.fm";

  return {
    // TY ADVAITH <3
    type: ActivityType.Listening,

    details: track.name,
    state: `by ${track.artist}`,

    largeImageKey: track.image.extralarge,
    largeImageText: track.album,
    smallImageKey,
    smallImageText,

    startTimestamp: lastStatus.date,

    buttons,
  };
}
