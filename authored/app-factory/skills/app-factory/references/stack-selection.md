# Choosing the stack

The choice is made by `software-architect` in P3 and recorded in an ADR with the discarded alternatives.
There is no universal stack: these landmarks are a starting point, not a rule.

## Principles

- **Proven technology** rather than new, unless there is a precise need. Each exotic component is a
  hiring and maintenance debt.
- **Skills of the team** that will maintain the product before the agent's preferences.
- **Managed services first** for a small team (database, authentication, queues, storage);
  self-host when cost, sovereignty or control justify it.
- **Data in the EU** by default for a European market (hosting region, processors).
- **Concrete versions**: take the latest stable version at scaffold time and write the exact
  version in the ADR and the README, never "latest".
- **Check up-to-date documentation** (Context7 or the official documentation) before writing code
  against a library, rather than relying on memory.

## Landmarks per need

| Need | Common starting point | Alternatives to consider |
|---|---|---|
| Web with SEO and public pages | React with an SSR framework (Next.js) | Nuxt, SvelteKit, Astro for content |
| Back office or private web app | SPA or SSR depending on the team | The team's full stack framework (Rails, Django, Laravel) |
| API | TypeScript (Node) or Python (FastAPI) | Go for performance, the team's language |
| Database | PostgreSQL | SQLite for a local tool, document database if the model truly requires it |
| Mobile iOS and Android, web team | Expo / React Native | Flutter (Dart team), Kotlin Multiplatform |
| Mobile tightly bound to the platform | Native Swift / SwiftUI and Kotlin / Compose | Hybrid with native modules |
| Hosting an MVP | Managed PaaS or serverless, EU region | Managed containers; Kubernetes only if the load and the team justify it |
| Observability | OpenTelemetry to a stack of choice | Equivalent managed service |

## Depending on the mode

- **Clone**: do not copy the reference app's stack on principle; start again from the PRD needs.
- **Takeover**: keep the existing stack by default. A migration is justified by an ADR (cost,
  risk, gain) and is done progressively, never as a big bang without a safety net.
