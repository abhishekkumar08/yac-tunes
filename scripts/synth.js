/*
 * Deterministic instrumental generator. Same spec in, same samples out.
 *
 *   bar:   0      1      2 ............................ n-2    n-1
 *          intro (pad+bass)  | drums + melody (2-bar motifs, A A' B A'') | outro
 *
 * Everything (key, progression, motif rhythm, noise) comes from one seeded RNG.
 */

import { mulberry32 } from "../shared/rng.js";

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  pentatonic: [0, 3, 5, 7, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};
const PROGRESSIONS = [
  [0, 4, 5, 3],
  [0, 5, 3, 4],
  [5, 3, 0, 4],
  [0, 3, 4, 3],
  [0, 5, 1, 4],
];
const DRUMS = {
  four: { kick: [0, 1, 2, 3], snare: [1, 3], hat: [0.5, 1.5, 2.5, 3.5] },
  back: { kick: [0, 2.5], snare: [1, 3], hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5] },
  brush: { kick: [0], snare: [], hat: [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66] },
  march: { kick: [0, 2], snare: [3, 3.5], hat: [] },
  none: { kick: [], snare: [], hat: [] },
};


const frac = (x) => x - Math.floor(x);
const OSC = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  triangle: (p) => 1 - 4 * Math.abs(frac(p) - 0.5),
  square: (p) => (frac(p) < 0.5 ? 0.6 : -0.6),
  saw: (p) => 0.7 * (2 * frac(p) - 1),
};

export function renderTrack({ seed, bpm, scale, wave, drums, seconds, rate = 22050 }) {
  const rng = mulberry32(seed);
  const n = Math.round(seconds * rate);
  const out = new Float32Array(n);
  const steps = SCALES[scale];
  const root = 45 + Math.floor(rng() * 12);
  const prog = PROGRESSIONS[Math.floor(rng() * PROGRESSIONS.length)];
  const beat = 60 / bpm;
  const bar = 4 * beat;
  const bars = Math.max(1, Math.floor(seconds / bar));
  const pattern = DRUMS[drums];

  const freq = (degree, octave) => {
    const d = ((degree % steps.length) + steps.length) % steps.length;
    const shift = Math.floor(degree / steps.length);
    return 440 * 2 ** ((root + 12 * (octave + shift) + steps[d] - 69) / 12);
  };

  const note = (start, dur, f, amp, shape, { attack = 0.01, release = 0.08, cutoff = 3000 } = {}) => {
    const s0 = Math.floor(start * rate);
    const len = Math.floor((dur + release) * rate);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / rate);
    let y = 0;
    for (let i = 0; i < len && s0 + i < n; i++) {
      const t = i / rate;
      const env = t < attack ? t / attack : t < dur ? 1 - 0.3 * ((t - attack) / Math.max(dur - attack, 1e-3)) : 0.7 * (1 - (t - dur) / release);
      y += a * (OSC[shape](f * t) - y);
      out[s0 + i] += amp * Math.max(env, 0) * y;
    }
  };

  const hit = (start, kind) => {
    const s0 = Math.floor(start * rate);
    const len = Math.floor((kind === "kick" ? 0.25 : kind === "snare" ? 0.18 : 0.05) * rate);
    let prev = 0;
    for (let i = 0; i < len && s0 + i < n; i++) {
      const t = i / rate;
      let v;
      if (kind === "kick") v = 0.9 * Math.sin(2 * Math.PI * (45 * t + (75 / 30) * (1 - Math.exp(-30 * t)))) * Math.exp(-14 * t);
      else {
        const noise = rng() * 2 - 1;
        const high = noise - prev;
        prev = noise;
        v = kind === "snare" ? (0.35 * noise + 0.2 * Math.sin(2 * Math.PI * 180 * t)) * Math.exp(-22 * t) : 0.18 * high * Math.exp(-70 * t);
      }
      out[s0 + i] += v;
    }
  };

  const motif = (variant) => {
    const r = mulberry32(seed * 31 + variant);
    const events = [];
    let degree = 2 + Math.floor(r() * 3);
    for (let step = 0; step < 16; step++) {
      if (r() < 0.55) {
        degree = Math.max(0, Math.min(11, degree + Math.floor(r() * 5) - 2));
        const len = r() < 0.3 ? 2 : 1;
        events.push({ step, degree, len });
        step += len - 1;
      }
    }
    return events.length ? events : [{ step: 0, degree: 2, len: 4 }];
  };
  const motifs = [motif(0), motif(1)];
  const melodyShape = wave === "sine" ? "triangle" : wave;

  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const chord = prog[b % prog.length];
    for (const d of [chord, chord + 2, chord + 4]) note(t0, bar, freq(d, 1), 0.06, "sine", { attack: 0.3, release: 0.4, cutoff: 1800 });
    const bassBeats = drums === "four" ? [0, 1, 2, 3] : [0, 2];
    for (const bb of bassBeats) note(t0 + bb * beat, beat * 0.9, freq(chord, 0), 0.2, "triangle", { cutoff: 900 });

    const inBody = b >= 2 && b < bars - 1;
    if (inBody || bars <= 3) {
      const phrase = Math.floor(b / 2);
      const m = motifs[phrase % 4 === 2 ? 1 : 0];
      const half = b % 2;
      const lift = phrase % 4 === 3 ? 1 : 0;
      for (const e of m) {
        if (Math.floor(e.step / 8) !== half) continue;
        const st = (e.step % 8) * (beat / 2);
        note(t0 + st, e.len * (beat / 2) * 0.95, freq(chord + e.degree + lift, 2), 0.13, melodyShape, { cutoff: 2600 });
      }
      for (const k of ["kick", "snare", "hat"]) for (const at of pattern[k]) hit(t0 + at * beat, k);
    }
  }

  const fadeIn = Math.min(1.5, seconds / 4) * rate;
  const fadeOut = Math.min(3, seconds / 4) * rate;
  let peak = 0;
  for (let i = 0; i < n; i++) {
    if (i < fadeIn) out[i] *= i / fadeIn;
    if (i > n - fadeOut) out[i] *= (n - i) / fadeOut;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  const gain = peak > 0 ? (0.85 * 32767) / peak : 0;
  return Int16Array.from(out, (v) => Math.round(v * gain));
}

export function wav(pcm, rate) {
  const data = pcm.length * 2;
  const buf = Buffer.alloc(44 + data);
  buf.write("RIFF", 0, "ascii");
  buf.writeUInt32LE(36 + data, 4);
  buf.write("WAVE", 8, "ascii");
  buf.write("fmt ", 12, "ascii");
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36, "ascii");
  buf.writeUInt32LE(data, 40);
  Buffer.from(pcm.buffer, pcm.byteOffset, data).copy(buf, 44);
  return buf;
}
