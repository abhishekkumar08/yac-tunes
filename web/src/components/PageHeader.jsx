import { CheckCircle2, MoreHorizontal, PlusCircle, Shuffle } from "lucide-react";
import { IconButton, Menu, cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { PlayButton, ToggleIconButton } from "@/components/Controls.jsx";

/**
 * The tall gradient header of album, artist and playlist pages. `color` is the
 * cover's base hue; the gradient fades it into the panel below.
 */
export function PageHeader({ color, cover, label, title, meta, round }) {
  const size = title.length > 28 ? "text-[clamp(2rem,4vw,3.5rem)]" : "text-[clamp(2.5rem,6vw,6rem)]";
  return (
    <header className="relative">
      <div className="absolute inset-0 -z-0" style={{ background: `linear-gradient(${color}, rgb(var(--mw-surface)) 140%)` }} aria-hidden="true" />
      <div className="relative flex flex-col gap-6 px-6 pb-6 pt-16 sm:flex-row sm:items-end">
        <div className={cn("w-48 shrink-0 shadow-[0_8px_24px_rgb(0_0_0/0.5)] lg:w-56", round && "rounded-full")}>{cover}</div>
        <div className="min-w-0">
          {label && <div className="flex items-center gap-2 text-label text-fg">{label}</div>}
          <h1 className={cn("my-2 break-words font-black leading-[1.05] tracking-tight text-fg", size)}>{title}</h1>
          {meta && <div className="flex flex-wrap items-center gap-x-1 text-label text-fg">{meta}</div>}
        </div>
      </div>
    </header>
  );
}

/** Big Play, Shuffle and any extra buttons, on a faint wash of the page colour. */
export function PlayActions({ context, tracks, color, children }) {
  const player = usePlayer();
  const shuffleOn = player.state.shuffle;
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-56" style={{ background: `linear-gradient(${color}, transparent)`, opacity: 0.35 }} aria-hidden="true" />
      <div className="relative flex items-center gap-5 px-6 py-5">
        {tracks.length > 0 && (
          <>
            <PlayButton
              name={context.name}
              playing={player.isPlayingContext(context.type, context.id)}
              onClick={() => player.playOrToggle(context, tracks)}
            />
            <ToggleIconButton
              size="lg"
              icon={Shuffle}
              label={shuffleOn ? COPY.PLAYER.SHUFFLE_OFF : COPY.PLAYER.SHUFFLE_ON}
              on={shuffleOn}
              onClick={player.toggleShuffle}
            />
          </>
        )}
        {children}
      </div>
    </div>
  );
}

export function SaveButton({ saved, onClick }) {
  return <ToggleIconButton size="lg" icon={saved ? CheckCircle2 : PlusCircle} label={saved ? COPY.PAGE.REMOVE : COPY.PAGE.SAVE} on={saved} onClick={onClick} />;
}

export function MoreButton({ name, items }) {
  return (
    <Menu
      items={items}
      label={COPY.PAGE.MORE(name)}
      trigger={<IconButton icon={MoreHorizontal} label={COPY.PAGE.MORE(name)} variant="ghost" className="h-10 w-10 text-fg-muted hover:text-fg [&_svg]:h-7 [&_svg]:w-7" />}
    />
  );
}
