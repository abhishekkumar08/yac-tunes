import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ListEnd, Pencil, Trash2 } from "lucide-react";
import { Avatar, Button, useNotifications } from "@kasumi/ui";
import { moveItem } from "@shared/order.js";
import { formatTotal } from "@shared/format.js";
import { COPY } from "@/copy.js";
import { api, errorText, useApi } from "@/lib/api.js";
import { coverColor } from "@/lib/cover.js";
import { useLibrary } from "@/lib/library.jsx";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";
import { Loaded } from "@/components/PageState.jsx";
import { Cover } from "@/components/Cover.jsx";
import { MoreButton, PageHeader, PlayActions, SaveButton } from "@/components/PageHeader.jsx";
import { TrackList } from "@/components/TrackList.jsx";
import { EditDetails, FindSongs } from "@/components/PlaylistEditors.jsx";

function PlaylistPage({ initial }) {
  const [playlist, setPlaylist] = useState(initial);
  const [editing, setEditing] = useState(false);
  const lib = useLibrary();
  const player = usePlayer();
  const navigate = useNavigate();
  const { notify } = useNotifications();
  const color = coverColor(playlist.seed);
  const context = { type: "playlist", id: playlist.id, name: playlist.name };
  const tracks = playlist.items.map((i) => i.track);
  const own = playlist.isOwner;
  const cover = <Cover seed={playlist.seed} mosaic={playlist.mosaic} empty={playlist.empty} className="w-full" />;

  const refreshAfter = (p) => {
    setPlaylist(p);
    lib.reload();
  };

  const reorder = async (from, to) => {
    const before = playlist;
    const items = moveItem(playlist.items, from, to);
    setPlaylist({ ...playlist, items });
    try {
      const res = await api.put(`/api/playlists/${playlist.id}/order`, { itemIds: items.map((i) => i.itemId) });
      refreshAfter(res.playlist);
    } catch (err) {
      setPlaylist(before);
      notify(errorText(err), "error");
      if (err.code === "stale_order") api.get(`/api/playlists/${playlist.id}`).then((r) => setPlaylist(r.playlist), (e) => notify(errorText(e), "error"));
    }
  };

  const remove = async (item) => {
    try {
      const res = await api.del(`/api/playlists/${playlist.id}/items/${item.itemId}`);
      refreshAfter(res.playlist);
      notify(COPY.TRACK.REMOVED_FROM(playlist.name), "success");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const add = async (track) => {
    const p = await lib.addToPlaylist(playlist, [track.id]);
    if (p) setPlaylist(p);
  };

  const destroy = async () => {
    try {
      await api.del(`/api/playlists/${playlist.id}`);
      notify(COPY.PLAYLIST.DELETED(playlist.name), "success");
      lib.reload();
      navigate("/");
    } catch (err) {
      notify(errorText(err), "error");
    }
  };

  const meta = (
    <>
      {playlist.description && <p className="mb-2 w-full text-body text-fg-muted">{playlist.description}</p>}
      <Avatar name={playlist.owner.name} size="sm" className="mr-1 h-6 w-6" />
      <span className="font-bold">{playlist.owner.name}</span>
      {tracks.length > 0 && (
        <span className="text-fg-muted">
          • {COPY.ALBUM.SONGS(tracks.length)}, {playlist.totalSec >= 3600 ? COPY.PLAYLIST.ABOUT(formatTotal(playlist.totalSec)) : formatTotal(playlist.totalSec)}
        </span>
      )}
    </>
  );

  const menu = [
    tracks.length > 0 && { label: COPY.TRACK.ADD_TO_QUEUE, icon: ListEnd, onSelect: () => player.enqueue(tracks) },
    own && { label: COPY.PLAYLIST.EDIT, icon: Pencil, onSelect: () => setEditing(true) },
    own && { label: COPY.PLAYLIST.DELETE, icon: Trash2, tone: "danger", onSelect: destroy },
  ].filter(Boolean);

  return (
    <div className="pb-10">
      <PageHeader
        color={color}
        cover={
          own ? (
            <Button variant="ghost" onClick={() => setEditing(true)} aria-label={COPY.PLAYLIST.EDIT} className="h-auto w-full p-0">
              {cover}
            </Button>
          ) : (
            cover
          )
        }
        label={own ? COPY.PLAYLIST.PLAYLIST : COPY.PLAYLIST.PUBLIC}
        title={playlist.name}
        meta={meta}
      />
      <PlayActions context={context} tracks={tracks} color={color}>
        {!own && <SaveButton saved={lib.savedPlaylists.has(playlist.id)} onClick={() => lib.toggleSavePlaylist(playlist.id)} />}
        {menu.length > 0 && <MoreButton name={playlist.name} items={menu} />}
      </PlayActions>
      {tracks.length > 0 && (
        <TrackList
          items={playlist.items.map((i) => ({ ...i, key: i.itemId }))}
          context={context}
          columns={{ cover: true, album: true, dateAdded: true }}
          onMove={own ? reorder : undefined}
          onRemove={own ? remove : undefined}
        />
      )}
      {own && <FindSongs onAdd={add} />}
      {own && <EditDetails key={String(editing)} playlist={playlist} open={editing} onClose={() => setEditing(false)} onSaved={refreshAfter} />}
    </div>
  );
}

export function Playlist() {
  const { id } = useParams();
  const res = useApi(`/api/playlists/${encodeURIComponent(id)}`);
  return <Loaded result={res}>{({ playlist }) => <PlaylistPage key={playlist.id} initial={playlist} />}</Loaded>;
}
