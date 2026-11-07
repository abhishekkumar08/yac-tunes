import { COPY } from "@/copy.js";
import { QueueList } from "@/components/RightPanel.jsx";

export function Queue() {
  return (
    <div className="max-w-3xl px-6 pb-10 pt-6">
      <h1 className="pb-4 text-headline font-bold text-fg">{COPY.QUEUE_PAGE.TITLE}</h1>
      <QueueList />
    </div>
  );
}
