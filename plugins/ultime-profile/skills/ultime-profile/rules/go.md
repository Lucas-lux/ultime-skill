---
paths:
  - "**/*.go"
  - "**/go.mod"
---

# Go

- Erreurs enveloppees avec contexte (`fmt.Errorf("...: %w", err)`), jamais ignorees ; pas de `panic`
  hors initialisation.
- `context.Context` en premier parametre de tout appel bloquant ou reseau, propage jusqu'au bout.
- Goroutines avec une fin garantie (contexte, `errgroup`) ; pas de fuite.
- `gofmt`, `go vet` et `golangci-lint` du projet propres sur les paquets touches.
