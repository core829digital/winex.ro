/* eslint-disable */
/**
 * Generated `api` utility (mantenuto a mano finché non si esegue `npx convex dev`, che lo rigenera).
 */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as ResendOTP from "../ResendOTP.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as campaigns from "../campaigns.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_emailTemplate from "../lib/emailTemplate.js";
import type * as posts from "../posts.js";
import type * as push from "../push.js";
import type * as settings from "../settings.js";
import type * as subscribers from "../subscribers.js";
import type * as team from "../team.js";

declare const fullApi: ApiFromModules<{
  ResendOTP: typeof ResendOTP;
  analytics: typeof analytics;
  auth: typeof auth;
  campaigns: typeof campaigns;
  crons: typeof crons;
  http: typeof http;
  leads: typeof leads;
  "lib/admin": typeof lib_admin;
  "lib/emailTemplate": typeof lib_emailTemplate;
  posts: typeof posts;
  push: typeof push;
  settings: typeof settings;
  subscribers: typeof subscribers;
  team: typeof team;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
export declare const components: {};
