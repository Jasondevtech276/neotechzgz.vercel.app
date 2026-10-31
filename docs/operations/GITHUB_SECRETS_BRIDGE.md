# NEOTECHZGZ — GitHub Actions Secrets bridge

## Deployment topology

The Bridge is an isolated Cloudflare Worker named `neotechzgz-github-secrets-bridge`. It must never replace or share bindings with the existing production Worker `neotechzgz`. The source of truth is branch `feat/github-secrets-bridge`; PR #72 remains unmerged until review and explicit approval.

The Worker is fixed to repository `Jasondevtech276/neotechzgz.vercel.app`. It exposes an authenticated MCP endpoint and a separate secret-entry page. It never returns secret values.

## Credentials and least privilege

Create a GitHub App installed only on `Jasondevtech276/neotechzgz.vercel.app`.

Required GitHub App permissions:
- Repository metadata: read-only.
- Repository **Actions: read and write** (required by the Actions secrets REST endpoints).

Do not grant Contents, Administration, Workflows, Deployments, organization-wide access, or permissions on other repositories. Generate a private key and store it only as a Cloudflare Worker secret.

The App ID is `5545695`; the installation ID is `176987145`. These identifiers are non-secret. Confirm both in the GitHub App settings before enabling any operation.

## Cloudflare bindings

For the Worker **Production** environment, configure these plain-text variables:
- `GITHUB_REPOSITORY=Jasondevtech276/neotechzgz.vercel.app`
- `GITHUB_APP_ID=5545695`
- `GITHUB_INSTALLATION_ID=176987145`
- `ENABLE_TEST_SECRET_PROBE=false`
- `ENABLE_PRODUCTION_SECRET_OPS=false`
- `ALLOWED_SECRET_NAMES=` (empty until an explicitly reviewed allowlist is approved).

Configure these as **Secret** bindings, never plain-text variables:
- `GITHUB_APP_PRIVATE_KEY`: GitHub App PEM private key.
- `BRIDGE_API_TOKEN`: independently generated random bearer credential with at least 32 random bytes.

Do not paste either secret into ChatGPT, GitHub source, issue comments, CI variables, terminal command arguments, shell history, or logs. Use the Cloudflare Dashboard secret editor or `wrangler secret put NAME` from a trusted local terminal. For Termux, use a protected local file and pipe it to Wrangler; do not use `echo SECRET`, command-line arguments, or shell tracing. Keep the private key and bearer token separate.

After saving, reload the Production settings page. Verify the names and types are present. The Cloudflare API should list the two secret binding names and the expected non-secret variables. A successful Dashboard save is not sufficient if the deployed Worker version does not receive the bindings.

## Branch and production separation

- PR branch: `feat/github-secrets-bridge`; CI only. Do not point the production Worker deployment trigger at `main` or another application Worker.
- Worker service: `neotechzgz-github-secrets-bridge` only.
- Existing Worker `neotechzgz`: no changes.
- Keep `workers_dev=false` until a dedicated endpoint/domain and access policy are reviewed. Do not expose the secret-entry page on an unprotected public hostname.
- Cloudflare Dashboard Deploy action is in Workers & Pages → `neotechzgz-github-secrets-bridge` → Production → Deployments (or the Deploy button in the Worker's Overview/Deployments view). Review the target Worker and environment shown in the confirmation dialog before confirming.

## Validation and release gates

1. CI must pass on the exact branch commit.
2. Cloudflare Production settings must show all four credential bindings with correct types; API metadata must independently confirm the names without reading values.
3. Validate GitHub App installation and permissions using a read-only API operation.
4. Validate unauthenticated `/mcp` returns 401 only after a dedicated HTTPS endpoint has been configured.
5. Validate authenticated `bridge_status` and `list_secret_names`; list output may contain names and timestamps only.
6. Keep `ENABLE_TEST_SECRET_PROBE=false` unless a separately approved, one-time probe test is being executed.
7. If a probe is approved, verify creation, metadata visibility, deletion, and absence; then reset the flag to false.
8. Keep `ENABLE_PRODUCTION_SECRET_OPS=false` and the allowlist empty until a separate production change approval.

## Current decision

HOLD. Do not deploy a runnable Bridge until both Cloudflare secret bindings are confirmed in the active Worker environment, the branch CI is green, and the endpoint exposure model is configured. Never enable production secret writes as part of initial deployment.
