import { mulberry32 } from "@shared/rng.js";

// Generated cover art: a seed picks two hues and one of a few abstract patterns.

export function coverPalette(seed) {
  const r = mulberry32(seed);
  const h1 = Math.floor(r() * 360);
  const h2 = (h1 + 40 + Math.floor(r() * 140)) % 360;
  const pattern = Math.floor(r() * 5);
  return {
    bg: `hsl(${h1} 55% 32%)`,
    bg2: `hsl(${h2} 60% 22%)`,
    ink: `hsl(${h2} 85% 68%)`,
    ink2: `hsl(${h1} 90% 78%)`,
    pattern,
    dominantHue: pattern === 2 ? h2 : h1,
    r,
  };
}

/** The header gradient colour for a page: the hue that fills most of the cover, darkened. */
export const coverColor = (seed) => `hsl(${coverPalette(seed).dominantHue} 45% 30%)`;

export function coverShapes(seed) {
  const { bg, bg2, ink, ink2, pattern, r } = coverPalette(seed);
  const shapes = [];
  if (pattern === 0) {
    for (let i = 0; i < 6; i++) {
      shapes.push({ kind: "circle", cx: 15 + r() * 70, cy: 15 + r() * 70, r: 6 + r() * 22, fill: i % 2 ? ink : ink2, opacity: 0.55 + r() * 0.4 });
    }
  } else if (pattern === 1) {
    const tilt = -30 + r() * 60;
    for (let i = 0; i < 7; i++) shapes.push({ kind: "rect", x: -20, y: i * 18 - 10, w: 140, h: 7 + r() * 6, fill: i % 2 ? ink : ink2, opacity: 0.8, rotate: tilt });
  } else if (pattern === 2) {
    for (let i = 5; i > 0; i--) shapes.push({ kind: "circle", cx: 50, cy: 50 + (r() - 0.5) * 20, r: i * 11, fill: i % 2 ? ink : bg2, opacity: 0.9 });
  } else if (pattern === 3) {
    for (let x = 0; x < 4; x++)
      for (let y = 0; y < 4; y++) if (r() > 0.45) shapes.push({ kind: "rect", x: x * 25 + 3, y: y * 25 + 3, w: 19, h: 19, fill: (x + y) % 2 ? ink : ink2, opacity: 0.85, radius: r() * 10 });
  } else {
    for (let i = 0; i < 4; i++) {
      const y = 25 + i * 16;
      shapes.push({ kind: "wave", d: `M -5 ${y} Q 25 ${y - 18 - r() * 10} 50 ${y} T 105 ${y}`, stroke: i % 2 ? ink : ink2, width: 4 + r() * 4 });
    }
  }
  return { bg, bg2, shapes };
}
