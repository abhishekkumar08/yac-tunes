import { Heart, Pause, Play } from "lucide-react";
import { IconButton, Tooltip, cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useLibrary } from "@/lib/library.jsx";

const PlayIcon = (p) => <Play {...p} fill="currentColor" strokeWidth={0} />;
const PauseIcon = (p) => <Pause {...p} fill="currentColor" strokeWidth={0} />;
export { PlayIcon, PauseIcon };

/** The big round accent play button of page headers and cards. */
export function PlayButton({ playing, onClick, name, size = "lg", className }) {
  return (
    <IconButton
      icon={playing ? PauseIcon : PlayIcon}
      label={playing ? COPY.PAGE.PAUSE(name) : COPY.PAGE.PLAY(name)}
      variant="primary"
      onClick={onClick}
      className={cn(
        "rounded-full shadow-raised transition-transform hover:scale-105 [&_svg]:h-[45%] [&_svg]:w-[45%]",
        size === "lg" ? "h-14 w-14" : "h-12 w-12",
        className,
      )}
    />
  );
}

const FilledHeart = (p) => <Heart {...p} fill="currentColor" />;

export function HeartButton({ trackId, className, alwaysVisible }) {
  const { liked, toggleLike } = useLibrary();
  const on = liked.has(trackId);
  return (
    <IconButton
      icon={on ? FilledHeart : Heart}
      label={on ? COPY.TRACK.UNLIKE : COPY.TRACK.LIKE}
      variant="ghost"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        toggleLike(trackId);
      }}
      className={cn(on ? "text-accent" : "text-fg-muted", !on && !alwaysVisible && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100", className)}
    />
  );
}

export function Equalizer({ className }) {
  return (
    <span className={cn("yt-eq inline-flex h-3.5 items-end gap-[2px]", className)} aria-hidden="true">
      <span className="h-full w-[3px] rounded-sm bg-accent" />
      <span className="h-full w-[3px] rounded-sm bg-accent" />
      <span className="h-full w-[3px] rounded-sm bg-accent" />
    </span>
  );
}

/**
 * An icon toggle that turns accent when on (shuffle, repeat, save, panels). `sm` sits in the
 * player bar with a dot under it when on; `lg` is the 40px page-action size.
 */
export function ToggleIconButton({ icon, label, on, onClick, size = "sm" }) {
  return (
    <Tooltip content={label}>
      <IconButton
        icon={icon}
        label={label}
        variant="ghost"
        size={size === "sm" ? "sm" : undefined}
        pressed={on}
        onClick={onClick}
        className={cn(
          "relative bg-transparent hover:bg-transparent",
          on ? "text-accent hover:text-accent-hover" : "text-fg-muted hover:text-fg",
          size === "lg" && "h-10 w-10 [&_svg]:h-7 [&_svg]:w-7",
          on && size === "sm" && "after:absolute after:bottom-0 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-accent",
        )}
      />
    </Tooltip>
  );
}
