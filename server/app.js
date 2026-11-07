import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { AppError } from "./guards.js";
import { SESSION_COOKIE, userForToken } from "./auth.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import playlistRoutes from "./routes/playlists.js";
import libraryRoutes from "./routes/library.js";
import audioRoutes from "./routes/audio.js";

const PUBLIC = new Set(["/api/me", "/api/auth/signup", "/api/auth/login", "/api/auth/logout"]);
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

export function buildApp({ db, audioDir, now = () => Date.now() }) {
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });
  app.register(cookie);
  app.decorateRequest("user", null);

  app.addHook("preHandler", async (req) => {
    if (BODY_METHODS.has(req.method) && !String(req.headers["content-type"]).startsWith("application/json")) {
      throw new AppError(415, "json_required");
    }
    req.user = userForToken(db, req.cookies[SESSION_COOKIE], now());
    if (!req.user && !PUBLIC.has(req.url.split("?")[0])) throw new AppError(401, "auth_required");
  });

  app.addContentTypeParser("*", (req, payload, done) => done(new AppError(415, "json_required")));

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof AppError) return reply.code(err.status).send({ error: err.code });
    if (err.validation) return reply.code(400).send({ error: "invalid_input", detail: err.message });
    if (err.statusCode && err.statusCode < 500) return reply.code(err.statusCode).send({ error: err.code ?? "bad_request" });
    req.log.error(err);
    return reply.code(500).send({ error: "server_error" });
  });

  const ctx = { db, now, audioDir };
  for (const routes of [authRoutes, catalogRoutes, playlistRoutes, libraryRoutes, audioRoutes]) {
    app.register(async (scope) => routes(scope, ctx));
  }
  return app;
}
