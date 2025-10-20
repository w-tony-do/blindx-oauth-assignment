import { promises as fs } from "fs";
import { FileMigrationProvider, Migrator } from "kysely";
import path from "path";
import { createDatabase } from "./database.js";

async function migrateToLatest() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://blinx:blinx_password@localhost:5432/blinx_signaturerx";

  const db = createDatabase(connectionString);

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(
        `✅ Migration "${it.migrationName}" was executed successfully`,
      );
    } else if (it.status === "Error") {
      console.error(`❌ Failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("❌ Failed to migrate");
    console.error(error);
    process.exit(1);
  }

  console.log("✅ All migrations completed successfully");
  await db.destroy();
}

migrateToLatest();
