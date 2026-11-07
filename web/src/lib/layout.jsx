import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readJSON, writeJSON } from "@/lib/storage.js";

const LayoutContext = createContext(null);
export const useLayout = () => useContext(LayoutContext);

const KEY = "yt-layout";
export const LIBRARY_MIN = 280;
export const LIBRARY_MAX = 420;
export const LIBRARY_RAIL = 72;

export function LayoutProvider({ children }) {
  const saved = useMemo(() => readJSON(KEY, {}), []);
  const [panel, setPanel] = useState(saved.panel ?? null);
  const [libraryWidth, setLibraryWidth] = useState(saved.libraryWidth ?? 320);
  const [collapsed, setCollapsed] = useState(!!saved.collapsed);

  useEffect(() => {
    const t = setTimeout(() => writeJSON(KEY, { panel, libraryWidth, collapsed }), 300);
    return () => clearTimeout(t);
  }, [panel, libraryWidth, collapsed]);

  const togglePanel = useCallback((name) => setPanel((p) => (p === name ? null : name)), []);
  const resizeLibrary = useCallback((w) => setLibraryWidth(Math.min(LIBRARY_MAX, Math.max(LIBRARY_MIN, Math.round(w)))), []);

  const value = useMemo(
    () => ({ panel, setPanel, togglePanel, libraryWidth, resizeLibrary, collapsed, setCollapsed }),
    [panel, togglePanel, libraryWidth, resizeLibrary, collapsed],
  );
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}
