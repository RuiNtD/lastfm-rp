/// <reference path="../node_modules/cumcord-types/defs.d.ts" />

import { persist } from "@cumcord/pluginData";
import { setDefaults } from "cumcord-tools";
import _ from "lodash";
import { findByProps } from "@cumcord/modules/webpack";

const { SET_ACTIVITY } = findByProps("SET_ACTIVITY");
import injectStyles from "./styles.scss";

const clientID = "740140397162135563";
const lastFmKey = "52ffa34ebbd200da17da5a6c3aef1b2e";

const { store } = persist;

const timer = setInterval(async () => {
  setActivity(await activity());
}, 5000);
const patches = [
  injectStyles(),
  () => clearInterval(timer),
  () => setActivity(undefined),
];

let shuttingDown = false;

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
    store.status = "❌ Please add your Last.fm username";
    return undefined;
  }

  // const playing = await lastfm.helper.getNowPlaying(username);
  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.search = new URLSearchParams({
    method: "user.getrecenttracks",
    api_key: lastFmKey,
    format: "json",
    user: username,
    limit: "1",
  }).toString();
  const recent = await (await fetch(url)).json();

  if (recent.error) {
    store.status = `❌ Error from Last.fm: ${recent.message}`;
    return undefined;
  }

  const track = recent.recenttracks.track[0];
  if (!track || !track["@attr"]?.nowplaying) {
    store.status = `⏹️ Nothing playing\nLast song: ${track.name}`;
    return undefined;
  }

  store.status = `▶️ Now playing: ${track.name}`;

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

  let small_text = "Scrobbling on last.fm";
  if (store.shareName) small_text += ` as ${username}`;

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
  store.status = "🕑 Waiting for status...";
}
export function onUnload() {
  shuttingDown = true;
  _.forEachRight(patches, (p) => p());
}

setDefaults({
  username: "",
  shareName: true,
  appName: "Music",
});

export { default as settings } from "./Settings";
