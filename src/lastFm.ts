import LastFMTyped from "lastfm-typed";
import { getInfo } from "lastfm-typed/dist/interfaces/userInterface";
import config from "./config";

const { username } = config;
const apiKey = config.advanced.lastFmKey || "3b64424cee4803202edd52b060297958";
const lastfm = new LastFMTyped(apiKey, {
  userAgent: "https://github.com/FayneAldan/lastfm-rp",
});

export async function getLastTrack() {
  return await lastfm.user.getRecentTracks(username, {
    limit: 1,
  });
}

let cachedUser: getInfo;
export async function getUser() {
  if (cachedUser) return cachedUser;
  cachedUser = await lastfm.user.getInfo(username);
  return cachedUser;
}
