import esbuild from "esbuild";

esbuild
  .build({
    entryPoints: ["./src/main.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./out/index.js",
    minify: true,
    external: [],
  })
  .catch(() => process.exit(1));

esbuild
  .build({
    entryPoints: ["./src/libs/db/migrate.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "./out/migrate.js",
    minify: true,
    external: [],
  })
  .catch(() => process.exit(1));
