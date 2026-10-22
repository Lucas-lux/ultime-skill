# Design footguns (dangerous APIs and configurations)

To run over the code and configuration touched. A footgun is not necessarily a vulnerability: it is a
place where an ordinary mistake becomes one. Report it as `minor` if it is not exploitable, as
`major` or `blocking` if an attack path exists.

## Defaults and configuration

- Debug mode, detailed error pages or administration console active outside development.
- CORS with reflected origin or `*` combined with credentials (cookies, `Authorization`).
- Session cookies without `Secure`, `HttpOnly`, `SameSite`; session duration without a limit.
- Configuration comparison permissive by default: a missing variable that disables a check
  (`if not CHECK_ENABLED`), an empty `ALLOWED_HOSTS` that accepts everything.
- Default secrets in the code (`SECRET_KEY = "change-me"`) used if the variable is missing.
- Webhook or internal API paths exposed without signature or authentication.

## Inputs and interpretation

- Deserialization of external data with a format that executes code (pickle, unsafe YAML,
  `unserialize`, `ObjectInputStream`, `eval`, `Function`).
- Building queries, commands, paths, URLs or template expressions by concatenation.
- XML parsers with external entities enabled; decompression without a size limit (zip bomb).
- Regular expressions with exponential backtracking on user input.
- Validation by denylist, or validation done after a normalization that changes the value.
- Redirects to a user-supplied URL; server requests to a supplied URL (SSRF), including through a link
  preview, an import by URL or a webhook.

## Identity and authorization

- Object identifier taken from the request without checking that it belongs to the caller (IDOR),
  especially on read, export and delete routes.
- Authorization check in the interface only, or only on some HTTP methods.
- Mass assignment: object built directly from the request body (`role`, `is_admin`, `tenant_id`
  modifiable).
- Tokens: algorithm accepted from the header (`alg: none`), signature not verified, audience or
  expiration ignored, secret shared between environments.
- Password reset or magic link without expiration, reusable, or predictable.
- Comparison of secrets by plain equality instead of a constant-time comparison.

## Concurrency and state

- Non-atomic check then act (TOCTOU): balance, stock, quota, single use of a code.
- No idempotency on payments and replayed webhooks.
- No rate limiting on login, sign-up, email or SMS sending, expensive endpoints.

## Cryptography and randomness

- Non-cryptographic randomness for tokens, session identifiers or codes.
- Encryption without authentication (mode without integrity), reused IV or nonce, key derived from a
  password without a slow function.
- Fast password hashing (MD5, plain SHA-x) instead of Argon2id, scrypt or bcrypt.
- TLS verification disabled (`verify=False`, `rejectUnauthorized: false`) left in place.

## Data and logs

- Personal data, tokens or secrets in logs, error messages, URLs or analytics.
- Uploaded files served from the same domain as the application, without checking the real type, or
  stored with the user-supplied name.
- Exports and backups reachable by a guessable URL.

## Agents and LLMs

- Model output used as a command, query, path or HTML without validation.
- External content (page, document, issue) treated as an instruction by a tooled agent.
- Agent tools with more rights than the task needs (write, network, secrets) without confirmation.
