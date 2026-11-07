import { useState } from "react";
import { Link } from "react-router-dom";
import { ListMusic, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, PlaySquare, Volume1, Volume2, VolumeX } from "lucide-react";
import { IconButton, Slider, Tooltip } from "@kasumi/ui";
import { formatDuration } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { usePlayer, usePosition } from "@/lib/player/PlayerProvider.jsx";
import { useLayout } from "@/lib/layout.jsx";
import { Cover } from "@/components/Cover.jsx";
import { HeartButton, PauseIcon, PlayIcon, ToggleIconButton } from "@/components/Controls.jsx";
import { ArtistLinks } from "@/components/TrackList.jsx";

const SkipBackFilled = (p) => <SkipBack {...p} fill="currentColor" />;
const SkipForwardFilled = (p) => <SkipForward {...p} fill="currentColor" />;

function Seek() {
  const p = usePlayer();
  const position = usePosition();
  const [drag, setDrag] = useState(null);
  const shown = drag ?? position;
  return (
    <div className="flex w-full items-center gap-2 text-caption tabular-nums text-fg-muted">
      <span className="w-10 text-right">{formatDuration(shown)}</span>
      <Slider
        variant="media"
        label={COPY.PLAYER.PROGRESS}
        min={0}
        max={Math.max(1, Math.floor(p.duration))}
        value={Math.floor(shown)}
        valueText={COPY.PLAYER.PROGRESS_TEXT(formatDuration(shown), formatDuration(p.duration))}
        onChange={setDrag}
        onCommit={(v) => {
          p.seek(v);
          setDrag(null);
        }}
        disabled={!p.track}
      />
      <span className="w-10">{formatDuration(p.duration)}</span>
    </div>
  );
}

export function PlayerBar() {
  const p = usePlayer();
  const layout = useLayout();
  const t = p.track;
  const repeatIcon = p.state.repeat === "one" ? Repeat1 : Repeat;
  const volIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;
  return (
    <section aria-label={COPY.PANEL.NOW_PLAYING} className="grid h-[72px] grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-2 px-2">
      <div className="flex min-w-0 items-center gap-3">
        {t ? (
          <>
            <Cover seed={t.albumSeed} className="w-14" />
            <div className="min-w-0">
              <Link to={`/album/${t.albumId}`} className="block truncate text-body text-fg hover:underline">
                {t.title}
              </Link>
              <ArtistLinks artists={t.artists} className="block text-caption text-fg-muted" />
            </div>
            <HeartButton trackId={t.id} alwaysVisible className="ml-1 shrink-0" />
          </>
        ) : (
          <p className="truncate pl-2 text-body text-fg-muted">{COPY.PLAYER.NOTHING}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <ToggleIconButton icon={Shuffle} label={p.state.shuffle ? COPY.PLAYER.SHUFFLE_OFF : COPY.PLAYER.SHUFFLE_ON} on={p.state.shuffle} onClick={p.toggleShuffle} />
          <Tooltip content={COPY.PLAYER.PREVIOUS}>
            <IconButton icon={SkipBackFilled} label={COPY.PLAYER.PREVIOUS} variant="ghost" size="sm" onClick={p.previous} disabled={!t} className="text-fg-muted hover:text-fg" />
          </Tooltip>
          <Tooltip content={p.playing ? COPY.PLAYER.PAUSE : COPY.PLAYER.PLAY}>
            <IconButton
              icon={p.playing ? PauseIcon : PlayIcon}
              label={p.playing ? COPY.PLAYER.PAUSE : COPY.PLAYER.PLAY}
              onClick={p.togglePlay}
              disabled={!t && !p.state.queue.length}
              className="h-9 w-9 rounded-full bg-fg text-canvas hover:scale-105 hover:bg-fg [&_svg]:h-4 [&_svg]:w-4"
            />
          </Tooltip>
          <Tooltip content={COPY.PLAYER.NEXT}>
            <IconButton icon={SkipForwardFilled} label={COPY.PLAYER.NEXT} variant="ghost" size="sm" onClick={p.next} disabled={!t} className="text-fg-muted hover:text-fg" />
          </Tooltip>
          <ToggleIconButton icon={repeatIcon} label={COPY.PLAYER.REPEAT[p.state.repeat]} on={p.state.repeat !== "off"} onClick={p.cycleRepeat} />
        </div>
        <Seek />
      </div>

      <div className="flex items-center justify-end gap-1">
        <ToggleIconButton icon={PlaySquare} label={COPY.PLAYER.NOW_PLAYING_VIEW} on={layout.panel === "nowPlaying"} onClick={() => layout.togglePanel("nowPlaying")} />
        <ToggleIconButton icon={ListMusic} label={COPY.PLAYER.QUEUE} on={layout.panel === "queue"} onClick={() => layout.togglePanel("queue")} />
        <Tooltip content={p.muted ? COPY.PLAYER.UNMUTE : COPY.PLAYER.MUTE}>
          <IconButton icon={volIcon} label={p.muted ? COPY.PLAYER.UNMUTE : COPY.PLAYER.MUTE} variant="ghost" size="sm" onClick={p.toggleMute} className="text-fg-muted hover:text-fg" />
        </Tooltip>
        <Slider
          variant="media"
          label={COPY.PLAYER.VOLUME}
          min={0}
          max={100}
          value={p.muted ? 0 : Math.round(p.volume * 100)}
          valueText={`${p.muted ? 0 : Math.round(p.volume * 100)}%`}
          onChange={(v) => p.setVolume(v / 100)}
          className="hidden w-24 sm:flex"
        />
      </div>
    </section>
  );
}
