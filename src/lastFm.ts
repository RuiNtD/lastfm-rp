import { persist } from "@cumcord/pluginData";
const { store } = persist;

const lastFmKey = "3b64424cee4803202edd52b060297958";

export async function getLastTrack() {
  const username = store.username;
  if (!username) return;

  const url = new URL("https://ws.audioscrobbler.com/2.0/");
  url.search = new URLSearchParams({
    method: "user.getrecenttracks",
    api_key: store.lastFmKey || lastFmKey,
    format: "json",
    user: username,
    limit: "1",
  }).toString();
  return await (await fetch(url)).json();
}
