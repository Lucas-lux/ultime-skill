---
paths:
  - "**/*.tsx"
  - "**/*.jsx"
  - "**/app/**"
  - "**/pages/**"
  - "**/components/**"
---

# React and Next.js

- Server components by default (App Router); `'use client'` only for state, effects or events, as low
  in the tree as possible.
- No `useEffect` to derive a value or to load data on the server side; no cascading fetches: load in
  parallel, `Suspense` for streaming.
- Accessibility: native elements (`button`, `a`, `label`), alternative text, visible focus, contrast.
- Forms: server-side validation mandatory (server actions or route), the client is trusted for
  nothing.
- Secrets never in a client component nor in a `NEXT_PUBLIC_` variable.
- Images through `next/image`, fonts through `next/font`, metadata through the `metadata` API.
