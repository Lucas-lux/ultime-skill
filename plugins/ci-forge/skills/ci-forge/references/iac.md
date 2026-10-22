# Infrastructure as code

## Terraform and OpenTofu (`.tf` files detected)

| Job | Command | Level |
|---|---|---|
| format | `terraform fmt -check -recursive` (`hashicorp/setup-terraform@v4`; OpenTofu: `opentofu/setup-opentofu` and `tofu`) | PR |
| validate | per root module: `terraform init -backend=false` then `terraform validate` | PR |
| lint | `terraform-linters/setup-tflint@v6` (tflint 0.64.0), `tflint --init` then `tflint --recursive` with the provider plugin | PR |
| scan | `trivy config --severity HIGH,CRITICAL --exit-code 1 .` (or checkov if already used) | PR |
| test | `terraform test` if `.tftest.hcl` files exist | PR |
| plan | `terraform plan -lock=false` with read-only OIDC credentials, plan posted as a PR comment | PR, only if OIDC is configured |
| cost | Infracost (`infracost diff`) if `INFRACOST_API_KEY` exists, PR comment | PR |
| drift | `terraform plan -detailed-exitcode` on each environment, issue opened on drift | nightly, with OIDC |

- `apply` is never in the PR CI: it goes through `cd.md` (GitHub environment with a reviewer for
  production).
- Provider and Terraform versions pinned (`required_version`, `.terraform.lock.hcl` versioned).

## Others

- Pulumi: `pulumi preview` with OIDC, same rules as `plan`.
- Serverless, SAM, CDK: `cdk synth` then `cdk-nag` or `cfn-lint` on the template, `trivy config`.
- Ansible: `ansible-lint`, `molecule test` nightly.
