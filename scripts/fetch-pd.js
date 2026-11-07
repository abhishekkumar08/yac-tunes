// Downloads the CC0 recordings listed in catalog.js into data/pd/. Run only after the owner approves.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PUBLIC_DOMAIN } from "./catalog.js";

const dataDir = process.env.TUNES_DATA_DIR ? `${process.env.TUNES_DATA_DIR}/` : fileURLToPath(new URL("../data/", import.meta.url));
const dir = `${dataDir}pd`;
mkdirSync(dir, { recursive: true });

for (const t of PUBLIC_DOMAIN.tracks) {
  const out = `${dir}/${t.id}.ogg`;
  if (existsSync(out)) continue;
  const res = await fetch(t.url, { headers: { "user-agent": "yac-tunes-local/0.1 (local demo; one-time download)" } });
  if (!res.ok) throw new Error(`Download failed for ${t.title}: HTTP ${res.status}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  process.stdout.write(`Saved ${t.title} → ${out}\n`);
}
