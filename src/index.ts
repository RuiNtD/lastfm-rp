import listenProvider, { type Track } from "./listenProvider/index.ts";
import { type SetActivity } from "@xhayper/discord-rpc";
import {
  type GatewayActivityButton,
  ActivityType,
} from "discord-api-types/v10";
import config, { ButtonType } from "./config/index.ts";
import { hasOtherActivity } from "./otherIDs.ts";
import { setActivity } from "./discord.ts";
import { getLogger } from "./logger.ts";
import { isTruthy } from "./lib/helper.ts";
import * as Time from "@std/datetime/constants";
import { getNintendoThumbnail, NintendoArtist } from "./lib/nintendoMusic.ts";
import chalk from "chalk";

const log = getLogger();

let lastStatus = {
  status: "",
  date: new Date(),
};

setActivity(await activity());
setInterval(async () => {
  setActivity(await activity());
}, Time.SECOND);

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
    if (status) log.log(status);
  }
}

async function activity(): Promise<SetActivity | undefined | null> {
  const otherAct = await hasOtherActivity();
  if (otherAct)
    return void status(
      chalk.dim(chalk.bold("Detected another player: ") + otherAct.name),
    );

  const track = await listenProvider.getListening();
  if (track === null) return null; // Return null if error
  if (!track) return void status(chalk.dim("Nothing playing"));
  const isNintendo = track.artist == NintendoArtist;

  let stat = chalk.bold("Now playing: ") + track.name;
  if (track.artist && !isNintendo) stat += chalk.gray(` by ${track.artist}`);
  else if (track.album) stat += chalk.gray(` from ${track.album}`);
  if (isNintendo) stat += chalk.dim(` (Nintendo Music)`);
  status(stat);

  const ret: SetActivity = {
    // TY ADVAITH <3
    type: ActivityType.Listening,
    details: track.name,
    state: track.artist ? `by ${track.artist}` : undefined,

    largeImageKey: track.image || "album",
    largeImageText: track.album,

    startTimestamp: lastStatus.date,
    buttons: [
      await getButton(config.button1),
      await getButton(config.button2),
    ].filter(isTruthy),
  };

  if (config.smallImage == "profile" || config.smallImage == "logo") {
    ret.smallImageKey = listenProvider.logoAsset;
    ret.smallImageText = `Scrobbling on ${listenProvider.name}`;

    if (config.smallImage == "profile") {
      const user = await listenProvider.getUser();
      if (user) {
        ret.smallImageKey = user.image || listenProvider.logoAsset;
        ret.smallImageText = `Scrobbling as ${user.name} on ${listenProvider.name}`;
      }
    }
  }

  if (isNintendo) {
    if (config.useNintendoMusicFormat) {
      ret.state = undefined;
      const nameParts = track.name.split(" / ");
      if (nameParts.length == 2) {
        ret.details = nameParts[0];
        ret.state = `by ${nameParts[1]}`;
      }
    }
    if (config.useNintendoMusicArt) {
      const thumb = await getNintendoThumbnail(track);
      if (thumb) ret.largeImageKey = thumb;
    }
  }

  log.debug("activity", ret);
  return ret;
}

async function getButton(
  type: ButtonType,
): Promise<GatewayActivityButton | undefined> {
  switch (type) {
    case "song": {
      const track = await listenProvider.getListening();
      if (!track || !track.url) return;
      return {
        label: "View Song",
        url: track.url,
      };
    }
    case "profile": {
      const user = await listenProvider.getUser();
      if (!user || !user.url) return;
      return {
        label: `${listenProvider.name} Profile`,
        url: user.url,
      };
    }
    case "github":
      return {
        label: "Scrobble Rich Presence",
        url: "https://github.com/RuiNtD/lastfm-rp",
      };
  }
}
