# PR #49 — Production rollout and recovery runbook

## Current status

- Supabase organization plan: **Free**.
- Production database: PostgreSQL 17.11; project ref `qkzmpxyefuqdhyxwfjcw`.
- Production migration history currently ends at `20261016130248`; the PR's least-privilege, atomic quote-status, and Stripe event-ledger migrations are not applied.
- The PR's automated database suite now runs against disposable PostgreSQL 17 in GitHub Actions, matching the production major version. This is useful migration/test coverage, but it is not a restored copy of production and does not prove the backup is recoverable.
- No paid Supabase branch is required or permitted for this procedure.
- The account-purge endpoint now requires `ACCOUNT_PURGE_ENABLED=true` in addition to the existing cron authorization secret. Leave it unset/false until the recovery checkpoint and rollout are verified.

## Why production rollout is gated

Supabase's current documentation says automatic daily backups are provided on Pro, Team, and Enterprise; Free projects should export data and keep off-site backups. PITR is a paid add-on and is not included in Free. Do not upgrade or enable paid add-ons as part of this runbook without separate cost approval.

References:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/deployment/database-migrations

## Preflight — no production writes

1. Freeze merge/deploy while the preflight is open.
2. Confirm the current production migration list and compare it to the branch. Expected proposed order:
   - `20261017120000_least_privilege_customer_access.sql`
   - `20261018110000_atomic_admin_quote_status.sql`
   - `20261020160000_stripe_webhook_idempotency.sql`
3. From an authorized operator workstation with the Supabase CLI and database access, check `supabase db dump --help` for the installed CLI version, then create a logical export using the documented procedure for the linked project. Keep connection strings and tokens in the local environment/secret manager; never put database URLs, access tokens, service-role keys, or exported customer data in GitHub, Vercel variables, or build logs. This ChatGPT-connected session cannot run the Supabase CLI or retrieve a full database dump, so the export has NOT been created by this run.
4. Store the export encrypted and off-site, with access restricted to the project owner. Export Storage objects separately if used; a database dump does not include file contents in Storage.
5. Restore the export into an isolated local PostgreSQL 17 environment (for example, a local Docker container with no public port). Never restore over production for a test. Record the restore result and verify table counts/schema without publishing customer data. Do not call recovery complete until `pg_restore`/`psql` exits successfully and representative schema/data checks pass.
6. Take a read-only snapshot of the current grants, policies, constraints, triggers, and public functions for the five affected tables. Preserve it outside the repository as the rollback reference.
7. Confirm the Vercel Preview environment uses a non-production Supabase project and Stripe test-mode credentials before sending any test events. If the preview is connected to production, do not send Stripe test events to it.
8. Verify required secrets exist by name only; never print values. Do not rotate or change secrets during this procedure.

## Migration validation

1. Apply the three migration files in the stated order to the isolated PostgreSQL 17 restore, not to production.
2. Run:
   - `supabase/tests/least_privilege_customer_access.sql`
   - `supabase/tests/least_privilege_synthetic_users.sql`
   - `supabase/tests/stripe_webhook_idempotency.sql`
3. Confirm own-row isolation, denied cross-user reads/writes, profile display-name update, support-ticket creation, admin quote-status/history atomicity, and the account-retention trigger's protection of `deleted_at`.
4. Confirm Stripe duplicate delivery, retry after failure, stale-claim recovery, and older-event rejection. Also inspect same-second Stripe event ordering as a remaining limitation: Stripe event timestamps have second-level precision.
5. Re-run the application CI and production build against the final commit. Keep the PR open if any test fails.

## Production rollout — separate approval/window required

Do not begin this section until the preflight and restore test are complete and the owner has confirmed the production window.

1. Confirm the backup artifact and restore result are accessible to the operator; capture the exact migration history and effective grants immediately before rollout.
2. Apply the migrations in order with the supported Supabase migration workflow, one reviewed migration at a time. Stop on any error; do not mark a migration as applied manually if its SQL did not finish.
3. Read back migration history, function signatures/privileges, effective grants, and policies. Verify `admin_update_quote_status` exists before deploying the route that calls it.
4. Deploy the application only after database verification. Confirm Vercel deployment checks are green.
5. Test admin quote status/history with a synthetic quote and test Stripe webhook delivery only against a verified non-production Stripe/Supabase pair. Do not create real charges or cancel real subscriptions as tests.
6. Verify normal customer quote submission, account access, support-ticket creation, admin reads, and rate-limit configuration.
7. Keep `ACCOUNT_PURGE_ENABLED` unset until the owner separately confirms the deletion policy, backup checkpoint, and intended activation. Enabling it allows the daily cron to process pending deletions without a general 60-day wait, matching the current legal page; do not enable it casually.

## Rollback principles

- Prefer rolling the application back to the last known-good deployment if a route fails.
- The SQL migrations narrow permissions and add functions/tables/columns. Do not run a generic `GRANT ALL` rollback. Use the saved preflight grants/policies snapshot and restore only privileges proven necessary.
- The Stripe migration is additive. If it fails, stop webhook-dependent rollout and keep the previous route version active; do not drop the event ledger or new columns while the new code is live.
- Do not restore the entire database as a first-line rollback. A database restore can discard legitimate customer changes and require downtime; use it only under an explicitly approved disaster-recovery procedure.
- After any rollback, rerun the security tests and verify effective privileges.

## Completion checklist

- [ ] Encrypted logical export completed and stored off-site.
- [ ] Restore verified in isolated PostgreSQL 17.
- [ ] Production grants/policies snapshot stored securely.
- [ ] Isolated migration sequence and SQL suite pass.
- [ ] Final CI and Vercel Preview pass on the same HEAD.
- [ ] Separate reviewer approval recorded.
- [ ] Production rollout window approved.
- [ ] Migrations applied and verified in production.
- [ ] App deployed and smoke-tested.
- [ ] Account-purge activation explicitly reviewed; remain disabled by default until then.

This runbook is operational guidance, not a guarantee of recovery or a legal certification.
