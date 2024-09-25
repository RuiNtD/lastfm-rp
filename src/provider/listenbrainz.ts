import config from "../config/index.ts";
import chalk from "chalk";
import { getLogger } from "../logger.ts";
import * as v from "valibot";
import axios, { AxiosError } from "axios";
import memoize from "memoize";
import type { Provider, Track } from "./index.ts";

const api = axios.create({
  baseURL: "https://api.listenbrainz.org/1/",
  headers: { "User-Agent": "https://github.com/RuiNtD/lastfm-rp" },
});
const log = getLogger(
  chalk.hex("#353070")("Listen") + chalk.hex("#eb743b")("Brainz")
);
const { username } = config;

let isReady = false;
function ready() {
  if (isReady) return;
  log.info(chalk.green("First check successful!"));
  isReady = true;
}

const Lookup = v.object({
  artist_mbids: v.optional(v.array(v.string())),
  recording_mbid: v.optional(v.string()),
  release_mbid: v.optional(v.string()),
  metadata: v.object({
    release: v.object({
      caa_id: v.optional(v.number()),
      caa_release_mbid: v.optional(v.string()),
    }),
  }),
});
type Lookup = v.InferOutput<typeof Lookup>;

async function _lookup(
  track: string,
  artist: string,
  album?: string
): Promise<Lookup | undefined> {
  try {
    const { data } = await api.get(
      `https://api.listenbrainz.org/1/metadata/lookup/`,
      {
        params: {
          recording_name: track,
          artist_name: artist,
          release_name: album,
          inc: "release",
          metadata: true,
        },
      }
    );
    return v.parse(Lookup, data);
  } catch (e) {
    if (e instanceof AxiosError) log.error(chalk.red("Error"), e.message);
    else log.error(chalk.red("Error"), e);
    return;
  }
}
const lookupMetadata = memoize(_lookup);

const LBPlayingAPI = v.object({
  payload: v.object({
    listens: v.array(
      v.object({
        track_metadata: v.object({
          artist_name: v.string(),
          release_name: v.optional(v.string()),
          track_name: v.string(),
        }),
      })
    ),
  }),
});

async function _getListening(): Promise<Track | undefined> {
  try {
    const { data } = await api.get(`/user/${username}/playing-now`);
    log.trace("listenbrainz playing now", data);

    const resp = v.parse(LBPlayingAPI, data);
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
      track.release_name
    );
    if (lookup) {
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
    return;
  }
}

const LBProvider: Provider = {
  name: "ListenBrainz",
  logoAsset: "listenbrainz",

  getListening: memoize(_getListening, { maxAge: 5_000 }),
  async getUser() {
    return {
      name: username,
      // LB doesn't have profile pictures
      url: `https://listenbrainz.org/user/${username}`,
    };
  },
};
export default LBProvider;
