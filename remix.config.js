/** @type {import('@remix-run/dev').AppConfig} */
export default {
  serverBuildFile: "server.js",
  serverConditions: ["worker"],
  serverDependenciesToBundle: "all",
  serverMainFields: ["browser", "module", "main"],
  serverModuleFormat: "esm",
  serverPlatform: "neutral",
  future: {
    unstable_optimizeDeps: true,
  },
};
