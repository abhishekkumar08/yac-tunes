import { useCallback } from "react";
import { useNotifications } from "@kasumi/ui";
import { api, errorText } from "@/lib/api.js";
import { usePlayer } from "@/lib/player/PlayerProvider.jsx";

/** The player context a card stands for: a song card plays its album. */
export const cardContext = (card) => (card.type === "track" ? { type: "album", id: card.track.albumId } : { type: card.type, id: card.id });

async function tracksFor(card) {
  if (card.type === "album") {
    const { album } = await api.get(`/api/albums/${card.id}`);
    return { context: { type: "album", id: album.id, name: album.title }, list: album.tracks };
  }
  if (card.type === "playlist") {
    const { playlist } = await api.get(`/api/playlists/${card.id}`);
    return { context: { type: "playlist", id: playlist.id, name: playlist.name }, list: playlist.items.map((i) => i.track) };
  }
  if (card.type === "artist") {
    const { artist, popular } = await api.get(`/api/artists/${card.id}`);
    return { context: { type: "artist", id: artist.id, name: artist.name }, list: popular };
  }
  if (card.type === "liked") {
    const { items } = await api.get("/api/me/tracks");
    return { context: { type: "liked", id: "liked", name: card.name }, list: items.map((i) => i.track) };
  }
  const { album } = await api.get(`/api/albums/${card.track.albumId}`);
  return {
    context: { type: "album", id: album.id, name: album.title },
    list: album.tracks,
    index: Math.max(0, album.tracks.findIndex((t) => t.id === card.id)),
  };
}

/** Play (or pause) whatever a card stands for, fetching its tracks first. */
export function usePlayCard() {
  const player = usePlayer();
  const { notify } = useNotifications();
  return useCallback(
    async (card) => {
      const { type, id } = cardContext(card);
      if (player.isContext(type, id) && player.state.current && card.type !== "track") return player.togglePlay();
      try {
        const { context, list, index = 0 } = await tracksFor(card);
        if (list.length) player.playContext(context, list, index);
      } catch (err) {
        notify(errorText(err), "error");
      }
    },
    [player, notify],
  );
}
