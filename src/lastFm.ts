import {
  LastFMUser,
  LastFMUserGetInfoResponse,
  LastFMUserGetRecentTracksResponse,
} from "lastfm-ts-api";
import config from "./config.js";
import { lastFmWord } from "./index.js";
import chalk from "chalk";

const { username } = config;
const apiKey = config.advanced.lastFmKey || "3b64424cee4803202edd52b060297958";
const user = new LastFMUser(apiKey);

export type Track =
  LastFMUserGetRecentTracksResponse["recenttracks"]["track"][number];
export async function getLastTrack(): Promise<Track | undefined> {
  try {
    const tracks = await user.getRecentTracks({ user: username, limit: 1 });
    return tracks.recenttracks.track[0];
  } catch (e) {
    console.error(lastFmWord, chalk.red("Error"), e);
    return;
  }
}

let cachedUser: LastFMUserGetInfoResponse["user"];
export async function getUser() {
  try {
    if (cachedUser) return cachedUser;
    cachedUser = (await user.getInfo({ user: username })).user;
    return cachedUser;
  } catch (e) {
    console.error(lastFmWord, chalk.red("Error"), e);
    return;
  }
}
