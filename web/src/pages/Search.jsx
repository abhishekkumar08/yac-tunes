import { Link, useParams } from "react-router-dom";
import { Chip, EmptyState, cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { Loaded } from "@/components/PageState.jsx";
import { Cover } from "@/components/Cover.jsx";
import { PlayButton } from "@/components/Controls.jsx";
import { CardGrid, Shelf, cardHref } from "@/components/Card.jsx";
import { TrackList } from "@/components/TrackList.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { cardContext, usePlayCard } from "@/lib/playCard.js";

function Browse() {
  const res = useApi("/api/genres");
  return (
    <Loaded result={res}>
      {({ genres }) => (
        <div className="px-6 pb-10 pt-6">
          <h1 className="pb-4 text-headline font-bold text-fg">{COPY.SEARCH.BROWSE_ALL}</h1>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
            {genres.map((g) => (
              <Link
                key={g.id}
                to={`/genre/${g.id}`}
                className="relative aspect-[16/10] overflow-hidden rounded-lg p-4"
                style={{ background: `hsl(${g.hue} 60% 40%)` }}
              >
                <span className="text-title-lg font-bold text-white">{g.name}</span>
                {g.seed != null && <Cover seed={g.seed} className="absolute -bottom-2 -right-4 w-24 rotate-[25deg] shadow-raised" />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Loaded>
  );
}

function TopResult({ card }) {
  const player = usePlayer();
  const playCard = usePlayCard();
  const { type, id } = cardContext(card);
  const playing = player.isPlayingContext(type, id);
  return (
    <div className="group relative flex flex-col gap-5 rounded-lg bg-surface-subtle p-5 transition-colors hover:bg-surface-muted">
      <Cover seed={card.seed} mosaic={card.mosaic} round={card.round} className="w-24 shadow-raised" />
      <div>
        <Link to={cardHref(card)} className="block truncate text-headline font-bold text-fg after:absolute after:inset-0 after:content-['']">
          {card.name}
        </Link>
        <p className="mt-1 text-body text-fg-muted">
          <span className="mr-2 rounded-full bg-black/40 px-3 py-1 text-label text-fg">{COPY.SEARCH.TYPE[card.type]}</span>
          {card.type !== "artist" && card.subtitle}
        </p>
      </div>
      <PlayButton
        name={card.name}
        playing={playing}
        onClick={() => playCard(card)}
        className={cn("absolute bottom-5 right-5 z-10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100", playing && "opacity-100")}
      />
    </div>
  );
}

const TABS = ["all", "tracks", "artists", "albums", "playlists"];

function Results({ q, tab }) {
  const res = useApi(`/api/search?q=${encodeURIComponent(q)}`);
  const base = `/search/${encodeURIComponent(q)}`;
  return (
    <Loaded result={res}>
      {(r) => {
        const context = { type: "search", id: q, name: q };
        const rows = (list) => list.map((t) => ({ key: t.id, track: t }));
        const empty = !r.top;
        return (
          <div className="pb-10">
            <div className="sticky top-0 z-20 flex gap-2 bg-surface px-6 py-3">
              {TABS.map((t) => (
                <Chip key={t} as={Link} to={t === "all" ? base : `${base}/${t}`} selected={t === tab}>
                  {COPY.SEARCH.TABS[t]}
                </Chip>
              ))}
            </div>
            {empty ? (
              <EmptyState className="py-20" titleAs="h1" title={COPY.SEARCH.NO_RESULTS(q)} description={COPY.SEARCH.NO_RESULTS_BODY} />
            ) : tab === "all" ? (
              <div className="px-3">
                <div className="grid gap-6 px-3 pt-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <section>
                    <h2 className="pb-3 text-title-lg font-bold text-fg">{COPY.SEARCH.TOP}</h2>
                    <TopResult card={r.top} />
                  </section>
                  {r.tracks.length > 0 && (
                    <section>
                      <h2 className="pb-3 text-title-lg font-bold text-fg">{COPY.SEARCH.SONGS}</h2>
                      <div className="-mx-4">
                        <TrackList items={rows(r.tracks.slice(0, 4))} context={context} columns={{ cover: true }} header={false} />
                      </div>
                    </section>
                  )}
                </div>
                <Shelf title={COPY.SEARCH.ARTISTS} items={r.artists} href={`${base}/artists`} showAllLabel={COPY.PAGE.SHOW_ALL} />
                <Shelf title={COPY.SEARCH.ALBUMS} items={r.albums} href={`${base}/albums`} showAllLabel={COPY.PAGE.SHOW_ALL} />
                <Shelf title={COPY.SEARCH.PLAYLISTS} items={r.playlists} href={`${base}/playlists`} showAllLabel={COPY.PAGE.SHOW_ALL} />
              </div>
            ) : tab === "tracks" ? (
              <TrackList items={rows(r.tracks)} context={context} columns={{ cover: true, album: true }} />
            ) : (
              <div className="px-3">
                <CardGrid items={r[tab] ?? []} />
              </div>
            )}
          </div>
        );
      }}
    </Loaded>
  );
}

export function Search() {
  const { q, tab = "all" } = useParams();
  if (!q?.trim()) return <Browse />;
  return <Results key={q} q={q} tab={TABS.includes(tab) ? tab : "all"} />;
}
