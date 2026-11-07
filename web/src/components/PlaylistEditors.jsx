import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Button, Input, Modal, Textarea } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api, errorText, useApi } from "@/lib/api.js";
import { Cover } from "@/components/Cover.jsx";
import { ArtistLinks } from "@/components/TrackList.jsx";

/** Rename / describe an own playlist. */
export function EditDetails({ playlist, open, onClose, onSaved }) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.patch(`/api/playlists/${playlist.id}`, { name: name.trim(), description: description.trim() });
      onSaved(res.playlist);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={COPY.PLAYLIST.EDIT}
      footer={
        <Button type="submit" form="edit-playlist" loading={busy} disabled={!name.trim()} className="rounded-full px-6">
          {COPY.PLAYLIST.SAVE}
        </Button>
      }
    >
      <form id="edit-playlist" onSubmit={save} className="flex gap-4">
        <Cover seed={playlist.seed} mosaic={playlist.mosaic} empty={playlist.empty} className="hidden w-40 sm:block" />
        <div className="flex flex-1 flex-col gap-3">
          <Input label={COPY.PLAYLIST.NAME} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} error={error || undefined} required />
          <Textarea
            label={COPY.PLAYLIST.DESCRIPTION}
            placeholder={COPY.PLAYLIST.DESCRIPTION_PLACEHOLDER}
            value={description}
            maxLength={300}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

/** Search box under an own playlist for adding songs. */
export function FindSongs({ onAdd }) {
  const [q, setQ] = useState("");
  const res = useApi(q.trim() ? `/api/search?q=${encodeURIComponent(q.trim())}` : null);
  return (
    <section className="mt-6 border-t border-line px-6 pt-6">
      <h2 className="text-title-lg font-bold text-fg">{COPY.PLAYLIST.EMPTY_TITLE}</h2>
      <div className="mt-4 max-w-md">
        <Input
          aria-label={COPY.PLAYLIST.EMPTY_SEARCH}
          placeholder={COPY.PLAYLIST.EMPTY_SEARCH}
          leading={<Search className="h-4 w-4" aria-hidden="true" />}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <ul className="mt-4 flex flex-col">
        {(res.data?.tracks ?? []).slice(0, 10).map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-surface-muted/60">
            <Cover seed={t.albumSeed} className="w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-lg text-fg">{t.title}</p>
              <ArtistLinks artists={t.artists} className="block text-body text-fg-muted" />
            </div>
            <Link to={`/album/${t.albumId}`} className="hidden flex-1 truncate text-body text-fg-muted hover:underline md:block">
              {t.albumTitle}
            </Link>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => onAdd(t)}>
              {COPY.PLAYLIST.ADD}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
