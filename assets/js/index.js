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

function createTileVideo(tile) {
  const relativePath = tile.dataset.videoPath;
  const cleanPath = relativePath.split("?")[0];
  const assetVersion = relativePath.startsWith("real_world/") ? "?v=h264-1080p-1" : "";
  const video = document.createElement("video");
  video.className = "video-preview";
  video.dataset.source = "assets/videos/" + relativePath + assetVersion;
  video.poster = "assets/posters/" + cleanPath.replace(/\.mp4$/i, ".webp");
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("loading", "lazy");
  video.setAttribute("aria-hidden", "true");

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
  video.play().catch(() => {});
}

function startAutoPlayback(tile) {
  if (tile.dataset.videoMissing === "true") return;
  const video = tile.querySelector("video") || createTileVideo(tile);
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
  video.play().catch(() => {});
}

function pauseTileVideo(tile) {
  tile.querySelector("video")?.pause();
  tile.classList.remove("autoplaying");
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
  });
});

if ("IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadVideoPreview(entry.target);
      });
    },
    { rootMargin: "100px 0px" },
  );
  videoTiles.forEach((tile) => videoObserver.observe(tile));
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const maxAutoplayVideos = 3;
const autoplayCandidates = new Set();
let autoplayFrame = 0;

function refreshAutoPlayback() {
  autoplayFrame = 0;

  if (reduceMotion || document.hidden) {
    videoTiles.forEach(pauseTileVideo);
    return;
  }

  const viewportCenter = window.innerHeight / 2;
  const activeTiles = [...autoplayCandidates]
    .filter((tile) => tile.dataset.inView === "true")
    .sort((first, second) => {
      const manualDifference = Number(second.querySelector("video")?.dataset.manual === "true")
        - Number(first.querySelector("video")?.dataset.manual === "true");
      if (manualDifference) return manualDifference;

      const firstBox = first.getBoundingClientRect();
      const secondBox = second.getBoundingClientRect();
      const firstDistance = Math.abs(firstBox.top + firstBox.height / 2 - viewportCenter);
      const secondDistance = Math.abs(secondBox.top + secondBox.height / 2 - viewportCenter);
      return firstDistance - secondDistance;
    })
    .slice(0, maxAutoplayVideos);
  const activeSet = new Set(activeTiles);

  videoTiles.forEach((tile) => {
    if (activeSet.has(tile)) {
      startAutoPlayback(tile);
    } else {
      pauseTileVideo(tile);
    }
  });
}

function scheduleAutoPlaybackRefresh() {
  if (autoplayFrame) return;
  autoplayFrame = window.requestAnimationFrame(refreshAutoPlayback);
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const playbackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= 0.15;
        entry.target.dataset.inView = String(shouldPlay);
        if (shouldPlay) {
          autoplayCandidates.add(entry.target);
        } else {
          autoplayCandidates.delete(entry.target);
        }
      });
      scheduleAutoPlaybackRefresh();
    },
    { threshold: [0, 0.15, 0.5] },
  );
  videoTiles.forEach((tile) => playbackObserver.observe(tile));
}

document.addEventListener("visibilitychange", () => {
  scheduleAutoPlaybackRefresh();
});
window.addEventListener("scroll", scheduleAutoPlaybackRefresh, { passive: true });
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
    track.addEventListener("scroll", () => updateScrollButtons(track), { passive: true });
  }

  button.addEventListener("click", () => {
    if (!track) return;
    const direction = Number(button.dataset.direction) || 1;
    track.scrollBy({ left: direction * track.clientWidth * 0.82, behavior: "smooth" });
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
