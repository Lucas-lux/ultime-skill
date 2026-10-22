---
name: social-publishing
description: >
  Goes from social strategy to publishing: editorial calendar, post preparation per platform,
  scheduling through official tools, validation before publishing, community management, measurement.
  Use to plan, prepare, schedule or publish posts, manage an editorial calendar or run a community on
  social networks.
---

# Publishing on social networks

The strategy, content pillars and formats are in the `social` skill; this skill covers execution.
**Nothing is published without the user's approval** (post by post, or an explicitly approved batch).

## Editorial calendar

A `content/calendar.csv` file (or `.md`), one line per post: date and time, platform, format, pillar,
text, visuals, alt text, link with UTM (skill `analytics`), partnership mention where applicable, status
(idea, drafted, approved, scheduled, published), results.

## Preparing a post

- Adapt to each platform (length, image or video format, tone) instead of duplicating.
- Accessibility: alt text for images, subtitles for videos.
- Tracked links (UTM); visuals from `marketing-creatives`.
- Proofread: accurate promise, mandatory mentions (`marketing-compliance-fr`), no third party's
  personal data.

## Scheduling and publishing

In order of preference:
1. The platforms' native tools (Meta Business Suite for Facebook and Instagram, TikTok scheduling
   tools, YouTube Studio, LinkedIn) from the user's accounts.
2. A scheduling tool the user already uses, through its official API (tokens configured by the user,
   never in the repository).
3. The browser (skill for the browser in use), filling in then letting the user validate.

Forbidden: automations that violate the platforms' terms (mass private messages, automatic
follow/unfollow, fake engagement, buying followers or reviews), and any unapproved publication.

## Community

- Response charter: tone, response times, what we answer, what we escalate (support, legal, crisis).
- Moderation according to a published rule; do not delete legitimate criticism; answer product
  questions with links to the help.
- Feed useful feedback back into the product backlog.

## Measurement

Weekly report: reach, engagement, clicks, follows, attributed conversions (UTM), best and worst posts,
learnings and calendar adjustments.
