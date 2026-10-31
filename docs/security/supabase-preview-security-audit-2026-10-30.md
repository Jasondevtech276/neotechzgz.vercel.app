# Supabase Preview security and regional deployment verification — 2026-10-30

## Scope and safety boundary

- Repository: `Jasondevtech276/neotechzgz.vercel.app`
- Branch: `audit/stripe-webhook-test-harness`
- Supabase project: `hdpikaqxeadqmckmmjfh` (Preview only)
- Vercel project: `prj_iykDkWYrfpls0aVwdJYg8LhxQnH5`
- Vercel deployment: `dpl_4Unx1yrhzBSM8DZcxPQkBnMi7L27`
- Commit: `022e2ab0b0efe9d256dba1af6d0d543226d0e907`
- No Production, Stripe Live, credential, schema, row, policy, bucket, or deployment-promotion changes were made during this audit.
- All Supabase SQL executed was read-only catalog inspection.

## Vercel Preview — verified

- Deployment state: `READY`.
- Region reported by deployment API: `fra1` (Frankfurt).
- Branch: `audit/stripe-webhook-test-harness`.
- Commit: `022e2ab0b0efe9d256dba1af6d0d543226d0e907`.
- Preview URL: https://neotechzgz-hoo5mur83-larbimhed260796-5453s-projects.vercel.app
- No domain promotion or Production deployment was performed.
- This verifies Vercel Functions deployment region only; it does not certify global static/CDN placement or residency of third-party data, logs, backups, analytics, or payment-provider data.

## GitHub Actions — verified

Both workflow runs associated with the audited HEAD completed successfully:

1. Security build gate — run `40986149518`, conclusion `success`.
   - Checkout and Node setup succeeded.
   - `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run build` all succeeded.
2. Isolated Stripe test database — run `40986149534`, conclusion `success`.
   - PostgreSQL 17 migration/RLS/idempotency job succeeded.
   - Deno type-check and Edge Function import/type validation succeeded.
   - Isolated webhook handler security tests succeeded.
   - Preview schema migration/RLS integration job succeeded.
   - Ownership/admin/trigger/least-privilege assertions succeeded.
   - Isolated PostgREST/PostgreSQL end-to-end handler and duplicate-event rejection checks succeeded.

These are CI test results; they do not constitute proof of a live external Stripe webhook delivery to the protected Vercel Preview runtime.

## Supabase project health and region

- Project state: `ACTIVE_HEALTHY`.
- Database: PostgreSQL 17.11.
- Region: `eu-central-1` (Frankfurt).
- Seven expected migrations are registered, including:
  - `20261030005446_preview_reconcile_account_schema`
  - `20261030005545_preview_consolidate_read_policies`

## RLS and application-table policies

- RLS is enabled on all eight application tables: `profiles`, `quotes`, `payments`, `quote_status_history`, `support_tickets`, `stripe_webhook_events`, `stripe_invoices`, and `stripe_webhook_test_events`.
- RLS is also enabled on the inspected Storage tables.
- Policies found on application tables:
  - Profiles: authenticated users can read/update their own profile; update check pins `id` to `auth.uid()`.
  - Quotes: owner/admin read; admin-only update with both USING and WITH CHECK.
  - Payments: owner/admin read; no client-side write policy.
  - Quote status history: owner/admin read; admin-only insert.
  - Support tickets: owner/admin read; authenticated insert requires `user_id = auth.uid()`.
  - Stripe invoice/webhook ledgers: no client policies; intended service-role-only access.
- No table-level grants to `anon` or `PUBLIC` were found on the inspected application tables.
- Authenticated table grants are limited to the operations supported by the policies; the profile update column grant observed is for `display_name`, not `is_admin`.
- Stripe ledger tables have RLS enabled, no client policies, and the inspected client roles have no direct table grants. This is intentional; the advisor notices are informational rather than evidence of a client exposure.

## Functions and triggers

- No Supabase Edge Functions are deployed in this project (`list_edge_functions` returned an empty list).
- The application function `public.handle_new_user()` is SECURITY DEFINER, owned by `postgres`, and explicitly sets an empty search_path.
- Its body schema-qualifies `public.profiles`, always inserts `is_admin=false`, uses user-editable metadata only to derive a bounded display name, and uses `ON CONFLICT DO NOTHING`.
- Its function ACL grants EXECUTE to `service_role` and `supabase_auth_admin`; no EXECUTE was effective for `anon` or `authenticated`. The function is invoked by the `auth.users` AFTER INSERT trigger `on_auth_user_created`.
- The inspected public application schema has no other triggers.
- Supabase-managed Storage triggers are present on buckets/objects for name validation, control-column protection, lifecycle enforcement, delete protection, and updated-at maintenance.
- No demonstrated privilege-escalation or search-path defect was found in the inspected application function/trigger path. No function or trigger was changed.

## Storage

- No Storage buckets exist in the Preview project (`storage.buckets` returned no rows).
- No policies exist in the `storage` schema.
- RLS is enabled on `storage.objects`, `storage.buckets`, and the other inspected Storage tables.
- With no buckets and no Storage policies, there is currently no configured application upload/download surface. Do not add broad Storage policies pre-emptively. When a real upload feature is introduced, define private buckets, object ownership/path rules, MIME and size limits, and narrowly scoped policies in a reviewed migration.

## Advisors

- Security advisor returned three INFO findings: RLS enabled with no policy on `stripe_invoices`, `stripe_webhook_events`, and `stripe_webhook_test_events`. These are intentional internal ledger tables with no client grants/policies; do not add client policies just to silence the informational linter.
- Performance advisor returned nine INFO findings for indexes not yet observed in use. No index was dropped: low traffic and incomplete workload history do not prove an index is unnecessary. Reassess after representative production-like query telemetry.
- No critical/high security finding was returned in the inspected advisor response.

## Corrections applied

**None.** The requested correction threshold was “only problems demonstrated by evidence.” The inspection did not demonstrate an exploitable access-control defect, unsafe client grant, exposed Storage bucket, or defective application trigger. Changing policies, grants, function ACLs, or Storage configuration without such evidence would add risk and could break intended application flows.

## Phase status

- Infrastructure / European Preview deployment: **verified for Vercel Functions in FRA1 and Supabase in Frankfurt**.
- GitHub CI gates: **both successful on the audited commit**.
- Supabase application RLS/grants/functions/triggers: **audited; no demonstrated defect requiring immediate correction**.
- Storage: **currently unused and closed by absence of buckets/policies**.
- Overall phase: **partially complete; security catalog review passed for the inspected scope, but not a full production security certification**.

## Remaining gates

1. Verify the runtime's actual database identity and behavior using approved non-production test identities, without revealing secrets.
2. Review Auth configuration, JWT/session settings, network restrictions, backup/PITR and recovery evidence.
3. Verify Storage requirements before creating any bucket or policy.
4. Complete third-party data residency and DPA/transfer review for analytics, payments, logs, backups and CDN.
5. Continue Stripe TEST end-to-end webhook delivery with Preview Deployment Protection intact.
6. Keep PR #69 open/draft and keep Production, Stripe Live and Checkout disabled until the complete acceptance process passes.

## Operational decision

No schema or access-control mutation was justified by the evidence in this pass. Keep Preview isolated, retain the current least-privilege policies, and do not merge PR #69 or promote the deployment yet.
