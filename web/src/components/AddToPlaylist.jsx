import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button, Input, Modal } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useLibrary } from "@/lib/library.jsx";
import { Cover } from "@/components/Cover.jsx";

const AddContext = createContext(() => {});
export const useAddToPlaylist = () => useContext(AddContext);

export function AddToPlaylistProvider({ children }) {
  const [trackIds, setTrackIds] = useState(null);
  const [filter, setFilter] = useState("");
  const { ownPlaylists, addToPlaylist, createPlaylist } = useLibrary();

  const open = useCallback((ids) => {
    setFilter("");
    setTrackIds(ids);
  }, []);
  const close = () => setTrackIds(null);

  const shown = useMemo(
    () => ownPlaylists.filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase())),
    [ownPlaylists, filter],
  );

  const add = async (playlist) => {
    const ids = trackIds;
    close();
    await addToPlaylist(playlist, ids);
  };
  const addToNew = async () => {
    const ids = trackIds;
    close();
    const created = await createPlaylist();
    if (created) await addToPlaylist(created, ids);
  };

  return (
    <AddContext.Provider value={open}>
      {children}
      <Modal open={!!trackIds} onClose={close} title={COPY.ADD_TO_PLAYLIST.TITLE} size="sm">
        <div className="flex flex-col gap-3">
          <Input
            aria-label={COPY.ADD_TO_PLAYLIST.FIND}
            placeholder={COPY.ADD_TO_PLAYLIST.FIND}
            leading={<Search className="h-4 w-4" aria-hidden="true" />}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <Button variant="ghost" className="justify-start gap-3" onClick={addToNew}>
            <Plus className="h-5 w-5" aria-hidden="true" />
            {COPY.ADD_TO_PLAYLIST.NEW}
          </Button>
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {shown.map((p) => (
              <li key={p.id}>
                <Button variant="ghost" className="h-auto w-full justify-start gap-3 py-2" onClick={() => add(p)}>
                  <Cover seed={p.seed} mosaic={p.mosaic} empty={p.empty} className="w-10" />
                  <span className="truncate">{p.name}</span>
                </Button>
              </li>
            ))}
            {!shown.length && <li className="px-3 py-2 text-caption text-fg-muted">{COPY.ADD_TO_PLAYLIST.NONE}</li>}
          </ul>
        </div>
      </Modal>
    </AddContext.Provider>
  );
}
