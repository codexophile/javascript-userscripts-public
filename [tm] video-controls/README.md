# Global Video Controls Userscript

## Subtitle Auto-Speed (DOM Selector Mode)

This userscript now includes a speed-transition mode inspired by mpv behavior, adapted for webpages.

Shadow DOM support:

- Video and audio detection now searches through reachable shadow roots.
- Subtitle selector matching also searches through reachable shadow roots.
- Closed shadow roots are best-effort only: they can be supported when created after script injection, but browser encapsulation can still block full coverage.

Behavior:

- If your subtitle selector matches visible, non-empty subtitle text, playback is forced to normal speed (`1x`).
- If your subtitle selector is not found, playback is forced to your configured fast speed.
- If your selector matches elements but they are empty (or only whitespace), playback stays at your configured fast speed.
- If matched subtitle text contains common musical symbols (`♪`, `♫`, `♬`, `♩`, `🎵`, `🎶`), playback is forced to fast speed.
- Elements matching the subtitle selector (and their descendants) are forced to text-selection-friendly styles (`user-select: text`, pointer events enabled, text cursor), so subtitle text can be selected/copied more reliably.
- When the userscript is running inside an iframe and a subtitle selector is set, the matched subtitle root is also repositioned toward the iframe center (`50% / 50%`) as a best-effort override.

This approach is site-agnostic and works even when native media text tracks are unavailable.

## How To Use

1. Open the control panel on a page with video.
2. In the header's second row, use the `💨` button for manual speed toggle and the `🚀` toggle button for subtitle speed transition mode.
3. You can also enable the same transition mode from `Subtitle auto-speed` (checkbox); both controls stay synchronized.
4. When the active site profile has a subtitle CSS selector saved in userscript storage, the `🚀` button shows a tiny green corner dot.
5. Enter a subtitle CSS selector in `Subtitle selector`.
6. If you try to enable subtitle speed transition while the selector is empty, the script refuses to enable it and prompts you to enter the selector manually.
7. Set `Auto fast speed` (for subtitle gaps).
8. Enable `Pause on focus loss` if you want playback to stop when the tab loses focus, the browser is minimized, or you switch away.
9. Use the volume sliders as a two-stage control: the main slider controls `0` to `0.25`; when it reaches max, an extended slider appears for `0.25` to `1`.
10. Use `📷` to download a PNG snapshot, or `📋` to copy the current frame image to your clipboard.

## Sync Config Across Devices (GitHub Gist)

The script now supports optional config sync using GitHub Gists.

What syncs:

- The canonical `globalVideoControls` JSON payload (`profiles` + `rules`).

What does not sync:

- Your GitHub token. The token is stored locally in userscript storage and never uploaded into the gist file.

### Setup

1. Open your userscript manager menu for this script.
2. Run `Video Controls: Sync Setup (GitHub Gist)`.
3. Provide:

- A GitHub personal access token with `gist` scope.
- Gist ID is hardcoded to `fa95900daa3e342803a3014e4a1285e9`.
- File name is hardcoded to `video-controls.json`.
- Visibility for newly created gists (`secret` or `public`).

Setup now prompts only for the GitHub token (stored locally in userscript storage).

### Manual Sync Actions

- `Video Controls: Sync Push -> Gist`: uploads current local config to gist.
- `Video Controls: Sync Pull <- Gist`: downloads gist config and applies immediately.
- `Video Controls: Sync Status`: shows current sync setup and last sync timestamp.

### Automatic Sync

- Local config writes now trigger automatic sync push to gist.
- Auto-push is debounced (about 2.5 seconds), so rapid UI edits are batched.
- Auto-push is silent (no success alert); failures are logged to console.
- Auto-push is intentionally skipped during startup config hydration and during `pull` imports to avoid sync loops.
- A `GM_addValueChangeListener` / `GM.addValueChangeListener` hook listens for cross-tab config storage changes and schedules sync from those updates too.
- A lightweight userscript-storage lock is used so multiple tabs do not spam duplicate auto-push requests at the same time.

If your userscript manager does not expose menu commands, use console helpers:

- `window.globalVideoControlsSync.setup()`
- `window.globalVideoControlsSync.push()`
- `window.globalVideoControlsSync.pull()`
- `window.globalVideoControlsSync.status()`

### Security Notes

- Keep your gist token private and prefer `secret` gist visibility unless you intentionally want public sharing.
- Anyone with a secret gist URL can read it.
- `pull` replaces local config with gist content after normalization.

The subtitle auto-speed status badge was removed from the panel UI. The feature behavior still follows visible-text subtitle detection and music-symbol override rules described above.

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
- Setting changes are persisted immediately to the active profile when they are meant to survive reloads (for example panel drag position, subtitle selector edits, auto-hide toggle, and fast speed value).
- Subtitle auto-speed enabled is session-only now; it resets on reload and is not written into profile storage.
- On startup, the script scans for duplicate subtitle selectors across profiles and can prompt to merge them into one profile.
- Duplicate selector matching is escape-tolerant for common quote variants (for example `[data-testid=\"caption-container\"]` and `[data-testid=caption-container]` are treated as the same selector for duplicate detection).
- Duplicate-profile merge target defaults to the active profile. If non-selector fields conflict, active profile values win and missing target fields may be filled from merged profiles.
- Subtitle auto-speed presence checks are observer-driven (no tight polling timer): it uses shared DOM observer helpers when available, with a local `MutationObserver` fallback for compatibility.
- When `Pause on focus loss` is enabled, playback resumes automatically when the tab regains focus after an automatic pause.
- While auto-speed is enabled, manual speed hotkeys (`z`, `x`, `c`) are ignored to avoid conflicts.
- Disabling subtitle auto-speed immediately resets playback to `1x`.
- The auto-pause behavior is frame-local, so it continues to work when the userscript is running inside an iframe.
- Subtitle centering in iframes is only attempted when you provide a non-empty subtitle selector.
- Cross-origin iframe players may expose subtitles outside the userscript context; in that case, use a selector that is visible from the current page context.
- Open shadow roots are supported directly; closed shadow roots are only partially discoverable by platform design.
- The extended volume slider is shown only when the base slider is at its maximum (or effective volume is above `0.25`) and hides again when volume returns below that threshold.
- The control panel remembers its dragged position in the active profile and respawns there on reload; if no saved position exists yet, it starts at the default location and does not write a position until you manually drag it.
- If saved coordinates become off-screen (for example after viewport size changes), they are clamped back into view automatically.
- The header now shows playback percentage (`played / duration * 100`) and updates continuously during playback.
- Header value badges briefly pulse whenever their displayed text changes for the frame rate, bitrate, and video-dimension readouts.
- The header now has two rows inside `contPanelHeader`; the second row contains manual speed toggle (`💨`) and subtitle transition toggle (`🚀`).
- The subtitle transition toggle (`🚀`) now shows a tiny green corner dot when the active site profile has a stored subtitle CSS selector.
- Internal control panel DOM updates are ignored by the page-level `MutationObserver` trigger path, which prevents self-induced refresh loops while paused.

### Storage Shape

```json
{
  "profiles": {
    "default": {
      "autoHide": false,
      "autoPauseOnBlur": false,
      "autoSpeedSelector": "",
      "autoSpeedFast": 3
    },
    "streamingDefault": {
      "autoHide": true,
      "autoPauseOnBlur": true,
      "panelPosition": { "left": 12, "top": 1 }
    },
    "vidrock": {
      "autoHide": true,
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
