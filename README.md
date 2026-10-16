# LORE project page

Static project page for **LORE: Learning Contact-Rich Humanoid Loco-Manipulation without Paired Interaction Demonstrations**. The page uses plain HTML, CSS, and JavaScript, so it can be published directly with GitHub Pages.

## Local preview

Run this command in the project-page directory:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8000>. If an older version is cached, use `Ctrl+Shift+R`.

## Main video

In `index.html`, add the YouTube ID to `#main-video-card`:

```html
data-youtube-id="YOUTUBE_VIDEO_ID"
```

Use only the YouTube ID, not the complete URL.

## Experiment video paths

Place browser-compatible H.264 MP4 files at the following paths. Matching WebP posters live under `assets/posters/` with the same directory and filename. Posters load within 360px of the viewport. Up to two nearby videos warm their first frame in the background; visible videos waiting for data take priority over starting another warmup. Every video at least 75% visible plays automatically, with no limit on the number playing. Videos pause out of view; warmed/paused videos use `preload="metadata"` as a browser hint to reduce speculative downloading without discarding their buffers. Actual network buffering remains browser-controlled. Playback updates follow visibility changes instead of repeating `play()` on every scroll event. Click a video to show playback controls.

```text
assets/videos/comparisons/reference/
  carry_ours.mp4          carry_hdmi.mp4          carry_resmimic.mp4
  push_ours.mp4           push_hdmi.mp4

assets/videos/comparisons/general/
  carry_ours.mp4          carry_physhsi.mp4       carry_sonic.mp4
  push_ours.mp4           push_physhsi.mp4        push_sonic.mp4

assets/videos/contact_analysis/
  carry_size/lower.mp4    carry_size/upper.mp4
  carry_height/lower.mp4  carry_height/upper.mp4
  push_size/lower.mp4     push_size/upper.mp4
  push_friction/lower.mp4 push_friction/upper.mp4

assets/videos/ablation/carry/
  ours.mp4                from_scratch.mp4
  without_arm_load.mp4    without_contact_force.mp4
  action_space_residual.mp4

assets/videos/ablation/push/
  ours.mp4                from_scratch.mp4
  without_arm_load.mp4    without_contact_force.mp4
  action_space_residual.mp4

assets/videos/real_world/carry/
  height/low.mp4          height/mid.mp4           height/high.mp4
  size/small.mp4          size/mid.mp4             size/big.mp4
  weight/0_55kg.mp4       weight/1_3kg.mp4         weight/2_2kg.mp4
  weight/3_2kg.mp4
  cylinder/01.mp4         cylinder/02.mp4

assets/videos/real_world/push/
  size/small.mp4          size/mid.mp4             size/big.mp4
  ood/25kg_load.mp4       ood/bucket.mp4

assets/videos/kuavo/
  experiment-01.mp4       experiment-02.mp4
```

The ResMimic push-box cell is intentionally empty because no corresponding video is available.

## Responsive layout

`assets/css/index.css` defines the shared layout values at `:root`:

- `--content-width`: the centered page width (85vw, capped at 2200px).
- `--section-space`: each section's outer vertical padding. Do not add another pair of section paddings to `.results-shell` or in a laptop breakpoint.
- `--heading-space` and `--row-space`: spacing within sections.
- `--row-label-width`, `--row-gap`, `--media-gap`, and `--tile-width`: the common experiment grid, including Kuavo.
- `--video-ratio`: 16:9 for every video tile. Source videos use `object-fit: contain` to preserve their original proportions.

Font sizes and spacing scale continuously with the viewport. Breakpoints only change layout: Video/Abstract and row labels stack below 1000px, navigation collapses below 850px, and experiment strips become swipeable below 700px. Real-world two-video strips stay left-aligned at every screen width. Desktop carousel buttons advance one complete video column; Contact Analysis moves its upper and lower videos together. Task headings consistently use "Object Carrying" and "Object Pushing".

When changing layout, check 390, 768, 1000, 1024, 1280, 1366, 1440, 1536, 1919, 1920, and 2560px widths. Check section boundaries, 16:9 tile dimensions, the first and last carousel items, and 125%/150% display scaling. Increment the CSS/JS query versions in `index.html` when publishing edits.

## Before publication

Add the final publication details, main-video ID, and any final preview images before release. The experiment grouping and file paths can remain unchanged.
