import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "node:test";
import { openDb } from "../server/db.js";
import { buildApp } from "../server/app.js";

export const NOW = Date.parse("2026-11-01T10:00:00Z");

export function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), "yac-tunes-"));
  const db = openDb(join(dir, "test.db"));
  after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  return { db, dir };
}

export const AUDIO_BYTES = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 256));

export function fixture(db, dir) {
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  run("INSERT INTO genres (id, name, hue) VALUES ('pop', 'Pop', 330), ('jazz', 'Jazz', 30)");
  run("INSERT INTO artists (id, name, bio, seed, base_listeners) VALUES ('ar1', 'Nova Lane', 'bio', 11, 1000), ('ar2', 'Brass Harbor', 'bio', 22, 50)");
  run(`INSERT INTO albums (id, artist_id, title, kind, year, released_on, seed, label) VALUES
    ('al1', 'ar1', 'Night Drive', 'album', 2025, '2025-03-01', 101, 'YAC Records'),
    ('al2', 'ar2', 'Low Tide', 'single', 2026, '2026-09-01', 202, 'YAC Records')`);
  run(`INSERT INTO tracks (id, album_id, title, track_no, duration_sec, genre_id, base_plays, audio_file) VALUES
    ('t1', 'al1', 'Neon 100%', 1, 61, 'pop', 500, 't1.mp3'),
    ('t2', 'al1', 'Mirror Road', 2, 75, 'pop', 300, 't2.mp3'),
    ('t3', 'al1', 'Last Exit', 3, 90, 'pop', 100, 't3.mp3'),
    ('t4', 'al2', 'Low Tide', 1, 45, 'jazz', 10, 't4.mp3')`);
  for (const [t, a] of [["t1", "ar1"], ["t2", "ar1"], ["t3", "ar1"], ["t4", "ar2"]]) {
    run("INSERT INTO track_artists (track_id, artist_id, ord) VALUES (?, ?, 0)", t, a);
  }
  const audioDir = join(dir, "audio");
  mkdirSync(audioDir, { recursive: true });
  writeFileSync(join(audioDir, "t1.mp3"), AUDIO_BYTES);
  return { audioDir };
}

export function testApp() {
  const { db, dir } = tempDb();
  const { audioDir } = fixture(db, dir);
  let clock = NOW;
  const app = buildApp({ db, audioDir, now: () => clock });
  after(() => app.close());
  return { app, db, tick: (ms) => (clock += ms) };
}

export async function signUp(app, email = "ada@tunes.test") {
  const res = await app.inject({ method: "POST", url: "/api/auth/signup", payload: { email, name: email.split("@")[0], password: "tunes-demo-1" } });
  const cookie = res.cookies.find((c) => c.name === "yt_session");
  const cookies = { yt_session: cookie?.value ?? "" };
  const call = (method, url, payload) => app.inject({ method, url, payload, cookies }).then((r) => ({ status: r.statusCode, body: r.json() }));
  return { res, user: res.json().user, call, cookies };
}
