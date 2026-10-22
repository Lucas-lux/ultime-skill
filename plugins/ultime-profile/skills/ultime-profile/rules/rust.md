---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---

# Rust

- No `unwrap()` or `expect()` outside tests and documented invariants; typed errors (`thiserror`
  for a library, `anyhow` for a binary).
- `unsafe` only with a `SAFETY:` comment that justifies the invariant.
- `cargo fmt` and `cargo clippy -- -D warnings` clean.
