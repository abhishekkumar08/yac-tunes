import { createReadStream, statSync } from "node:fs";
import { join } from "node:path";
import { AppError } from "../guards.js";

const SAFE_NAME = /^[a-z0-9-]+\.mp3$/;

function sizeOf(path) {
  try {
    return statSync(path).size;
  } catch (err) {
    if (err.code === "ENOENT") throw new AppError(404, "not_found");
    throw err;
  }
}

export default function audioRoutes(app, { audioDir }) {
  app.get("/audio/:file", (req, reply) => {
    const { file } = req.params;
    if (!SAFE_NAME.test(file)) throw new AppError(404, "not_found");
    const path = join(audioDir, file);
    const size = sizeOf(path);
    reply.header("accept-ranges", "bytes").header("content-type", "audio/mpeg").header("cache-control", "private, max-age=3600");

    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (!m || (m[1] === "" && m[2] === "")) return reply.header("content-length", size).send(createReadStream(path));

    let start = m[1] === "" ? size - Number(m[2]) : Number(m[1]);
    let end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    start = Math.max(0, start);
    if (start >= size || end < start) {
      return reply.code(416).header("content-range", `bytes */${size}`).send();
    }
    return reply
      .code(206)
      .header("content-range", `bytes ${start}-${end}/${size}`)
      .header("content-length", end - start + 1)
      .send(createReadStream(path, { start, end }));
  });
}
