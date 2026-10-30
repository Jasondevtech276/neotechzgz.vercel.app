# NEOTECHZGZ — off-site Supabase backup

## Status

This workflow is staged on branch `backup/secure-supabase-r2`. It is not active on the default branch and has not run. It requires GitHub Actions variables/secrets to be configured first.

Target database: the canonical application project `qkzmpxyefuqdhyxwfjcw` (EU-West-2), as identified in the repository security audit. Do not point this workflow at the legacy/alternate Supabase project without an explicit review.

Storage target: private Cloudflare R2 bucket `neotechzgz-db-backups` (WEUR, Standard). The R2 management API currently reports the managed `r2.dev` domain disabled and no custom domains. No backup objects have been uploaded by this workflow.

## What it does

1. Runs daily at 02:17 UTC, or manually through `workflow_dispatch`.
2. Uses the PostgreSQL 17 client to create a custom-format `pg_dump` through the Supabase Session Pooler (port 5432) with TLS required.
3. Encrypts and deduplicates the dump locally with Restic before uploading it to R2 over the S3-compatible API.
4. Checks repository metadata and reads a 5% sample of repository data.
5. Keeps 7 daily and 4 weekly snapshots, then prunes obsolete Restic data.
6. Deletes the plaintext temporary dump from the ephemeral runner.

The workflow has read-only GitHub repository permissions, no pull-request trigger, a 30-minute timeout and a concurrency lock. It does not deploy to Vercel or modify Supabase.

## GitHub configuration

Repository: `Jasondevtech276/neotechzgz.vercel.app`

Create these **Actions Variables**:

| Variable | Value |
|---|---|
| `SUPABASE_DB_HOST` | Hostname shown for the project's **Session pooler** in Supabase Connect |
| `SUPABASE_DB_USER` | Session pooler username shown by Supabase (usually includes the project reference) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET` | `neotechzgz-db-backups` |

Create these **Actions Secrets**:

| Secret | Value |
|---|---|
| `SUPABASE_DB_PASSWORD` | Database password for the canonical Supabase project |
| `R2_ACCESS_KEY_ID` | R2 S3 access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 S3 secret access key |
| `RESTIC_PASSWORD` | Unique, high-entropy Restic repository password |

Never put these values in Git, issue comments, workflow YAML, Vercel public variables, or chat.

## Cloudflare credential policy

Create an R2 S3 API token in the Cloudflare Dashboard with **Object Read & Write** permission scoped only to `neotechzgz-db-backups`. Do not use a global Cloudflare API token or account-wide administrator token. The Restic retention step requires deletion permission in this one bucket.

Keep the bucket private. Do not enable the `r2.dev` public endpoint or attach a public custom domain. Preserve the independent Restic password outside GitHub and Cloudflare; losing it makes the encrypted repository unrecoverable.

## Supabase connection policy

Use the Session Pooler connection details from the canonical project. Do not use the transaction pooler. The workflow uses the pooler host and user as Actions Variables and the database password as an Actions Secret. PostgreSQL SSL mode is set to `require`.

Do not use `service_role`, Supabase secret API keys, JWT signing secrets, or Vercel environment variables for this backup.

## Validation and recovery

After configuration, run the workflow manually from the Actions tab. A successful first run must create a Restic snapshot and pass `restic check`.

The current automated verification checks Restic repository integrity and reads a 5% data subset. It does **not** yet prove a full restore into a disposable Supabase-compatible PostgreSQL instance. Before declaring disaster recovery validated, restore a snapshot into an isolated compatible PostgreSQL/Supabase environment and run application-level smoke tests.

Example manual recovery outline:

1. Install Restic and configure the same repository endpoint, S3 credentials and Restic password.
2. Run `restic snapshots` and select the desired snapshot.
3. Restore to an isolated directory with `restic restore <snapshot-id> --target ./restore`.
4. Inspect the dump with `pg_restore --list <path-to-dump>`.
5. Restore only into an explicitly selected, disposable target first. Never use `--clean` against production during a test.

## Scope limitations

- `pg_dump` captures PostgreSQL database objects and data, including schema content available to the database role. It does not copy the actual binary objects stored in Supabase Storage; those require a separate object-storage export.
- Project-level Auth configuration, Edge Function source/deployment configuration, secrets, DNS, Vercel configuration and GitHub secrets are not included in the database dump.
- Supabase Free does not provide its own downloadable automatic database backups. This external workflow is the compensating control.
- The workflow uses GitHub-hosted runners and Cloudflare R2. The repository is public, so the workflow source is public; secret values remain in GitHub Actions Secrets. Only authorized repository writers can trigger workflows.
- R2 includes a free monthly allowance, not an unconditional guarantee of zero charges. Monitor usage and configure billing alerts/spend controls where available. Do not exceed the free allowance.

## Connector capabilities and boundaries

- GitHub connector: can inspect and update repository files and inspect workflow runs/logs. The current connector does not expose Actions Secrets write operations.
- Supabase connector: can inspect projects, schemas, migrations, logs and advisors. It does not provide a safe way to retrieve the database password.
- Cloudflare connector: can inspect and manage the R2 bucket through the account API. S3 credentials must be created in the Cloudflare Dashboard.
- Vercel connector: can inspect linked project/deployment context. Vercel is not used as a backup destination.

No additional ChatGPT backup connector is required. The existing platform connectors orchestrate configuration; Restic and PostgreSQL tools perform the actual backup.
