import { test } from "node:test";
import assert from "node:assert/strict";
import { moveItem, isPermutation } from "../shared/order.js";
import { formatDuration, formatTotal, formatCount } from "../shared/format.js";

test("moveItem moves an item down", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
});

test("moveItem moves an item up", () => {
  assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 1), ["a", "d", "b", "c"]);
});

test("moveItem to the same index returns an equal copy", () => {
  const src = ["a", "b"];
  const out = moveItem(src, 1, 1);
  assert.deepEqual(out, src);
  assert.notEqual(out, src);
});

test("moveItem swaps first and last", () => {
  assert.deepEqual(moveItem(["a", "b", "c"], 0, 2), ["b", "c", "a"]);
  assert.deepEqual(moveItem(["a", "b", "c"], 2, 0), ["c", "a", "b"]);
});

test("moveItem rejects out-of-range indexes", () => {
  assert.throws(() => moveItem(["a"], 0, 1), RangeError);
  assert.throws(() => moveItem(["a"], -1, 0), RangeError);
});

test("isPermutation accepts a reordering", () => {
  assert.equal(isPermutation([1, 2, 3], [3, 1, 2]), true);
});

test("isPermutation rejects missing, extra or duplicated ids", () => {
  assert.equal(isPermutation([1, 2, 3], [1, 2]), false);
  assert.equal(isPermutation([1, 2], [1, 2, 3]), false);
  assert.equal(isPermutation([1, 2, 3], [1, 1, 3]), false);
});

test("formatDuration shows m:ss", () => {
  assert.equal(formatDuration(0), "0:00");
  assert.equal(formatDuration(59), "0:59");
  assert.equal(formatDuration(187.9), "3:07");
  assert.equal(formatDuration(3600), "60:00");
});

test("formatTotal reads like the reference player", () => {
  assert.equal(formatTotal(252), "4 min 12 sec");
  assert.equal(formatTotal(59), "59 sec");
  assert.equal(formatTotal(3780), "1 hr 3 min");
  assert.equal(formatTotal(3600), "1 hr");
});

test("formatCount adds thousands separators", () => {
  assert.equal(formatCount(1234567), "1,234,567");
  assert.equal(formatCount(0), "0");
});
