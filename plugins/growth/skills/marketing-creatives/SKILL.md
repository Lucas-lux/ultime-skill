---
name: marketing-creatives
description: >
  Production pipeline for the marketing creatives of an app or product: brief, concepts, images,
  videos (UGC, demo, motion), platform variants, rights and mentions, organization and testing. Use to
  produce ad creatives, visuals, marketing videos, UGC videos, launch content or a campaign kit.
---

# Marketing creatives (images and videos)

This skill orchestrates the production tools; the detailed creative strategy is in `ad-creative`, the
copy in `copywriting`.

## Pipeline

1. **Context**: read `.agents/product-marketing.md` (skill `product-marketing`); otherwise create it.
2. **Brief**: goal (awareness, installs, conversion), audience, platform, message, proof, call to
   action, brand and budget constraints.
3. **Concepts**: each concept is a testable hypothesis (audience, motivation, angle, format)
   (`ad-creative`, `marketing-psychology`).
4. **Production** with the appropriate tool (see table), cost estimate before any paid generation, and
   the user's approval.
5. **Variants** per format and platform; burned-in subtitles (many videos are watched without sound);
   interface safe zones respected.
6. **Check**: faithfulness to the product, readability on mobile, rights, mandatory mentions.
7. **Delivery and tests**: campaign manifest, then tracking of results by concept.

## Tools

| Need | Skills (if installed) |
|---|---|
| Marketing images, social visuals | `image`; `gen-ai-images`; `google-flow-generate` (included in a Google AI Pro subscription) |
| Generated or programmatic video | `video`; `gen-ai-video`; `google-flow-generate` |
| UGC video with a recurring actor presenting the app | `ugc-app-video` |
| Voice-over, music, sounds | `gen-ai-audio` |
| Editing, subtitles, formats | video-editing pack (`ffmpeg-video-editor`, `video-use`, `faster-whisper`) |
| Animation and motion design | motion-design pack (GSAP, Lottie, Manim) |
| Store screenshots and preview video | `app-store-screenshots`, `app-preview-video` (store-aso pack) |

Favor what the user already pays for (subscription) before pay-per-use credits; announce the estimated
cost before generating.

## Common formats

Vertical 9:16 (Reels, TikTok, Shorts, Stories), 4:5 and 1:1 (feeds), 16:9 (YouTube, web). The exact
durations, file sizes and safe zones change: check them in each platform's documentation before export.

## Rights and mentions

- Music licensed for advertising (the platforms' free libraries do not always cover advertising use).
- Filmed people or creators: written authorization (image rights), contract specifying uses, media and
  duration; mention of the commercial collaboration.
- No fake testimonial presented as real, no feature absent from the app, no fake system interface
  (notification, button) that deceives.
- AI-generated content: apply the labels required by the platforms for realistic content; in the EU,
  the AI Act requires disclosing deepfakes; in France, the influencer marketing law requires mentions
  for retouched or virtual images (details in `marketing-compliance-fr`).

## Organization

`creatives/<campagne>/<concept>/<format>/` and one `manifest.md` per campaign: concept, hypothesis,
files, tool and cost, rights and mentions, status (draft, approved, live), results.
