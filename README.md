# Scrobble Rich Presence

Show your scrobbler's Now Playing on your Discord profile

Supports [Last.fm] and [ListenBrainz]

## Requirements

- [Git](https://git-scm.com/)
- [Bun](https://bun.sh)

## Setup

```sh
git clone https://github.com/RuiNtD/lastfm-rp
bun install
```

## Configuration

Before running Scrobble RP, please copy `config.example.yml` to `config.yml`
and edit it to your liking. `username` is required.

The "Disable when another app's Rich Presence is detected" feature uses [Lanyard].
If you would like to use this feature, you will need to join the [Lanyard Discord].

Use `manager` if you want Scrobble RP to run at startup

## Usage

Run `start` to start Scrobble Rich Presence.
`manager` includes an option to update the script.

## Special Thanks!

- [Tabler Icons](https://tabler.io/icons)
- [SVG to PNG](https://github.com/vincerubinetti/svg-to-png)

[lanyard]: https://github.com/Phineas/lanyard
[lanyard discord]: https://discord.gg/lanyard
[last.fm]: https://last.fm/
[listenbrainz]: https://listenbrainz.org/
