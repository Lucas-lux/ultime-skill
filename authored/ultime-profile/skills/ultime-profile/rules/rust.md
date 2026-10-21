---
paths:
  - "**/*.rs"
  - "**/Cargo.toml"
---

# Rust

- Pas de `unwrap()` ni `expect()` hors tests et invariants documentes ; erreurs typees (`thiserror`
  pour une bibliotheque, `anyhow` pour un binaire).
- `unsafe` seulement avec un commentaire `SAFETY:` qui justifie l'invariant.
- `cargo fmt` et `cargo clippy -- -D warnings` propres.
