import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "../build/server/index.js";

export const onRequest: PagesFunction = createPagesFunctionHandler({
  build,
  getLoadContext: ({ env }) => ({
    cloudflare: { env },
  }),
});
