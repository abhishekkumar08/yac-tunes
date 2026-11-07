import { useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, ListEnd } from "lucide-react";
import { Button, Chip, cn } from "@kasumi/ui";
import { formatCount } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { coverColor } from "@/lib/cover.js";
import { useLibrary } from "@/lib/library.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { Loaded } from "@/components/PageState.jsx";
import { Shelf } from "@/components/Card.jsx";
import { TrackList } from "@/components/TrackList.jsx";
import { Cover } from "@/components/Cover.jsx";
import { MoreButton, PageHeader, PlayActions } from "@/components/PageHeader.jsx";

function ArtistPage({ data }) {
  const { artist, popular, discography, fansAlsoLike } = data;
  const lib = useLibrary();
  const player = usePlayer();
  const [more, setMore] = useState(false);
  const [disco, setDisco] = useState("all");
  const color = coverColor(artist.seed);
  const context = { type: "artist", id: artist.id, name: artist.name };
  const following = lib.following.has(artist.id);
  const releases = disco === "all" ? discography : discography.filter((d) => (disco === "album" ? d.kind === "Album" : d.kind !== "Album"));
  return (
    <div className="pb-10">
      <PageHeader
        color={color}
        round
        cover={<Cover seed={artist.seed} round className="w-full" />}
        label={
          <>
            <BadgeCheck className="h-6 w-6 fill-info text-white" aria-hidden="true" />
            {COPY.ARTIST.VERIFIED}
          </>
        }
        title={artist.name}
        meta={<span className="text-body-lg font-normal">{COPY.ARTIST.LISTENERS(formatCount(artist.listeners))}</span>}
      />
      <PlayActions context={context} tracks={popular} color={color}>
        <Button variant="outline" size="sm" onClick={() => lib.toggleFollow(artist)} className={cn("rounded-full px-4 font-bold", following && "border-fg")}>
          {following ? COPY.ARTIST.FOLLOWING : COPY.ARTIST.FOLLOW}
        </Button>
        <MoreButton name={artist.name} items={[{ label: COPY.TRACK.ADD_TO_QUEUE, icon: ListEnd, onSelect: () => player.enqueue(popular) }]} />
      </PlayActions>

      <h2 className="px-6 pb-2 text-title-lg font-bold text-fg">{COPY.ARTIST.POPULAR}</h2>
      <TrackList
        items={(more ? popular : popular.slice(0, 5)).map((t) => ({ key: t.id, track: t }))}
        context={context}
        columns={{ cover: true, plays: true, artists: false }}
        header={false}
      />
      {popular.length > 5 && (
        <Button variant="ghost" size="sm" onClick={() => setMore(!more)} className="ml-6 mt-2 font-bold text-fg-muted hover:text-fg">
          {more ? COPY.PAGE.SHOW_LESS : COPY.PAGE.SEE_MORE}
        </Button>
      )}

      <div className="px-3">
        <section className="mt-8">
          <h2 className="px-3 text-title-lg font-bold text-fg">{COPY.ARTIST.DISCOGRAPHY}</h2>
          <div className="flex gap-2 px-3 pt-3">
            {Object.entries(COPY.ARTIST.DISCO_TABS).map(([k, label]) => (
              <Chip key={k} as="button" type="button" selected={disco === k} onClick={() => setDisco(k)}>
                {label}
              </Chip>
            ))}
          </div>
          <Shelf title="" items={releases} className="mt-0" />
        </section>
        <Shelf title={COPY.ARTIST.FANS} items={fansAlsoLike} />
        <section className="mt-8 px-3">
          <h2 className="pb-3 text-title-lg font-bold text-fg">{COPY.ARTIST.ABOUT}</h2>
          <div className="max-w-2xl rounded-lg bg-surface-muted p-6">
            <p className="text-body-lg font-bold text-fg">{COPY.ARTIST.LISTENERS(formatCount(artist.listeners))}</p>
            <p className="mt-3 text-body-lg text-fg-muted">{artist.bio}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export function Artist() {
  const { id } = useParams();
  const res = useApi(`/api/artists/${encodeURIComponent(id)}`);
  return <Loaded result={res}>{(data) => <ArtistPage key={data.artist.id} data={data} />}</Loaded>;
}
