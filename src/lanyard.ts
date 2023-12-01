import { ActivityType } from "discord-api-types/v10";
import { z } from "zod";
import { WebSocket } from "ws";
import { lanyardWord, getDiscordUser } from "./index.js";
import chalk from "chalk";
import config from "./config.js";
import { scheduler } from "timers/promises";

export { ActivityType };

export const LanyardActivity = z.object({
  id: z.string(),
  name: z.string(),
  type: z.nativeEnum(ActivityType),
  application_id: z.string().optional(),
});
export type LanyardActivity = z.infer<typeof LanyardActivity>;

export const LanyardData = z.object({
  discord_user: z.object({
    id: z.string(),
  }),
  activities: LanyardActivity.array(),
  listening_to_spotify: z.boolean(),
});
export type LanyardData = z.infer<typeof LanyardData>;

const LanyardEmptyData = z.record(z.never());
export type LanyardEmptyData = z.infer<typeof LanyardEmptyData>;

enum LanyardWSOpcodes {
  Event,
  Hello,
  Initalize,
  Heartbeat,
}

const LanyardWSInitState = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("INIT_STATE"),
  d: z.union([LanyardData, LanyardEmptyData, z.record(LanyardData)]),
});
const LanyardWSPresenceUpdate = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.literal("PRESENCE_UPDATE"),
  d: LanyardData,
});
type LanyardWSPresenceUpdate = z.infer<typeof LanyardWSPresenceUpdate>;

const LanyardWSHello = z.object({
  op: z.literal(LanyardWSOpcodes.Hello),
  d: z.object({
    heartbeat_interval: z.number(),
  }),
});

const LanyardWSMsg = z.union([
  LanyardWSInitState,
  LanyardWSPresenceUpdate,
  LanyardWSHello,
]);

let lanyardCache: LanyardData | undefined;
let gotFirstData = false;
let ws: WebSocket;
const connectIDs: string[] = [];
let firstWarn = false;

function isData(d: unknown): d is LanyardData {
  return LanyardData.safeParse(d).success;
}

function isEmpty(d: unknown): d is LanyardEmptyData {
  return LanyardEmptyData.safeParse(d).success;
}

function subscribe() {}

function connect() {
  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.on("message", async (raw) => {
    const obj = JSON.parse(raw.toString("utf8"));
    // console.log(obj);
    const msg = LanyardWSMsg.parse(obj);
    const { id } = await getDiscordUser();
    // console.log(msg);
    switch (msg.op) {
      case LanyardWSOpcodes.Event:
        const { d } = msg;
        if (isEmpty(d)) {
          if (!firstWarn)
            console.log(lanyardWord, "Please join discord.gg/lanyard");
          firstWarn = true;
          lanyardCache = undefined;
        } else if (isData(d)) {
          if (d.discord_user.id == id) lanyardCache = d;
        } else if (d[id]) lanyardCache = d[id];
        gotFirstData = true;
        return;
      case LanyardWSOpcodes.Hello:
        addID(id);
        setInterval(() => {
          ws.send(JSON.stringify({ op: LanyardWSOpcodes.Heartbeat }));
        }, msg.d.heartbeat_interval);
        return;
    }
  });

  ws.onopen = () => {
    console.log(lanyardWord, chalk.greenBright("Connected"));
  };

  ws.onclose = async () => {
    console.log(lanyardWord, chalk.redBright("Disconnected"));
    await scheduler.wait(5000);
    connect();
  };

  ws.onerror = async (e) => {
    console.log(lanyardWord, chalk.redBright("Error"), e);
    ws.removeAllListeners();
    ws.close();
    await scheduler.wait(5000);
    connect();
  };
}
if (config.otherEnabled) connect();

async function addID(id: string) {
  if (connectIDs.includes(id)) return;
  connectIDs.push(id);

  while (ws.readyState != WebSocket.OPEN) {
    await scheduler.yield();
  }

  gotFirstData = false;
  ws.send(
    JSON.stringify({
      op: LanyardWSOpcodes.Initalize,
      d: { subscribe_to_ids: connectIDs },
    })
  );
}

const LanyardResponseSuccess = z.object({
  success: z.literal(true),
  data: LanyardData,
});

const LanyardResponseFailure = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const LanyardResponse = z.discriminatedUnion("success", [
  LanyardResponseSuccess,
  LanyardResponseFailure,
]);

export async function getLanyard() {
  while (!gotFirstData) {
    await scheduler.yield();
  }

  const { id } = await getDiscordUser();
  await addID(id);

  return lanyardCache;
}
