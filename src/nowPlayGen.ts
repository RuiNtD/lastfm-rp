// @ts-nocheck

import { getLastTrack } from "./lastFm.ts";
import moment from "moment";

const bgImg = new Image();
bgImg.src = "../assets/np-background.png";

const debug = false;
const font = "sans-serif";

async function lastTrack() {
  const recent = await getLastTrack();
  if (recent.error) throw `Error from Last.fm: ${recent.message}`;
  const track = recent.recenttracks.track[0];
  if (!track) throw "Error: No recently played tracks";
  return track;
}

export async function genPlayText() {
  const track = await lastTrack();
  const { nowplaying } = track["@attr"] || {};
  let ret = "🎧 __**";
  if (!nowplaying) ret += "Now Playing**__";
  else {
    //const { uts } = track.date;
    //const rel = moment.unix(uts).fromNow();
    const rel = "59 minutes ago";
    ret += `Recently Played**__ (${rel})`;
  }
  ret += `\n**${track.name}**\nby ${track.artist["#text"]}`;
  return ret;
}

export async function genPlayImage(): Promise<Blob> {
  const track = await lastTrack();
  const { nowplaying } = track["@attr"] || {};

  const canvas = document.createElement("canvas");
  canvas.width = 350;
  canvas.height = 100;

  const ctx = canvas.getContext("2d");
  // "exploder" is not a typo. just a dumb joke.
  if (!ctx) throw "bruh wtf are you using internet exploder or smth???";

  ctx.drawImage(bgImg, 0, 0);

  const albumArt = new Image();
  albumArt.crossOrigin = "anonymous";
  albumArt.src = track.image[track.image.length - 1]["#text"];
  await new Promise((resolve) => {
    albumArt.onload = resolve;
  });

  ctx.save();
  roundImage(ctx, 5, 5, 90, 90, 10);
  ctx.clip();
  ctx.drawImage(albumArt, 5, 5, 90, 90);
  ctx.restore();

  // TODO: Add Loved indicator

  ctx.textAlign = "center";
  ctx.fillStyle = "#404040";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 16px " + font;
  centerText(ctx, nowplaying ? "Now Playing" : "Recently Played", 100, 25, 190);

  ctx.textAlign = "start";
  ctx.fillStyle = "black";

  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 14px " + font;
  text(ctx, track.name, 105, 55, 240);

  ctx.textBaseline = "hanging";
  ctx.fillStyle = "black";
  ctx.font = "12px " + font;
  text(ctx, "by " + track.artist["#text"], 105, 60, 240);

  ctx.fillStyle = "#808080";
  ctx.textBaseline = "alphabetic";

  ctx.font = "8px " + font;
  let last_text = nowplaying ? "Scrobbling now " : "Scrobbled ";
  last_text += store.shareName ? `as ${store.username}` : "on Last.fm";
  text(ctx, last_text, 100, 90, 150);

  if (!nowplaying) {
    const { uts } = track.date;
    const rel = moment.unix(uts).fromNow();
    ctx.textAlign = "right";
    ctx.font = "10px " + font;
    text(ctx, rel, 340, 90, 80);
  }

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      blob ? resolve(blob) : reject();
    });
  });
}

function roundImage(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.closePath();
}

function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number
) {
  const halfW = width / 2;
  const halfX = x + halfW;
  debug && ctx.strokeRect(x, y, width, 0);
  ctx.fillText(text, halfX, y, width);
}

function text(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width?: number
) {
  if (debug) {
    const measure = ctx.measureText(text);
    console.log(text, measure);
    const debugY = y;
    const debugH = 1;
    const debugW = (ctx.textAlign == "right" ? -1 : 1) * (width || 1);
    ctx.strokeRect(x, debugY, debugW, debugH);
  }
  ctx.fillText(text, x, y, width);
}
