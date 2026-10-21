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
