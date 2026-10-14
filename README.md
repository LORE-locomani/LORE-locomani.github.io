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

Place browser-compatible H.264 MP4 files at the following paths. Existing videos are detected lazily and their first frame replaces the image placeholder automatically; click the cover to play. Missing videos keep the original image placeholder.

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

## Before publication

Add the final publication details, main-video ID, and any final preview images before release. The experiment grouping and file paths can remain unchanged.
