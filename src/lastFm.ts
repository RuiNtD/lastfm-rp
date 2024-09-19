import config, { lastFmApiKey } from "./config.ts";
import chalk from "chalk";
import { getLogger } from "./logger.ts";
import z, { object, tuple } from "zod";
import axios, { AxiosError } from "axios";
import memoize from "memoize";

const api = axios.create({
  baseURL: "https://ws.audioscrobbler.com/2.0/",
  headers: {
    "User-Agent": "https://github.com/RuiNtD/lastfm-rp",
  },
});

const log = getLogger(chalk.hex("#ba0000")("Last.fm"));

const { lastFmUsername: username } = config;
const apiKey = lastFmApiKey;

export const LastFMError = z.object({ error: z.number(), message: z.string() });
export type LastFMError = z.infer<typeof LastFMError>;

const hashtext = object({
  "#text": z.string(),
}).transform((v) => v["#text"]);

const images = tuple([
  z.object({
    size: z.literal("small"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("medium"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("large"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("extralarge"),
    "#text": z.literal("").or(z.string().url()),
  }),
]).transform((v) => ({
  small: v[0]["#text"],
  medium: v[1]["#text"],
  large: v[2]["#text"],
  extralarge: v[3]["#text"],
}));

export const LastFMTrack = object({
  artist: hashtext,
  image: images,
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
export type LastFMTrack = z.infer<typeof LastFMTrack>;

export const LastFMTracks = z.object({
  recenttracks: z.object({
    track: z.array(LastFMTrack),
  }),
});
export type LastFMTracks = z.infer<typeof LastFMTracks>;

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

async function _getLastTrack(): Promise<LastFMTrack | undefined> {
  try {
    const data = await sendRequest({
      method: "user.getrecenttracks",
      user: username,
      limit: "1",
    });

    const tracks = LastFMTracks.parse(data);
    const track: LastFMTrack = tracks.recenttracks.track[0];
    log.debug(track);
    return track;
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
export const getLastTrack = memoize(_getLastTrack, { maxAge: 5_000 });

const LastFMUser = z.object({
  name: z.string(),
  age: z.coerce.number(),
  realname: z.string(),
  image: images,
  country: z.string(),
  url: z.string().url(),
});
export type LastFMUser = z.infer<typeof LastFMUser>;
const LastAPIUser = z.object({ user: LastFMUser });

async function _getUser(): Promise<LastFMUser | undefined> {
  try {
    const data = await sendRequest({
      method: "user.getinfo",
      user: username,
    });
    return LastAPIUser.parse(data).user;
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
export const getUser = memoize(_getUser, { maxAge: 5 * 60_000 });

const LastFMArtist = z.object({
  name: z.string(),
  url: z.string().url(),
  image: images,
});
export type LastFMArtist = z.infer<typeof LastFMArtist>;
const LastAPIArtist = z.object({ artist: LastFMArtist });

async function _getArtist(artist: string): Promise<LastFMArtist | undefined> {
  try {
    const data = await sendRequest({
      method: "artist.getinfo",
      artist,
    });
    return LastAPIArtist.parse(data).artist;
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
export const getArtist = memoize(_getArtist, { maxAge: 20 * 60_000 });
