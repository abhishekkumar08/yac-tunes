import { Link, useParams } from "react-router-dom";
import { ListEnd, ListPlus, UserRound } from "lucide-react";
import { formatTotal } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { coverColor } from "@/lib/cover.js";
import { useLibrary } from "@/lib/library.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { Loaded } from "@/components/PageState.jsx";
import { Cover } from "@/components/Cover.jsx";
import { MoreButton, PageHeader, PlayActions, SaveButton } from "@/components/PageHeader.jsx";
import { Shelf } from "@/components/Card.jsx";
import { TrackList } from "@/components/TrackList.jsx";
import { useAddToPlaylist } from "@/components/AddToPlaylist.jsx";

export function Album() {
  const { id } = useParams();
  const res = useApi(`/api/albums/${encodeURIComponent(id)}`);
  const lib = useLibrary();
  const player = usePlayer();
  const addToPlaylist = useAddToPlaylist();
  return (
    <Loaded result={res}>
      {({ album, moreByArtist }) => {
        const color = coverColor(album.seed);
        const context = { type: "album", id: album.id, name: album.title };
        const credits = [...new Set(album.tracks.map((t) => t.credit).filter(Boolean))];
        return (
          <div className="pb-10">
            <PageHeader
              color={color}
              cover={<Cover seed={album.seed} className="w-full" />}
              label={album.kind}
              title={album.title}
              meta={
                <>
                  <Cover seed={album.artist.seed} round className="mr-1 w-6" />
                  <Link to={`/artist/${album.artist.id}`} className="font-bold hover:underline">
                    {album.artist.name}
                  </Link>
                  <span className="text-fg-muted">• {album.year} • {COPY.ALBUM.SONGS(album.tracks.length)}, {formatTotal(album.totalSec)}</span>
                </>
              }
            />
            <PlayActions context={context} tracks={album.tracks} color={color}>
              <SaveButton saved={lib.savedAlbums.has(album.id)} onClick={() => lib.toggleSaveAlbum(album.id)} />
              <MoreButton
                name={album.title}
                items={[
                  { label: COPY.TRACK.ADD_TO_QUEUE, icon: ListEnd, onSelect: () => player.enqueue(album.tracks) },
                  { label: COPY.TRACK.ADD_TO_PLAYLIST, icon: ListPlus, onSelect: () => addToPlaylist(album.tracks.map((t) => t.id)) },
                  { label: COPY.TRACK.GO_ARTIST, icon: UserRound, as: Link, to: `/artist/${album.artist.id}` },
                ]}
              />
            </PlayActions>
            <TrackList items={album.tracks.map((t) => ({ key: t.id, track: t }))} context={context} />
            <div className="px-6 pt-6 text-caption text-fg-muted">
              <p className="text-body">{COPY.ALBUM.RELEASED(album.releasedOn)}</p>
              <p>{COPY.ALBUM.COPYRIGHT(album.year, album.label)}</p>
              <p>{COPY.ALBUM.PHONOGRAM(album.year, album.label)}</p>
              {credits.map((c) => (
                <p key={c}>{c}</p>
              ))}
            </div>
            <div className="px-3">
              <Shelf title={COPY.ALBUM.MORE_BY(album.artist.name)} href={`/artist/${album.artist.id}`} showAllLabel={COPY.PAGE.SHOW_ALL} items={moreByArtist} />
            </div>
          </div>
        );
      }}
    </Loaded>
  );
}
