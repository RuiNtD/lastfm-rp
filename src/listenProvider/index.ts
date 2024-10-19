import config from "../config";
import LastFMProvider from "./lastFm";
import LBProvider from "./listenbrainz";

export interface Track {
  name: string;
  artist?: string;
  album?: string;
  image?: string;
  url?: string;
}

export interface User {
  name: string;
  image?: string;
  url?: string;
}

export interface ListenProvider {
  readonly name: string;
  readonly logoAsset: string;

  getListening(): Promise<Track | undefined | null>;
  getUser(): Promise<User | undefined>;
}

function getProvider(): ListenProvider {
  switch (config.provider) {
    case "lastfm":
      return LastFMProvider;
    case "listenbrainz":
      return LBProvider;
  }
}

export default getProvider();
