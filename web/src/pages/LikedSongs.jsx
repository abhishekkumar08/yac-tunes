import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Avatar, Button, EmptyState } from "@kasumi/ui";
import { formatTotal } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";
import { useLibrary } from "@/lib/library.jsx";
import { Loaded } from "@/components/PageState.jsx";
import { Cover } from "@/components/Cover.jsx";
import { PageHeader, PlayActions } from "@/components/PageHeader.jsx";
import { TrackList } from "@/components/TrackList.jsx";

const COLOR = "rgb(80 56 160)";

export function LikedSongs() {
  const { user } = useAuth();
  const { liked, likedIds } = useLibrary();
  const res = useApi("/api/me/tracks");
  const { data, reload } = res;
  // Unlikes hide at once through the library's Set; a like made elsewhere needs its track fetched.
  const tried = useRef("");
  useEffect(() => {
    if (!data) return;
    const missing = likedIds.filter((id) => !data.items.some((i) => i.track.id === id)).join(",");
    if (missing && missing !== tried.current) {
      tried.current = missing;
      reload();
    }
  }, [data, likedIds, reload]);
  return (
    <Loaded result={res}>
      {({ items }) => {
        const shown = items.filter((i) => liked.has(i.track.id));
        const tracks = shown.map((i) => i.track);
        const context = { type: "liked", id: "liked", name: COPY.LIKED.TITLE };
        return (
          <div className="pb-10">
            <PageHeader
              color={COLOR}
              cover={<Cover liked className="w-full" />}
              label={COPY.PLAYLIST.PLAYLIST}
              title={COPY.LIKED.TITLE}
              meta={
                <>
                  <Avatar name={user.name} size="sm" className="mr-1 h-6 w-6" />
                  <span className="font-bold">{user.name}</span>
                  <span className="text-fg-muted">
                    • {COPY.ALBUM.SONGS(tracks.length)}
                    {tracks.length > 0 && `, ${formatTotal(tracks.reduce((s, t) => s + t.durationSec, 0))}`}
                  </span>
                </>
              }
            />
            <PlayActions context={context} tracks={tracks} color={COLOR} />
            {tracks.length ? (
              <TrackList
                items={shown.map((i) => ({ key: i.track.id, track: i.track, addedAt: i.addedAt }))}
                context={context}
                columns={{ cover: true, album: true, dateAdded: true }}
              />
            ) : (
              <EmptyState
                className="py-16"
                title={COPY.LIKED.EMPTY_TITLE}
                description={COPY.LIKED.EMPTY_BODY}
                action={
                  <Button as={Link} to="/search" className="rounded-full">
                    {COPY.LIKED.FIND}
                  </Button>
                }
              />
            )}
          </div>
        );
      }}
    </Loaded>
  );
}
