import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTrack, wav } from "../scripts/synth.js";

const spec = { seed: 42, bpm: 110, scale: "major", wave: "saw", drums: "four", seconds: 4, rate: 8000 };

test("the same spec renders identical audio", () => {
  assert.deepEqual(renderTrack(spec), renderTrack(spec));
});

test("a different seed renders different audio", () => {
  assert.notDeepEqual(renderTrack(spec), renderTrack({ ...spec, seed: 43 }));
});

test("length matches seconds times sample rate", () => {
  assert.equal(renderTrack(spec).length, 4 * 8000);
});

test("audio is audible and never clips", () => {
  for (const wave of ["sine", "triangle", "square", "saw"]) {
    const pcm = renderTrack({ ...spec, wave, drums: wave === "sine" ? "none" : "four" });
    let peak = 0;
    for (const v of pcm) peak = Math.max(peak, Math.abs(v));
    assert.ok(peak > 2000, `${wave} peak ${peak}`);
    assert.ok(peak <= 32767, `${wave} peak ${peak}`);
  }
});

test("wav writes a 16-bit mono PCM header", () => {
  const pcm = new Int16Array([0, 1000, -1000]);
  const buf = wav(pcm, 8000);
  assert.equal(buf.toString("ascii", 0, 4), "RIFF");
  assert.equal(buf.toString("ascii", 8, 12), "WAVE");
  assert.equal(buf.readUInt16LE(22), 1);
  assert.equal(buf.readUInt32LE(24), 8000);
  assert.equal(buf.readUInt16LE(34), 16);
  assert.equal(buf.readUInt32LE(40), 6);
  assert.equal(buf.readInt16LE(46), 1000);
  assert.equal(buf.length, 44 + 6);
});
