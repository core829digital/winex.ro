import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily("prune analytics events", { hourUTC: 1, minuteUTC: 15 }, internal.analytics.prune, {});
export default crons;
