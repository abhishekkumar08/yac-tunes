import { test } from "node:test";
import assert from "node:assert/strict";
import { testApp, signUp } from "./helpers.js";

test("signup sets a session cookie and /api/me returns the user", async () => {
  const { app } = testApp();
  const { res, call } = await signUp(app);
  assert.equal(res.statusCode, 200);
  const me = await call("GET", "/api/me");
  assert.equal(me.body.user.email, "ada@tunes.test");
});

test("signing up twice with one email is refused", async () => {
  const { app } = testApp();
  await signUp(app);
  const { res } = await signUp(app);
  assert.equal(res.statusCode, 409);
  assert.equal(res.json().error, "email_taken");
});

test("login with a wrong password is refused", async () => {
  const { app } = testApp();
  await signUp(app);
  const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ada@tunes.test", password: "nope-nope" } });
  assert.equal(res.statusCode, 401);
});

test("login with the right password works", async () => {
  const { app } = testApp();
  await signUp(app);
  const res = await app.inject({ method: "POST", url: "/api/auth/login", payload: { email: "ada@tunes.test", password: "tunes-demo-1" } });
  assert.equal(res.statusCode, 200);
  assert.ok(res.cookies.some((c) => c.name === "yt_session" && c.httpOnly));
});

test("logout ends the session", async () => {
  const { app } = testApp();
  const { call } = await signUp(app);
  await call("POST", "/api/auth/logout", {});
  const me = await call("GET", "/api/me");
  assert.equal(me.body.user, null);
});

test("catalogue and audio need a session", async () => {
  const { app } = testApp();
  for (const url of ["/api/home", "/api/albums/al1", "/audio/t1.mp3"]) {
    const res = await app.inject({ method: "GET", url });
    assert.equal(res.statusCode, 401, url);
  }
});
