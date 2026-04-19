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
2. In the header's second row, use the `💨` button for manual speed toggle and the `🚀` toggle button for subtitle speed transition mode.
3. You can also enable the same transition mode from `Subtitle auto-speed` (checkbox); both controls stay synchronized.
4. Enter a subtitle CSS selector in `Subtitle selector`.
5. If you try to enable subtitle speed transition while the selector is empty, the script refuses to enable it and prompts you to enter the selector manually.
6. Set `Auto fast speed` (for subtitle gaps).
7. Enable `Pause on focus loss` if you want playback to stop when the tab loses focus, the browser is minimized, or you switch away.
8. Use the volume sliders as a two-stage control: the main slider controls `0` to `0.25`; when it reaches max, an extended slider appears for `0.25` to `1`.
9. Use `📷` to download a PNG snapshot, or `📋` to copy the current frame image to your clipboard.

The subtitle auto-speed status badge was removed from the panel UI. The feature behavior is unchanged and still follows selector presence and music-symbol detection rules described above.

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

- Settings are stored in one canonical userscript JSON object under `globalVideoControls`, with separate `profiles` (settings payloads) and `rules` (hostname routing).
- Canonical storage key is `globalVideoControls`, and its value must be an object containing `profiles` and `rules`.
- Old per-host flat keys are no longer read or migrated. Storage is profile/rule JSON only.
- On first run, the script seeds a default config object. If no rule matches the current hostname, the first setting write auto-creates an exact-host rule and profile (for example `auto:example.com`).
- Wildcard rule patterns are supported (for example `vidrock.*` and `*.vidsrc.*`) so TLD/domain changes can keep using the same profile.
- Setting changes are persisted immediately to the active profile (for example panel drag position, subtitle selector edits, auto-hide toggle, auto-speed toggle, and fast speed value).
- Subtitle auto-speed presence checks are observer-driven (no tight polling timer): it uses shared DOM observer helpers when available, with a local `MutationObserver` fallback for compatibility.
- When `Pause on focus loss` is enabled, playback resumes automatically when the tab regains focus after an automatic pause.
- While auto-speed is enabled, manual speed hotkeys (`z`, `x`, `c`) are ignored to avoid conflicts.
- Disabling subtitle auto-speed immediately resets playback to `1x`.
- The auto-pause behavior is frame-local, so it continues to work when the userscript is running inside an iframe.
- Cross-origin iframe players may expose subtitles outside the userscript context; in that case, use a selector that is visible from the current page context.
- Open shadow roots are supported directly; closed shadow roots are only partially discoverable by platform design.
- The extended volume slider is shown only when the base slider is at its maximum (or effective volume is above `0.25`) and hides again when volume returns below that threshold.
- The control panel remembers its dragged position in the active profile and respawns there on reload; if no saved position exists yet, it starts at the default location and does not write a position until you manually drag it.
- If saved coordinates become off-screen (for example after viewport size changes), they are clamped back into view automatically.
- The header now shows playback percentage (`played / duration * 100`) and updates continuously during playback.
- The header now has two rows inside `contPanelHeader`; the second row contains manual speed toggle (`💨`) and subtitle transition toggle (`🚀`).
- Internal control panel DOM updates are ignored by the page-level `MutationObserver` trigger path, which prevents self-induced refresh loops while paused.

### Storage Shape

```json
{
  "profiles": {
    "default": {
      "autoHide": false,
      "autoPauseOnBlur": false,
      "autoSpeedEnabled": false,
      "autoSpeedSelector": "",
      "autoSpeedFast": 3
    },
    "streamingDefault": {
      "autoHide": true,
      "autoPauseOnBlur": true,
      "autoSpeedEnabled": true,
      "panelPosition": { "left": 12, "top": 1 }
    },
    "vidrock": {
      "autoHide": true,
      "autoSpeedEnabled": false,
      "autoSpeedSelector": "[data-testid=\"caption-container\"]",
      "panelPosition": { "left": 177, "top": 2 }
    }
  },
  "rules": {
    "cloudnestra.com": "streamingDefault",
    "vidrock.*": "vidrock",
    "*.vidsrc.*": "streamingDefault"
  }
}
```
