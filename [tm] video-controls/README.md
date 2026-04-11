# Global Video Controls Userscript

## Subtitle Auto-Speed (DOM Selector Mode)

This userscript now includes a speed-transition mode inspired by mpv behavior, adapted for webpages.

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

## Notes

- Settings are stored per hostname using `GM.getValue`/`GM.setValue` when available, with `localStorage` used only as a compatibility fallback.
- `Pause on focus loss` is also stored per hostname, so each domain can remember its own preference independently.
- While auto-speed is enabled, manual speed hotkeys (`z`, `x`, `c`) are ignored to avoid conflicts.
- Disabling subtitle auto-speed immediately resets playback to `1x`.
- The auto-pause behavior is frame-local, so it continues to work when the userscript is running inside an iframe.
- Cross-origin iframe players may expose subtitles outside the userscript context; in that case, use a selector that is visible from the current page context.
