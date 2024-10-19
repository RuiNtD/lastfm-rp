import config, { lastFmApiKey as apiKey } from "../config/index.ts";
import chalk from "chalk";
import { getLogger } from "../logger.ts";
import * as v from "valibot";
import axios, { AxiosError } from "axios";
import memoize from "memoizee";
import type { ListenProvider, Track, User } from "./index.ts";
import * as Time from "../lib/time.ts";

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

export const LastFMError = v.object({ error: v.number(), message: v.string() });
export type LastFMError = v.InferOutput<typeof LastFMError>;

const hashtext = v.pipe(
  v.object({
    "#text": v.string(),
  }),
  v.transform((v) => v["#text"]),
);
const image = v.pipe(
  v.array(hashtext),
  v.transform((v) => v.at(-1)),
);

export const LastFMTrack = v.object({
  artist: hashtext,
  image,
  album: hashtext,
  name: v.string(),
  "@attr": v.optional(
    v.object({
      nowplaying: v.optional(
        v.pipe(
          v.picklist(["true", "false"]),
          v.transform((v) => v == "true"),
        ),
      ),
    }),
  ),
  url: v.pipe(v.string(), v.url()),
});
export const LastFMTracks = v.object({
  recenttracks: v.object({
    track: v.array(LastFMTrack),
  }),
});

async function sendRequest(params: Record<string, string>): Promise<unknown> {
  const req = await api.get(`/`, {
    params: {
      api_key: apiKey,
      format: "json",
      ...params,
    },
  });
  const { data } = req;

  const error = v.safeParse(LastFMError, data);
  if (error.success)
    throw new Error(`Error ${error.output.error}: ${error.output.message}`);

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
    const tracks = v.parse(LastFMTracks, data);
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

const LastFMUser = v.object({
  name: v.string(),
  image,
  url: v.pipe(v.string(), v.url()),
});
const LastAPIUser = v.object({ user: LastFMUser });

async function _getUser(): Promise<User | undefined> {
  try {
    const data = await sendRequest({
      method: "user.getinfo",
      user: username,
    });
    const { user } = v.parse(LastAPIUser, data);
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

  getListening: memoize(_getListening, { maxAge: Time.Second * 5 }),
  getUser: memoize(_getUser, { maxAge: Time.Minute * 5 }),
};
export default LastFMProvider;
