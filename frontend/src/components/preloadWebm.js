let warmupVideo;

function ensureWarmupVideo() {
  if (warmupVideo) return warmupVideo;
  warmupVideo = document.createElement("video");
  warmupVideo.muted = true;
  warmupVideo.playsInline = true;
  warmupVideo.preload = "auto";
  warmupVideo.style.position = "fixed";
  warmupVideo.style.left = "-99999px";
  warmupVideo.style.width = "1px";
  warmupVideo.style.height = "1px";
  document.body.appendChild(warmupVideo);
  return warmupVideo;
}

export function preloadWebm(urls, { max = 6 } = {}) {
  const list = (urls || []).filter(Boolean).slice(0, max);

  // 1) network/cache warmup
  for (const url of list) {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "video";
    link.href = url;
    document.head.appendChild(link);
  }

  // 2) decode warmup (idle-ben)
  const run = async () => {
    const v = ensureWarmupVideo();
    for (const url of list) {
      try {
        v.src = url;
        v.load();

        // várjunk metadata-ig (gyors)
        await new Promise((resolve) => {
          const on = () => { cleanup(); resolve(); };
          const cleanup = () => {
            v.removeEventListener("loadedmetadata", on);
            v.removeEventListener("error", on);
          };
          v.addEventListener("loadedmetadata", on);
          v.addEventListener("error", on);
        });

        // pici “play-pause” decode trigger (muted → engedi)
        const p = v.play();
        if (p?.catch) await p.catch(() => {});
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore
      }
    }
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 300);
  }
}
