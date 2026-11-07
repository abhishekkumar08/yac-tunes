import { useParams } from "react-router-dom";
import { COPY } from "@/copy.js";
import { useApi } from "@/lib/api.js";
import { Loaded } from "@/components/PageState.jsx";
import { CardGrid } from "@/components/Card.jsx";

export function Section() {
  const { id } = useParams();
  const res = useApi(`/api/sections/${encodeURIComponent(id)}`);
  return (
    <Loaded result={res}>
      {({ items }) => (
        <div className="px-3 pb-10 pt-6">
          <h1 className="px-3 pb-2 text-headline font-bold text-fg">{COPY.HOME.SECTIONS[id] ?? id}</h1>
          <CardGrid items={items} />
        </div>
      )}
    </Loaded>
  );
}
