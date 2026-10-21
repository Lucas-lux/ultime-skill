# Choisir la stack

Le choix est fait par `software-architect` en P3 et consigne dans un ADR avec les alternatives ecartees.
Il n'y a pas de stack universelle : ces reperes servent de point de depart, pas de regle.

## Principes

- **Technologie eprouvee** plutot que nouvelle, sauf besoin precis. Chaque composant exotique est une
  dette de recrutement et de maintenance.
- **Competences de l'equipe** qui maintiendra le produit avant les preferences de l'agent.
- **Services manages d'abord** pour une petite equipe (base, authentification, files, stockage) ;
  auto-heberger quand le cout, la souverainete ou le controle le justifient.
- **Donnees en UE** par defaut pour un marche europeen (region d'hebergement, sous-traitants).
- **Versions concretes** : prendre la derniere version stable au moment du scaffold et ecrire la version
  exacte dans l'ADR et le README, jamais "latest".
- **Verifier la documentation a jour** (Context7 ou la documentation officielle) avant d'ecrire du code
  sur une bibliotheque, plutot que de se fier a la memoire.

## Reperes par besoin

| Besoin | Point de depart courant | Alternatives a considerer |
|---|---|---|
| Web avec SEO et pages publiques | React avec un framework SSR (Next.js) | Nuxt, SvelteKit, Astro pour du contenu |
| Back-office ou app web privee | SPA ou SSR selon l'equipe | Framework full stack de l'equipe (Rails, Django, Laravel) |
| API | TypeScript (Node) ou Python (FastAPI) | Go pour la performance, le langage de l'equipe |
| Base de donnees | PostgreSQL | SQLite pour un outil local, base documentaire si le modele l'exige vraiment |
| Mobile iOS et Android, equipe web | Expo / React Native | Flutter (equipe Dart), Kotlin Multiplatform |
| Mobile tres lie a la plateforme | Natif Swift / SwiftUI et Kotlin / Compose | Hybride avec modules natifs |
| Hebergement d'un MVP | PaaS ou serverless manage, region UE | Conteneurs manages ; Kubernetes seulement si la charge et l'equipe le justifient |
| Observabilite | OpenTelemetry vers une stack au choix | Service manage equivalent |

## Selon le mode

- **Clone** : ne pas recopier la stack de l'app de reference par principe ; repartir des besoins du PRD.
- **Reprise** : garder la stack existante par defaut. Une migration se justifie par un ADR (cout,
  risque, gain) et se fait progressivement, jamais en big bang sans filet.
