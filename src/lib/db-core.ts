import fs from "node:fs";
import path from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import * as schema from "@/db/schema";

type MarkqDatabase = ReturnType<typeof createDatabase>;

const globalForDatabase = globalThis as typeof globalThis & {
  markqDatabase?: MarkqDatabase;
};

function databasePath() {
  const configured = process.env.DATABASE_URL ?? "./data/markq.db";
  const withoutFilePrefix = configured.startsWith("file:") ? configured.slice(5) : configured;
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), withoutFilePrefix);
}

function createDatabase() {
  const filename = databasePath();
  fs.mkdirSync(path.dirname(filename), { recursive: true });

  const sqlite = new Database(filename);
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA foreign_keys = ON");

  const database = drizzle(sqlite, { schema });
  migrate(database, { migrationsFolder: path.join(process.cwd(), "drizzle") });

  return database;
}

export function getDatabase() {
  if (!globalForDatabase.markqDatabase) {
    globalForDatabase.markqDatabase = createDatabase();
  }

  return globalForDatabase.markqDatabase;
}
