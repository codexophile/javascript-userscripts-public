# Refactor Todo

## P0: Correctness fixes

2. [ ] Correct `getVideoFileSize` so it reports file size semantics, not video area.
3. [ ] Remove or rewrite the accidental React-style `Download` code so it uses the userscript style consistently.
4. [ ] Standardize `generateElements` and `replaceWith` return shapes so callers can rely on them.
5. [ ] Make `getAccentColor` parsing handle hex, `rgb()`, and `rgba()` safely.

## P1: Remove duplication

6. [ ] Extract the duplicate `throttle` in `markAndFilterCOM` and reuse the shared helper.
7. [ ] Consolidate `lazyLoad`, `lazyLoadWithObserver`, `lazyLoadScrollPast`, and `eagerLoad` into one configurable loader.
8. [ ] Merge `makeElementDraggableAndResizable`, `makeDraggable`, and `dragElement` around one drag core.
9. [ ] Rework `waitForAll`, `waitNotExist`, and `waitForNew` to use `CentralObserverManager` or a shared observer layer.
10. [ ] Combine `getVideoFileSize`, `getVideoSize`, and `getVideoInfo` into one `video` utility surface.
11. [ ] Replace `downloadText`, `downloadFile`, and related download code with one `downloadBlob` helper.
12. [ ] Merge `getAccentColor` and `getAccentColorFromFavicon` into one color utility.
13. [ ] Unify `isElementInViewport` and `getVisibleElements` into one visibility helper.
14. [ ] Normalize Greasemonkey requests behind a single `gmFetch` Promise wrapper.

## P2: Cleanup and maintainability

15. [ ] Reduce repeated `document.querySelectorAll` scans inside `CentralObserverManager.processMutations`.
16. [ ] Replace brittle `addStyle` equality checks with a stable style identity strategy.
17. [ ] Centralize recurring storage keys and config constants.
18. [ ] Split shared helpers into small utility modules where it reduces duplication.
19. [ ] Add small tests or examples for pure helpers like `rgbToHsl` and `toSeconds`.

## Suggested first pass

1. Fix `blink` and the `throttle` duplication first. (Items #1 and #6)
2. Then add `gmFetch` and update the request callers. (Item #14)
3. After that, tackle the video/download cleanup as a separate slice. (Items #10 and #11)
