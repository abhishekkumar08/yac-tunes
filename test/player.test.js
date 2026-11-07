import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyPlayer,
  playContext,
  next,
  previous,
  setShuffle,
  cycleRepeat,
  enqueue,
  removeQueued,
  moveQueued,
  playQueued,
  skipTo,
  upNext,
  currentTrackId,
} from "../shared/player.js";
import { mulberry32 } from "../shared/rng.js";


const album = { id: "al1", type: "album", name: "Album", trackIds: ["a", "b", "c", "d", "e"] };
const start = (index = 0, over = {}) => playContext({ ...emptyPlayer(), ...over }, album, index);
const walk = (state, n, opts) => {
  const ids = [];
  for (let i = 0; i < n; i++) {
    state = next(state, opts);
    ids.push(currentTrackId(state));
  }
  return { state, ids };
};

test("playContext starts at the chosen track", () => {
  const s = start(2);
  assert.equal(currentTrackId(s), "c");
  assert.equal(s.stopped, false);
  assert.equal(s.current.fromQueue, false);
});

test("next walks the context in order", () => {
  assert.deepEqual(walk(start(0), 4).ids, ["b", "c", "d", "e"]);
});

test("next past the end with repeat off stops on the first track", () => {
  const s = next(start(4));
  assert.equal(currentTrackId(s), "a");
  assert.equal(s.stopped, true);
});

test("repeat all wraps to the first track and keeps playing", () => {
  const s = next(start(4, { repeat: "all" }));
  assert.equal(currentTrackId(s), "a");
  assert.equal(s.stopped, false);
});

test("repeat one replays the track when it ends, but manual next moves on", () => {
  const s = start(1, { repeat: "one" });
  assert.equal(currentTrackId(next(s, { auto: true })), "b");
  assert.equal(currentTrackId(next(s)), "c");
});

test("queued tracks play before the rest of the context, in the order added", () => {
  let s = start(1);
  s = enqueue(s, "x", "q1");
  s = enqueue(s, "y", "q2");
  const { ids, state } = walk(s, 3);
  assert.deepEqual(ids, ["x", "y", "c"]);
  assert.equal(state.queue.length, 0);
});

test("a queued track is marked as coming from the queue", () => {
  const s = next(enqueue(start(0), "x", "q1"));
  assert.equal(s.current.fromQueue, true);
  assert.equal(s.current.uid, "q1");
});

test("removeQueued and moveQueued change what plays next", () => {
  let s = start(0);
  for (const [id, uid] of [["x", "q1"], ["y", "q2"], ["z", "q3"]]) s = enqueue(s, id, uid);
  s = removeQueued(s, "q2");
  s = moveQueued(s, 1, 0);
  assert.deepEqual(upNext(s).queue.map((q) => q.trackId), ["z", "x"]);
});

test("previous more than 3 seconds in restarts the same track", () => {
  const { state, restart } = previous(start(2), 3.5);
  assert.equal(restart, true);
  assert.equal(currentTrackId(state), "c");
});

test("previous near the start goes to the previous track", () => {
  const { state, restart } = previous(start(2), 1);
  assert.equal(restart, false);
  assert.equal(currentTrackId(state), "b");
});

test("previous on the first track restarts it with repeat off", () => {
  const { state, restart } = previous(start(0), 0);
  assert.equal(restart, true);
  assert.equal(currentTrackId(state), "a");
});

test("previous on the first track wraps to the last with repeat all", () => {
  const { state } = previous(start(0, { repeat: "all" }), 0);
  assert.equal(currentTrackId(state), "e");
});

test("previous while a queued track plays returns to the context track before it", () => {
  let s = next(enqueue(start(1), "x", "q1"));
  s = enqueue(s, "y", "q2");
  const { state } = previous(s, 0);
  assert.equal(currentTrackId(state), "b");
  assert.equal(state.current.fromQueue, false);
  assert.deepEqual(state.queue.map((q) => q.uid), ["q2"]);
});

