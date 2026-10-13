# NeoTech ZGZ — Security roadmap (13 October 2026)

This roadmap records verified work and remaining operational gates. It does not claim complete security; no system can be made invulnerable.

## Completed

- Merged PR #18 as `eff5df317d755e5fbcda9a24221dbac47b67930b`: authenticated profile updates are restricted in the API and database to `display_name`; account profile writes are rate limited; failed Stripe webhook persistence returns a retryable HTTP 500 with redacted logs and no-store responses; installs use `npm ci`; Dependabot updates npm and GitHub Actions weekly; CI runs `npm audit --audit-level=high`.
- Applied Supabase migration `restrict_profile_updates` to production, recorded at version `20261013132826`. Post-migration privilege inspection confirmed `authenticated` can update only `display_name`; `service_role` retains required update privileges.
- GitHub Actions run `38405327860` passed for the PR head, including dependency installation, build, and high-severity npm audit. Vercel built the merged `main` commit as READY deployment `dpl_GUDDNV74BgbqX3Ad77xKX6ziZnQP`; its preview homepage and `/api/health` returned HTTP 200 with HSTS, nosniff, frame denial, Referrer-Policy, and Permissions-Policy.
- Read-only checks of production `https://neotechzgz.vercel.app` returned HTTP 200 for the homepage and `/api/health`.

## Deployment state

The merged Vercel deployment is READY but has no production target. The latest deployment listed with target `production` still uses commit `532706f28264b4ebe55b99d5e8ba243016e70a9a`. Promoting the new deployment failed with HTTP 403 because this Codex connection does not have access to the Vercel team. Do not claim the merged changes are live until the new deployment is promoted and the public domain is checked again.

## Current findings and limits

- Supabase Auth's security advisor reports leaked-password protection disabled. Enable it in Supabase Auth settings.
- Vercel environment metadata flags 12 entries as readable secrets. Their values were not decrypted or changed. Review sensitivity and rotate affected credentials in Vercel's dashboard if warranted.
- Read-only Stripe inspection found three enabled live webhook endpoints: two target the NeoTech Vercel webhook URL and one targets a Supabase Edge Function. The Supabase project for that function is not accessible through this connection. Delivery-attempt history is not available through the connected Stripe API tools.
- The webhook currently writes a deleted subscription as payment status `refunded`. Cancellation and refund are different financial states. Do not change Stripe destinations or the handler until operators verify endpoint ownership, event delivery history, and test-mode behavior.
- Preview `/api/admin/overview` is protected by Vercel deployment authentication; the attempted unauthenticated fetch returned 401 and therefore did not verify the app-level admin handler.
- Main-branch protection could not be configured with the available GitHub connector tools.
- Local Windows build could not run because dependency resolution returned `EPERM`; use CI evidence rather than claiming a local build.

## Next phases

1. **Publish the merged release.** Grant this connection access to the Vercel team; promote the READY deployment to production; verify the active production commit and the homepage, health route, and key authenticated flows at `neotechzgz.vercel.app`.
2. **Complete Stripe architecture verification.** In Stripe Dashboard, review event-delivery attempts for all enabled live destinations, establish which destination is authoritative, check retries and signatures, and confirm a test-mode destination is available. Keep all existing destinations and signing secrets unchanged until this review is complete.
3. **Separate subscription lifecycle from payment outcomes.** Design a dedicated subscription-status field and customer-account display for active, past-due, and canceled states; keep refunds tied only to confirmed refund events. Account for duplicate and out-of-order events. Validate in an isolated test environment before applying a database migration or changing the webhook handler.
4. **Harden provider settings.** Enable leaked-password protection in Supabase Auth. Review the 12 Vercel readable-secret findings in the dashboard; use sensitive/write-only environment settings and rotate affected values there where appropriate. Never put secret values in source, PRs, or chat.
5. **Strengthen repository and operations controls.** Configure main-branch protection and require the security build gate; add regression coverage for profile authorization and webhook retries; review storage RLS, administrator MFA, audit logging, backups, and recovery procedures.
6. **Improve site security policy and design after verification.** Review Content Security Policy against the actual Stripe, analytics, and email integrations before introducing enforcement; then run visual, accessibility, and responsive checks on the public site.

Do not expose secrets. Do not modify or delete Stripe webhook destinations until their architecture and delivery have been verified.
