# Licenses

This document is a technical reading of the licenses, not legal advice.

## What you are allowed to do

All the library's content is under a permissive license:

| License | Where | Obligations |
|---|---|---|
| MIT | the repository's own work (scripts, in-house packs, documentation) and 46 imported sources | keep the copyright notice and the license text |
| Apache-2.0 | 20 imported sources (Google, Android, AWS, Docker, Grafana, Hugging Face, Sentry, Anthropic...) | keep the license and the original `NOTICE`, flag modified files |
| BSD-3-Clause | the Flutter skills | keep the notice; do not use the authors' name to promote a derived product |

Internal or commercial use, modification, redistribution, integration into a product that is sold:
everything is allowed, as long as the notices are kept, and they are already in place in each imported
folder. There is no obligation to publish your own modifications.

## Import policy

- **Accepted**: MIT, Apache-2.0, BSD, ISC, and permissive equivalents.
- **Refused**: non-commercial licenses (CC-BY-NC, CC-BY-NC-SA), PolyForm, copyleft licenses (GPL, AGPL,
  LGPL, MPL, CC-BY-SA) and repositories without a license.
- A skill whose repository is permissive but whose skill itself carries another license (`LICENSE` file
  in its folder, `license:` field in its frontmatter, content derived from a work under another license)
  follows the most restrictive license. Example: a security review derived from the OWASP cheat sheets,
  under CC-BY-SA, was removed.
- A skill removed for its license is rewritten in-house **from scratch**, without reusing its text: a
  paraphrase would remain a derived work, under the original license. Only its name and its scope are
  used to know what to cover.

## Compliance records

- Each imported folder contains the license (and the `NOTICE`) of its source, copied at the pinned
  commit.
- `MODIFICATIONS.md` lists, folder by folder, the files modified at import and the nature of the change
  (em dashes replaced, invisible characters removed, self-promotion removed, passage adapted), as
  Apache-2.0 requires (section 4.b).
- `LICENSE-NOTE.md` explains the special cases: license only declared by the author with no file in
  their repository (two Vercel skills, MIT), skill license different from the repository's
  (`scikit-learn`, BSD-3-Clause in an MIT repository).
- [THIRD_PARTY.md](../THIRD_PARTY.md) records each import: path, repository, source path, commit,
  license.

## What the licenses do not cover

- **Trademarks** (Expo, Vercel, Flutter, Apple, Google...): you can use the skills, not the names for
  your own promotion.
- **The Apple device frames** provided as images by `app-store-screenshots`: the repository's MIT license
  does not guarantee rights to images of Apple products; for an App Store listing, prefer Apple's official
  frames (Apple Design Resources).
- **The terms of use of the services** that some skills drive (stores, cloud APIs, ad networks).

## Redo the audit

The declared licenses are in `scripts/gen_vendor.py`. To check the files actually shipped: classify each
`LICENSE*`, `NOTICE*` and `COPYING*` under `plugins/`, read the `license:` field of each `SKILL.md`, and
compare with the source's declared license and with the one GitHub detects at the pinned commit
(`gh api repos/<repository>/contents?ref=<commit>`). Every new source goes through this check before its
import.