test("shuffle on keeps the current track and plays every other track once", () => {
  const s = setShuffle(start(2), true, mulberry32(7));
  assert.equal(currentTrackId(s), "c");
  const rest = upNext(s).context;
  assert.deepEqual([...rest].sort(), ["a", "b", "d", "e"]);
});

test("shuffle off continues from the current track's own position", () => {
  let s = setShuffle(start(0), true, mulberry32(3));
  s = next(next(s));
  const playing = currentTrackId(s);
  s = setShuffle(s, false);
  assert.equal(currentTrackId(s), playing);
  const idx = album.trackIds.indexOf(playing);
  assert.deepEqual(upNext(s).context, album.trackIds.slice(idx + 1));
});

test("playContext with shuffle on starts with the chosen track", () => {
  const s = playContext({ ...emptyPlayer(), shuffle: true }, album, 3, mulberry32(11));
  assert.equal(currentTrackId(s), "d");
  assert.equal(upNext(s).context.length, 4);
  assert.ok(!upNext(s).context.includes("d"));
});

test("the queue is never shuffled", () => {
  let s = enqueue(enqueue(start(0), "x", "q1"), "y", "q2");
  s = setShuffle(s, true, mulberry32(5));
  assert.deepEqual(upNext(s).queue.map((q) => q.trackId), ["x", "y"]);
});

test("shuffle toggled while a queued track plays reshuffles only the context", () => {
  let s = next(enqueue(start(1), "x", "q1"));
  s = setShuffle(s, true, mulberry32(9));
  assert.equal(currentTrackId(s), "x");
  const after = next(s);
  assert.notEqual(currentTrackId(after), "b");
  assert.deepEqual([...upNext(s).context].sort(), ["a", "c", "d", "e"]);
});

test("cycleRepeat goes off, all, one, off", () => {
  let s = emptyPlayer();
  const seen = [];
  for (let i = 0; i < 3; i++) {
    s = cycleRepeat(s);
    seen.push(s.repeat);
  }
  assert.deepEqual(seen, ["all", "one", "off"]);
});

test("upNext lists the queue then the remaining context in play order", () => {
  const s = enqueue(start(2), "x", "q1");
  assert.deepEqual(upNext(s), { queue: [{ uid: "q1", trackId: "x" }], context: ["d", "e"] });
});

test("duplicate tracks in a context are tracked by position", () => {
  const dupes = { id: "p1", type: "playlist", name: "P", trackIds: ["a", "b", "a", "c"] };
  let s = playContext(emptyPlayer(), dupes, 2);
  assert.deepEqual(upNext(s).context, ["c"]);
  s = previous(s, 0).state;
  assert.equal(currentTrackId(s), "b");
});

test("playContext keeps the user's queue", () => {
  const s = playContext(enqueue(start(0), "x", "q1"), { ...album, id: "al2" }, 0);
  assert.deepEqual(s.queue, [{ uid: "q1", trackId: "x" }]);
});

test("a queued track on an empty player plays on next, then playback stops", () => {
  let s = enqueue(emptyPlayer(), "x", "q1");
  s = next(s);
  assert.equal(currentTrackId(s), "x");
  assert.equal(s.stopped, false);
  s = next(s);
  assert.equal(s.stopped, true);
});

test("playQueued jumps to that queued track and drops the ones before it", () => {
  let s = start(0);
  for (const [id, uid] of [["x", "q1"], ["y", "q2"], ["z", "q3"]]) s = enqueue(s, id, uid);
  s = playQueued(s, "q2");
  assert.equal(currentTrackId(s), "y");
  assert.deepEqual(s.queue.map((q) => q.uid), ["q3"]);
});

test("skipTo jumps ahead in the context and keeps the queue", () => {
  let s = enqueue(start(0), "x", "q1");
  s = skipTo(s, 2);
  assert.equal(currentTrackId(s), "d");
  assert.equal(s.queue.length, 1);
});
