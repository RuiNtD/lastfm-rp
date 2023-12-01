import config, { OtherConfig, clientID } from "./config.js";
import { ActivityType, LanyardActivity, getLanyard } from "./lanyard.js";

type OtherKey = Exclude<keyof OtherConfig, "any" | "listening" | "custom">;
const OtherAppIDs: { [appName in OtherKey]: string[] } = {
  cider: [
    "911790844204437504", // Cider
    "886578863147192350", // Apple Music
  ],
  iTRP: [
    // iTunes Rich Presence
    // https://itunesrichpresence.com/
    "383816327850360843", // iTunes
    "529435150472183819", // Apple Music
  ],
  AMPMD: ["842112189618978897"], // Apple Music PreMiD
};

async function getUserActivities(): Promise<LanyardActivity[]> {
  const res = await getLanyard();
  return res?.activities || [];
}

function getBlockedIDs(): string[] {
  let ids: string[] = [];
  if (!config.other) return [];
  for (const appName of Object.keys(OtherAppIDs) as OtherKey[]) {
    if (config.other[appName]) ids = ids.concat(OtherAppIDs[appName]);
  }
  return ids;
}

export async function hasOtherActivity(): Promise<LanyardActivity | undefined> {
  if (!config.otherEnabled || !config.other) return;
  const activities = (await getUserActivities()).filter(
    (v) => v.id != clientID
  );

  if (config.other.any) {
    const act = activities.at(0);
    return act;
  }

  const blockedIDs = getBlockedIDs();
  return activities.find(
    (v) =>
      (config.other?.listening && v.type == ActivityType.Listening) ||
      blockedIDs.includes(v.id)
  );
}
