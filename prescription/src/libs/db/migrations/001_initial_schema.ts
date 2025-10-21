import { Kysely, sql } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Create prescriptions table
  await db.schema
    .createTable("prescriptions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("signaturerx_prescription_id", "varchar(255)")
    .addColumn("patient_email", "varchar(255)", (col) => col.notNull())
    .addColumn("patient_name", "varchar(500)", (col) => col.notNull())
    .addColumn("status", "varchar(50)", (col) =>
      col.notNull().defaultTo("Pending"),
    )
    .addColumn("medicines", "jsonb", (col) => col.notNull())
    .addColumn("payload", "jsonb", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Create webhook_events table
  await db.schema
    .createTable("webhook_events")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("event_type", "varchar(100)", (col) => col.notNull())
    .addColumn("prescription_id", "varchar(255)")
    .addColumn("status", "varchar(50)")
    .addColumn("payload", "jsonb", (col) => col.notNull())
    .addColumn("received_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  // Create indexes
  await db.schema
    .createIndex("idx_prescriptions_status")
    .on("prescriptions")
    .column("status")
    .execute();

  await db.schema
    .createIndex("idx_prescriptions_patient_email")
    .on("prescriptions")
    .column("patient_email")
    .execute();

  await db.schema
    .createIndex("idx_prescriptions_signaturerx_id")
    .on("prescriptions")
    .column("signaturerx_prescription_id")
    .execute();

  await db.schema
    .createIndex("idx_webhook_events_prescription_id")
    .on("webhook_events")
    .column("prescription_id")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("webhook_events").execute();
  await db.schema.dropTable("prescriptions").execute();
}
