# Unborrowed — The Hollow Bell

A complete small top-down pixel adventure. You are a red-caped courier arriving at a village whose bell has forgotten its voice.

## Play

Open the hosted prototype at https://tallyrift.frillycloud.chatgpt.site (the existing project URL; owner-private). The app itself is now Unborrowed. Mosswake is the village in its story.

The standalone **Unborrowed-offline.html** in the parent outputs folder contains the entire game, font, sprites, maps, story, and generated audio. No installation or server is needed for normal use. The browser automation policy does not allow direct `file://` testing; the identical standalone file was tested through local HTTP preview.

For development with Node, run `node server.mjs`, then open http://localhost:4173. No package installation is needed. Run tests with `node --test tests/engine.test.mjs tests/game/world.test.mjs`. Rebuild the standalone app with `node build-offline.mjs`.

## Controls

| Input | Action |
| --- | --- |
| WASD / arrows | Walk; hold to keep moving |
| E / Enter | Talk, examine, advance a conversation |
| Up / Down, then E / Enter | Select a dialogue response; mouse works too |
| L | Toggle the listening lantern after meeting Brin |
| Shift + direction | Mossstep dash after meeting Tove |
| I | Open the satchel |
| Escape | Close a conversation or open/close pause |
| M | Toggle the original ambient score |

The bridge has a short gap. Approach it closely and dash across along the planks. Deep water remains impassable. A mistimed crossing safely returns you to the bank. The winch on the far bank makes the crossing permanent.

## The vertical slice

- Four explorable, scrolling environments: Mosswake village, the Listening Wood, Glasswater, and the Buried Belfry.
- A controllable courier, solid terrain and props, animated water, moths, fire, lantern lighting, and a dash trail.
- Brin, Tove, and Nim have dialogue choices and remembered relationship responses. Orrin is an optional fourth character at the archive.
- The lantern reveals a concealed rootway; the recovered bell tongue opens the stair; the dash crosses terrain that ordinary walking cannot.
- Optional discoveries include Nim’s letter, a starflower that can be given to Brin, and a very important cat.
- Two complete endings. The village changes afterward, including Nim’s physical presence and character dialogue.
- Local autosave keeps area, position, discoveries, abilities, relationships, bridge repairs, and the ending. The pause menu can export and restore an actual story JSON file.
- The satchel, dialogue, pause screen, title, and ending are styled as game interfaces. There is no task dashboard or XP system.

This is an exploration and conversation game. Combat, mining, crafting, a large procedural world, and multiplayer are outside this vertical slice.

## Optional real-world chore

Orrin’s archive is reachable as a building in the village. The main adventure never requires a file import.

To retain the original hackathon’s real-work requirement, Orrin can read a real transaction CSV/TSV from the player’s device. Recognized columns include Date, Description/Merchant, Amount, and optionally Currency. Without a currency column, amounts are labeled USD. No source file is uploaded. File contents remain in tab memory and are not included in story saves.

Orrin’s dialogue lets the player categorize actual rows, review potential duplicates, undo a decision, and download the reviewed or partial CSV, excluded rows, and decision log. Original columns are preserved, with `mosswake_*` review fields added. Possible recurring patterns are noted in the output. An explicitly excluded row is available in a separate export. Closing the tab clears the working ledger, so export it first.

Helping with a ledger produces an actual paper-moth item in the satchel. This side interaction can be ignored while completing either ending.

## Architecture

The runtime is browser-native JavaScript and Canvas 2D, with no game engine installation, package dependencies, API keys, or application server.

- `dist/game/world.js`: map data, collision, real-time movement, dash physics, area transitions, discoverable entities, and save validation.
- `dist/game/render.js`: original code-drawn pixel sprites, cached terrain, depth ordering, animated world details, and lighting.
- `dist/game/story.js`: dialogue trees, choices, relationships, item grants, and endings.
- `dist/game/main.js`: keyboard/touch input, game loop, dialogue UI, inventory, pause, local saves, and archive encounter.
- `dist/game/audio.js`: an original generated ambient motif and short effects using Web Audio. Sound starts only after a user toggle.
- `dist/game/ledger.js` and `dist/engine.js`: optional CSV processing and verifiable exports.
- `dist/game.css`: game framing, pixel typography, dialogue, and responsive layout.

The VT323 font is bundled under its SIL Open Font License in `dist/fonts/VT323-OFL.txt`. The offline file embeds both the font and its license. Game art and sound are generated by the included code; no remote media is requested.

## Verification

26 automated tests pass, including terrain and prop collision, frame-rate-independent dash range, impassable water, hidden passage gating, reachable interaction positions, both story endings, relationship persistence, changed post-ending villagers, corrupt-save recovery, and actual ledger exports.

Browser tests walked the complete main route using keyboard input, played both endings, exported/restored a real checkpoint, reloaded saved progress, verified Nim’s homecoming, and completed a real three-row archive import with reviewed and excluded downloads. The standalone file was separately run through movement, checkpoint restore, an ending, and keyboard return to the village.
