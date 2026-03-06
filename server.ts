import { Hono } from "hono";
import { handle } from "hono/cloudflare-workers";
import { createRequestHandler } from "@remix-run/cloudflare-workers";

import * as build from "./build/server/index.js";

const app = new Hono();

// Serve static assets
app.get("/assets/*", async (c) => {
  const url = new URL(c.req.url);
  const assetPath = url.pathname;
  const asset = await c.env.ASSETS.get(assetPath);
  if (asset) {
    return new Response(asset, {
      headers: {
        "Content-Type": getContentType(assetPath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
  return c.notFound();
});

// Handle Remix requests
app.all("*", async (c) => {
  const requestHandler = createRequestHandler({
    build,
    getLoadContext: (request) => ({
      env: c.env,
      cf: c.raw.cf,
    }),
  });
  return requestHandler(c.req.raw);
});

function getContentType(path: string): string {
  if (path.endsWith(".js")) return "application/javascript";
  if (path.endsWith(".css")) return "text/css";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".woff") || path.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

export default app;
