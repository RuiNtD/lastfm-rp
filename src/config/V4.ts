import * as v from "valibot";

export const Provider = v.picklist(["lastfm", "listenbrainz"]);

export const OtherConfig = v.object({
  any: v.optional(v.boolean(), false),
  listening: v.optional(v.boolean(), false),
  custom: v.optional(
    v.array(v.pipe(v.string(), v.digits(), v.maxLength(20))),
    []
  ),
});

export const ButtonType = v.optional(
  v.picklist(["song", "profile", "github", "none"]),
  "none"
);
export type ButtonType = v.InferOutput<typeof ButtonType>;

export default v.object({
  _VERSION: v.literal(4),

  provider: Provider,
  username: v.string(),

  smallImage: v.optional(v.picklist(["logo", "profile", "none"]), "none"),

  button1: ButtonType,
  button2: ButtonType,

  disableOnPresence: v.optional(OtherConfig, {}),

  lastFmApiKey: v.optional(v.string()),
  discordClientId: v.optional(v.string()),
});
