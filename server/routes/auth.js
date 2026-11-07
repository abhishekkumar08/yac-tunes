import { createSession, deleteSession, hashPassword, SESSION_COOKIE as COOKIE, verifyPassword } from "../auth.js";
import { AppError, body, text } from "../guards.js";

const cookieOpts = { path: "/", httpOnly: true, sameSite: "lax", maxAge: 30 * 86_400 };
const email = { type: "string", format: "email", maxLength: 200 };
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, avatarHue: u.avatar_hue });

export default function authRoutes(app, { db, now }) {
  const signIn = (reply, user) => {
    reply.setCookie(COOKIE, createSession(db, user.id, now()), cookieOpts);
    return { user: publicUser(user) };
  };

  app.post("/api/auth/signup", { schema: { body: body({ email, name: text(80, 1), password: text(200, 8) }) } }, (req, reply) => {
    const { email: e, name, password } = req.body;
    if (!name.trim()) throw new AppError(400, "invalid_input");
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(e)) throw new AppError(409, "email_taken");
    const user = db
      .prepare("INSERT INTO users (email, name, password_hash, avatar_hue) VALUES (?, ?, ?, ?) RETURNING *")
      .get(e, name.trim(), hashPassword(password), Math.floor(Math.random() * 360));
    return signIn(reply, user);
  });

  app.post("/api/auth/login", { schema: { body: body({ email, password: text(200, 1) }) } }, (req, reply) => {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(req.body.email);
    if (!user || !verifyPassword(req.body.password, user.password_hash)) throw new AppError(401, "bad_credentials");
    return signIn(reply, user);
  });

  app.post("/api/auth/logout", (req, reply) => {
    if (req.cookies[COOKIE]) deleteSession(db, req.cookies[COOKIE]);
    reply.clearCookie(COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/api/me", (req) => ({ user: req.user ? publicUser(req.user) : null }));
}
