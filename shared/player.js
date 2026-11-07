/*
 * Pure player engine. Every function takes a state and returns a new one.
 *
 *   context.trackIds  [a, b, c, d, e]        the album / playlist being played
 *   order             [2, 0, 4, 1, 3]        play order as context indexes (identity unless shuffled)
 *   pos               index into order of the current (or last played) context track
 *   queue             [{uid, trackId}]       "Add to queue" tracks; always play before order[pos + 1]
 *   current           {trackId, uid?, fromQueue}
 *
 * Positions, never track ids, are tracked so a playlist may hold the same song twice.
 */
import { moveItem } from "./order.js";

const RESTART_AFTER_SEC = 3;

export const emptyPlayer = () => ({
  context: null,
  order: [],
  pos: 0,
  queue: [],
  current: null,
  shuffle: false,
  repeat: "off",
  stopped: true,
});

export const currentTrackId = (s) => s.current?.trackId ?? null;

const identity = (n) => Array.from({ length: n }, (_, i) => i);

function shuffled(items, rng) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function orderFrom(n, firstIndex, shuffle, rng) {
  if (!shuffle) return { order: identity(n), pos: firstIndex };
  const rest = identity(n).filter((i) => i !== firstIndex);
  return { order: [firstIndex, ...shuffled(rest, rng)], pos: 0 };
}

const atPos = (s, pos, stopped = false) => ({
  ...s,
  pos,
  stopped,
  current: { trackId: s.context.trackIds[s.order[pos]], fromQueue: false },
});

export function playContext(state, context, startIndex, rng = Math.random) {
  const { order, pos } = orderFrom(context.trackIds.length, startIndex, state.shuffle, rng);
  return atPos({ ...state, context, order }, pos);
}

export function next(state, { auto = false } = {}) {
  if (auto && state.repeat === "one" && state.current) return { ...state, stopped: false };
  if (state.queue.length) {
    const [head, ...rest] = state.queue;
    return { ...state, queue: rest, stopped: false, current: { trackId: head.trackId, uid: head.uid, fromQueue: true } };
  }
  if (!state.context) return { ...state, stopped: true };
  if (state.pos + 1 < state.order.length) return atPos(state, state.pos + 1);
  return atPos(state, 0, state.repeat === "off");
}

export function previous(state, positionSec) {
  const restart = { state: { ...state, stopped: false }, restart: true };
  if (positionSec > RESTART_AFTER_SEC || !state.context) return restart;
  if (state.current?.fromQueue) return { state: atPos(state, state.pos), restart: false };
  if (state.pos > 0) return { state: atPos(state, state.pos - 1), restart: false };
  if (state.repeat !== "off") return { state: atPos(state, state.order.length - 1), restart: false };
  return restart;
}

export function setShuffle(state, on, rng = Math.random) {
  if (!state.context) return { ...state, shuffle: on };
  const { order, pos } = orderFrom(state.context.trackIds.length, state.order[state.pos], on, rng);
  return { ...state, shuffle: on, order, pos };
}

const REPEAT_NEXT = { off: "all", all: "one", one: "off" };
export const cycleRepeat = (state) => ({ ...state, repeat: REPEAT_NEXT[state.repeat] });

export const enqueue = (state, trackId, uid) => ({ ...state, queue: [...state.queue, { uid, trackId }] });

export const removeQueued = (state, uid) => ({ ...state, queue: state.queue.filter((q) => q.uid !== uid) });

export const moveQueued = (state, from, to) => ({ ...state, queue: moveItem(state.queue, from, to) });

export function playQueued(state, uid) {
  const i = state.queue.findIndex((q) => q.uid === uid);
  if (i < 0) return state;
  return next({ ...state, queue: state.queue.slice(i) });
}

export const skipTo = (state, contextOffset) => atPos(state, state.pos + 1 + contextOffset);

export function upNext(state) {
  const context = state.context ? state.order.slice(state.pos + 1).map((i) => state.context.trackIds[i]) : [];
  return { queue: state.queue, context };
}
