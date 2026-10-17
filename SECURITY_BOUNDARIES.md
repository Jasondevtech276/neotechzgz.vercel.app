# NeoTech ZGZ — security boundaries

## Scope of this change
This change proposes database least-privilege controls only. It does not connect to Vercel, ChatGPT, a customer computer, or a remote-control provider. It does not enable remote sessions.

## Identity and authorization invariants
- Browser clients never receive Supabase service-role/secret keys, Stripe secrets, NVIDIA/OpenAI keys, or remote-access credentials.
- A user ID, role, price, payment status, or admin flag supplied by the browser is never trusted as authority.
- Every server-side customer operation authenticates with Supabase Auth and scopes queries to the authenticated user.
- Administrative actions use a server-only identity and a separate authorization check.
- Database RLS and SQL grants must both be restrictive. RLS alone is not a substitute for least-privilege grants.
- Customer profile self-service may update only `display_name`; it must not change `is_admin` or retention fields.
- Quotes and payment state are server-controlled. Stripe events must be signature-verified and idempotent.
- AI output is untrusted input. AI must not hold privileged credentials or initiate remote access, payments, deletion, or administrative actions without a separately authorized server workflow.

## Static review findings (2026-10-17)
This review used read-only queries against the current Supabase project and repository inspection. No database changes were made.

- RLS is enabled on `profiles`, `quotes`, `quote_status_history`, `payments`, and `support_tickets`.
- The live table grants currently include broad table-level `SELECT/INSERT/UPDATE/DELETE` for both `anon` and `authenticated` on these tables. Existing RLS policies reduce row access, but the grants are broader than required; this is the principal issue addressed by the proposed least-privilege migration.
- Existing customer policies scope profile, payment, support-ticket, and quote-history reads to the signed-in user. The current `quotes` policies are admin-only, so the proposed `quotes_select_own` policy is needed for the account endpoint.
- The admin overview uses the authenticated session client to read payments and tickets. The proposed admin-only read policies are intended to preserve that dashboard after narrowing grants.
- Profile updates already have a migration restricting the grant to `display_name`. Keep that column-level boundary.
- `lib/rate-limit.ts` fails closed in production if its Redis limiter is missing or unavailable. Confirm the required rate-limit environment variables exist in each Vercel environment before future deployment changes.
- The repository's security roadmap records sensitive environment-variable hygiene work as pending, including server-only Supabase/Stripe/cron keys and stale `NEXT_PUBLIC_*` database/JWT variable names. This review did not read or modify secret values. Keep privileged keys out of Git and all `NEXT_PUBLIC_*` variables.
- GitHub code search did not return matches for common literal prefixes `sk_live_` or `whsec_`; this is not a substitute for GitHub secret scanning or a complete history scan.

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
- Do not apply the proposed migrations to production without a successful isolated test. A paid Supabase development branch was deliberately not created.
- CI passed for the PR commit checked during this review: `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run build`. These checks do not execute or validate the SQL migrations.
- Before merge, validate effective grants and RLS, own-row access, ticket creation, profile display-name updates, admin dashboard access, and denial of cross-user reads/writes.
- Do not merge or apply if any required customer workflow fails. Rollback must restore only the minimum privileges demonstrated to be required; do not broadly regrant CRUD to `anon` or `authenticated`.
- This document and the proposed migration do not constitute a security certification.
