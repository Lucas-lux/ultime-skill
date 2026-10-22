# Go, Rust, JVM, PHP, Ruby, scripts

## Go

`actions/setup-go@v7` (`go-version-file: go.mod`, built-in cache): `gofmt -l .` empty,
`golangci/golangci-lint-action@v9` (`.golangci.yml` configuration, linters `govet`, `staticcheck`,
`errcheck`, `gosec`, `revive`), `go test -race -shuffle=on -coverprofile=cover.out ./...`,
`govulncheck ./...`, `go build ./...`; nightly: `go test -fuzz` on the fuzzing targets, OS matrix.

## Rust

`dtolnay/rust-toolchain@stable` with `components: rustfmt, clippy`, `Swatinem/rust-cache` cache:
`cargo fmt --all --check`, `cargo clippy --all-targets --all-features -- -D warnings`,
`cargo test --all-features` (or `cargo nextest run`), `cargo deny check` (licenses, advisories,
duplicates); nightly: `cargo +nightly miri test` on `unsafe` code, `cargo fuzz` if present, MSRV
(`rust-version`).

## JVM (Java, Kotlin)

`actions/setup-java@v6` (temurin, project version), `gradle/actions/setup-gradle@v6` or Maven cache:
Gradle `./gradlew check` (tests, Spotless, Checkstyle or ktlint, SpotBugs or detekt, JaCoCo with a
threshold), Maven `./mvnw -B verify`; OWASP dependency-check or osv-scanner; Spring Boot: context test
and `bootBuildImage` for the container.

## PHP

`shivammathur/setup-php@2.40.0` (version from `composer.json`, required extensions):
`composer validate --strict`, `composer install --no-interaction --prefer-dist`, `composer audit`,
PHPStan (`vendor/bin/phpstan analyse --no-progress`, max level for a new project, baseline otherwise),
php-cs-fixer or PHP_CodeSniffer in `--dry-run`, PHPUnit or Pest with coverage; Laravel:
`php artisan test`, migrations on a service database; Symfony: `lint:container`, `doctrine:schema:validate`.

## Ruby

`ruby/setup-ruby` with `bundler-cache: true`: `bundle exec rubocop`, `bundle exec rspec`,
`bundle audit check --update`, Brakeman for Rails, `rails db:schema:load` on a service database.

## Scripts without a manifest (detector's `file_languages`)

- Shell: `shellcheck -S style` on each `*.sh` and the extensionless scripts with a shebang, `shfmt -d -i 2`.
- PowerShell: `Invoke-ScriptAnalyzer -Path . -Recurse -Severity Warning -EnableExit` (`windows-latest` runner or `pwsh` on
  Linux).
- Standalone Python or JavaScript (tooling, hooks): ruff, or `node --check` and the `node --test` tests
  if they exist; a minimal tooling `pyproject.toml` or `package.json` if the rules must be pinned.
