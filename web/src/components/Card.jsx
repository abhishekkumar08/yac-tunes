import { Link } from "react-router-dom";
import { cn } from "@kasumi/ui";
import { Cover } from "@/components/Cover.jsx";
import { PlayButton } from "@/components/Controls.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { cardContext, usePlayCard } from "@/lib/playCard.js";

export const cardHref = (c) =>
  c.type === "liked" ? "/collection/tracks" : c.type === "track" ? `/album/${c.track.albumId}` : `/${c.type}/${c.id}`;

/** A square cover card with a stretched link and a hover play button. */
export function Card({ card, className }) {
  const player = usePlayer();
  const playCard = usePlayCard();
  const { type, id } = cardContext(card);
  const playing = player.isPlayingContext(type, id);
  return (
    <div className={cn("group relative flex w-full flex-col gap-2 rounded-md p-3 transition-colors hover:bg-surface-muted/60", className)}>
      <div className="relative">
        <Cover seed={card.seed} mosaic={card.mosaic} liked={card.liked} empty={card.empty} round={card.round} className="w-full shadow-raised" />
        <PlayButton
          size="md"
          name={card.name}
          playing={playing}
          onClick={() => playCard(card)}
          className={cn(
            "absolute bottom-2 right-2 z-10 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
            playing && "translate-y-0 opacity-100",
          )}
        />
      </div>
      <div className="min-w-0">
        <Link to={cardHref(card)} className="line-clamp-2 font-medium text-fg after:absolute after:inset-0 after:content-['']">
          {card.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-caption text-fg-muted">{card.subtitle}</p>
      </div>
    </div>
  );
}

export function Shelf({ title, href, showAllLabel, items, className }) {
  if (!items?.length) return null;
  return (
    <section className={cn("mt-6", className)}>
      <div className="mb-1 flex items-end justify-between px-3">
        <h2 className="text-title font-bold text-fg">{href ? <Link to={href} className="hover:underline">{title}</Link> : title}</h2>
        {href && (
          <Link to={href} className="text-caption font-semibold text-fg-muted hover:underline">
            {showAllLabel}
          </Link>
        )}
      </div>
      <div className="yt-no-scrollbar -mx-0 grid auto-cols-[minmax(150px,1fr)] grid-flow-col overflow-x-auto sm:auto-cols-[minmax(170px,190px)]">
        {items.map((c) => (
          <Card key={`${c.type}:${c.id}`} card={c} />
        ))}
      </div>
    </section>
  );
}

export function CardGrid({ items }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))]">
      {items.map((c) => (
        <Card key={`${c.type}:${c.id}`} card={c} />
      ))}
    </div>
  );
}
