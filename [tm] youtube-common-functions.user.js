function generateAllYouTubeSbUrls(fullYTHtml) {
  //# Based on:
  // https://github.com/hjk789/Userscripts/tree/master/YouTube-Clickbait-Buster
  // Enhanced with dynamic quality selection from iG8R/YouTube-Mouseover-Preview

  try {
    const resText = fullYTHtml;
    const fullStoryboardURL = resText.match(
      /"playerStoryboardSpecRenderer":.+?"spec":"(.+?)"/,
    );

    if (!fullStoryboardURL) {
      console.warn('[YT-Storyboard] No storyboard spec found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const rawSpecStr = fullStoryboardURL[1];

    // Check for ad storyboards
    if (rawSpecStr.includes('googleadservices')) {
      console.warn(
        '[YT-Storyboard] Ad storyboard detected, not video storyboard',
      );
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // Parse storyboard spec format: URL|Level0Data|Level1Data|Level2Data|...
    const parts = rawSpecStr.split('|');
    const urlBase = parts[0]; // The URL template

    if (parts.length < 2) {
      console.warn('[YT-Storyboard] Invalid storyboard format');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    // --- DYNAMIC QUALITY SELECTION: Find the highest resolution level ---
    let bestData = null;
    let bestRes = 0;
    let bestIndex = 0;

    // Iterate through all quality levels (parts[1] = Level 0, parts[2] = Level 1, etc.)
    for (let i = 1; i < parts.length; i++) {
      const levelStr = parts[i];
      // Format: Width#Height#Count#Cols#Rows#IntervalMs#Name#Signature#...
      const chunks = levelStr.split('#');

      // Need at least: width, height, count, cols, rows, and signature
      if (chunks.length < 5) continue;

      const w = parseInt(chunks[0], 10);
      const h = parseInt(chunks[1], 10);
      const count = parseInt(chunks[2], 10);
      const cols = parseInt(chunks[3], 10);
      const rows = parseInt(chunks[4], 10);
      const sig = chunks[chunks.length - 1]; // Signature is always last

      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) continue;

      const res = w * h; // Calculate resolution

      // Select the highest resolution available
      if (res > bestRes) {
        bestRes = res;
        bestIndex = i - 1; // Level index for URL (parts[0] is URL, so subtract 1)
        bestData = {
          width: w,
          height: h,
          frameCount: count,
          cols: cols,
          rows: rows,
          signature: sig,
        };
      }
    }

    if (!bestData) {
      console.warn('[YT-Storyboard] No valid quality level found');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    console.log(
      `[YT-Storyboard] Selected Level ${bestIndex}: ${bestData.width}x${bestData.height}px`,
    );

    // Construct the URL with the best quality level
    let baseUrl = urlBase.replace(/\\/g, '').replace('$L', bestIndex);

    // Append signature parameter
    if (baseUrl.indexOf('?') === -1) {
      baseUrl += `?sigh=${bestData.signature}`;
    } else {
      baseUrl += `&sigh=${bestData.signature}`;
    }

    // Extract video length for sampling frequency calculation
    const lengthMatch = resText.match(/"lengthSeconds":"(\d+)"/);
    if (!lengthMatch) {
      console.warn('[YT-Storyboard] Could not determine video length');
      return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
    }

    const videoLength = parseInt(lengthMatch[1], 10);

    // Calculate sampling frequency based on video length
    const samplingFq =
      videoLength <= 120
        ? 1
        : videoLength <= 300
          ? 2
          : videoLength < 900
            ? 5
            : 10;

    const trueNoOfSlots = Math.round(videoLength / samplingFq);

    // Calculate number of storyboard sheets needed
    const framesPerSheet = bestData.cols * bestData.rows;
    const numSheets = Math.ceil(bestData.frameCount / framesPerSheet);

    // Generate all storyboard URLs
    let allUrls = [];
    for (let i = 0; i < numSheets; i++) {
      const url = baseUrl.replace('$N', `M${i}`);
      allUrls.push(url);
    }

    console.log(
      `[YT-Storyboard] Generated ${allUrls.length} URLs for ${trueNoOfSlots} slots (${bestData.cols}x${bestData.rows} grid)`,
    );

    return {
      allUrls,
      trueNoOfSlots,
      samplingFq,
      quality: { width: bestData.width, height: bestData.height },
      framesPerSheet,
      horizontal: bestData.cols,
      vertical: bestData.rows,
    };
  } catch (error) {
    console.error('[YT-Storyboard] Error parsing storyboard:', error);
    return { allUrls: [], trueNoOfSlots: 0, samplingFq: 0 };
  }
}
