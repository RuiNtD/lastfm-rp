const { Plugin } = require("powercord/entities");
const { getModule, React } = require("powercord/webpack");

const { join } = require("path");
const { existsSync } = require("fs");
const { execSync } = require("child_process");
const nodeModulesPath = join(__dirname, "node_modules");

function installDeps() {
  console.log("Installing dependencies, please wait...");
  execSync("npm install --only=prod", {
    cwd: __dirname,
    stdio: [null, null, null],
  });
  console.log("Dependencies successfully installed!");
  powercord.pluginManager.remount(__dirname);
}

if (!existsSync(nodeModulesPath)) {
  installDeps();
  return;
}

const LastFMTyped = require("lastfm-typed").default;
const Settings = require("./Settings");

const { SET_ACTIVITY } = getModule(["SET_ACTIVITY"], false);
const clientID = "740140397162135563";
const lastFmKey = "52ffa34ebbd200da17da5a6c3aef1b2e";

module.exports = class customRPC extends Plugin {
  timerID;
  lastfm = new LastFMTyped(lastFmKey, {
    userAgent: "github.com/FayneAldan/lastfm-rp",
  });

  async reloadRPC() {
    SET_ACTIVITY.handler({
      isSocketConnected: () => true,
      socket: {
        id: 100,
        application: {
          id: clientID,
          name: "Music",
        },
        transport: "ipc",
      },
      args: {
        pid: 10,
        activity: await this.activity(),
      },
    });
  }

  async activity() {
    const username = this.settings.get("username", "");
    if (!username) {
      console.log("No username");
      return undefined;
    }

    const playing = await this.lastfm.helper.getNowPlaying(username);
    const track = playing.recent;
    if (!track.nowplaying) return undefined;

    return {
      details: track.track,
      state: track.artist,
      assets: {
        large_image: track.image[track.image.length - 1]?.url || "lastfm",
        small_image: "lastfm",
        large_text: track.album,
        small_text: `Scrobbling on last.fm as ${username}`,
      },
      buttons: [
        {
          label: "Last.fm Profile",
          url: `https://www.last.fm/user/${username}`,
        },
        {
          label: "View Song",
          url: track.url,
        },
      ],
    };
  }

  startPlugin() {
    powercord.api.settings.registerSettings(this.entityID, {
      category: this.entityID,
      label: "Last.fm Rich Presence",
      render: (props) => React.createElement(Settings, props),
    });

    this.timerID = setInterval(() => this.reloadRPC(), 5000);
  }

  pluginWillUnload() {
    SET_ACTIVITY.handler({
      isSocketConnected: () => true,
      socket: {
        id: 100,
        application: {
          id: clientID,
          name: "Music",
        },
        transport: "ipc",
      },
      args: {
        pid: 10,
        activity: undefined,
      },
    });
    if (this.timerID) clearInterval(this.timerID);
    powercord.api.settings.unregisterSettings(this.entityID);
  }
};
