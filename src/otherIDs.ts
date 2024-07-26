import config, { OtherConfig, clientID } from "./config.ts";
import { ActivityType, LanyardActivity, getLanyard } from "./lanyard.ts";

type OtherKey = Exclude<keyof OtherConfig, "any" | "listening" | "custom">;
const OtherAppIDs: { [appName in OtherKey]: string[] } = {
  cider: [
    "911790844204437504", // Cider
    "886578863147192350", // Apple Music
  ],
  iTunesRP: [
    // iTunes Rich Presence
    // https://itunesrichpresence.com/
    "383816327850360843", // iTunes
    "529435150472183819", // Apple Music
  ],
  PreMiDAppleMusic: ["842112189618978897"], // Apple Music PreMiD
};

async function getUserActivities(): Promise<LanyardActivity[]> {
  const res = await getLanyard();
  return res?.activities || [];
}

function getBlockedIDs(): string[] {
  let ids: string[] = [];
  if (!config.disableOnPresence) return [];
  for (const appName of Object.keys(OtherAppIDs) as OtherKey[]) {
    if (config.disableOnPresence[appName])
      ids = ids.concat(OtherAppIDs[appName]);
  }
  return ids;
}

export async function hasOtherActivity(): Promise<LanyardActivity | undefined> {
  if (!config.disableOnPresence) return;
  const activities = (await getUserActivities()).filter(
    (v) => v.application_id != clientID && v.id != "custom"
  );

  if (config.disableOnPresence.any) {
    const act = activities.at(0);
    return act;
  }

  const blockedIDs = getBlockedIDs();
  return activities.find(
    (v) =>
      (config.disableOnPresence?.listening &&
        v.type == ActivityType.Listening) ||
      (v.application_id && blockedIDs.includes(v.application_id))
  );
}
