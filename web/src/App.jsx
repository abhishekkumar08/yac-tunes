import { Route, Routes } from "react-router-dom";
import { RequireAuth } from "@/lib/auth.jsx";
import { Shell } from "@/components/Shell.jsx";
import { Login } from "@/pages/Login.jsx";
import { Home } from "@/pages/Home.jsx";
import { Search } from "@/pages/Search.jsx";
import { Genre } from "@/pages/Genre.jsx";
import { Section } from "@/pages/Section.jsx";
import { Album } from "@/pages/Album.jsx";
import { Artist } from "@/pages/Artist.jsx";
import { Playlist } from "@/pages/Playlist.jsx";
import { LikedSongs } from "@/pages/LikedSongs.jsx";
import { Queue } from "@/pages/Queue.jsx";
import { NotFound } from "@/pages/NotFound.jsx";

export function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route path="signup" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="search/:q" element={<Search />} />
        <Route path="search/:q/:tab" element={<Search />} />
        <Route path="genre/:id" element={<Genre />} />
        <Route path="section/:id" element={<Section />} />
        <Route path="album/:id" element={<Album />} />
        <Route path="artist/:id" element={<Artist />} />
        <Route path="playlist/:id" element={<Playlist />} />
        <Route path="collection/tracks" element={<LikedSongs />} />
        <Route path="queue" element={<Queue />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
