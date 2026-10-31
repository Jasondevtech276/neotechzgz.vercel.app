# Coordinated credential rotation and backup activation runbook

Last reviewed: 2026-10-30
Scope: `neotechzgz.vercel.app`, canonical Supabase project `qkzmpxyefuqdhyxwfjcw`, Cloudflare R2 bucket `neotechzgz-db-backups`.

## Safety invariants

- Do not merge this branch or enable the scheduled backup until all gates below pass.
- Do not rotate or revoke a production credential until its consumers, deployment targets, overlap strategy, and rollback path are identified.
- Never put secret values in Git, issues, pull-request comments, logs, screenshots, or ChatGPT messages.
- Use a password manager or a trusted local secret generator. Transfer values directly into the provider and secret store.
- Keep the canonical Supabase project separate from the legacy project `hdpikaqxeadqmckmmjfh`; do not use the legacy project for production.
- The R2 bucket must remain private. Do not enable `r2.dev` or public bucket access.

## Verified baseline (2026-10-30)

- Canonical Supabase project: `qkzmpxyefuqdhyxwfjcw`, region `eu-west-2`, status `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- R2 bucket: `neotechzgz-db-backups`, region `WEUR`, Standard storage.
- R2 object listing returned empty; no Restic repository or snapshots are evidenced.
- Managed `r2.dev` is disabled; no custom domains are configured.
- Backup workflow is on `backup/secure-supabase-r2`, not `main`; it has not run.
- CI for PR #71 passed `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run build`. Vercel check passed.
- Supabase Preview check was skipped because preview branching is disabled; its check metadata points to legacy project `hdpikaqxeadqmckmmjfh`. Do not interpret this skipped check as validation of the canonical production database.
- Vercel environment metadata contains Production entries for `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and legacy `SERVICE_ROLE` aliases. Values were not read. The application source uses `SUPABASE_SECRET_KEY` with `SERVICE_ROLE` fallback in server-side routes.
- Vercel metadata includes `DATABASE_URL` in Production, Preview, and Development, but its value is masked. Repository code search did not find a direct `DATABASE_URL` reference on the default branch. This does not rule out platform integrations or external consumers.
- GitHub Actions secret/variable values and presence have not been verified through the available GitHub connector.

## Phase 0 — Inventory and containment (read-only)

- [x] Confirm canonical Supabase project identity and health.
- [x] Confirm R2 bucket identity, region, privacy configuration, and current object listing.
- [x] Confirm backup branch and CI state.
- [x] Confirm application code's server-side Supabase admin-key consumers.
- [ ] In GitHub repository Settings → Secrets and variables → Actions, record the *names and scope only* of required backup variables/secrets. Do not copy values into this runbook.
- [ ] Identify every consumer of the database password: Vercel integrations, local admin tools, migrations, scheduled jobs, external clients, and any other repositories.
- [ ] Confirm whether any Supabase direct-DB credential is used outside this repository.
- [ ] Confirm that the earlier exposed Restic password and any generated database password are treated as compromised and are not reused.

Gate: no provider credential changes until the inventory is complete.

## Phase 1 — R2 access credential

Create a dedicated Cloudflare R2 S3 API token scoped to bucket `neotechzgz-db-backups` with only the permissions required for object listing, reading, writing, and deleting for retention/prune. Do not use an account-wide administrator token.

Store the access key ID and secret access key directly as GitHub Actions secrets:
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Configure GitHub Actions variables:
- `S3_ENDPOINT` (account-specific R2 S3 endpoint, HTTPS)
- `S3_REGION` (R2 region value accepted by the S3 client)
- `S3_BUCKET` = `neotechzgz-db-backups`

Do not expose the bucket publicly. Test only after the workflow has passed static review and all required values have been set.

## Phase 2 — Restic encryption key (before first repository initialization)

Because the R2 object listing is empty, there is no evidenced existing Restic repository or snapshot history to preserve.

- Generate a new high-entropy Restic repository password locally or in a password manager.
- Store it directly as GitHub Actions secret `RESTIC_PASSWORD`; never reuse the previously disclosed value.
- Keep an offline recovery copy in the organisation's approved password manager / break-glass vault.
- Do not initialize the repository manually from an untrusted runner.
- First initialization must occur only after successful bucket-state detection and a successful S3 connectivity test.

