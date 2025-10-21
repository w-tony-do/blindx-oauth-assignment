import esbuild from "esbuild";
import { readdir } from "fs/promises";
import { join } from "path";

// Build main server
esbuild
  .build({
    entryPoints: ["prescription/src/main.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "out/index.js",
    minify: true,
    external: [],
  })
  .catch(() => process.exit(1));

// Build migration runner
esbuild
  .build({
    entryPoints: ["prescription/src/libs/db/migrate.ts"],
    bundle: true,
    platform: "node",
    target: "node22",
    outfile: "out/migrate.js",
    minify: true,
    external: [],
  })
  .catch(() => process.exit(1));

// Build migration files
const migrationsDir = "prescription/src/libs/db/migrations";
readdir(migrationsDir)
  .then((files) => {
    const migrationFiles = files
      .filter((file) => file.endsWith(".ts"))
      .map((file) => join(migrationsDir, file));

    return esbuild.build({
      entryPoints: migrationFiles,
      bundle: true,
      platform: "node",
      target: "node22",
      outdir: "out/migrations",
      format: "esm",
      minify: false,
      external: [],
    });
  })
  .catch(() => process.exit(1));
