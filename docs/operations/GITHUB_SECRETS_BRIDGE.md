# NEOTECHZGZ — GitHub Actions Secrets bridge

## Deployment state

This implementation is staged on branch `feat/github-secrets-bridge`. A fail-closed placeholder Worker named `neotechzgz-github-secrets-bridge` has been created in Cloudflare with `workers_dev=false`, no bindings, and a 503 response; it is not publicly reachable and has no access to GitHub secrets. The actual MCP Worker bundle has not been deployed. Cloudflare's Workers Builds repository-connection API returned HTTP 404 because the account is disconnected from GitHub. Connect only this new placeholder Worker to GitHub in Cloudflare Dashboard → Workers & Pages → `neotechzgz-github-secrets-bridge` → Settings → Builds → Connect. Do not connect the existing production Worker `neotechzgz`.

The Worker is designed to expose a private, authenticated MCP endpoint for the fixed repository `Jasondevtech276/neotechzgz.vercel.app`. It does not proxy arbitrary GitHub API paths and does not return secret values.

## Security model

- The repository is hard-coded; callers cannot select another owner or repository.
- MCP requests require a bearer token with at least 256 bits of entropy.
- The GitHub App installation token is short-lived and created server-side from the App private key.
- GitHub Actions secret values are encrypted with the repository's GitHub public key using libsodium sealed boxes before the REST API call.
- Secret names and timestamps may be listed; secret values are never read or returned.
- The only MCP-triggered write/delete probe is the fixed name `NEOTECHZGZ_BRIDGE_PROBE`; production values are never accepted as MCP arguments.
- The probe refuses to overwrite an existing name, verifies metadata visibility, deletes the probe, and verifies absence.
- Production secret values are never accepted by MCP tools. They can only be entered through the separate browser UI, which is disabled unless `ENABLE_PRODUCTION_SECRET_OPS=true` and the name is in `ALLOWED_SECRET_NAMES`.
- No credentials are committed to Git, plugin files, workflow logs, or this document.

## User-mediated secret entry

The Worker serves a dedicated `/secret-entry` page. The user enters the bridge bearer token and secret value directly in the browser; the value is posted straight to the Worker and encrypted with GitHub's repository public key. It is not passed through an MCP tool, ChatGPT message, plugin configuration, or logs. The UI supports save/replace and delete with exact-name confirmation. The Worker rejects every name outside `ALLOWED_SECRET_NAMES`. The production operations flag is false by default and must remain false until the GitHub App and connection are independently verified.

## GitHub App prerequisites

Create a GitHub App and install it only on `Jasondevtech276/neotechzgz.vercel.app`.

Grant only the repository permissions required by the Actions Secrets REST API:
- Repository metadata: read-only.
- Repository permission **Secrets: read/write** (the GitHub App permission used by the Actions Secrets REST API).

Do not grant Contents, Administration, Workflows, Deployments, or organization-wide access. Generate an App private key and retain it securely.

Record the App ID and installation ID. Do not put the private key in GitHub repository files or chat.

## Cloudflare Worker secrets

Set these values in the Worker environment using the Cloudflare Dashboard or a secure secrets-management workflow:

- `BRIDGE_API_TOKEN`: random bearer credential, at least 32 random bytes; never reuse a GitHub token.
- `GITHUB_APP_PRIVATE_KEY`: the GitHub App PEM private key.

Set these non-secret variables:
- `GITHUB_APP_ID`: GitHub App ID.
- `GITHUB_INSTALLATION_ID`: installation ID for the single repository.
- `ALLOWED_SECRET_NAMES`: comma-separated exact allowlist of secret names (empty by default).
- `ENABLE_TEST_SECRET_PROBE`: `true` only during the controlled probe test; reset to `false` afterwards.
- `ENABLE_PRODUCTION_SECRET_OPS`: keep `false` until the bridge and probe are independently validated.

The private ChatGPT plugin uses API-key/Bearer authentication. The bearer credential must be entered through the plugin's supported connection/authentication UI, not in chat or in `mcp.json`.

## Validation sequence

1. Run `npm test` and `npm run check` from this directory.
2. Connect the placeholder Worker to the feature branch using Cloudflare Workers Builds; authorize Cloudflare's GitHub App for this repository only. Configure its root directory as `/infra/github-secrets-bridge`, build command `npm install --ignore-scripts --no-audit --no-fund`, and deploy command `npx wrangler deploy`.
3. Confirm unauthenticated requests to `/mcp` return HTTP 401.
4. Connect the private plugin using the bearer credential and confirm `bridge_status`.
5. Confirm `list_secret_names` returns names only.
6. Temporarily enable `ENABLE_TEST_SECRET_PROBE`; run `test_secret_roundtrip` once.
7. Verify the reserved probe is absent from GitHub Actions Secrets afterwards.
8. Disable `ENABLE_TEST_SECRET_PROBE` and rotate the temporary bridge bearer credential if it was used for initial connection testing.

## Release gates

- [ ] GitHub App exists and is installed on the single intended repository.
- [ ] App permissions are least-privilege and independently reviewed.
- [ ] Worker bearer credential and App private key are stored as Cloudflare Worker secrets.
- [ ] Worker is deployed and unauthenticated access returns 401.
- [ ] Private plugin is connected and its bearer auth is verified.
- [ ] Harmless probe create/list/delete round-trip passes.
- [ ] Probe is absent after test and test mode is disabled.
- [ ] No production secret mutation capability is enabled.

**Current decision: HOLD.** Production secret mutations are implemented only through the separate browser UI and remain disabled by default. Do not enable `ENABLE_PRODUCTION_SECRET_OPS` until the GitHub App, Worker authentication, allowlist, and harmless probe have passed independent verification.
