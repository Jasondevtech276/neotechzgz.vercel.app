# NeoTech ZGZ — security boundaries

## Current scope
This document records the safe scope of the current security review. It does not enable remote control, unattended access, or access to Vercel, ChatGPT, customer devices, or external accounts.

## Required security invariants
- Never expose Supabase service-role keys, Stripe secrets, API keys, or remote-access credentials to browser code or public environment variables.
- Treat user IDs, roles, admin flags, prices, and payment states supplied by a client as untrusted.
- Authenticate server-side customer operations and scope data access to the authenticated user.
- Enforce least privilege through both database grants and Row Level Security (RLS); neither is a substitute for the other.
- Customer profile self-service may change only explicitly approved non-privileged fields.
- Keep quote and payment state server-controlled; verify Stripe webhook signatures and handle events idempotently.
- Treat AI output as untrusted input. It must not independently authorize payments, deletion, administrative changes, or remote access.
- Require explicit, time-limited customer consent and auditable authorization before any future remote-support feature. Remote access remains disabled.

## Status of the current database proposal
The least-privilege SQL migrations in pull request #49 are **proposed only**. They have not been applied to production and must not be merged until their complete migration sequence is validated against a disposable, non-production database and the relevant customer and administrator workflows are verified.

The latest GitHub Actions security build gate passed for the current pull-request commit. CI passing does not validate the SQL migrations or prove that production workflows remain functional.

## Minimum validation before database rollout
- Confirm effective grants and RLS policies after applying the full migration sequence in isolation.
- Test own-row reads, profile display-name updates, support-ticket creation, and administrator access.
- Verify cross-user reads and unauthorized writes are denied.
- Review all frontend and server code paths for direct database writes.
- Define and test a least-privilege rollback before production rollout.

This document is an engineering checkpoint, not a security certification.
