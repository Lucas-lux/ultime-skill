# Infrastructure as code

## Terraform et OpenTofu (fichiers `.tf` detectes)

| Job | Commande | Niveau |
|---|---|---|
| format | `terraform fmt -check -recursive` (`hashicorp/setup-terraform@v4` ; OpenTofu : `opentofu/setup-opentofu` et `tofu`) | PR |
| validate | par module racine : `terraform init -backend=false` puis `terraform validate` | PR |
| lint | `terraform-linters/setup-tflint@v6` (tflint 0.64.0), `tflint --init` puis `tflint --recursive` avec le plugin du fournisseur | PR |
| scan | `trivy config --severity HIGH,CRITICAL --exit-code 1 .` (ou checkov si deja utilise) | PR |
| test | `terraform test` si des fichiers `.tftest.hcl` existent | PR |
| plan | `terraform plan -lock=false` avec identifiants OIDC en lecture seule, plan publie en commentaire de PR | PR, seulement si l'OIDC est configure |
| cost | Infracost (`infracost diff`) si `INFRACOST_API_KEY` existe, commentaire de PR | PR |
| drift | `terraform plan -detailed-exitcode` sur chaque environnement, issue ouverte si derive | nuit, avec OIDC |

- `apply` n'est jamais dans la CI de PR : il passe par `cd.md` (environnement GitHub avec relecteur
  pour la production).
- Versions du fournisseur et de Terraform figees (`required_version`, `.terraform.lock.hcl` versionne).

## Autres

- Pulumi : `pulumi preview` avec OIDC, meme regles que `plan`.
- Serverless, SAM, CDK : `cdk synth` puis `cdk-nag` ou `cfn-lint` sur le template, `trivy config`.
- Ansible : `ansible-lint`, `molecule test` la nuit.
