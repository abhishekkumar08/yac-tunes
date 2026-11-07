import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { Button, EmptyState, IconButton, cn } from "@kasumi/ui";
import { formatCount } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { useLayout } from "@/lib/layout.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { Cover } from "@/components/Cover.jsx";
import { Equalizer, HeartButton } from "@/components/Controls.jsx";
import { ArtistLinks, TrackMenu } from "@/components/TrackList.jsx";

function QueueRow({ track, playing, onPlay, onRemove, onDragStart, onDrop, current }) {
  const [menu, setMenu] = useState(false);
  return (
    <div
      className="group flex items-center gap-3 rounded-md p-2 hover:bg-surface-muted/60"
      onDoubleClick={onPlay}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu(true);
      }}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDrop ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
    >
      <Cover seed={track.albumSeed} className="w-12" />
      <div className="min-w-0 flex-1">
        <div className={cn("flex items-center gap-2 truncate text-body-lg", current ? "text-accent" : "text-fg")}>
          {current && playing && <Equalizer />}
          <span className="truncate">{track.title}</span>
        </div>
        <ArtistLinks artists={track.artists} className="block text-body text-fg-muted" />
      </div>
      {onRemove && (
        <IconButton icon={X} label={COPY.PANEL.REMOVE} variant="ghost" size="sm" onClick={onRemove} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100" />
      )}
      <TrackMenu track={track} open={menu} onOpenChange={setMenu} />
    </div>
  );
}

export function QueueList() {
  const p = usePlayer();
  const { queue, context } = p.upNext;
  const nowTrack = p.track;
  return (
    <div className="flex flex-col gap-4">
      {nowTrack && (
        <section>
          <h3 className="px-2 pb-1 text-title font-bold text-fg">{COPY.PANEL.NOW_PLAYING}</h3>
          <QueueRow track={nowTrack} current playing={p.playing} onPlay={p.togglePlay} />
        </section>
      )}
      {queue.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-2 pb-1">
            <h3 className="text-title font-bold text-fg">{COPY.PANEL.NEXT_IN_QUEUE}</h3>
            <Button variant="ghost" size="sm" onClick={p.clearQueue} className="text-fg-muted">
              {COPY.PANEL.CLEAR_QUEUE}
            </Button>
          </div>
          {queue.map((q, i) => {
            const t = p.getTrack(q.trackId);
            return t ? (
              <QueueRow
                key={q.uid}
                track={t}
                onPlay={() => p.playQueued(q.uid)}
                onRemove={() => p.removeQueued(q.uid)}
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData("text/plain"));
                  if (Number.isInteger(from) && from !== i) p.moveQueued(from, i);
                }}
              />
            ) : null;
          })}
        </section>
      )}
      {context.length > 0 && p.state.context && (
        <section>
          <h3 className="px-2 pb-1 text-title font-bold text-fg">{COPY.PANEL.NEXT_FROM(p.state.context.name)}</h3>
          {context.slice(0, 50).map((id, i) => {
            const t = p.getTrack(id);
            return t ? <QueueRow key={`${id}-${i}`} track={t} onPlay={() => p.skipTo(i)} /> : null;
          })}
        </section>
      )}
      {!nowTrack && !queue.length && (
        <EmptyState size="sm" title={COPY.PANEL.EMPTY_QUEUE} description={COPY.PANEL.EMPTY_QUEUE_BODY} />
      )}
    </div>
  );
}

function AboutArtist({ id }) {
  const res = useApi(`/api/artists/${id}`);
  const a = res.data?.artist;
  if (!a) return null;
  return (
    <Link to={`/artist/${a.id}`} className="block overflow-hidden rounded-lg bg-surface-muted hover:bg-surface-muted/80">
      <Cover seed={a.seed} className="w-full rounded-none" />
      <div className="p-4">
        <p className="text-label text-fg">{COPY.PANEL.ABOUT_ARTIST}</p>
        <p className="mt-2 text-title font-bold text-fg">{a.name}</p>
        <p className="text-body text-fg-muted">{COPY.PANEL.LISTENERS(formatCount(a.listeners))}</p>
        <p className="mt-2 line-clamp-3 text-body text-fg-muted">{a.bio}</p>
      </div>
    </Link>
  );
}

function NowPlaying() {
  const p = usePlayer();
  const layout = useLayout();
  const t = p.track;
  if (!t) return <EmptyState size="sm" title={COPY.PLAYER.NOTHING} />;
  const nextId = p.upNext.queue[0]?.trackId ?? p.upNext.context[0];
  const next = nextId && p.getTrack(nextId);
  return (
    <div className="flex flex-col gap-4">
      <Cover seed={t.albumSeed} className="w-full rounded-lg shadow-raised" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/album/${t.albumId}`} className="block truncate text-headline font-bold text-fg hover:underline">
            {t.title}
          </Link>
          <ArtistLinks artists={t.artists} className="block text-body-lg text-fg-muted" />
        </div>
        <HeartButton trackId={t.id} alwaysVisible />
      </div>
      <AboutArtist id={t.artists[0]?.id} />
      {next && (
        <div className="rounded-lg bg-surface-muted p-3">
          <div className="flex items-center justify-between pb-2">
            <p className="text-label font-bold text-fg">{COPY.PANEL.NEXT_UP}</p>
            <Button variant="ghost" size="sm" className="text-fg-muted" onClick={() => layout.setPanel("queue")}>
              {COPY.PANEL.OPEN_QUEUE}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Cover seed={next.albumSeed} className="w-12" />
            <div className="min-w-0">
              <p className="truncate text-body-lg text-fg">{next.title}</p>
              <ArtistLinks artists={next.artists} className="block text-body text-fg-muted" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RightPanel() {
  const layout = useLayout();
  const p = usePlayer();
  if (!layout.panel) return null;
  const title = layout.panel === "queue" ? COPY.PANEL.QUEUE : p.state.context?.name ?? COPY.PANEL.NOW_PLAYING;
  return (
    <aside aria-label={title} className="flex h-full w-80 shrink-0 flex-col rounded-lg bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="truncate text-body-lg font-bold text-fg">{title}</h2>
        <IconButton icon={X} label={COPY.PANEL.CLOSE} variant="ghost" size="sm" onClick={() => layout.setPanel(null)} />
      </div>
      <div className="yt-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-4">{layout.panel === "queue" ? <QueueList /> : <NowPlaying />}</div>
    </aside>
  );
}
