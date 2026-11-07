CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_hue INTEGER NOT NULL DEFAULT 200,
  is_curator INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS genres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hue INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  seed INTEGER NOT NULL,
  base_listeners INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES artists(id),
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('album', 'single', 'ep')),
  year INTEGER NOT NULL,
  released_on TEXT NOT NULL,
  seed INTEGER NOT NULL,
  label TEXT NOT NULL DEFAULT 'YAC Records'
);

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id),
  title TEXT NOT NULL,
  track_no INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL,
  genre_id TEXT NOT NULL REFERENCES genres(id),
  base_plays INTEGER NOT NULL DEFAULT 0,
  audio_file TEXT NOT NULL,
  credit TEXT
);
CREATE INDEX IF NOT EXISTS tracks_album ON tracks(album_id, track_no);

CREATE TABLE IF NOT EXISTS track_artists (
  track_id TEXT NOT NULL REFERENCES tracks(id),
  artist_id TEXT NOT NULL REFERENCES artists(id),
  ord INTEGER NOT NULL,
  PRIMARY KEY (track_id, artist_id)
);
CREATE INDEX IF NOT EXISTS track_artists_artist ON track_artists(artist_id);

-- Positions are rewritten inside one transaction on every change; SQLite cannot defer a
-- UNIQUE check, so there is a plain index rather than a unique one.
CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  seed INTEGER NOT NULL,
  genre_id TEXT REFERENCES genres(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS playlist_items (
  id INTEGER PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id),
  position INTEGER NOT NULL,
  added_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS playlist_items_order ON playlist_items(playlist_id, position);

CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, track_id)
);

CREATE TABLE IF NOT EXISTS follows (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES artists(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE IF NOT EXISTS saved_albums (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  album_id TEXT NOT NULL REFERENCES albums(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, album_id)
);

CREATE TABLE IF NOT EXISTS saved_playlists (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, playlist_id)
);

CREATE TABLE IF NOT EXISTS plays (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL REFERENCES tracks(id),
  context_type TEXT NOT NULL CHECK (context_type IN ('album', 'playlist', 'artist', 'liked', 'search', 'queue')),
  context_id TEXT,
  played_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS plays_user ON plays(user_id, played_at);
CREATE INDEX IF NOT EXISTS plays_track ON plays(track_id);
