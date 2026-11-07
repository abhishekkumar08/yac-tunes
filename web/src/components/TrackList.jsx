import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Clock3, Disc3, Heart, HeartOff, ListEnd, ListPlus, MinusCircle, MoreHorizontal, UserRound } from "lucide-react";
import { IconButton, Menu, cn, useMediaQuery } from "@kasumi/ui";
import { artistNames, formatCount, formatDuration } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { useLibrary } from "@/lib/library.jsx";
import { Cover } from "@/components/Cover.jsx";
import { Equalizer, HeartButton, PauseIcon, PlayIcon } from "@/components/Controls.jsx";
import { useAddToPlaylist } from "@/components/AddToPlaylist.jsx";

const DAY = 86_400_000;
const rel = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function addedText(ms) {
  const days = Math.floor((Date.now() - ms) / DAY);
  if (days < 1) return rel.format(-Math.max(1, Math.floor((Date.now() - ms) / 3_600_000)), "hour");
  if (days < 30) return rel.format(-days, "day");
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function ArtistLinks({ artists, className }) {
  return (
    <span className={cn("truncate", className)}>
      {artists.map((a, i) => (
        <span key={a.id}>
          {i > 0 && ", "}
          <Link to={`/artist/${a.id}`} className="hover:text-fg hover:underline" onClick={(e) => e.stopPropagation()}>
            {a.name}
          </Link>
        </span>
      ))}
    </span>
  );
}

export function TrackMenu({ track, open, onOpenChange, onRemove, onMove, index, count }) {
  const player = usePlayer();
  const { liked, toggleLike } = useLibrary();
  const addToPlaylist = useAddToPlaylist();
  const items = [
    { label: COPY.TRACK.ADD_TO_QUEUE, icon: ListEnd, onSelect: () => player.enqueue(track) },
    { label: COPY.TRACK.ADD_TO_PLAYLIST, icon: ListPlus, onSelect: () => addToPlaylist([track.id]) },
    { label: liked.has(track.id) ? COPY.TRACK.UNLIKE : COPY.TRACK.LIKE, icon: liked.has(track.id) ? HeartOff : Heart, onSelect: () => toggleLike(track.id) },
    { label: COPY.TRACK.GO_ARTIST, icon: UserRound, as: Link, to: `/artist/${track.artists[0]?.id}` },
    { label: COPY.TRACK.GO_ALBUM, icon: Disc3, as: Link, to: `/album/${track.albumId}` },
  ];
  if (onMove && index > 0) items.push({ label: COPY.TRACK.MOVE_UP, icon: ArrowUp, onSelect: () => onMove(index, index - 1), group: COPY.TRACK.ORDER });
  if (onMove && index < count - 1) items.push({ label: COPY.TRACK.MOVE_DOWN, icon: ArrowDown, onSelect: () => onMove(index, index + 1), group: COPY.TRACK.ORDER });
  if (onRemove) items.push({ label: COPY.TRACK.REMOVE_FROM_PLAYLIST, icon: MinusCircle, tone: "danger", onSelect: onRemove });
  return (
    <Menu
      items={items}
      label={COPY.TRACK.MORE(track.title, artistNames(track))}
      align="end"
      open={open}
      onOpenChange={onOpenChange}
      trigger={
        <IconButton
          icon={MoreHorizontal}
          label={COPY.TRACK.MORE(track.title, artistNames(track))}
          variant="ghost"
          size="sm"
          className={cn("text-fg-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100", open && "opacity-100")}
        />
      }
    />
  );
}

function Row({ item, index, count, context, cols, grid, onRemove, onMove, tracks, drag }) {
  const player = usePlayer();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = item.track;
  const current = player.isCurrentRow(context.type, context.id, index);
  const playingNow = current && player.playing;
  const play = () => (current ? player.togglePlay() : player.playContext(context, tracks, index));
  return (
    <div
      role="row"
      className={cn(
        "group grid items-center gap-4 rounded px-4 py-1.5 text-body text-fg-muted hover:bg-surface-muted/60",
        menuOpen && "bg-surface-muted",
        drag.target === index && "shadow-[inset_0_2px_0_rgb(var(--mw-accent))]",
      )}
      style={{ gridTemplateColumns: grid }}
      onDoubleClick={play}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
      draggable={!!onMove}
      onDragStart={onMove ? (e) => drag.start(e, index) : undefined}
      onDragOver={onMove ? (e) => drag.enter(e, index) : undefined}
      onDrop={onMove ? (e) => drag.drop(e, index) : undefined}
      onDragEnd={onMove ? drag.end : undefined}
    >
      <div role="gridcell" className="relative flex h-8 items-center justify-end tabular-nums">
        <span className={cn("group-hover:invisible", current && "text-accent")}>{playingNow ? <Equalizer /> : index + 1}</span>
        <IconButton
          icon={playingNow ? PauseIcon : PlayIcon}
          label={playingNow ? COPY.TRACK.PAUSE_TRACK(t.title) : COPY.TRACK.PLAY_TRACK(t.title)}
          variant="ghost"
          size="sm"
          onClick={play}
          className="invisible absolute right-[-6px] text-fg group-hover:visible focus-visible:visible"
        />
      </div>
      <div role="gridcell" className="flex min-w-0 items-center gap-3">
        {cols.cover && <Cover seed={t.albumSeed} className="w-10" />}
        <div className="min-w-0">
          <div className={cn("truncate text-body-lg", current ? "text-accent" : "text-fg")}>{t.title}</div>
          {cols.artists !== false && <ArtistLinks artists={t.artists} className="block text-body" />}
        </div>
      </div>
      {cols.plays && (
        <div role="gridcell" className="tabular-nums">
          {formatCount(t.plays)}
        </div>
      )}
      {cols.album && (
        <div role="gridcell" className="truncate">
          <Link to={`/album/${t.albumId}`} className="hover:text-fg hover:underline">
            {t.albumTitle}
          </Link>
        </div>
      )}
      {cols.dateAdded && <div role="gridcell">{item.addedAt ? addedText(item.addedAt) : ""}</div>}
      <div role="gridcell" className="flex items-center justify-end gap-1">
        <HeartButton trackId={t.id} />
        <span className="w-10 text-right tabular-nums">{formatDuration(t.durationSec)}</span>
        <TrackMenu
          track={t}
          open={menuOpen}
          onOpenChange={setMenuOpen}
          index={index}
          count={count}
          onMove={onMove}
          onRemove={onRemove ? () => onRemove(item, index) : undefined}
        />
      </div>
    </div>
  );
}

/**
 * The song table of album, playlist, artist and search pages. `items` are
 * `{ key, track, addedAt? }`; `context` is what the player plays when a row starts.
 */
export function TrackList({ items, context, columns = {}, onRemove, onMove, header = true }) {
  const wide = useMediaQuery("(min-width: 900px)");
  const cols = { ...columns, album: wide && columns.album, dateAdded: wide && columns.dateAdded, plays: wide && columns.plays };
  const grid = ["1.5rem", "minmax(0,4fr)", cols.plays && "minmax(0,1.4fr)", cols.album && "minmax(0,2.4fr)", cols.dateAdded && "minmax(0,1.4fr)", "7.5rem"]
    .filter(Boolean)
    .join(" ");
  const tracks = useMemo(() => items.map((i) => i.track), [items]);
  const [from, setFrom] = useState(null);
  const [target, setTarget] = useState(null);
  const drag = {
    target: from === null ? null : target,
    start(e, i) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(i));
      setFrom(i);
    },
    enter(e, i) {
      if (from === null) return;
      e.preventDefault();
      if (target !== i) setTarget(i);
    },
    drop(e, i) {
      e.preventDefault();
      if (from !== null && from !== i) onMove(from, i);
      drag.end();
    },
    end() {
      setFrom(null);
      setTarget(null);
    },
  };
  return (
    <div role="grid" aria-label={context.name} aria-rowcount={items.length} className="px-4">
      {header && (
        <div
          role="row"
          className="sticky top-16 z-10 mb-2 grid items-center gap-4 border-b border-line bg-surface px-4 py-2 text-label text-fg-muted"
          style={{ gridTemplateColumns: grid }}
        >
          <div role="columnheader" className="text-right">
            #
          </div>
          <div role="columnheader">{COPY.TRACK.TITLE}</div>
          {cols.plays && <div role="columnheader">{COPY.TRACK.PLAYS}</div>}
          {cols.album && <div role="columnheader">{COPY.TRACK.ALBUM}</div>}
          {cols.dateAdded && <div role="columnheader">{COPY.TRACK.DATE_ADDED}</div>}
          <div role="columnheader" className="flex justify-end pr-11">
            <Clock3 className="h-4 w-4" aria-label={COPY.TRACK.DURATION} />
          </div>
        </div>
      )}
      {items.map((item, i) => (
        <Row
          key={item.key}
          item={item}
          index={i}
          count={items.length}
          context={context}
          cols={cols}
          grid={grid}
          onRemove={onRemove}
          onMove={onMove}
          tracks={tracks}
          drag={drag}
        />
      ))}
    </div>
  );
}
