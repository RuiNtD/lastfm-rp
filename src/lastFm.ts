import config from "./config.ts";
import { colors } from "@cliffy/ansi/colors";
import { getLogger } from "./logger.ts";
import { z } from "zod";
import axios from "axios";
import CacheVar from "./cache.ts";

const api = axios.create({
  baseURL: "https://ws.audioscrobbler.com/2.0/",
  headers: {
    "User-Agent": "https://github.com/RuiNtD/lastfm-rp",
  },
});

const log = getLogger(colors.bold.rgb24("[Last.fm]", 0xba0000));

const { lastFmUsername: username } = config;
const apiKey = config.lastFmApiKey || "3b64424cee4803202edd52b060297958";

export const LastFMError = z.object({ error: z.number(), message: z.string() });
export type LastFMError = z.infer<typeof LastFMError>;

const images = z
  .tuple([
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
  ])
  .transform((v) => {
    return {
      small: v[0]["#text"],
      medium: v[1]["#text"],
      large: v[2]["#text"],
      extralarge: v[3]["#text"],
    };
  });

export const LastFMTrack = z.object({
  artist: z
    .object({
      "#text": z.string(),
    })
    .transform((v) => v["#text"]),
  image: images,
  album: z
    .object({
      "#text": z.string(),
    })
    .transform((v) => v["#text"]),
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

const lastTrack = new CacheVar<LastFMTrack>({ seconds: 5 });
export async function getLastTrack(): Promise<LastFMTrack | undefined> {
  try {
    const cached = lastTrack.get();
    if (cached) return cached;

    const data = await sendRequest({
      method: "user.getrecenttracks",
      user: username,
      limit: "1",
    });

    const tracks = LastFMTracks.parse(data);
    const track: LastFMTrack = tracks.recenttracks.track[0];
    log.debug(track);
    lastTrack.set(track);
    return track;
  } catch (e) {
    log.error(colors.red("Error"), e);
    return;
  }
}

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

const cachedUser = new CacheVar<LastFMUser>({ minutes: 5 });
export async function getUser(): Promise<LastFMUser | undefined> {
  try {
    const cached = cachedUser.get();
    if (cached) return cached;

    const data = await sendRequest({
      method: "user.getinfo",
      user: username,
    });

    const { user } = LastAPIUser.parse(data);
    cachedUser.set(user);
    return user;
  } catch (e) {
    log.error(colors.red("Error"), e);
    return;
  }
}
