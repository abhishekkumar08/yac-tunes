import { useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Library, List, Pin, Plus, Search } from "lucide-react";
import { Button, Chip, IconButton, Input, Menu, Tooltip, cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useLibrary } from "@/lib/library.jsx";
import { useLayout } from "@/lib/layout.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { Cover } from "@/components/Cover.jsx";
import { cardHref } from "@/components/Card.jsx";

const SORTS = {
  recents: (a, b) => Math.max(b.lastPlayedAt ?? 0, b.addedAt ?? 0) - Math.max(a.lastPlayedAt ?? 0, a.addedAt ?? 0),
  added: (a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0),
  alpha: (a, b) => a.name.localeCompare(b.name),
  creator: (a, b) => (a.owner ?? a.subtitle).localeCompare(b.owner ?? b.subtitle) || a.name.localeCompare(b.name),
};

function Row({ item, collapsed, active }) {
  return (
    <NavLink
      to={cardHref(item)}
      title={collapsed ? item.name : undefined}
      className={({ isActive }) =>
        cn("flex items-center gap-3 rounded-md p-2 hover:bg-surface-muted/60", isActive && "bg-surface-muted", collapsed && "justify-center")
      }
    >
      <Cover seed={item.seed} mosaic={item.mosaic} liked={item.liked} empty={item.empty} round={item.round} className="w-12" />
      {!collapsed && (
        <span className="min-w-0">
          <span className={cn("block truncate text-body-lg", active ? "text-accent" : "text-fg")}>{item.name}</span>
          <span className="flex items-center gap-1 truncate text-body text-fg-muted">
            {item.liked && <Pin className="h-3.5 w-3.5 rotate-45 fill-accent text-accent" aria-label={COPY.LIBRARY.PINNED} />}
            {item.subtitle}
          </span>
        </span>
      )}
    </NavLink>
  );
}

export function LibraryPanel({ narrow }) {
  const lib = useLibrary();
  const player = usePlayer();
  const layout = useLayout();
  const navigate = useNavigate();
  const [filter, setFilter] = useState(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [sort, setSort] = useState("recents");
  const dragging = useRef(null);
  const collapsed = narrow || layout.collapsed;

  const liked = {
    type: "liked",
    id: "liked",
    name: COPY.LIBRARY.LIKED,
    subtitle: `${COPY.LIBRARY.PLAYLIST} • ${COPY.LIBRARY.SONGS(lib.likedIds.length)}`,
    liked: true,
  };
  const all = useMemo(() => [...lib.playlists, ...lib.albums, ...lib.artists], [lib.playlists, lib.albums, lib.artists]);
  const kinds = ["playlist", "album", "artist"].filter((k) => all.some((i) => i.type === k));
  const q = query.trim().toLowerCase();
  const items = all
    .filter((i) => (!filter || i.type === filter) && (!q || i.name.toLowerCase().includes(q)))
    .sort(SORTS[sort]);
  const showLiked = (!filter || filter === "playlist") && (!q || liked.name.toLowerCase().includes(q));

  const create = async () => {
    const p = await lib.createPlaylist();
    if (p) navigate(`/playlist/${p.id}`);
  };

  const startResize = (e) => {
    dragging.current = { x: e.clientX, w: layout.libraryWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const resize = (e) => dragging.current && layout.resizeLibrary(dragging.current.w + e.clientX - dragging.current.x);

  return (
    <nav aria-label={COPY.LIBRARY.TITLE} className="relative flex h-full min-h-0 flex-col rounded-lg bg-surface">
      <div className={cn("flex items-center gap-2 px-4 pb-2 pt-3", collapsed && "flex-col px-2")}>
        <Tooltip content={collapsed ? COPY.LIBRARY.EXPAND : COPY.LIBRARY.COLLAPSE} side="right">
          <Button
            variant="ghost"
            onClick={() => !narrow && layout.setCollapsed(!layout.collapsed)}
            aria-label={collapsed ? COPY.LIBRARY.EXPAND : COPY.LIBRARY.COLLAPSE}
            className="gap-3 px-2 font-bold text-fg-muted hover:text-fg"
          >
            <Library className="h-6 w-6" aria-hidden="true" />
            {!collapsed && <span className="text-body-lg">{COPY.LIBRARY.TITLE}</span>}
          </Button>
        </Tooltip>
        {!collapsed && <span className="flex-1" />}
        <Tooltip content={COPY.LIBRARY.CREATE}>
          <IconButton icon={Plus} label={COPY.LIBRARY.CREATE} variant="ghost" onClick={create} className="rounded-full bg-surface-muted" />
        </Tooltip>
      </div>

      {!collapsed && kinds.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {filter ? (
            <Chip selected onRemove={() => setFilter(null)} removeLabel={COPY.LIBRARY.CLEAR_FILTER}>
              {COPY.LIBRARY.FILTERS[filter]}
            </Chip>
          ) : (
            kinds.map((k) => (
              <Chip key={k} onClick={() => setFilter(k)} as="button" type="button">
                {COPY.LIBRARY.FILTERS[k]}
              </Chip>
            ))
          )}
        </div>
      )}

      {!collapsed && (
        <div className="flex items-center gap-2 px-4 py-1">
          {searching ? (
            <Input
              aria-label={COPY.LIBRARY.SEARCH}
              placeholder={COPY.LIBRARY.SEARCH_PLACEHOLDER}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={() => !query && setSearching(false)}
              leading={<Search className="h-4 w-4" aria-hidden="true" />}
              fieldSize="sm"
              autoFocus
              containerClassName="flex-1"
            />
          ) : (
            <IconButton icon={Search} label={COPY.LIBRARY.SEARCH} variant="ghost" size="sm" onClick={() => setSearching(true)} />
          )}
          <span className="flex-1" />
          <Menu
            align="end"
            label={COPY.LIBRARY.SORT}
            items={Object.entries(COPY.LIBRARY.SORTS).map(([k, label]) => ({ label, onSelect: () => setSort(k), group: COPY.LIBRARY.SORT }))}
            trigger={
              <Button variant="ghost" size="sm" className="gap-2 text-fg-muted hover:text-fg">
                {COPY.LIBRARY.SORTS[sort]}
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
            }
          />
        </div>
      )}

      <div className="yt-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {showLiked && <Row item={liked} collapsed={collapsed} active={player.isContext("liked", "liked")} />}
        {items.map((i) => (
          <Row key={`${i.type}:${i.id}`} item={i} collapsed={collapsed} active={player.isContext(i.type, i.id)} />
        ))}
        {!collapsed && !lib.playlists.some((p) => p.own) && !filter && !q && (
          <div className="m-2 rounded-lg bg-surface-muted p-4">
            <p className="font-bold text-fg">{COPY.LIBRARY.EMPTY_TITLE}</p>
            <p className="mb-4 mt-1 text-body text-fg-muted">{COPY.LIBRARY.EMPTY_BODY}</p>
            <Button size="sm" onClick={create} className="rounded-full">
              {COPY.LIBRARY.CREATE}
            </Button>
          </div>
        )}
        {!collapsed && !items.length && !showLiked && <p className="px-3 py-4 text-body text-fg-muted">{COPY.LIBRARY.NO_MATCH}</p>}
      </div>

      {!narrow && !layout.collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label={COPY.LIBRARY.RESIZE}
          className="absolute -right-1.5 top-0 h-full w-3 cursor-col-resize after:absolute after:inset-y-0 after:left-1/2 after:w-px after:bg-transparent hover:after:bg-line-strong"
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={() => (dragging.current = null)}
        />
      )}
    </nav>
  );
}
