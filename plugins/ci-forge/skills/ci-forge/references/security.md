# Securite dans la CI (tout projet)

| Job | Outil | Niveau | Notes |
|---|---|---|---|
| secrets | gitleaks 8.30.1 en CLI (binaire fige et verifie, ou image `zricethezav/gitleaks:v8.30.1`) : `gitleaks git --redact --exit-code 1` sur l'historique de la PR | PR | l'action officielle demande une licence pour les comptes d'organisation : utiliser le CLI |
| deps | `google/osv-scanner-action` (workflow reutilisable `osv-scanner-reusable-pr.yml`, v2.7.0) : nouvelles vulnerabilites introduites par la PR | PR | gratuit, tous ecosystemes |
| deps-review | `actions/dependency-review-action@v5` : licences interdites, vulnerabilites | PR | depot public, ou prive avec GitHub Advanced Security |
| sast | `github/codeql-action@v4` (init, autobuild, analyze), requetes `security-extended` | PR + nuit | public, ou prive avec Advanced Security |
| sast (sans GHAS) | Semgrep CE 1.182 : `semgrep scan --config p/default --config p/<langage> --metrics=off --error` | PR | remplace CodeQL sur un depot prive sans licence |
| workflows | `zizmor .github/workflows` (1.31.1) et `actionlint` (1.7.12) | PR | |
| iac et images | Trivy (`config`, `image`), voir `containers-k8s.md` et `iac.md` | PR | |
| sbom et provenance | SBOM SPDX, `actions/attest-build-provenance@v4` | principale, release | |
| scorecard | `ossf/scorecard-action@v2.5.0` | nuit | depot public seulement |
| dast | OWASP ZAP baseline (`zaproxy/action-baseline`) contre staging | nuit | jamais contre la production sans accord |

- Resultats SARIF publies dans l'onglet securite si Advanced Security est disponible
  (`security-events: write`), sinon en artefact et en echec du job.
- Les exceptions (faux positifs) sont dans le fichier de l'outil (`.gitleaks.toml`, `.trivyignore`,
  `.semgrepignore`), une ligne par exception, avec la raison et une date de revue.
- Le pack `security` (skills `security-review`, `sast`, `auditing-supply-chain`, `gha-security-review`) sert a
  analyser les resultats ; ci-forge installe les controles.
