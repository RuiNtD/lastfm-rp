/// <reference path="../node_modules/cumcord-types/defs.d.ts" />

import cumcord from "@cumcord";
import { setDefaults } from "cumcord-tools";
import _ from "lodash";
import { getLastTrack } from "./lastFm";
import { genPlayImage, genPlayText } from "./nowPlayGen";

const { findByProps } = cumcord.modules.webpack;
const { SET_ACTIVITY } = findByProps("SET_ACTIVITY");
const { getActivities } = findByProps("getActivities");
const { promptToUpload } = findByProps("promptToUpload");
import injectStyles from "./styles.scss";

const clientID = "740140397162135563";

const { store } = cumcord.pluginData.persist;

const timer = setInterval(async () => {
  setActivity(await activity());
}, 5000);

const removeCommand = cumcord.commands.addCommand({
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
});

const patches = [
  injectStyles(),
  removeCommand,
  () => clearInterval(timer),
  () => setActivity(undefined),
];

let shuttingDown = false;

const OtherAppIDs: { [appName: string]: string[] } = {
  Cider: [
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

function getActAppIDs() {
  const activities = getActivities();
  const appIDs: string[] = [];
  for (const { application_id: appID } of activities) {
    if (!appID) continue;
    if (appID == clientID) continue;
    appIDs.push(appID);
  }
  return appIDs;
}

function hasOtherActivity(): boolean {
  if (!store.otherEnabled) return false;
  if (store.otherListening) {
    const activities = getActivities();
    for (const { type, application_id: appID } of activities) {
      if (type == 2 && appID != clientID) return true;
    }
  }
  const actAppIDs = getActAppIDs();
  for (const appName in OtherAppIDs) {
    if (!store["other" + appName]) continue;
    const appIDs = OtherAppIDs[appName];
    for (const appID of appIDs) if (_.includes(actAppIDs, appID)) return true;
  }
  return false;
}

function setActivity(activity?): void {
  SET_ACTIVITY.handler({
    isSocketConnected: () => true,
    socket: {
      id: 169,
      application: {
        id: clientID,
        name: store.appName || "Music",
      },
      transport: "ipc",
    },
    args: {
      pid: 169,
      activity: shuttingDown ? undefined : activity,
    },
  });
}

async function activity() {
  store.status =
    "🕑 Checking last.fm...\nIf this doesn't disappear, something might be wrong.";

  const username = store.username;
  if (!username) {
    store.status =
      "Please add your Last.fm username below to\nstart showing your status on your profile";
    return;
  }

  if (hasOtherActivity()) {
    store.status = "🔇 Detected another player's Rich Presence";
    return;
  }

  const recent = await getLastTrack();

  if (recent.error) {
    store.status = `❌ Error from Last.fm\n${recent.message}`;
    return;
  }

  const track = recent.recenttracks.track[0];
  if (!track || !track["@attr"]?.nowplaying) {
    store.status = `⏹️ Nothing playing\nLast song: ${track.name}`;
    return;
  }

  store.status = `▶️ Now playing\n${track.name}`;

  const buttons: any[] = [];
  if (store.shareName)
    buttons.push({
      label: "Last.fm Profile",
      url: `https://www.last.fm/user/${username}`,
    });
  buttons.push({
    label: "View Song",
    url: track.url,
  });

  let small_text = "Scrobbling now ";
  if (store.shareName) small_text += `as ${username} `;
  small_text += "on Last.fm";

  return {
    details: track.name,
    state: `by ${track.artist["#text"]}`,
    assets: {
      large_image: track.image[track.image.length - 1]["#text"],
      small_image: "lastfm",
      large_text: track.album["#text"],
      small_text,
    },
    buttons,
  };
}

export async function onLoad() {
  store.status = "🕑 Waiting for first load...";
}
export function onUnload() {
  shuttingDown = true;
  _.forEachRight(patches, (p) => p());
}

setDefaults({
  username: "",
  shareName: true,
  appName: "Music",
  otherEnabled: true,
  otherListening: true,
  otherCider: true,
  otheriTRP: true,
  otherAMPMD: true,
  lastFmKey: "",
});

export { default as settings } from "./Settings";
