# Last.fm Rich Presence

Show your Last.fm Now Playing on your Discord profile

## Requirements

- [NodeJS]
- Windows only: [WebView2 Runtime]
- Mac and Linux only: [Deno]
- Linux only: [GTK] and [WebKit2GTK] \
  `apt install libgtk-3-0 libwebkit2gtk-4.0-37`

## Installation

Run this commands in terminal:

```
npm install
```

### Mac / Linux

Also run these commands on Mac / Linux:

```
chmod +x editconfig.js
chmod +x run.js
```

## Configuration

Please run `editconfig` (`.exe` on Windows or `.js` on Mac/Linux)
once before running Last.fm RP to set the configuration.

An option to run Last.fm RP at startup is coming Soon™️

## Usage

Run `run` to start Last.fm Rich Presence.

[deno]: https://deno.land/
[nodejs]: https://nodejs.org/en/
[webview2 runtime]: https://go.microsoft.com/fwlink/p/?LinkId=2124703
[gtk]: https://docs.gtk.org/gtk3/
[webkit2gtk]: https://webkitgtk.org/
