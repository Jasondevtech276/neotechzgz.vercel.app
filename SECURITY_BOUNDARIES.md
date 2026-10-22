# NeoTech ZGZ — security boundaries

## Scope of this change
This change proposes database least-privilege controls only. It does not connect to Vercel, ChatGPT, a customer computer, or a remote-control provider. It does not enable remote sessions.

## Identity and authorization invariants
- Browser clients never receive Supabase service-role/secret keys, Stripe secrets, NVIDIA/OpenAI keys, or remote-access credentials.
- A user ID, role, price, payment status, or admin flag supplied by the browser is never trusted as authority.
- Every server-side customer operation authenticates with Supabase Auth and scopes queries to the authenticated user.
- Administrative actions use a server-side identity and a separate authorization check.
- Database RLS and SQL grants must both be restrictive. RLS alone is not a substitute for least-privilege grants.
- Customer profile self-service may update only `display_name`; it must not change `is_admin` or retention fields.
- Quotes and payment state are server-controlled. Stripe events must be signature-verified and idempotent.
- AI output is untrusted input. AI must not hold privileged credentials or initiate remote access, payments, deletion, or administrative actions without a separately authorized server workflow.

## Read-only production review (2026-10-19)
The live Supabase project was inspected using catalog/privilege queries and Security Advisor. No production database changes were made.

- RLS is enabled on `profiles`, `quotes`, `quote_status_history`, `payments`, and `support_tickets`; it is not forced. Client roles do not own these tables, but grants and policies must both remain restrictive.
- **Live grants remain broader than the target:** `anon` currently has table-level SELECT/INSERT/UPDATE/DELETE on all five tables, and `authenticated` has broad table-level grants on most/all of them. The live privilege query also reports independent column grants. The proposed migration has not been applied, so this remains an open production finding. Existing RLS policies limit rows, but RLS is not a replacement for removing unnecessary SQL privileges.
- Existing row policies include own-row reads for profiles/payments/support tickets and quote history; quotes currently have admin-only SELECT/UPDATE/DELETE policies. The proposed `quotes_select_own` policy adds customer-owned quote reads without giving customers quote writes.
- Proposed `payments_select_admin` and `support_tickets_select_admin` policies preserve admin reads after narrowing grants.
- The existing quote status-history insert policy checks `profiles.is_admin = true`; an INSERT grant alone does not authorize non-admin writes.
- The live `public.prevent_client_deleted_at_changes()` trigger function is SECURITY INVOKER and currently has direct EXECUTE permission for `anon` and `authenticated`. The proposed migration revokes those direct permissions; the trigger should continue to execute as part of the table operation. The disposable-database test confirms the intended behavior in the test fixture.
- The proposed `public.admin_update_quote_status(uuid,text)` RPC is not yet present in production. In the branch it is SECURITY INVOKER, checks the authenticated admin identity, and updates `quotes.status` plus inserts `quote_status_history` in one transaction. The admin PATCH route calls the RPC. The migration must be applied before this route can use it successfully.
- Live default ACLs under creator role `postgres` currently show no API-role grants for future tables in `public`, but sequence and function defaults still grant API-role privileges. The migration revokes future public sequence/function grants and globally revokes default PUBLIC EXECUTE for future functions created by `postgres`. The global function change is deliberate because a schema-specific revoke does not remove privileges inherited from global defaults. Defaults affect future objects only; they do not repair grants on existing objects.
- `supabase_admin` has platform-managed default ACLs. Do not alter internal platform defaults or elevate roles to bypass ownership. The proposed migration scopes its changes to application objects and future objects created by `postgres`.
- Supabase Security Advisor reports leaked-password protection disabled. It has not been changed as part of this migration; assess and configure it separately after reviewing authentication impact: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Supabase Performance Advisor currently lists eight unused-index observations. These are informational candidates only; do not drop indexes without workload evidence and a separate review.
- `lib/rate-limit.ts` fails closed in production if its Redis limiter is missing or unavailable. Confirm required rate-limit configuration exists in each Vercel environment before future deployment changes.
- Secret hygiene work remains a separate pending item, including checking server-only Supabase/Stripe/cron keys and stale `NEXT_PUBLIC_*` database/JWT variable names. This review did not read or modify secret values. Keep privileged keys out of Git and all `NEXT_PUBLIC_*` variables.
- GitHub code search did not return matches for common literal prefixes `sk_live_` or `whsec_`; this is not a substitute for GitHub secret scanning or a complete history scan.

