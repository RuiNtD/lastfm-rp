import { ActivityType } from "discord-api-types/v10";
import * as v from "valibot";
import { getDiscordUser } from "./discord.ts";
import chalk from "chalk";
import { getLogger } from "./logger.ts";

const log = getLogger(chalk.hex("#d7bb87")("Lanyard"));

export { ActivityType };

export const LanyardActivity = v.object({
  id: v.string(),
  name: v.string(),
  type: v.enum(ActivityType),
  application_id: v.optional(v.string()),
});
export type LanyardActivity = v.InferOutput<typeof LanyardActivity>;

export const LanyardData = v.object({
  discord_user: v.object({
    id: v.string(),
  }),
  activities: v.array(LanyardActivity),
  listening_to_spotify: v.boolean(),
});
export type LanyardData = v.InferOutput<typeof LanyardData>;

const LanyardEmptyData = v.record(v.string(), v.never());
export type LanyardEmptyData = v.InferOutput<typeof LanyardEmptyData>;

enum LanyardWSOpcodes {
  Event,
  Hello,
  Initalize,
  Heartbeat,
}

const LanyardWSInitState = v.object({
  op: v.literal(LanyardWSOpcodes.Event),
  t: v.literal("INIT_STATE"),
  d: v.union([
    LanyardData,
    LanyardEmptyData,
    v.record(v.string(), LanyardData),
  ]),
});
const LanyardWSPresenceUpdate = v.object({
  op: v.literal(LanyardWSOpcodes.Event),
  t: v.literal("PRESENCE_UPDATE"),
  d: LanyardData,
});
type LanyardWSPresenceUpdate = v.InferOutput<typeof LanyardWSPresenceUpdate>;

const LanyardWSHello = v.object({
  op: v.literal(LanyardWSOpcodes.Hello),
  d: v.object({
    heartbeat_interval: v.number(),
  }),
});

const LanyardWSMsg = v.union([
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
  return v.safeParse(LanyardData, d).success;
}

function isEmpty(d: unknown): d is LanyardEmptyData {
  return v.safeParse(LanyardEmptyData, d).success;
}

function connect() {
  ws = new WebSocket("wss://api.lanyard.rest/socket");

  ws.onmessage = async (event) => {
    const obj = JSON.parse(event.data);
    log.debug(obj);
    const msg = v.parse(LanyardWSMsg, obj);
    const { id } = await getDiscordUser();
    log.debug(msg);
    switch (msg.op) {
      case LanyardWSOpcodes.Event: {
        const { d } = msg;
        if (isEmpty(d)) {
          if (!firstWarn)
            log.error(chalk.redBright("Please join discord.gg/lanyard"));
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
    log.info(chalk.greenBright("Connected"));
  };

  ws.onclose = async () => {
    log.warn(chalk.redBright("Disconnected"));
    await Bun.sleep(5000);
    connect();
  };

  ws.onerror = async (e) => {
    log.error(chalk.redBright("Error"), e);
    ws.onclose = null;
    ws.close();
    await Bun.sleep(5000);
    connect();
  };
}
connect();

async function addID(id: string) {
  if (connectIDs.includes(id)) return;
  connectIDs.push(id);

  while (ws.readyState != WebSocket.OPEN) {
    await Bun.sleep(0);
  }

  gotFirstData = false;
  log.debug("subscribing", connectIDs);
  ws.send(
    JSON.stringify({
      op: LanyardWSOpcodes.Initalize,
      d: { subscribe_to_ids: connectIDs },
    }),
  );
}

export async function getLanyard() {
  while (!gotFirstData) {
    await Bun.sleep(0);
  }

  const { id } = await getDiscordUser();
  await addID(id);

  return lanyardCache;
}
