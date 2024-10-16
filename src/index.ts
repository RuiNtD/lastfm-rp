import provider from "./provider/index.ts";
import { type SetActivity } from "@xhayper/discord-rpc";
import {
  type GatewayActivityButton,
  ActivityType,
} from "discord-api-types/v10";
import config, { ButtonType } from "./config/index.ts";
import { hasOtherActivity } from "./otherIDs.ts";
import { setActivity } from "./discord.ts";
import { getLogger } from "./logger.ts";
import { isTruthy } from "./helper.ts";

const log = getLogger();

let lastStatus = {
  status: "",
  date: new Date(),
};

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

  const track = await provider.getListening();
  if (!track) {
    status("Nothing playing");
    return;
  }
  status(`Now playing: ${track.name} by ${track.artist}`);

  let smallImageKey: string | undefined;
  let smallImageText: string | undefined;

  switch (config.smallImage) {
    // @ts-ignore Intentional fallthrough
    case "profile": {
      const user = await provider.getUser();
      if (user) {
        smallImageKey = user.image || provider.logoAsset;
        smallImageText = `Scrobbling as ${user.name} on ${provider.name}`;
        break;
      }
    } // fallthrough
    case "logo": {
      smallImageKey = provider.logoAsset;
      smallImageText = `Scrobbling on ${provider.name}`;
      break;
    }
  }

  log.trace("smallImageKey", smallImageKey);

  return {
    // TY ADVAITH <3
    type: ActivityType.Listening,

    details: track.name,
    state: `by ${track.artist}`,

    largeImageKey: track.image || "album",
    largeImageText: track.album,
    smallImageKey,
    smallImageText,

    startTimestamp: lastStatus.date,

    buttons: [
      await getButton(config.button1),
      await getButton(config.button2),
    ].filter(isTruthy),
  };
}

async function getButton(
  type: ButtonType,
): Promise<GatewayActivityButton | undefined> {
  switch (type) {
    case "song": {
      const track = await provider.getListening();
      if (!track || !track.url) return;
      return {
        label: "View Song",
        url: track.url,
      };
    }
    case "profile": {
      const user = await provider.getUser();
      if (!user || !user.url) return;
      return {
        label: `${provider.name} Profile`,
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
