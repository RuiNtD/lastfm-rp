import config, { OtherConfig, clientID } from "./config.js";
import { clientUser } from "./index.js";
import { LanyardActivity, getLanyard } from "./lanyard.js";

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
  const id = clientUser.id;
  const res = getLanyard();
  return res?.activities || [];
}

export async function hasOtherActivity(): Promise<boolean> {
  if (!config.otherEnabled || !config.other) return false;
  const activities = await getUserActivities();
  if (!activities) return false;

  if (config.other.any) {
    for (const { type, id: appID } of activities) {
      if (appID != clientID) return true;
    }
    return false;
  }

  if (config.other.listening) {
    for (const { type, id: appID } of activities) {
      if (appID == clientID) continue;
      if (type == 2) return true;
    }
  }

  const actAppIDs = activities.map((v) => v.id);
  for (const appName of Object.keys(OtherAppIDs) as OtherKey[]) {
    if (!config.other[appName]) continue;
    const appIDs = OtherAppIDs[appName];
    for (const appID of appIDs) {
      if (actAppIDs.includes(appID)) return true;
    }
  }

  return false;
}
