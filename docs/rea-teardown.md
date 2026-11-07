# yac-tunes — REA teardown of a public music web player (structure only)

Captured 2026-10-22 with REA 6.7.0 (`list-browser-targets`, `capture-web-screenshot`, `inspect-web-page
--include-accessibility-text`) on logged-out public pages in a throwaway Chrome (loopback port 9255,
scratchpad profile). No artwork, audio, names or code kept; screenshots stay in the session scratchpad.

## Shell (every page)
- Top bar: logo, round Home button, wide pill search combobox ("What do you want to play?") with a
  Browse icon button at its right end; right side: nav links, Install App, Sign up, Log in (pill).
- Left panel "Your Library" (resizable via slider "Resize main navigation"), header + "Create" (+) button;
  body is a grid of library rows (empty when logged out → "Create your first playlist" card).
- Main panel: rounded dark card, scrolls independently. Right edge: "Show Now Playing view" toggle.
- Bottom: complementary region "Now playing bar". Controls (in order): Enable shuffle (button),
  Previous, Play/Pause, Next, repeat as a checkbox ("Enable repeat" → "Enable repeat one" → "Disable repeat"),
  elapsed time, slider "Change progress", total time; right side: Mute button + slider "Change volume".
  Logged out the controls are disabled and a sign-up banner replaces the track info.

## Home
- Rows (shelves) with heading + "Show all": square cards (cover, title, 1–2 line subtitle);
  artist shelf uses circular images with "Artist" subtitle. Horizontal scroll with arrow.

## Album / single (/album/:id)
- Header on a colour gradient taken from the cover: cover (square, shadow), type label ("Album"/"Single"),
  huge title, "Artist • Artist • year • N songs, X min Y sec".
- Action row: big round Play, Shuffle, Save to Your Library (+ in circle), More options (…); right: "List" view toggle.
- Track grid: columns # | Title (title + artists under) | (clock) Duration. Footer: release date, © / ℗ lines.
  Then "More by <artist>" shelf.

## Artist (/artist/:id)
- Header: round photo, huge name, "N monthly listeners". Action row: Play, Shuffle, Follow (outline pill), More.
- "Popular": numbered rows with small cover, title, artists, play count, duration (top 5, "See more").

## Playlist (/playlist/:id)
- Header: "Public Playlist", huge title, description, owner • saves • "N songs, about X hr".
- Action row as album. Grid columns: # | Title (cover + title + artists) | Album | Duration.
- Row hover reveals "Add to Liked Songs" and "More options for <title> by <artists>"; row number becomes Play.

## Search (/search)
- Empty query: "Browse all" grid of coloured genre tiles (title top-left, tilted cover bottom-right).

## Not captured (needs login)
Player with a track loaded, Now Playing / Queue side panel, Library filters/sort, Liked Songs, context menus.
Design from the known product pattern.

## Signed in (user signed in themselves; captured 2026-10-22, layout only, profile deleted after)
- Top bar right: "Explore Premium" pill, Install App, bell (What's New), friends icon, avatar (user menu).
- Library panel header: "Your Library", Create (+), Expand/Collapse. Filter chips (listbox "Filter options":
  Playlists, Albums, Artists when present). Row: search-in-library icon button + "Recents" sort combobox with
  list-view icon. Grid rows: 48px cover (round for artists), name, "Playlist • owner" / "Album • artist",
  pin icon for pinned; hover shows Play; current page row highlighted.
- Liked Songs (/collection/tracks): purple→teal gradient cover with white heart, "Playlist", huge title,
  owner avatar • "N songs, X min Y sec". Actions: Play, Shuffle, Download. Columns: # | Title | Album |
  Date added | Duration.
- Player bar extra buttons (right cluster): Now Playing view, Queue (toggle, pressed state), Connect to a device,
  Mute + volume slider, Enter full screen.
- No playback captured: the throwaway profile had no track loaded (protected playback not attempted).
