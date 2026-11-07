import { useParams } from "react-router-dom";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { Loaded } from "@/components/PageState.jsx";
import { CardGrid } from "@/components/Card.jsx";

export function Genre() {
  const { id } = useParams();
  const res = useApi(`/api/genres/${encodeURIComponent(id)}`);
  return (
    <Loaded result={res}>
      {({ genre, playlists, albums }) => (
        <div className="pb-10">
          <header className="px-6 pb-8 pt-20" style={{ background: `linear-gradient(hsl(${genre.hue} 60% 38%), rgb(var(--mw-surface)))` }}>
            <h1 className="text-[clamp(2.5rem,6vw,6rem)] font-black leading-none text-fg">{genre.name}</h1>
          </header>
          <div className="px-3">
            {playlists.length > 0 && (
              <>
                <h2 className="px-3 pt-4 text-title font-bold text-fg">{COPY.SEARCH.PLAYLISTS}</h2>
                <CardGrid items={playlists} />
              </>
            )}
            <h2 className="px-3 pt-4 text-title font-bold text-fg">{COPY.SEARCH.ALBUMS}</h2>
            <CardGrid items={albums} />
          </div>
        </div>
      )}
    </Loaded>
  );
}