## Phase 3 — PostgreSQL password (conditional; do not rotate yet)

The backup workflow requires `SUPABASE_DB_PASSWORD` to run `pg_dump`. Vercel metadata also contains a masked `DATABASE_URL`, but code search on the default branch did not find direct application references.

Before changing the Supabase database password:
1. Confirm all direct PostgreSQL consumers, including Vercel integrations and external tools.
2. Confirm the exact database role and connection mode used by the backup workflow (direct connection vs session pooler).
3. Prepare the replacement password in a password manager.
4. Change the database password in the canonical Supabase project's supported Dashboard control.
5. Immediately update every verified consumer, including GitHub Actions secret `SUPABASE_DB_PASSWORD` and any confirmed Vercel/database integration.
6. Validate a read-only connection and `pg_dump --schema-only` before any data backup.
7. If any consumer fails, stop the rollout and restore the previous provider credential only if it remains valid; otherwise complete the forward repair. Do not assume password rotation is reversible.

Do not rotate the database password until the consumer inventory is complete. The available Supabase connector does not expose a database-password rotation action.

## Phase 4 — Supabase API server key rotation (separate from DB password)

The application server uses `SUPABASE_SECRET_KEY` and has a legacy fallback to `SERVICE_ROLE`. These are API credentials, not the PostgreSQL password.

- Identify whether Production uses the current Supabase secret-key format or a legacy service-role JWT.
- Create/issue a replacement key using the canonical project's supported Supabase controls.
- Update the Vercel Production secret `SUPABASE_SECRET_KEY` without changing Preview/Development.
- Deploy to a non-production preview connected to an isolated test project first; then validate server routes that use the admin client.
- For Production, use a controlled deployment and validate quote lookup/create and account-retention paths before revoking the old key.
- Remove legacy fallback only in a separate reviewed code change after the replacement key is verified.
- Revoke the old key only after the new key is confirmed in production and no other consumers remain.

Do not copy key values into this runbook or GitHub Actions unless the workflow demonstrably needs them.

## Phase 5 — Backup workflow hardening and validation

Before enabling:
- Pin Restic to a specific release and verify its published checksum/signature.
- Pin the PostgreSQL client image by immutable digest, matching the supported server major version.
- Validate the R2 S3 endpoint/region configuration using a harmless list operation.
- Ensure repository initialization fails closed when the bucket is non-empty and Restic config cannot be read.
- Confirm retention/prune permissions and concurrency.
- Ensure logs never print credentials or connection strings.
- Run the workflow manually from the feature branch only after the secrets/variables are installed and reviewed.
- Confirm a Restic snapshot exists and run repository integrity checks.
- Perform a full restore into a disposable isolated PostgreSQL instance; verify schema, rows, extensions, roles/ownership assumptions, and application-level critical queries.
- Record restore duration and recovered snapshot ID.

The current 5% Restic data-subset check is not a substitute for a full restore test.

## Phase 6 — Scope expansion and recovery completeness

The PostgreSQL dump does not by itself back up:
- Supabase Storage object contents.
- Edge Function source/deployment configuration and secrets.
- Auth provider settings, OAuth configuration, SMTP settings, and project-level secrets.
- Cloudflare/Vercel configuration and third-party integration credentials.

Create separate protected backup/export procedures for these assets. Do not put secrets in the database dump or object storage without a separately approved encryption and access design.

## Release gates

The PR may leave draft only when:
- [ ] All required GitHub Actions variables/secrets are configured and verified by name/scope.
- [ ] R2 access is bucket-scoped and private.
- [ ] Restic password is new, stored safely, and recovery-tested.
- [ ] Database password consumers are inventoried; rotation is either completed safely or explicitly determined unnecessary for the backup path.
- [ ] API-key rotation plan is validated independently of DB password rotation.
- [ ] Backup workflow is version-pinned and passes a manual run.
- [ ] Full isolated restore passes.
- [ ] CI, Vercel Preview, and the canonical Supabase test target are correctly aligned.
- [ ] Production remains unchanged until all gates are reviewed.

## Current decision

**HOLD — do not merge, do not schedule, do not rotate the production database password yet.**

The feature branch and PR are safe to review. R2 is empty, so the Restic encryption password can be replaced before first initialization. Database and Supabase API-key rotations remain separate operations with different consumers and rollback plans.
