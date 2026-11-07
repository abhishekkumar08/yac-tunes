import { Link } from "react-router-dom";
import { Button, EmptyState } from "@kasumi/ui";
import { COPY } from "@/copy.js";

export function NotFound() {
  return (
    <EmptyState
      className="py-24"
      titleAs="h1"
      title={COPY.NOT_FOUND.TITLE}
      description={COPY.NOT_FOUND.BODY}
      action={
        <Button as={Link} to="/" className="rounded-full">
          {COPY.NOT_FOUND.HOME}
        </Button>
      }
    />
  );
}
