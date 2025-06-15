import config from "../config/index.ts";
import chalk from "chalk";
import { getLogger } from "../logger.ts";
import { z } from "zod/v4";
import axios, { AxiosError } from "axios";
import memoize from "memoize";
import type { ListenProvider, Track } from "./index.ts";
import * as Time from "@std/datetime/constants";

const api = axios.create({
  baseURL: config.listenBrainzAPIURL || "https://api.listenbrainz.org",
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});
const log = getLogger(
  // chalk.hex("#353070")("Listen") + chalk.hex("#eb743b")("Brainz")
  chalk.hex("#eb743b")("ListenBrainz"),
);
const { username } = config;

let isReady = false;
function ready() {
  if (isReady) return;
  log.info(chalk.green("First check successful!"));
  isReady = true;
}

const Lookup = z.object({
  artist_mbids: z.array(z.string()).optional(),
  recording_mbid: z.string().optional(),
  release_mbid: z.string().optional(),
  metadata: z.optional(
    z.object({
      release: z.object({
        caa_id: z.number().optional(),
        caa_release_mbid: z.string().optional(),
      }),
    }),
  ),
});
type Lookup = z.infer<typeof Lookup>;

async function _lookup(
  track: string,
  artist: string,
  album?: string,
): Promise<Lookup | undefined> {
  try {
    const { data } = await api.get("/1/metadata/lookup/", {
      params: {
        recording_name: track,
        artist_name: artist,
        release_name: album,
        inc: "release",
        metadata: true,
      },
    });
    return Lookup.parse(data);
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
const lookupMetadata = memoize(_lookup, { maxAge: Time.HOUR });

const LBPlayingAPI = z.object({
  payload: z.object({
    listens: z.array(
      z.object({
        track_metadata: z.object({
          artist_name: z.string(),
          release_name: z.string().optional(),
          track_name: z.string(),
        }),
      }),
    ),
  }),
});

async function _getListening(): Promise<Track | undefined | null> {
  try {
    const { data } = await api.get(`/1/user/${username}/playing-now`);
    log.trace("listenbrainz playing now", data);

    const resp = LBPlayingAPI.parse(data);
    const track = resp.payload.listens.at(0)?.track_metadata;
    ready();
    if (!track) return;

    const ret: Track = {
      name: track.track_name,
      artist: track.artist_name,
      album: track.release_name,
    };

    const lookup = await lookupMetadata(
      track.track_name,
      track.artist_name,
      track.release_name,
    );
    if (lookup?.metadata) {
      const { caa_release_mbid, caa_id } = lookup.metadata.release;
      if (caa_release_mbid && caa_id)
        ret.image = `http://coverartarchive.org/release/${caa_release_mbid}/${caa_id}-500.jpg`;
      if (lookup?.recording_mbid)
        ret.url = `https://musicbrainz.org/recording/${lookup.recording_mbid}`;
    }

    return ret;
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return null;
  }
}

const LBProvider: ListenProvider = {
  name: "ListenBrainz",
  logoAsset: "listenbrainz",

  getListening: memoize(_getListening, { maxAge: Time.SECOND * 5 }),
  async getUser() {
    return {
      name: username,
      // LB doesn't have profile pictures
      url: `https://listenbrainz.org/user/${username}`,
    };
  },
};
export default LBProvider;
