import config, { clientID } from "./config.ts";
import { ActivityType, LanyardActivity, getLanyard } from "./lanyard.ts";

async function getUserActivities(): Promise<LanyardActivity[]> {
  const res = await getLanyard();
  return res?.activities || [];
}

export async function hasOtherActivity(): Promise<LanyardActivity | undefined> {
  const { disableOnPresence: opts } = config;

  const activities = (await getUserActivities()).filter(
    (v) => v.application_id != clientID && v.id != "custom"
  );
  const customIDs = opts.custom || [];
  return activities.find(
    (v) =>
      opts.any ||
      (opts.listening && v.type == ActivityType.Listening) ||
      (v.application_id && customIDs.includes(v.application_id))
  );
}
