import { createRequestHandler } from "@remix-run/cloudflare-workers";
import * as build from "./build/server/index.js";

addEventListener("fetch", (event: FetchEvent) => {
  const handler = createRequestHandler({
    build,
    getLoadContext: ({ env }) => ({
      cloudflare: { env },
    }),
  });
  event.respondWith(handler(event.request));
});

export interface Env {
  DB: D1Database;
  BLOG_ASSETS: R2Bucket;
  PUBLIC_SITE_URL: string;
  ADMIN_PASSWORD?: string;
  AFFILIATE_ID?: string;
}
