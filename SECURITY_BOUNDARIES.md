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
- This migration must be reviewed and tested in a non-production Supabase branch before production.
- Confirm that customer routes use server-side clients where required and that existing UI does not depend on direct browser writes that this migration removes.
- Verify authenticated own-row reads, ticket insertion, profile display-name updates, and denial of direct payment/quote writes.
- Do not merge or apply if any required customer workflow fails. Rollback must restore only the minimum privileges demonstrated to be required; do not broadly regrant CRUD to `anon` or `authenticated`.
- This document and the proposed migration do not constitute a security certification.
