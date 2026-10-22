---
paths:
  - "**/*.tf"
  - "**/*.tfvars"
  - "**/*.hcl"
---

# Terraform and OpenTofu

- Terraform and provider versions pinned, `.terraform.lock.hcl` versioned.
- Never a secret in the code or in versioned `.tfvars`; remote state encrypted and locked.
- Never `apply` or `destroy` without the user's explicit confirmation; `plan` first.
- `terraform fmt`, `validate` and `tflint` clean on the touched modules.
- Style: `snake_case`, a resource named `this` when it is unique in the module; every variable with
  `type` and `description` (and `validation` if the domain is restricted), every output with
  `description`; in a block: `count` or `for_each` first, then the arguments, the nested blocks, and
  `lifecycle` last.
- Native tests (`*.tftest.hcl`): `run` blocks with `command = plan` for fast tests, `mock_provider` to do
  without credentials, `expect_failures` to check the `validation` blocks.
