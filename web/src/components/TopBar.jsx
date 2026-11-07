import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Home, LayoutGrid, LogOut, Search, X } from "lucide-react";
import { Avatar, IconButton, Input, Menu, Tooltip, cn } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { useAuth } from "@/lib/auth.jsx";

function SearchBox() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fromUrl = pathname.startsWith("/search/") ? decodeURIComponent(pathname.slice(8).split("/")[0]) : "";
  const [q, setQ] = useState(fromUrl);
  const timer = useRef(null);

  useEffect(() => {
    if (!pathname.startsWith("/search")) setQ("");
    else setQ(fromUrl);
  }, [pathname, fromUrl]);

  const go = (value) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const v = value.trim();
      navigate(v ? `/search/${encodeURIComponent(v)}` : "/search", { replace: pathname.startsWith("/search") });
    }, 250);
  };

  return (
    <div className="w-full max-w-[30rem]">
      <Input
        type="search"
        aria-label={COPY.NAV.SEARCH_PLACEHOLDER}
        placeholder={COPY.NAV.SEARCH_PLACEHOLDER}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          go(e.target.value);
        }}
        onFocus={() => !pathname.startsWith("/search") && navigate("/search")}
        leading={<Search className="h-5 w-5" aria-hidden="true" />}
        trailing={
          q ? (
            <IconButton icon={X} label={COPY.NAV.CLEAR_SEARCH} variant="ghost" size="sm" onClick={() => (setQ(""), go(""))} />
          ) : (
            <Tooltip content={COPY.NAV.BROWSE}>
              <IconButton icon={LayoutGrid} label={COPY.NAV.BROWSE} variant="ghost" size="sm" onClick={() => navigate("/search")} />
            </Tooltip>
          )
        }
        className="h-12 rounded-full border-transparent bg-surface-muted text-body-lg hover:bg-surface-muted/80"
      />
    </div>
  );
}

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <div className="flex h-16 items-center gap-2 px-2">
      <Link to="/" aria-label={COPY.APP_NAME} className="mr-1 hidden shrink-0 rounded-full p-2 sm:block">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
      </Link>
      <div className="hidden gap-1 md:flex">
        <IconButton icon={ChevronLeft} label={COPY.NAV.BACK} variant="ghost" onClick={() => navigate(-1)} className="rounded-full bg-black/40" />
        <IconButton icon={ChevronRight} label={COPY.NAV.FORWARD} variant="ghost" onClick={() => navigate(1)} className="rounded-full bg-black/40" />
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        <Tooltip content={COPY.NAV.HOME}>
          <IconButton
            icon={Home}
            label={COPY.NAV.HOME}
            variant="secondary"
            onClick={() => navigate("/")}
            className={cn("h-12 w-12 shrink-0 rounded-full bg-surface-muted", pathname === "/" ? "text-fg" : "text-fg-muted")}
          />
        </Tooltip>
        <SearchBox />
      </div>
      {user && (
        <Menu
          align="end"
          label={COPY.NAV.ACCOUNT}
          items={[{ label: COPY.NAV.LOG_OUT, icon: LogOut, onSelect: logout }]}
          trigger={
            <IconButton
              icon={() => <Avatar name={user.name} size="sm" color={`hsl(${user.avatarHue} 70% 55%)`} />}
              label={`${COPY.NAV.ACCOUNT}: ${user.name}`}
              variant="ghost"
              className="h-12 w-12 rounded-full bg-black/40"
            />
          }
        />
      )}
    </div>
  );
}
