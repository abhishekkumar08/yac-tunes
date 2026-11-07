import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api, errorText } from "@/lib/api.js";

const LibraryContext = createContext(null);
export const useLibrary = () => useContext(LibraryContext);

const EMPTY = { playlists: [], albums: [], artists: [], likedIds: [] };

export function LibraryProvider({ children }) {
  const [lib, setLib] = useState(EMPTY);
  const { notify } = useNotifications();

  const reload = useCallback(
    () => api.get("/api/library").then(setLib, (err) => notify(errorText(err), "error")),
    [notify],
  );
  useEffect(() => {
    reload();
  }, [reload]);

  const liked = useMemo(() => new Set(lib.likedIds), [lib.likedIds]);
  const savedAlbums = useMemo(() => new Set(lib.albums.map((a) => a.id)), [lib.albums]);
  const savedPlaylists = useMemo(() => new Set(lib.playlists.map((p) => p.id)), [lib.playlists]);
  const following = useMemo(() => new Set(lib.artists.map((a) => a.id)), [lib.artists]);
  const ownPlaylists = useMemo(() => lib.playlists.filter((p) => p.own), [lib.playlists]);

  // Optimistic changes are updaters, and a failure reloads the truth, so two quick toggles
  // can't roll each other back.
  const toggle = useCallback(
    async (path, id, on, { optimistic, success } = {}) => {
      if (optimistic) setLib(optimistic);
      try {
        await (on ? api.put(`/api/me/${path}/${id}`) : api.del(`/api/me/${path}/${id}`));
        if (success) notify(success, "success");
      } catch (err) {
        notify(errorText(err), "error");
      }
      reload();
    },
    [notify, reload],
  );

  const toggleLike = useCallback(
    (trackId) => {
      const on = !liked.has(trackId);
      return toggle("tracks", trackId, on, {
        optimistic: (l) => ({ ...l, likedIds: on ? [trackId, ...l.likedIds] : l.likedIds.filter((x) => x !== trackId) }),
        success: on ? COPY.TRACK.LIKED : COPY.TRACK.UNLIKED,
      });
    },
    [liked, toggle],
  );

  const saveToggle = useCallback(
    (path, saved) => (id) => toggle(path, id, !saved.has(id), { success: saved.has(id) ? COPY.PAGE.UNSAVED : COPY.PAGE.SAVED }),
    [toggle],
  );
  const toggleSaveAlbum = useMemo(() => saveToggle("albums", savedAlbums), [saveToggle, savedAlbums]);
  const toggleSavePlaylist = useMemo(() => saveToggle("playlists", savedPlaylists), [saveToggle, savedPlaylists]);
  const toggleFollow = useCallback(
    (artist) =>
      toggle("following", artist.id, !following.has(artist.id), {
        success: following.has(artist.id) ? COPY.ARTIST.UNFOLLOWED(artist.name) : COPY.ARTIST.FOLLOWED(artist.name),
      }),
    [following, toggle],
  );

  const createPlaylist = useCallback(async () => {
    try {
      const { playlist } = await api.post("/api/playlists", {});
      reload();
      return playlist;
    } catch (err) {
      notify(errorText(err), "error");
      return null;
    }
  }, [notify, reload]);

  const addToPlaylist = useCallback(
    async (playlist, trackIds) => {
      try {
        const res = await api.post(`/api/playlists/${playlist.id}/items`, { trackIds });
        notify(COPY.TRACK.ADDED_TO(playlist.name), "success");
        reload();
        return res.playlist;
      } catch (err) {
        notify(errorText(err), "error");
        return null;
      }
    },
    [notify, reload],
  );

  const value = useMemo(
    () => ({
      ...lib,
      reload,
      liked,
      savedAlbums,
      savedPlaylists,
      following,
      ownPlaylists,
      toggleLike,
      toggleSaveAlbum,
      toggleSavePlaylist,
      toggleFollow,
      createPlaylist,
      addToPlaylist,
    }),
    [lib, reload, liked, savedAlbums, savedPlaylists, following, ownPlaylists, toggleLike, toggleSaveAlbum, toggleSavePlaylist, toggleFollow, createPlaylist, addToPlaylist],
  );
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
