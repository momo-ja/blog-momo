/// <reference types="@remix-run/cloudflare-workers" />
/// <reference types="@cloudflare/workers-types" />

declare module "*.css" {
  export const content: { [className: string]: string };
  export default content;
}

interface CloudflareEnv {
  DB: D1Database;
  BLOG_ASSETS: R2Bucket;
  ASSETS?: KVNamespace;
  PUBLIC_SITE_URL: string;
  ADMIN_PASSWORD?: string;
  AFFILIATE_ID?: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production";
    }
  }
  var __cfEnv: CloudflareEnv | undefined;
}

export type { CloudflareEnv };
