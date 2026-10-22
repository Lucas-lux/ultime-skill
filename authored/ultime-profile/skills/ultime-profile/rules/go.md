---
paths:
  - "**/*.go"
  - "**/go.mod"
---

# Go

- Errors wrapped with context (`fmt.Errorf("...: %w", err)`), never ignored; no `panic` outside
  initialization.
- `context.Context` as the first parameter of every blocking or network call, propagated all the way.
- Goroutines with a guaranteed end (context, `errgroup`); no leak.
- The project's `gofmt`, `go vet` and `golangci-lint` clean on the touched packages.
