# PostgreSQL 17 backup and isolated restore runbook

This runbook is for the manual GitHub Actions workflow `.github/workflows/pg17-backup-restore.yml`.

## Safety gates

- Never store a plaintext database dump in Git, a release, an issue, or a pull-request comment.
- Do not use the production database as the restore target.
- Do not paste connection strings, passwords, or private encryption identities into chat, issues, workflow inputs, or logs.
- Use a disposable PostgreSQL 17 database on a separate instance/project with network access restricted to the minimum required. A fresh Supabase project/branch may incur charges; check costs first.
- The workflow only runs the backup job on a manual `workflow_dispatch` and requires the exact confirmation string. Pull-request runs are only intended to validate that GitHub can parse the workflow; the backup job must remain skipped.
- Do not merge this PR until the workflow PR check has completed, the connection values are configured in GitHub Actions, and an independent reviewer has reviewed the safety controls.

## Configure GitHub Actions

In the repository, open **Settings → Secrets and variables → Actions**.

Create these repository secrets:

- `SUPABASE_SOURCE_DB_URL`: an authorized PostgreSQL connection string for the source database. Prefer a least-privilege role that can read the required schema/data and catalog metadata.
- `PG17_ISOLATED_RESTORE_DB_URL`: a connection string for a newly created, disposable PostgreSQL 17 database on a different server/instance. Never use the production connection here.
- `BACKUP_AGE_IDENTITY`: the private age identity described below.

Create this repository variable:

- `BACKUP_AGE_RECIPIENT`: the matching public age recipient (starts with `age1`).

Generate an encryption key pair on a trusted machine with age installed:

```sh
age-keygen -o backup-identity.txt
```

The file contains a private `AGE-SECRET-KEY-...` identity and a comment containing the public `age1...` recipient. Copy the private identity only into the GitHub secret `BACKUP_AGE_IDENTITY`, and the public recipient into `BACKUP_AGE_RECIPIENT`. Keep a separate secure copy of the private identity; if it is lost, the encrypted backup cannot be decrypted. Never commit the key file. Remove the local key file securely according to your device's storage policy after provisioning a protected copy.

## Run it

1. Confirm the source URL points to the intended production source and the restore URL points to the disposable isolated target.
2. Ensure the target is empty and that PostgreSQL 17 is reachable from GitHub-hosted runners over TLS. Do not open database access broadly to the internet; restrict source/target network access where possible.
3. After this workflow has reached the repository's default branch, open **Actions → PostgreSQL 17 encrypted backup and isolated restore verification → Run workflow**.
4. Enter `RESTORE_TO_ISOLATED_PG17` exactly and choose whether to retain the encrypted artifact.
5. Review the full run logs. A successful job must include the restore step, report PostgreSQL major 17, at least one non-system schema, and zero unvalidated constraints.
6. Confirm the encrypted artifact exists if retention was selected. It is retained for three days; download it only to an authorized device and verify its SHA-256 sidecar before use.
7. Record the run URL, timestamp, commit SHA, target identity (without credentials), and verification output in the PR. Never include the dump or secrets in that record.

## What the workflow checks—and what it does not

It checks PostgreSQL 17 on the destination, compares server-address/database identities, rejects a target containing user tables/views/sequences, creates a custom-format dump, encrypts it before artifact retention, restores without `--clean`, and checks schema presence and unvalidated constraints.

A successful run is not a full application-level proof by itself. Verify required Supabase extensions, roles/grants, RLS policies, functions, triggers, representative row counts/checksums, and the application's synthetic end-to-end tests. Supabase-managed schemas/roles can require a compatible target and dump/restore adjustments. Do not weaken checks to force a green result.

## Current status

The workflow is committed to a draft pull request. No database dump or restore has been run from this session because the protected connection secrets, encryption key, and verified isolated target are not provisioned here. Therefore, restoration is **not yet verified**.
