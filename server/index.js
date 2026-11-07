import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { openDb } from "./db.js";

const dataDir = process.env.TUNES_DATA_DIR ? `${process.env.TUNES_DATA_DIR}/` : fileURLToPath(new URL("../data/", import.meta.url));
const audioDir = `${dataDir}audio`;
mkdirSync(audioDir, { recursive: true });

const port = Number(process.env.API_PORT ?? 3151);
const app = buildApp({ db: openDb(`${dataDir}tunes.db`), audioDir });
await app.listen({ port, host: "127.0.0.1" });
process.stdout.write(`yac-tunes API on http://127.0.0.1:${port}\n`);
