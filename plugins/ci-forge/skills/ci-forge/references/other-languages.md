# Go, Rust, JVM, PHP, Ruby, scripts

## Go

`actions/setup-go@v7` (`go-version-file: go.mod`, cache integre) : `gofmt -l .` vide,
`golangci/golangci-lint-action@v9` (configuration `.golangci.yml`, linters `govet`, `staticcheck`,
`errcheck`, `gosec`, `revive`), `go test -race -shuffle=on -coverprofile=cover.out ./...`,
`govulncheck ./...`, `go build ./...` ; nuit : `go test -fuzz` sur les cibles de fuzzing, matrice d'OS.

## Rust

`dtolnay/rust-toolchain@stable` avec `components: rustfmt, clippy`, cache `Swatinem/rust-cache` :
`cargo fmt --all --check`, `cargo clippy --all-targets --all-features -- -D warnings`,
`cargo test --all-features` (ou `cargo nextest run`), `cargo deny check` (licences, avis, doublons) ;
nuit : `cargo +nightly miri test` sur le code `unsafe`, `cargo fuzz` si present, MSRV (`rust-version`).

## JVM (Java, Kotlin)

`actions/setup-java@v6` (temurin, version du projet), `gradle/actions/setup-gradle@v6` ou cache Maven :
Gradle `./gradlew check` (tests, Spotless, Checkstyle ou ktlint, SpotBugs ou detekt, JaCoCo avec seuil),
Maven `./mvnw -B verify` ; OWASP dependency-check ou osv-scanner ; Spring Boot : test de contexte et
`bootBuildImage` pour le conteneur.

## PHP

`shivammathur/setup-php@2.40.0` (version de `composer.json`, extensions requises) :
`composer validate --strict`, `composer install --no-interaction --prefer-dist`, `composer audit`,
PHPStan (`vendor/bin/phpstan analyse --no-progress`, niveau max pour un projet neuf, baseline sinon),
php-cs-fixer ou PHP_CodeSniffer en `--dry-run`, PHPUnit ou Pest avec couverture ; Laravel :
`php artisan test`, migrations sur base de service ; Symfony : `lint:container`, `doctrine:schema:validate`.

## Ruby

`ruby/setup-ruby` avec `bundler-cache: true` : `bundle exec rubocop`, `bundle exec rspec`,
`bundle audit check --update`, Brakeman pour Rails, `rails db:schema:load` sur base de service.

## Scripts sans manifeste (`file_languages` du detecteur)

- Shell : `shellcheck -S style` sur chaque `*.sh` et les scripts sans extension a shebang, `shfmt -d -i 2`.
- PowerShell : `Invoke-ScriptAnalyzer -Recurse -Severity Warning` (runner `windows-latest` ou `pwsh` sur
  Linux).
- Python ou JavaScript isoles (outillage, hooks) : ruff, ou `node --check` et les tests `node --test`
  s'ils existent ; un `pyproject.toml` ou `package.json` minimal d'outillage si les regles doivent etre
  figees.
