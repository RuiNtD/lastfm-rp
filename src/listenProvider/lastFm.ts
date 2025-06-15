import config, { lastFmApiKey as apiKey } from "../config/index.ts";
import chalk from "chalk";
import { getLogger } from "../logger.ts";
import { z } from "zod/v4";
import axios, { AxiosError } from "axios";
import memoize from "memoize";
import type { ListenProvider, Track, User } from "./index.ts";
import * as Time from "@std/datetime/constants";

const api = axios.create({
  baseURL: "https://ws.audioscrobbler.com/2.0/",
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});
const log = getLogger(chalk.hex("#ba0000")("Last.fm"));
const { username } = config;

let isReady = false;
function ready() {
  if (isReady) return;
  log.info(chalk.green("First check successful!"));
  isReady = true;
}

export const LastFMError = z.object({ error: z.number(), message: z.string() });
export type LastFMError = z.infer<typeof LastFMError>;

const hashtext = z.object({ "#text": z.string() }).transform((v) => v["#text"]);
const image = z.array(hashtext).transform((v) => v.at(-1));

export const LastFMTrack = z.object({
  artist: hashtext,
  image,
  album: hashtext,
  name: z.string(),
  "@attr": z.optional(
    z.object({
      nowplaying: z.stringbool().optional(),
    }),
  ),
  url: z.url(),
});
export const LastFMTracks = z.object({
  recenttracks: z.object({
    track: z.array(LastFMTrack),
  }),
});

async function sendRequest(params: Record<string, string>): Promise<unknown> {
  const { data } = await api.get(`/`, {
    params: {
      api_key: apiKey,
      format: "json",
      ...params,
    },
  });

  const error = LastFMError.safeParse(data);
  if (error.success)
    throw new Error(`Error ${error.data.error}: ${error.data.message}`);

  return data;
}

async function _getListening(): Promise<Track | undefined | null> {
  try {
    const data = await sendRequest({
      method: "user.getrecenttracks",
      user: username,
      limit: "1",
    });
    log.trace("lastfm recent", data);
    const tracks = LastFMTracks.parse(data);
    const track = tracks.recenttracks.track[0];
    ready();

    if (!track || !track["@attr"]?.nowplaying) return;
    return {
      name: track.name,
      artist: track.artist,
      album: track.album,
      image: track.image,
      url: track.url,
    };
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return null;
  }
}

const LastFMUser = z.object({
  name: z.string(),
  image,
  url: z.url(),
});
const LastAPIUser = z.object({ user: LastFMUser });

async function _getUser(): Promise<User | undefined> {
  try {
    const data = await sendRequest({
      method: "user.getinfo",
      user: username,
    });
    const { user } = LastAPIUser.parse(data);
    log.trace("lastfm user", user);

    if (!user) return;
    return {
      name: user.name,
      image: user.image,
      url: user.url,
    };
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}

const LastFMProvider: ListenProvider = {
  name: "Last.fm",
  logoAsset: "lastfm",

  getListening: memoize(_getListening, { maxAge: Time.SECOND * 5 }),
  getUser: memoize(_getUser, { maxAge: Time.MINUTE * 5 }),
};
export default LastFMProvider;