## Isolated validation status (2026-10-19)
- GitHub Actions run https://github.com/Jasondevtech276/neotechzgz.vercel.app/actions/runs/39301349570 completed successfully for commit `8db5fff728c01acf77de9c2329853eb7b63170b7`.
- The application job passed dependency installation, high/critical npm audit, automated tests, and production build.
- The disposable PostgreSQL 16 job passed fixture creation, both proposed migrations, structural privilege assertions, and synthetic customer A/customer B/admin authorization and atomicity tests.
- These results prove the migrations execute against the CI fixture and the tested behaviors pass there. They do **not** prove every production-specific policy, grant, function, trigger, or workflow has been exercised against an exact production clone.
- The PR remains open and ready for review, but unmerged. No production migration, merge, or production deployment has been performed. No paid Supabase development branch was created.
- Before production, review the complete migration diff against live catalog results, verify all application call paths and status values, take/confirm a current backup/PITR recovery point, and prepare a tested rollback plan. Do not treat the passing CI fixture as a production restore drill.

## Remote assistance is intentionally disabled
No remote-control connection, unattended agent, Vercel remote access, ChatGPT access, shell execution, or device-control capability is enabled by this patch.

Before implementing customer remote support, require all of:
1. Authenticated customer and verified ownership of the support ticket/device.
2. Explicit consent bound to the ticket, device, technician, permitted actions, and time window.
3. Short-lived session authorization, default-deny, expiry, and immediate revocation.
4. No persistent unattended access by default; no credential collection or hidden installation.
5. Human approval before destructive actions or file transfer.
6. Append-only audit events without passwords, tokens, private keys, or unnecessary screen contents.
7. Automated tests for cross-user access, expired/revoked consent, replay, and unauthorized technician roles.

## Rollout and rollback
- Do not apply the proposed migration to production until production-specific preflight review and a rollback plan are complete. The migration changes grants and policies but does not intentionally modify customer rows.
- Before merge, validate migration syntax/order in a disposable database; run `supabase/tests/least_privilege_customer_access.sql` and `supabase/tests/least_privilege_synthetic_users.sql`; test own-row isolation, profile display-name updates, ticket creation, admin quote status/history, and admin payment/ticket reads. Current CI has passed these checks against its disposable PostgreSQL fixture.
- Inventory existing public functions and sequences separately: default-privilege changes only affect future objects. Verify the retention trigger still blocks client-driven `deleted_at` changes after direct EXECUTE is revoked.
- Use synthetic customer A, customer B, and admin accounts. Confirm cross-user reads fail, customer quote/payment/history writes fail, and customers cannot set ticket status/timestamps.
- The Supabase organization is on the Free plan, which does not include automatic daily backups or PITR. Before production, create an encrypted logical export off-site and verify a restore in an isolated PostgreSQL 17 environment; document rollback. Do not use a restore operation as a casual rollback.
- The account-purge cron is opt-in: it returns 503 unless `ACCOUNT_PURGE_ENABLED=true` is set in addition to the cron secret. Keep it disabled until backup/restore, retention policy, and rollout preflight are explicitly verified. See `docs/security/pr-49-production-rollout.md`.
- Do not merge or apply if any required customer workflow fails. Rollback must restore only the minimum privileges demonstrated to be required; do not broadly regrant CRUD to `anon` or `authenticated`.
- This document and the proposed migration do not constitute a security certification or legal opinion.
