import * as v from "valibot";
import ConfigV4 from "./V4.ts";

export const OtherConfig = v.object({
  any: v.optional(v.boolean(), false),
  listening: v.optional(v.boolean(), false),
  custom: v.optional(
    v.array(v.pipe(v.string(), v.digits(), v.maxLength(20))),
    [],
  ),
});

export const ButtonType = v.optional(
  v.picklist(["song", "artist", "profile", "github", "none"]),
  "none",
);
export type ButtonType = v.InferOutput<typeof ButtonType>;

export default v.pipe(
  v.object({
    _VERSION: v.literal(3),
    lastFmUsername: v.pipe(
      v.string(),
      v.regex(/^[A-Za-z][\w-]+$/),
      v.minLength(2),
      v.maxLength(15),
    ),

    smallImage: v.optional(v.picklist(["lastfm", "profile", "none"]), "none"),

    button1: ButtonType,
    button2: ButtonType,

    disableOnPresence: v.optional(OtherConfig, {}),

    lastFmApiKey: v.optional(v.string()),
    discordClientId: v.optional(v.string()),
  }),
  v.transform(
    (config): v.InferInput<typeof ConfigV4> => ({
      ...config,
      _VERSION: 4,
      provider: "lastfm",
      username: config.lastFmUsername,
      smallImage: config.smallImage == "lastfm" ? "logo" : config.smallImage,
      button1: config.button1 == "artist" ? "none" : config.button1,
      button2: config.button2 == "artist" ? "none" : config.button2,
    }),
  ),
);
