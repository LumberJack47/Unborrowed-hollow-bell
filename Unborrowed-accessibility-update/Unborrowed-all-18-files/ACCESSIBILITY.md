# Accessibility update

## Features

- A visible, keyboard-accessible settings panel appears before the game. Its controls have native checkbox semantics, labels, and persistent preferences.
- Text exploration provides a turn-based equivalent to visual exploration. Native buttons visit characters, examine objects, and travel between areas using the same story and save state. The bridge still requires the wind ribbon; the hidden stair still needs the lit lantern and recovered bell tongue. No timed movement is required in this mode.
- Readable-font and larger-text options, opaque dialogue surfaces, visible focus outlines, enlarged controls, and layouts that reflow on narrow screens improve readability and operability.
- Reduced motion freezes ambient canvas animation, removes transitions, and displays dialogue instantly. The initial preference follows the operating system; an explicit setting is remembered.
- Conversations and ending overlays have dialog semantics, announced descriptions, background isolation, focus containment, and focus restoration. Native menus have accessible names.
- A skip link bypasses the visual game to reach settings. Single-letter gameplay shortcuts are restricted to the focused canvas, preserving ordinary keyboard activation on controls.
- Screen-reader announcements describe areas and nearby objects without continuously speaking pixel coordinates or autosave notifications. Audio remains optional, and essential story information is available in text.

## Validation

Run `node --test tests/engine.test.mjs tests/game/*.test.mjs` (or `npm test`). All 29 tests passed during this update. Added tests verify text-mode progression gates, safe positions when switching to visual mode, both endings, and relationship save persistence. Existing game physics and transaction-engine tests also pass.

Axe-core 4.10.3 was run in Chrome against WCAG A/AA rules, including the 2.1 and 2.2 tags. Seven tested states reported no automated violations: title, text exploration, conversation choices, ending, pause menu, field notes, and a 320px layout with readable font and larger text. The narrow layout had no horizontal page overflow. Axe marked some contrast checks for manual review because of canvas/composited backgrounds; zero automated violations is not a claim of full conformance.

The song ending was completed in a browser through the text-mode controls. Both endings also pass the automated state-level route tests. See the accompanying validation report for additional browser checks.

## Limits

The evaluator in the submission screenshot does not disclose its rubric. These changes address actual barriers but cannot guarantee its score. Screen-reader usability should also be assessed by people using NVDA, JAWS, or VoiceOver; this update has not been manually tested with those programs. The visual canvas remains a spatial game, with text exploration offered as the accessible alternative.

## Deploy the update

Replace the contents of the existing `Unborrowed-all-18-files` directory on the same GitHub branch with the contents of this source folder. Preserve the folder hierarchy, including `dist/game/access.js`. Commit and redeploy.

In Vercel, keep Root Directory set to `Unborrowed-all-18-files`. The included `vercel.json` selects the Other/static framework, skips building, and serves `dist`. No runtime dependencies or keys are needed.

Re-run the submission evaluator against the updated commit after deployment. A score from the older commit will not reflect these improvements.
