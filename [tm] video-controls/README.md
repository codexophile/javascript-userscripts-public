# Global Video Controls Userscript

## Subtitle Auto-Speed (DOM Selector Mode)

This userscript now includes a speed-transition mode inspired by mpv behavior, adapted for webpages.

Shadow DOM support:

- Video and audio detection now searches through reachable shadow roots.
- Subtitle selector matching also searches through reachable shadow roots.
- Closed shadow roots are best-effort only: they can be supported when created after script injection, but browser encapsulation can still block full coverage.

Behavior:

- If your subtitle selector exists in the DOM, playback is forced to normal speed (`1x`).
- If your subtitle selector is not found, playback is forced to your configured fast speed.
- If matched subtitle text contains common musical symbols (`♪`, `♫`, `♬`, `♩`, `🎵`, `🎶`), playback is forced to fast speed.

This approach is site-agnostic and works even when native media text tracks are unavailable.

## How To Use

1. Open the control panel on a page with video.
2. Enable `Subtitle auto-speed` (checkbox).
3. Enter a subtitle CSS selector in `Subtitle selector`.
4. Set `Auto fast speed` (for subtitle gaps).
5. Enable `Pause on focus loss` if you want playback to stop when the tab loses focus, the browser is minimized, or you switch away.
6. Use the volume sliders as a two-stage control: the main slider controls `0` to `0.25`; when it reaches max, an extended slider appears for `0.25` to `1`.

Status badge values:

- `AUTO OFF`: feature disabled.
- `SELECTOR REQUIRED`: enabled but selector field is empty.
- `INVALID SELECTOR`: selector syntax is invalid.
- `AUTO NORMAL`: selector currently found, speed set to `1x`.
- `AUTO FAST`: selector not found, speed set to fast speed.
- `AUTO FAST (MUSIC)`: selector found and subtitle text contains musical symbols.

## Suggested Selectors

Examples to try and adjust per site:

- `.ytp-caption-segment`
- `.caption-window`
- `.jw-text-track-cue`
- `.vjs-text-track-cue`
- `.subtitle`

Tip:

- Prefer a selector that appears only when subtitle text is shown (not always-on wrapper elements).
- If subtitles live inside a web component, keep the selector relative to the subtitle nodes themselves; the script now searches inside shadow roots automatically.

## Notes

- Settings are stored per hostname using `GM.getValue`/`GM.setValue` when available, with `localStorage` used only as a compatibility fallback.
- `Pause on focus loss` is also stored per hostname, so each domain can remember its own preference independently.
- Subtitle auto-speed presence checks are observer-driven (no tight polling timer): it uses shared DOM observer helpers when available, with a local `MutationObserver` fallback for compatibility.
- When `Pause on focus loss` is enabled, playback resumes automatically when the tab regains focus after an automatic pause.
- While auto-speed is enabled, manual speed hotkeys (`z`, `x`, `c`) are ignored to avoid conflicts.
- Disabling subtitle auto-speed immediately resets playback to `1x`.
- The auto-pause behavior is frame-local, so it continues to work when the userscript is running inside an iframe.
- Cross-origin iframe players may expose subtitles outside the userscript context; in that case, use a selector that is visible from the current page context.
- Open shadow roots are supported directly; closed shadow roots are only partially discoverable by platform design.
- The extended volume slider is shown only when the base slider is at its maximum (or effective volume is above `0.25`) and hides again when volume returns below that threshold.
- The control panel remembers its dragged position per hostname and respawns there on reload; if no saved position exists yet, it starts at the default location and does not write a per-site position until you manually drag it.
- If saved coordinates become off-screen (for example after viewport size changes), they are clamped back into view automatically.
