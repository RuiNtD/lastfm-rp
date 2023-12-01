# Last.fm Rich Presence

Show your Last.fm Now Playing on your Discord profile

## Requirements

- [Deno]
- Windows only: [WebView2 Runtime] (Comes with Windows 11)
- Linux only: [GTK] and [WebKit2GTK] \
  `apt install libgtk-3-0 libwebkit2gtk-4.0-37`

## Installation

### Mac / Linux

Also run these commands on Mac / Linux:

```
chmod +x editconfig.js
chmod +x run.js
```

## Configuration

Please run `editconfig` (`.bat` on Windows or `.js` on Mac/Linux)
once before running Last.fm RP to set the configuration.

The "Disable when another app's Rich Presence is detected" feature uses [Lanyard].
If you would like to use this feature, you will need to join the [Lanyard Discord].

An option to run Last.fm RP at startup is coming Soon™️ Maybe™️

## Usage

Run `run` to start Last.fm Rich Presence.

[deno]: https://deno.land/
[webview2 runtime]: https://go.microsoft.com/fwlink/p/?LinkId=2124703
[gtk]: https://docs.gtk.org/gtk3/
[webkit2gtk]: https://webkitgtk.org/
[lanyard]: https://github.com/Phineas/lanyard
[lanyard discord]: https://discord.gg/lanyard
