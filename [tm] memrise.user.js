(function () {
  'use strict';

  waitForEach('[data-testid="plans-page"]', async () => {
    const closeBtnEl = await waitFor(`[aria-label="Close"]`);
    closeBtnEl.click();
  });
})();

//* taming audio volume
(function () {
  'use strict';
  if (window.top != window.self) return; //don't run on frames or iframes

  // Set your desired volume level here (0.0 to 1.0)
  // 0.3 means 30% of the original volume
  const TARGET_VOLUME = 0.2;

  console.log(
    `[Memrise Volume Limiter] Initializing... Target volume: ${TARGET_VOLUME}`,
  );

  // ====================================================================
  // METHOD 1: Intercept HTML5 Audio (new Audio())
  // ====================================================================

  // Intercept the 'volume' property on all media elements
  const originalVolumeDescriptor = Object.getOwnPropertyDescriptor(
    HTMLMediaElement.prototype,
    'volume',
  );
  if (originalVolumeDescriptor) {
    Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
      get: function () {
        // Return the "fake" volume to the site so its internal logic doesn't break
        return originalVolumeDescriptor.get.call(this) / TARGET_VOLUME;
      },
      set: function (val) {
        // Scale down the requested volume before setting it
        originalVolumeDescriptor.set.call(this, val * TARGET_VOLUME);
      },
    });
  }

  // Intercept the play() method.
  // If the site never explicitly sets the volume, it defaults to 1.0. We force it to lower here.
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (originalVolumeDescriptor.get.call(this) === 1.0) {
      this.volume = 1.0; // This triggers our custom setter above, reducing it to TARGET_VOLUME
    }
    return originalPlay.apply(this, arguments);
  };

  // ====================================================================
  // METHOD 2: Intercept Web Audio API (AudioContext)
  // ====================================================================

  const originalConnect = AudioNode.prototype.connect;

  AudioNode.prototype.connect = function (...args) {
    const destination = args[0];

    // Check if the script is trying to connect audio to the final speakers (AudioDestinationNode)
    if (
      destination &&
      window.AudioDestinationNode &&
      destination instanceof AudioDestinationNode
    ) {
      const ctx = destination.context;

      // Create a custom GainNode (volume knob) for this context if we haven't already
      if (!ctx.__volumeLimiterGain) {
        ctx.__volumeLimiterGain = ctx.createGain();
        ctx.__volumeLimiterGain.gain.value = TARGET_VOLUME;

        // Connect our GainNode to the actual speakers
        originalConnect.call(ctx.__volumeLimiterGain, destination);
        console.log(
          '[Memrise Volume Limiter] Web Audio API intercepted and GainNode inserted.',
        );
      }

      // Connect the current node to our GainNode instead of directly to the speakers
      originalConnect.call(
        this,
        ctx.__volumeLimiterGain,
        args[1] || 0,
        args[2] || 0,
      );

      // Return the original destination to maintain normal Javascript behavior
      return destination;
    }

    // If it's connecting to anything else (like an analyzer or filter), behave normally
    return originalConnect.apply(this, args);
  };
})();
