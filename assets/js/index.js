const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const toast = document.querySelector(".toast");
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2400);
}

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("open") ?? false;
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (link.getAttribute("href") !== "#") return;
    event.preventDefault();
    showToast(`${link.textContent.trim()} link will be added before release.`);
  });
});

const mainVideoCard = document.querySelector("#main-video-card");
const mainVideoPlayer = document.querySelector("#main-video-player");

function renderMainVideo() {
  if (!mainVideoCard || !mainVideoPlayer) return;

  const videoId = mainVideoCard.dataset.youtubeId;

  if (!videoId) {
    mainVideoPlayer.innerHTML = `<div class="video-empty"><span>▶</span><strong>Main paper video</strong></div>`;
    return;
  }

  const source = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`;

  mainVideoPlayer.innerHTML = `<iframe src="${source}" title="LORE project video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}

renderMainVideo();

const videoTiles = document.querySelectorAll(".media-tile[data-video-path]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const nearbyTiles = new Set();
const warmedTiles = new WeakSet();
const videoWarmups = new Map();
const pendingPlays = new WeakMap();
const maxBackgroundWarmups = 2;
let autoplayFrame = 0;

function finishVideoWarmup(tile, warmed = false) {
  const warmup = videoWarmups.get(tile);
  if (!warmup) return;
  warmup.cleanup();
  videoWarmups.delete(tile);
  if (warmed) warmedTiles.add(tile);
  if ((Number(tile.dataset.visibleRatio) || 0) < 0.75 && warmup.video.dataset.manual !== "true") {
    warmup.video.preload = "metadata";
  }
  scheduleAutoPlaybackRefresh();
}

function requestVideoPlayback(video) {
  if (!video.paused || pendingPlays.has(video)) return;
  const attempt = video.play();
  if (!attempt?.then) return;
  pendingPlays.set(video, attempt);
  const done = () => {
    if (pendingPlays.get(video) === attempt) pendingPlays.delete(video);
  };
  attempt.then(done, done);
}

function createTileVideo(tile) {
  const relativePath = tile.dataset.videoPath;
  const cleanPath = relativePath.split("?")[0];
  const posterVersion = new URLSearchParams(relativePath.split("?")[1] || "").get("v");
  const assetVersion = relativePath.startsWith("real_world/") ? "?v=h264-1080p-1" : "";
  const video = document.createElement("video");
  video.className = "video-preview";
  video.dataset.source = "assets/videos/" + relativePath + assetVersion;
  video.poster = "assets/posters/" + cleanPath.replace(/\.mp4$/i, ".webp")
    + (posterVersion ? "?v=" + encodeURIComponent(posterVersion) : "");
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-hidden", "true");
  video.addEventListener("canplay", scheduleAutoPlaybackRefresh);

  video.addEventListener(
    "loadeddata",
    () => tile.classList.add("has-video"),
    { once: true },
  );

  video.addEventListener(
    "error",
    () => {
      tile.dataset.videoMissing = "true";
      tile.classList.remove("has-poster", "has-video", "playing", "autoplaying");
      if (video.dataset.manual === "true") {
        showToast("Add video: assets/videos/" + relativePath);
      }
      video.remove();
    },
    { once: true },
  );

  tile.append(video);
  tile.classList.add("has-poster");
  return video;
}

function ensureTileVideoSource(video, preload = "auto") {
  video.preload = preload;
  if (video.dataset.sourceReady === "true") return;
  video.src = video.dataset.source;
  video.dataset.sourceReady = "true";
}

function activateTileVideo(tile, video) {
  finishVideoWarmup(tile, video.readyState >= 2);
  ensureTileVideoSource(video);
  video.dataset.active = "true";
  video.dataset.manual = "true";
  video.classList.remove("video-preview");
  video.removeAttribute("aria-hidden");
  video.controls = true;
  video.autoplay = true;
  video.loop = true;
  video.preload = "auto";
  tile.classList.remove("autoplaying");
  tile.classList.add("has-video", "playing");
  requestVideoPlayback(video);
}

function startAutoPlayback(tile) {
  if (tile.dataset.videoMissing === "true") return;
  const video = tile.querySelector("video") || createTileVideo(tile);
  finishVideoWarmup(tile, video.readyState >= 2);
  ensureTileVideoSource(video);
  video.classList.remove("video-preview");
  video.removeAttribute("aria-hidden");
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;
  video.preload = "auto";
  if (video.dataset.manual !== "true") {
    video.controls = false;
    tile.classList.add("autoplaying");
  }
  requestVideoPlayback(video);
}

function pauseTileVideo(tile) {
  const video = tile.querySelector("video");
  if (video) {
    // Prevent a late canplay event from restarting an offscreen video.
    video.autoplay = false;
    if (!video.paused || pendingPlays.has(video)) video.pause();
    if (!videoWarmups.has(tile) && video.dataset.sourceReady === "true") {
      video.preload = "metadata";
    }
  }
  tile.classList.remove("autoplaying");
}

function warmNearbyVideos() {
  for (const [tile, warmup] of videoWarmups) {
    if (document.hidden || !nearbyTiles.has(tile)) {
      finishVideoWarmup(tile, warmup.video.readyState >= 2);
    }
  }
  if (document.hidden || reduceMotion) return;

  // Visible videos always start immediately. Warmup slots only govern videos
  // that have not reached the playback threshold yet.
  const visibleVideoIsWaiting = [...videoTiles].some((tile) => {
    if ((Number(tile.dataset.visibleRatio) || 0) < 0.75 || tile.dataset.videoMissing === "true") return false;
    return (tile.querySelector("video")?.readyState ?? 0) < 3;
  });
  if (visibleVideoIsWaiting) return;

  const candidates = [...nearbyTiles]
    .filter((tile) => (Number(tile.dataset.visibleRatio) || 0) < 0.75 && !warmedTiles.has(tile)
      && !videoWarmups.has(tile) && tile.dataset.videoMissing !== "true")
    .sort((a, b) => {
      const distance = (tile) => {
        const box = tile.getBoundingClientRect();
        return Math.max(0, box.top - window.innerHeight, -box.bottom);
      };
      return distance(a) - distance(b);
    });

  for (const tile of candidates) {
    if (videoWarmups.size >= maxBackgroundWarmups) break;
    const video = tile.querySelector("video") || createTileVideo(tile);
    if (video.readyState >= 2) {
      warmedTiles.add(tile);
      continue;
    }
    const complete = () => finishVideoWarmup(tile, true);
    const failed = () => finishVideoWarmup(tile);
    // A stalled request must not hold a background slot indefinitely. Retrying
    // remains available when the video becomes visible.
    const timeout = window.setTimeout(() => {
      warmedTiles.add(tile);
      finishVideoWarmup(tile);
    }, 8000);
    videoWarmups.set(tile, {
      video,
      cleanup() {
        window.clearTimeout(timeout);
        video.removeEventListener("loadeddata", complete);
        video.removeEventListener("error", failed);
      },
    });
    video.addEventListener("loadeddata", complete, { once: true });
    video.addEventListener("error", failed, { once: true });
    ensureTileVideoSource(video);
  }
}

function loadVideoPreview(tile) {
  if (tile.dataset.previewAttempted === "true" || tile.querySelector("video")) return;
  tile.dataset.previewAttempted = "true";
  createTileVideo(tile);
}

videoTiles.forEach((tile) => {
  const playButton = tile.querySelector(":scope > button");
  playButton?.addEventListener("click", () => {
    if (tile.dataset.videoMissing === "true") {
      showToast("Add video: assets/videos/" + tile.dataset.videoPath);
      return;
    }
    const video = tile.querySelector("video") || createTileVideo(tile);
    activateTileVideo(tile, video);
    scheduleAutoPlaybackRefresh();
  });
});

if ("IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          nearbyTiles.add(entry.target);
          loadVideoPreview(entry.target);
        } else {
          nearbyTiles.delete(entry.target);
        }
      });
      scheduleAutoPlaybackRefresh();
    },
    { rootMargin: "360px 0px" },
  );
  videoTiles.forEach((tile) => videoObserver.observe(tile));
}

