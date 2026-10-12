# NeoTech ZGZ — Security roadmap (October 2026)

## Changes in this branch
- Admin API endpoints require an authenticated profile with `is_admin = true`; email-address-only admin bypasses are removed.
- Stripe checkout and billing portal use a configured canonical site URL, per-user rate limits, safer error responses, and subscription metadata.
- Support ticket creation and account deletion requests are rate limited.
- Account deletion is explicit and uses a 60-day retention window. The cron requires `CRON_SECRET`, uses constant-time token comparison, handles a small batch, excludes admin profiles, retries subscription cancellation, anonymizes linked records, and fails closed when checks fail.
- Default HTTP security headers and a CI build gate are added.
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
This roadmap is not a claim of complete security. No web application can be certified “100% secure”. This branch has not been validated by a successful full build, the migration has not been applied to any database, and no production deployment is implied by these source changes.
