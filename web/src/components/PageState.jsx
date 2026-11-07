import { EmptyState, ErrorState, Spinner } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { errorText } from "@/lib/api.js";

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <Spinner size="lg" label={COPY.LOADING} />
    </div>
  );
}

export function PageError({ error, onRetry }) {
  if (error?.status === 404) {
    return <EmptyState className="py-24" titleAs="h1" title={COPY.NOT_FOUND.TITLE} description={errorText(error)} />;
  }
  return <ErrorState className="m-8" message={errorText(error)} onRetry={onRetry} retryLabel={COPY.RETRY} />;
}

/** Renders loading / error for a useApi() result, else children(data). */
export function Loaded({ result, children }) {
  if (result.error) return <PageError error={result.error} onRetry={result.reload} />;
  if (!result.data) return <PageLoading />;
  return children(result.data);
}
