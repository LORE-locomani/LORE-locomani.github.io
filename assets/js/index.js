const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const progressBar = document.querySelector(".reading-progress span");
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

function updateProgress() {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

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
  const assetVersion = relativePath.startsWith("real_world/") ? "?v=h264-1080p-1" : "";
  const video = document.createElement("video");
  video.className = "video-preview";
  video.src = "assets/videos/" + relativePath + assetVersion;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.setAttribute("aria-hidden", "true");

  video.addEventListener(
    "loadedmetadata",
    () => {
      if (video.dataset.active === "true" || !Number.isFinite(video.duration) || video.duration <= 0.1) return;
      try {
        video.currentTime = Math.min(0.08, video.duration / 2);
      } catch {
        // The browser will keep the first decodable frame.
      }
    },
    { once: true },
  );

  video.addEventListener(
    "loadeddata",
    () => tile.classList.add("has-video"),
    { once: true },
  );

  video.addEventListener(
    "error",
    () => {
      tile.dataset.videoMissing = "true";
      tile.classList.remove("has-video", "playing", "autoplaying");
      if (video.dataset.manual === "true") {
        showToast("Add video: assets/videos/" + relativePath);
      }
      video.remove();
    },
    { once: true },
  );

  tile.append(video);
  video.load();
  return video;
}

function activateTileVideo(tile, video) {
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
        videoObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "500px 0px" },
  );
  videoTiles.forEach((tile) => videoObserver.observe(tile));
} else {
  videoTiles.forEach(loadVideoPreview);
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion && "IntersectionObserver" in window) {
  const playbackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= 0.35;
        entry.target.dataset.inView = String(shouldPlay);
        if (shouldPlay && !document.hidden) {
          startAutoPlayback(entry.target);
        } else {
          pauseTileVideo(entry.target);
        }
      });
    },
    { threshold: [0, 0.35, 0.7] },
  );
  videoTiles.forEach((tile) => playbackObserver.observe(tile));
} else if (!reduceMotion) {
  videoTiles.forEach(startAutoPlayback);
}

document.addEventListener("visibilitychange", () => {
  videoTiles.forEach((tile) => {
    if (document.hidden) {
      pauseTileVideo(tile);
    } else if (!reduceMotion && tile.dataset.inView === "true") {
      startAutoPlayback(tile);
    }
  });
});

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
