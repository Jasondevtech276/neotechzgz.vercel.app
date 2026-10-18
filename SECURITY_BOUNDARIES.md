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

## Static review findings (2026-10-17)
This review used read-only queries against the current Supabase project and repository inspection. No database changes were made.

- RLS is enabled on `profiles`, `quotes`, `quote_status_history`, `payments`, and `support_tickets`.
- Live table grants include broad table-level `SELECT/INSERT/UPDATE/DELETE` for `anon` and `authenticated` on these tables. The live privilege inventory also shows column-level grants; both levels must be revoked/reviewed because revoking table grants alone does not revoke independent column grants.
- Current policies include own-row access for profiles, payments, support tickets, and quote history; quote read/update/delete policies are admin-only. The proposed `quotes_select_own` policy adds account-page read access without granting customers quote writes.
- Proposed `payments_select_admin` and `support_tickets_select_admin` policies preserve admin reads after narrowing grants. They have not been applied or tested against the full migration sequence.
- The existing quote status-history insert policy checks `profiles.is_admin = true`; the insert grant alone does not authorize non-admin writes.
- Profile updates already have a migration restricting the grant to `display_name`. The new migration must preserve this column-level boundary.
- `lib/rate-limit.ts` fails closed in production if its Redis limiter is missing or unavailable. Confirm required rate-limit configuration exists in each Vercel environment before future deployment changes.
- The security roadmap records secret hygiene work as pending, including server-only Supabase/Stripe/cron keys and stale `NEXT_PUBLIC_*` database/JWT variable names. This review did not read or modify secret values. Keep privileged keys out of Git and all `NEXT_PUBLIC_*` variables.
- GitHub code search did not return matches for common literal prefixes `sk_live_` or `whsec_`; this is not a substitute for GitHub secret scanning or a complete history scan.
- Supabase Security Advisor reports leaked-password protection disabled. It has not been changed as part of this migration; assess and configure it separately after reviewing authentication impact.
- Production currently has no verified isolated migration run, synthetic-user authorization test, or restore drill for this proposed change. Do not activate it until these gates pass.
- **Additional default-privilege blocker found (2026-10-17):** live `pg_default_acl` contains table defaults granting CRUD to `anon` and `authenticated` for both grantors `postgres` and `supabase_admin`. The proposed migration only changes defaults for `postgres`. Read-only role inspection showed `postgres` is not a member of `supabase_admin` and is not a superuser, so it cannot safely change `supabase_admin` defaults in the current execution context. Do not assume the proposed default-privilege statement closes this gap. A separately authorized owner-level remediation or platform-supported procedure must be established and tested; do not elevate `postgres` privileges as a workaround.
- The branch now proposes `public.admin_update_quote_status(uuid,text)`, a SECURITY INVOKER PostgreSQL function that checks the admin identity and updates `quotes.status` plus inserts `quote_status_history` in one transaction. The admin PATCH route calls this RPC, so either both database changes commit or both roll back. This is code-reviewed but remains unvalidated until the full migration sequence and synthetic-admin workflow pass in an isolated database.

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
- Do not apply the proposed migration to production without a successful isolated test. A paid Supabase development branch was deliberately not created.
- The earlier GitHub workflow passed `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run build` for an earlier PR commit. The latest code's Vercel check is pending and SQL is not executed by those application checks.
- Before merge, validate the migration syntax and order in a disposable/local database; run `supabase/tests/least_privilege_customer_access.sql`; and test own-row isolation, profile display-name updates, ticket creation, admin quote status/history, and admin payment/ticket reads.
- The isolated test must also prove that default privileges are safe for every role that creates public tables, including the live `supabase_admin` grantor. If the current migration execution role cannot change those defaults, keep this as a separate blocking item; do not bypass it by elevating roles.
- Use synthetic customer A, customer B, and admin accounts. Confirm cross-user reads fail, customer quote/payment/history writes fail, and customers cannot set ticket status/timestamps.
- Before production, verify a current backup/PITR recovery point and a documented rollback plan; test restoration separately. Do not use a restore operation as a casual rollback.
- Do not merge or apply if any required customer workflow fails. Rollback must restore only the minimum privileges demonstrated to be required; do not broadly regrant CRUD to `anon` or `authenticated`.
- This document and the proposed migration do not constitute a security certification or legal opinion.
