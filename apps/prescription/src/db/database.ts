import { ColumnType, Generated, Kysely, PostgresDialect } from "kysely";
import pg from "pg";

const { Pool } = pg;

// Database types
export interface Database {
  prescriptions: PrescriptionsTable;
  webhook_events: WebhookEventsTable;
}

export interface PrescriptionsTable {
  id: Generated<string>;
  signaturerx_prescription_id: string | null;
  patient_email: string;
  patient_name: string;
  status: string;
  medicines: ColumnType<unknown, string, string>; // JSONB
  payload: ColumnType<unknown, string, string>; // JSONB
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface WebhookEventsTable {
  id: Generated<string>;
  event_type: string;
  prescription_id: string | null;
  status: string | null;
  payload: ColumnType<unknown, string, string>; // JSONB
  received_at: Generated<Date>;
}

const DATABASE_URL = process.env.DATABASE_URL;
let dbInstance: Kysely<Database> | null = null;

export function createDatabase(connectionString: string): Kysely<Database> {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString,
      max: 10,
    }),
  });

  return new Kysely<Database>({
    dialect,
  });
}

export const $db = () => {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
  }
  dbInstance ??= createDatabase(DATABASE_URL);
  return dbInstance;
};
