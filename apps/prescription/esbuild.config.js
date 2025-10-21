const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "out/index.cjs",
    minify: true,
    external: [],
  })
  .catch(() => process.exit(1));
