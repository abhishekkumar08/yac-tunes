/*
 * The one <audio> element of the app, driven by the pure engine in shared/player.js.
 *
 *   action ──► engine(state) ──► commit(next state) ──► load(): src / currentTime / play|pause
 *                                      │
 *   <audio> events: timeupdate ─► position, 10 s ─► POST /api/plays
 *                   ended ─► next({auto}) ─► commit      error ─► notify + skip (once per track)
 *
 * State, volume and position are saved per user in localStorage and restored paused.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNotifications } from "@kasumi/ui";
import * as engine from "@shared/player.js";
import { artistNames } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { api, errorText } from "@/lib/api.js";
import { readJSON, writeJSON } from "@/lib/storage.js";

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);
// Position changes ~4×/s while playing; only the seek bar reads it, so it lives apart.
const PositionContext = createContext(0);
export const usePosition = () => useContext(PositionContext);

const LOG_AFTER_SEC = 10;
const SAVE_EVERY_MS = 5000;
const storageKey = (userId) => `yt-player-${userId}`;

// Space toggles playback unless the focused element already uses the key.
const ownsSpaceKey = (el) => el?.closest?.("input, textarea, select, [contenteditable='true'], button, a, [role='slider']");

export function PlayerProvider({ userId, children }) {
  const audio = useMemo(() => new Audio(), []);
  const [state, setState] = useState(engine.emptyPlayer);
  const stateRef = useRef(state);
  const tracks = useRef(new Map());
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const logged = useRef(false);
  const failedSkips = useRef(0);
  const lastSave = useRef(0);
  const { notify } = useNotifications();

  const remember = useCallback((list) => list.forEach((t) => tracks.current.set(t.id, t)), []);
  const getTrack = useCallback((id) => tracks.current.get(id) ?? null, []);

  const startPlayback = useCallback(() => {
    audio.play().catch((err) => {
      if (err.name !== "AbortError") setPlaying(false);
    });
  }, [audio]);

  const load = useCallback(
    (s, { autoplay, at = 0 }) => {
      const t = tracks.current.get(engine.currentTrackId(s));
      logged.current = false;
      if (!t) {
        audio.pause();
        audio.removeAttribute("src");
        return;
      }
      if (audio.getAttribute("src") !== t.audio) audio.src = t.audio;
      audio.currentTime = at;
      setPosition(at);
      if (autoplay && !s.stopped) startPlayback();
      else audio.pause();
    },
    [audio, startPlayback],
  );

  const commit = useCallback(
    (s, loadOpts) => {
      stateRef.current = s;
      setState(s);
      if (loadOpts) load(s, loadOpts);
    },
    [load],
  );

  const advance = useCallback(
    (opts) => {
      const n = engine.next(stateRef.current, opts);
      commit(n, { autoplay: !n.stopped });
    },
    [commit],
  );

  const actions = useMemo(
    () => ({
      playContext(context, list, index = 0) {
        remember(list);
        failedSkips.current = 0;
        const ctx = { type: context.type, id: context.id, name: context.name, trackIds: list.map((t) => t.id) };
        commit(engine.playContext(stateRef.current, ctx, index), { autoplay: true });
      },
      togglePlay() {
        const s = stateRef.current;
        if (!s.current) {
          if (s.queue.length) advance();
          return;
        }
        if (audio.paused) {
          if (s.stopped) commit({ ...s, stopped: false });
          startPlayback();
        } else audio.pause();
      },
      next: () => advance(),
      previous() {
        const { state: s, restart } = engine.previous(stateRef.current, audio.currentTime);
        if (restart) {
          audio.currentTime = 0;
          setPosition(0);
          commit(s);
        } else commit(s, { autoplay: true });
      },
      seek(sec) {
        audio.currentTime = sec;
        setPosition(sec);
      },
      setVolume(v) {
        setVolume(v);
        if (v > 0) setMuted(false);
      },
      toggleMute: () => setMuted((m) => !m),
      toggleShuffle: () => commit(engine.setShuffle(stateRef.current, !stateRef.current.shuffle)),
      cycleRepeat: () => commit(engine.cycleRepeat(stateRef.current)),
      enqueue(trackOrList) {
        const list = Array.isArray(trackOrList) ? trackOrList : [trackOrList];
        remember(list);
        commit(list.reduce((s, t) => engine.enqueue(s, t.id, crypto.randomUUID()), stateRef.current));
        notify(COPY.TRACK.QUEUED, "success");
      },
      removeQueued: (uid) => commit(engine.removeQueued(stateRef.current, uid)),
      moveQueued: (from, to) => commit(engine.moveQueued(stateRef.current, from, to)),
      clearQueue: () => commit({ ...stateRef.current, queue: [] }),
      playQueued: (uid) => commit(engine.playQueued(stateRef.current, uid), { autoplay: true }),
      skipTo: (offset) => commit(engine.skipTo(stateRef.current, offset), { autoplay: true }),
    }),
    [advance, audio, commit, notify, remember, startPlayback],
  );

  useEffect(() => {
    audio.volume = volume;
    audio.muted = muted;
  }, [audio, volume, muted]);

  useEffect(() => {
    const save = () => {
      const s = stateRef.current;
      writeJSON(
        storageKey(userId),
        s.current || s.queue.length ? { state: s, position: audio.currentTime || 0, volume: audio.volume, muted: audio.muted } : undefined,
      );
    };
    const onTime = () => {
      setPosition(audio.currentTime);
      const s = stateRef.current;
      if (!logged.current && audio.currentTime >= LOG_AFTER_SEC && s.current) {
        logged.current = true;
        const fromQueue = s.current.fromQueue || !s.context;
        api
          .post("/api/plays", {
            trackId: s.current.trackId,
            contextType: fromQueue ? "queue" : s.context.type,
            contextId: fromQueue ? null : s.context.id,
          })
          .catch((err) => notify(errorText(err), "error"));
      }
      if (Date.now() - lastSave.current > SAVE_EVERY_MS) {
        lastSave.current = Date.now();
        save();
      }
    };
    const onEnded = () => advance({ auto: true });
    const onError = () => {
      if (!audio.getAttribute("src")) return;
      const s = stateRef.current;
      const limit = s.queue.length + (s.context?.trackIds.length ?? 0);
      failedSkips.current += 1;
      notify(COPY.PLAYER.CANT_PLAY, "error");
      if (failedSkips.current < limit) advance();
      else {
        failedSkips.current = 0;
        commit({ ...s, stopped: true });
      }
    };
    const handlers = {
      timeupdate: onTime,
      durationchange: () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0),
      play: () => setPlaying(true),
      playing: () => {
        failedSkips.current = 0;
      },
      pause: () => {
        setPlaying(false);
        save();
      },
      ended: onEnded,
      error: onError,
    };
    for (const [ev, fn] of Object.entries(handlers)) audio.addEventListener(ev, fn);
    window.addEventListener("pagehide", save);
    return () => {
      for (const [ev, fn] of Object.entries(handlers)) audio.removeEventListener(ev, fn);
      window.removeEventListener("pagehide", save);
    };
  }, [audio, advance, commit, notify, userId]);

  useEffect(() => {
    const saved = readJSON(storageKey(userId), null);
    if (!saved?.state?.current) return;
    const s = saved.state;
    const ids = [...new Set([...(s.context?.trackIds ?? []), ...s.queue.map((q) => q.trackId), s.current.trackId])];
    api
      .get(`/api/tracks?ids=${ids.map(encodeURIComponent).join(",")}`)
      .then(({ tracks: found }) => {
        if (found.length !== ids.length) return writeJSON(storageKey(userId), undefined);
        remember(found);
        setVolume(saved.volume ?? 0.8);
        setMuted(!!saved.muted);
        commit({ ...s, stopped: true }, { autoplay: false, at: saved.position ?? 0 });
      })
      .catch((err) => notify(errorText(err), "error"));
    return () => {
      audio.pause();
      audio.removeAttribute("src");
    };
  }, [audio, commit, notify, remember, userId]);

  const track = state.current ? getTrack(state.current.trackId) : null;

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = track
      ? new window.MediaMetadata({ title: track.title, artist: artistNames(track), album: track.albumTitle })
      : null;
  }, [track]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const set = (name, fn) => navigator.mediaSession.setActionHandler(name, fn);
    set("play", actions.togglePlay);
    set("pause", actions.togglePlay);
    set("nexttrack", actions.next);
    set("previoustrack", actions.previous);
    set("seekto", (d) => actions.seek(d.seekTime));
    const onKey = (e) => {
      if (e.code !== "Space" || e.repeat || ownsSpaceKey(e.target)) return;
      e.preventDefault();
      actions.togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [actions]);

  const contextIndex = state.current && !state.current.fromQueue ? state.order[state.pos] : -1;
  const value = useMemo(() => {
    const isContext = (type, id) => state.context?.type === type && state.context?.id === id;
    return {
      ...actions,
      state,
      upNext: engine.upNext(state),
      track,
      getTrack,
      playing,
      duration: duration || track?.durationSec || 0,
      volume,
      muted,
      isContext,
      isPlayingContext: (type, id) => playing && isContext(type, id),
      isCurrentRow: (type, id, index) => isContext(type, id) && contextIndex === index,
      playOrToggle(context, list, index = 0) {
        if (isContext(context.type, context.id) && state.current) actions.togglePlay();
        else if (list.length) actions.playContext(context, list, index);
      },
    };
  }, [actions, state, track, getTrack, playing, duration, volume, muted, contextIndex]);

  return (
    <PlayerContext.Provider value={value}>
      <PositionContext.Provider value={position}>{children}</PositionContext.Provider>
    </PlayerContext.Provider>
  );
}
