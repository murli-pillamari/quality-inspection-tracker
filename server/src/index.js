import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const currentDirectory = fileURLToPath(new URL(".", import.meta.url));
const databasePath = process.env.DATABASE_PATH ?? join(currentDirectory, "..", "data", "quality-inspections.db");
const port = Number(process.env.PORT ?? 3001);
const database = openDatabase(databasePath);
const app = createApp(database);
const server = app.listen(port, () => {
  console.log(`Quality Inspection API listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
