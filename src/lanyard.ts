import { ActivityType } from "discord-api-types/v10";
import { z } from "zod";
import { WebSocket } from "ws";
import { lanyardWord, clientUser } from "./index.js";
import chalk from "chalk";
import config from "./config.js";

export { ActivityType };

export const LanyardActivity = z.object({
  type: z.nativeEnum(ActivityType),
  id: z.string(),
  name: z.string(),
});
export type LanyardActivity = z.infer<typeof LanyardActivity>;

export const LanyardData = z
  .object({
    listening_to_spotify: z.boolean(),
    activities: LanyardActivity.array(),
  })
  .optional();
export type LanyardData = z.infer<typeof LanyardData>;

enum LanyardWSOpcodes {
  Event,
  Hello,
  Initalize,
  Heartbeat,
}

const LanyardWSEvent = z.object({
  op: z.literal(LanyardWSOpcodes.Event),
  t: z.enum(["INIT_STATE", "PRESENCE_UPDATE"]),
  d: LanyardData,
});

const LanyardWSHello = z.object({
  op: z.literal(LanyardWSOpcodes.Hello),
  d: z.object({
    heartbeat_interval: z.number(),
  }),
});

const LanyardWSMsg = z.discriminatedUnion("op", [
  LanyardWSEvent,
  LanyardWSHello,
]);

let lanyardCache: LanyardData;

function connect() {
  const ws = new WebSocket("wss://api.lanyard.rest/socket", {});

  ws.on("message", (raw) => {
    const obj = JSON.parse(raw.toString("utf8"));
    const msg = LanyardWSMsg.parse(obj);
    // console.log(msg);
    switch (msg.op) {
      case LanyardWSOpcodes.Event:
        lanyardCache = msg.d;
        return;
      case LanyardWSOpcodes.Hello:
        ws.send(
          JSON.stringify({
            op: LanyardWSOpcodes.Initalize,
            d: { subscribe_to_id: clientUser.id },
          })
        );
        setInterval(() => {
          ws.send(JSON.stringify({ op: LanyardWSOpcodes.Heartbeat }));
        }, msg.d.heartbeat_interval);
        return;
    }
  });

  ws.onopen = () => {
    console.log(lanyardWord, chalk.greenBright("Connected"));
  };

  ws.onclose = () => {
    console.log(lanyardWord, chalk.redBright("Disconnected"));
    setTimeout(connect, 5000);
  };

  ws.onerror = (e) => {
    console.log(lanyardWord, chalk.redBright("Error"), e);
    ws.close();
  };
}
if (config.otherEnabled) connect();

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

export function getLanyard() {
  return lanyardCache;
}
