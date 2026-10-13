# NeoTech ZGZ — Security roadmap (October 2026)

## Changes in this branch
- Admin API endpoints require an authenticated profile with `is_admin = true`; email-address-only admin bypasses are removed.
- Stripe checkout and billing portal use a configured canonical site URL, per-user rate limits, safer error responses, and subscription metadata.
- Support ticket creation and account deletion requests are rate limited.
- Account deletion is explicit and uses a 60-day retention window. The cron requires `CRON_SECRET`, uses constant-time token comparison, handles a small batch, excludes admin profiles, retries subscription cancellation, anonymizes linked records, and fails closed when checks fail.
- Default HTTP security headers and a CI build gate are added; Vercel installs dependencies with `npm ci` from the committed lockfile.
- SQL migration changes payment/support foreign keys so anonymized records can survive account removal.

## Required before production
1. Run the migration against a staging Supabase project; inspect actual schema, FK names, RLS policies and triggers first.
2. Verify Vercel environment variables exist and match the code: `CRON_SECRET`, Supabase URL/service-role key, Stripe secret, product price IDs and canonical site URL.
3. Verify the Vercel cron schedule and test unauthorized/authorized requests without using real customer accounts.
4. Test Stripe checkout, portal, cancellation and webhook reconciliation with Stripe test mode.
5. Test deletion with synthetic accounts and confirm all linked rows, support content, quotes, history and payment records behave as intended.
6. Run `npm ci`, `npm run build`, lint/type checks and security/dependency scans; fix all failures.
7. Review CSP and other headers against embedded checkout, analytics, email, and any third-party integrations before tightening further.
8. Review Supabase RLS policies table-by-table, storage policies, service-role exposure, auth settings, MFA for administrators, audit logs, backups and recovery procedures.
9. Deploy to a Vercel preview, perform smoke tests, then merge and monitor production.

## Limitations
This roadmap is not a claim of complete security. No web application can be certified “100% secure”. The follow-up migration has not been applied to any database, and the follow-up source changes have not been deployed to production.

## Follow-up review — 13 October 2026
- Confirmed `main` and the latest production deployment still point to `532706f28264b4ebe55b99d5e8ba243016e70a9a`. The GitHub build workflow passed for that commit; the combined GitHub status also reports a failed Vercel check.
- Found that the existing `profiles_update_own` row policy did not prevent users from changing privileged columns such as `is_admin`. A follow-up migration limits authenticated column updates to `display_name`; it has not been applied.
- Found that Stripe webhook database writes did not check Supabase errors or whether subscription/invoice updates matched a payment row. The follow-up code now returns a retryable 500 when persistence fails. Existing Stripe endpoints and secrets were not changed.
- The current webhook also records a deleted Stripe subscription as `refunded`, although cancellation does not establish that a payment was refunded. Keep this separate from the retry fix until the payment-status schema and account UI can be migrated together.
- Public checks observed HTTP 200 for the production homepage and health endpoint, HTTP 401 for unauthenticated admin overview, and the configured security response headers on the homepage. The webhook was not POST-tested because the available Vercel fetch operation did not provide a reliable POST response.
- Vercel's environment metadata reports several sensitive variables with a `readable-secret` security issue. Review and rotate those values in Vercel without sharing them in chat. The returned metadata was not used to change environment variables.

## Next phases
1. Apply the profile-column migration to staging and verify that an authenticated user can update `display_name` but cannot update `is_admin` or `deleted_at`; verify service-role account deletion still works.
2. Test Stripe webhook signature rejection, duplicate delivery, Supabase write failures and event ordering in Stripe test mode; verify Stripe retries after persistence failures. Migrate subscription cancellation status separately from refunds, including schema and account UI.
3. Review and rotate the Vercel variables flagged as readable secrets; confirm production and preview Supabase configuration is consistent without exposing values.
4. Dependabot now proposes weekly npm and GitHub Actions updates; add repository branch protection and required CI checks, vulnerability auditing, and regression coverage for authorization and webhook retries.
5. Review storage policies, administrator MFA, audit logging, backups/recovery, and a CSP compatible with the site's actual third-party integrations.
6. Deploy a preview only after the migration and Stripe staging checks pass; run smoke checks there, then consider production after CI is green and configuration findings are resolved.
