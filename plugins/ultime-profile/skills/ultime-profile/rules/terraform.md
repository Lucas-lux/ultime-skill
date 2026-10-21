---
paths:
  - "**/*.tf"
  - "**/*.tfvars"
  - "**/*.hcl"
---

# Terraform et OpenTofu

- Versions de Terraform et des fournisseurs figees, `.terraform.lock.hcl` versionne.
- Jamais de secret dans le code ni les `.tfvars` versionnes ; etat distant chiffre et verrouille.
- Jamais `apply` ni `destroy` sans confirmation explicite de l'utilisateur ; `plan` d'abord.
- `terraform fmt`, `validate` et `tflint` propres sur les modules touches.
- Style : `snake_case`, une ressource nommee `this` quand elle est unique dans le module ; chaque
  variable avec `type` et `description` (et `validation` si le domaine est restreint), chaque sortie avec
  `description` ; dans un bloc : `count` ou `for_each` en premier, puis les arguments, les blocs
  imbriques, et `lifecycle` en dernier.
- Tests natifs (`*.tftest.hcl`) : blocs `run` avec `command = plan` pour les tests rapides,
  `mock_provider` pour se passer d'identifiants, `expect_failures` pour verifier les `validation`.
