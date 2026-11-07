export function moveItem(arr, from, to) {
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    throw new RangeError(`move ${from} → ${to} outside 0..${arr.length - 1}`);
  }
  const out = arr.slice();
  const [item] = out.splice(from, 1);
  out.splice(to, 0, item);
  return out;
}

export function isPermutation(current, proposed) {
  if (current.length !== proposed.length) return false;
  const counts = new Map();
  for (const id of current) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const id of proposed) {
    const n = counts.get(id);
    if (!n) return false;
    counts.set(id, n - 1);
  }
  return true;
}
