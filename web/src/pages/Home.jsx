import { Link } from "react-router-dom";
import { cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { Loaded } from "@/components/PageState.jsx";
import { Cover } from "@/components/Cover.jsx";
import { PlayButton } from "@/components/Controls.jsx";
import { Shelf, cardHref } from "@/components/Card.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { cardContext, usePlayCard } from "@/lib/playCard.js";

function QuickTile({ card }) {
  const player = usePlayer();
  const playCard = usePlayCard();
  const { type, id } = cardContext(card);
  const playing = player.isPlayingContext(type, id);
  return (
    <div className="group relative flex h-14 items-center gap-3 overflow-hidden rounded bg-white/10 pr-2 transition-colors hover:bg-white/20">
      <Cover seed={card.seed} mosaic={card.mosaic} liked={card.liked} empty={card.empty} round={card.round} className="h-14 w-14 rounded-none" />
      <Link to={cardHref(card)} className="min-w-0 flex-1 truncate text-label font-bold text-fg after:absolute after:inset-0 after:content-['']">
        {card.name}
      </Link>
      <PlayButton
        size="md"
        name={card.name}
        playing={playing}
        onClick={() => playCard(card)}
        className={cn("relative z-10 h-8 w-8 opacity-0 group-hover:opacity-100 focus-visible:opacity-100", playing && "opacity-100")}
      />
    </div>
  );
}

const SECTIONS = [
  ["jump-back-in", "jumpBackIn"],
  ["made-for-you", "madeForYou"],
  ["editors-picks", "editorsPicks"],
  ["popular-artists", "popularArtists"],
  ["new-releases", "newReleases"],
];

export function Home() {
  const res = useApi("/api/home");
  return (
    <Loaded result={res}>
      {(home) => (
        <div className="relative pb-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-accent/25 to-transparent" aria-hidden="true" />
          <div className="relative px-3 pt-6">
            <h1 className="px-3 text-headline font-bold text-fg">{COPY.HOME.GREETING(new Date().getHours())}</h1>
            {home.recent.length ? (
              <div className="mt-4 grid grid-cols-1 gap-2 px-3 sm:grid-cols-2 xl:grid-cols-4">
                {home.recent.map((c) => (
                  <QuickTile key={`${c.type}:${c.id}`} card={c} />
                ))}
              </div>
            ) : (
              <p className="mt-2 px-3 text-body text-fg-muted">{COPY.HOME.FIRST_TIME}</p>
            )}
            {SECTIONS.map(([id, key]) => (
              <Shelf key={id} title={COPY.HOME.SECTIONS[id]} href={`/section/${id}`} showAllLabel={COPY.PAGE.SHOW_ALL} items={home[key]} />
            ))}
          </div>
        </div>
      )}
    </Loaded>
  );
}
