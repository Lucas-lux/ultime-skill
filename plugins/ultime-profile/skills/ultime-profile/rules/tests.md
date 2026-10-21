---
paths:
  - "**/test/**"
  - "**/tests/**"
  - "**/__tests__/**"
  - "**/*.test.*"
  - "**/*.spec.*"
  - "**/test_*.py"
  - "**/*_test.go"
  - "**/e2e/**"
---

# Tests

- Un test echoue d'abord pour la bonne raison, puis passe ; il verifie un comportement, pas une
  implementation.
- Pas de test saute, desactive ou affaibli pour faire passer la CI : corriger le code ou le test faux,
  et le dire.
- Determinisme : pas d'horloge, d'aleatoire ni de reseau reels sans controle ; pas de dependance a
  l'ordre des tests.
- Donnees de test factices et minimales ; jamais de donnees de production.
