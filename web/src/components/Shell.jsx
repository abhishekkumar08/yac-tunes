import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useMediaQuery } from "@kasumi/ui";
import { useAuth } from "@/lib/auth.jsx";
import { LibraryProvider } from "@/lib/library.jsx";
import { PlayerProvider } from "@/lib/player/PlayerProvider.jsx";
import { LIBRARY_RAIL, LayoutProvider, useLayout } from "@/lib/layout.jsx";
import { AddToPlaylistProvider } from "@/components/AddToPlaylist.jsx";
import { TopBar } from "@/components/TopBar.jsx";
import { LibraryPanel } from "@/components/LibraryPanel.jsx";
import { PlayerBar } from "@/components/PlayerBar.jsx";
import { RightPanel } from "@/components/RightPanel.jsx";

function Frame() {
  const layout = useLayout();
  const narrow = useMediaQuery("(max-width: 899px)");
  const wide = useMediaQuery("(min-width: 1100px)");
  const main = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    main.current?.scrollTo(0, 0);
  }, [pathname]);
  const libWidth = narrow || layout.collapsed ? LIBRARY_RAIL : layout.libraryWidth;
  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <TopBar />
      <div className="flex min-h-0 flex-1 gap-2 px-2">
        <div className="shrink-0" style={{ width: libWidth }}>
          <LibraryPanel narrow={narrow} />
        </div>
        <main ref={main} id="main" className="yt-scroll relative min-w-0 flex-1 overflow-y-auto rounded-lg bg-surface">
          <Outlet />
        </main>
        {wide && <RightPanel />}
      </div>
      <PlayerBar />
    </div>
  );
}

export function Shell() {
  const { user } = useAuth();
  return (
    <LayoutProvider>
      <LibraryProvider key={user.id}>
        <PlayerProvider key={user.id} userId={user.id}>
          <AddToPlaylistProvider>
            <Frame />
          </AddToPlaylistProvider>
        </PlayerProvider>
      </LibraryProvider>
    </LayoutProvider>
  );
}
