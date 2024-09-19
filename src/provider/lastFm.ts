import config, { lastFmApiKey as apiKey } from "../config/index.ts";
import chalk from "chalk";
import { getLogger } from "../logger.ts";
import z, { object } from "zod";
import axios, { AxiosError } from "axios";
import memoize from "memoize";
import type { Provider, Track, User } from "./index.ts";

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

const hashtext = object({
  "#text": z.string(),
}).transform((v) => v["#text"]);
const image = hashtext.array().transform((v) => v.at(-1));

export const LastFMTrack = object({
  artist: hashtext,
  image,
  album: hashtext,
  name: z.string(),
  "@attr": z
    .object({
      nowplaying: z
        .enum(["true", "false"])
        .transform((v) => v == "true")
        .optional(),
    })
    .optional(),
  url: z.string().url(),
  date: z
    .object({
      uts: z.coerce.number(),
      "#text": z.string(),
    })
    .optional(),
});
export const LastFMTracks = z.object({
  recenttracks: z.object({
    track: z.array(LastFMTrack),
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

  const error = LastFMError.safeParse(data);
  if (error.success)
    throw new Error(`Error ${error.data.error}: ${error.data.message}`);

  return data;
}

async function _getListening(): Promise<Track | undefined> {
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
    return;
  }
}

const LastFMUser = z.object({
  name: z.string(),
  image,
  url: z.string().url(),
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

const LastFMProvider: Provider = {
  name: "Last.fm",
  logoAsset: "lastfm",

  getListening: memoize(_getListening, { maxAge: 5_000 }),
  getUser: memoize(_getUser, { maxAge: 5 * 60_000 }),
};
export default LastFMProvider;
