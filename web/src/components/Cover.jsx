import { memo, useId } from "react";
import { Heart, Music } from "lucide-react";
import { cn } from "@kasumi/ui";
import { coverShapes } from "@/lib/cover.js";

function Art({ seed }) {
  const id = useId();
  const { bg, bg2, shapes } = coverShapes(seed);
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}g)`} />
      {shapes.map((s, i) =>
        s.kind === "circle" ? (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} />
        ) : s.kind === "rect" ? (
          <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.radius ?? 0} fill={s.fill} opacity={s.opacity} transform={s.rotate ? `rotate(${s.rotate} 50 50)` : undefined} />
        ) : (
          <path key={i} d={s.d} stroke={s.stroke} strokeWidth={s.width} fill="none" strokeLinecap="round" />
        ),
      )}
    </svg>
  );
}

/**
 * A generated cover. `liked` draws the Liked Songs heart, `empty` a note placeholder,
 * `mosaic` a 2×2 of album covers, `round` an artist portrait.
 */
export const Cover = memo(function Cover({ seed = 1, mosaic, liked, empty, round, className }) {
  const shape = cn("relative aspect-square shrink-0 overflow-hidden bg-surface-muted", round ? "rounded-full" : "rounded", className);
  if (liked) {
    return (
      <div className={cn(shape, "flex items-center justify-center bg-gradient-to-br from-[#4f2ee8] via-[#7b6cf0] to-[#c4efd9]")} aria-hidden="true">
        <Heart className="h-[38%] w-[38%] fill-white text-white" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className={cn(shape, "flex items-center justify-center")} aria-hidden="true">
        <Music className="h-[36%] w-[36%] text-fg-subtle" />
      </div>
    );
  }
  if (mosaic?.length >= 4) {
    return (
      <div className={cn(shape, "grid grid-cols-2 grid-rows-2")} aria-hidden="true">
        {mosaic.slice(0, 4).map((s, i) => (
          <Art key={i} seed={s} />
        ))}
      </div>
    );
  }
  return (
    <div className={shape} aria-hidden="true">
      <Art seed={seed} />
    </div>
  );
});
