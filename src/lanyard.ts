import { ActivityType } from "discord-api-types/v10";
import { z } from "zod";
import { getDiscordUser } from "./discord.ts";
import { colors } from "@cliffy/ansi/colors";
import config from "./config.ts";
import { delay } from "@std/async";
import { getLogger } from "./logger.ts";

const log = getLogger(colors.bold.rgb24("[Lanyard]", 0xd7bb87));

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

function connect() {
  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onmessage = async (event) => {
    const obj = JSON.parse(event.data);
    log.debug(obj);
    const msg = LanyardWSMsg.parse(obj);
    const { id } = await getDiscordUser();
    log.debug(msg);
    switch (msg.op) {
      case LanyardWSOpcodes.Event: {
        const { d } = msg;
        if (isEmpty(d)) {
          if (!firstWarn)
            log.error(colors.brightRed("Please join discord.gg/lanyard"));
          firstWarn = true;
          lanyardCache = undefined;
        } else if (isData(d)) {
          if (d.discord_user.id == id) lanyardCache = d;
        } else if (d[id]) lanyardCache = d[id];
        gotFirstData = true;
        break;
      }
      case LanyardWSOpcodes.Hello: {
        setInterval(() => {
          ws.send(JSON.stringify({ op: LanyardWSOpcodes.Heartbeat }));
        }, msg.d.heartbeat_interval);
        await addID(id);
        break;
      }
    }
  };

  ws.onopen = () => {
    log.info(colors.brightGreen("Connected"));
  };

  ws.onclose = async () => {
    log.warn(colors.brightRed("Disconnected"));
    await delay(5000);
    connect();
  };

  ws.onerror = async (e) => {
    log.error(colors.brightRed("Error"), e);
    ws.onclose = null;
    ws.close();
    await delay(5000);
    connect();
  };
}
if (config.otherEnabled) connect();

async function addID(id: string) {
  if (connectIDs.includes(id)) return;
  connectIDs.push(id);

  while (ws.readyState != WebSocket.OPEN) {
    await delay(0);
  }

  gotFirstData = false;
  log.debug("subscribing", connectIDs);
  ws.send(
    JSON.stringify({
      op: LanyardWSOpcodes.Initalize,
      d: { subscribe_to_ids: connectIDs },
    })
  );
}

export async function getLanyard() {
  while (!gotFirstData) {
    await delay(0);
  }

  const { id } = await getDiscordUser();
  await addID(id);

  return lanyardCache;
}