function refreshAutoPlayback() {
  autoplayFrame = 0;

  if (reduceMotion || document.hidden) {
    videoTiles.forEach(pauseTileVideo);
    warmNearbyVideos();
    return;
  }

  videoTiles.forEach((tile) => {
    const visibleRatio = Number(tile.dataset.visibleRatio) || 0;
    const isManual = tile.querySelector("video")?.dataset.manual === "true";
    if (visibleRatio >= 0.75 || (isManual && visibleRatio > 0)) {
      startAutoPlayback(tile);
    } else {
      pauseTileVideo(tile);
    }
  });
  warmNearbyVideos();
}

function scheduleAutoPlaybackRefresh() {
  if (autoplayFrame) return;
  autoplayFrame = window.requestAnimationFrame(refreshAutoPlayback);
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const playbackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.dataset.visibleRatio = String(entry.isIntersecting ? entry.intersectionRatio : 0);
      });
      scheduleAutoPlaybackRefresh();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  videoTiles.forEach((tile) => playbackObserver.observe(tile));
}

document.addEventListener("visibilitychange", () => {
  scheduleAutoPlaybackRefresh();
});
window.addEventListener("resize", scheduleAutoPlaybackRefresh, { passive: true });

const scrollButtons = [...document.querySelectorAll("[data-scroll]")];
const scrollTracks = new Set();

function updateScrollButtons(track) {
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  scrollButtons
    .filter((button) => button.dataset.scroll === track.id)
    .forEach((button) => {
      const direction = Number(button.dataset.direction) || 1;
      button.disabled = direction < 0 ? track.scrollLeft <= 2 : track.scrollLeft >= maxScroll - 2;
    });
}

scrollButtons.forEach((button) => {
  const track = document.getElementById(button.dataset.scroll);
  if (track && !scrollTracks.has(track)) {
    scrollTracks.add(track);
    track.addEventListener("scroll", () => {
      updateScrollButtons(track);
    }, { passive: true });
  }

  button.addEventListener("click", () => {
    if (!track) return;
    const direction = Number(button.dataset.direction) || 1;
    const item = track.firstElementChild;
    if (!item) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const step = item.getBoundingClientRect().width + gap;
    const index = Math.round(track.scrollLeft / step) + direction;
    track.scrollTo({ left: index * step, behavior: "smooth" });
  });
});

const refreshScrollButtons = () => scrollTracks.forEach(updateScrollButtons);
window.addEventListener("resize", refreshScrollButtons, { passive: true });
window.requestAnimationFrame(refreshScrollButtons);

const imageDialog = document.querySelector("#image-dialog");
document.querySelector(".zoom-button")?.addEventListener("click", () => imageDialog?.showModal());
imageDialog?.querySelector("button")?.addEventListener("click", () => imageDialog.close());
imageDialog?.addEventListener("click", (event) => {
  if (event.target === imageDialog) imageDialog.close();
});

document.querySelector("#copy-citation")?.addEventListener("click", async () => {
  const citation = document.querySelector("#citation-code")?.textContent.trim();
  if (!citation) return;
  try {
    await navigator.clipboard.writeText(citation);
    showToast("Citation copied.");
  } catch {
    showToast("Select the citation text to copy it.");
  }
});

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
