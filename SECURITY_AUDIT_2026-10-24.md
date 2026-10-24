# NeoTech ZGZ — security, release and legal readiness (2026-10-24)

## Production deployment evidence

- Security PR #61 was merged using GitHub's merge operation after the required checks passed. Merge commit: `322a145ebf817a2b24c0865b5a42cb67cbd433ab`.
- Production deployment `dpl_GgZkHV7fPZ6XmfNzh7eS9BRccrGw` reached `READY` for that commit and Vercel assigned `neotechzgz.vercel.app` to it.
- Fetching `https://neotechzgz.vercel.app` returned HTTP 200 and the expected Spanish page title after deployment.
- The production response still does not include the canonical metadata improvements in SEO PR #62; those changes remain in a draft PR and are not published.
- The production retention cron schedule remains `0 3 * * *`; it was not changed.

## Dependency remediation

- Manifest and lockfile pin Next.js to `16.4.3` and override DOMPurify to `3.4.17`.
- The mandatory GitHub Security build gate passed for the merged commit. It ran `npm ci`, `npm audit --audit-level=high`, `npm test`, and `npm run build`; all steps succeeded.
- The regression suite includes a lockfile version assertion and least-privilege policy checks. The isolated sandbox also reported 0 audit advisories and 11 passing tests before the final additional SEO tests were added.

## Supabase database

- Canonical project `qkzmpxyefuqdhyxwfjcw` records migration version `20261024133121`, name `least_privilege_public_tables_20261024150000`, as applied.
- Catalog checks confirmed no direct table privileges for `anon` on the five reviewed tables, narrowed `authenticated` grants, and expected own-quote/admin-read policies.
- The account-retention cron schedule and payment timing logic were not changed.
- The external Supabase project in the Stripe Edge Function URL is not one of the two linked projects. Its webhook source and database configuration remain unavailable; do not disable it without access and delivery evidence.

## Vercel environment hardening and cron rotation

- The 12 variables previously flagged by Vercel as `readable-secret` were converted to sensitive visibility and remain production-only. Vercel metadata now reports no `readable-secret` issue for those variables. This prevents ordinary readback through the environment-variable API but does not itself rotate provider-issued credentials.
- The self-managed `CRON_SECRET` was rotated to a new random 256-bit value and stored as a sensitive production-only variable. The deployed cron handler supports an overlap with `CRON_SECRET_NEXT` to avoid interrupting scheduled retention.
- The deployment built after rotation is READY. The old overlap key remains accepted temporarily; remove the fallback and retire the overlap variable only after verifying scheduled invocation behavior. No authenticated manual cron request was made, to avoid triggering account deletion.
- Eight unused or malformed public-prefixed legacy aliases were replaced with a non-credential sentinel value. The source fallback references were removed in the merged code. The API rejected changes to three other sensitive variables; no provider-side rotation of their underlying credentials has been claimed.
- Remaining provider-issued credential rotation is pending at the source: Stripe API/webhook credentials, Supabase service/secret keys, Redis/KV, EmailJS and any actual database password. Rotate each at its provider, update Vercel, redeploy and validate consumers. Do not replace a provider-issued credential with a random string.
- Supabase Auth leaked-password protection remains disabled because the connected plan does not provide that feature; no bypass was attempted.

## Stripe — unresolved critical release gate

- The Vercel webhook handler validates the Stripe signature, upserts completed Checkout sessions by `stripe_session_id`, and returns 500 on persistence failures to allow retries.
- The handler does not demonstrate a persistent event-ID deduplication ledger. Invoice/subscription updates require replay and out-of-order event tests.
- Three live endpoints were inventoried previously: two point to the same Vercel URL and one points to a Supabase Edge Function in an external project. Endpoint-specific signing secrets and delivery histories are not available through the current Stripe connector.
- The connected Stripe context exposed to this session is live mode; no test-mode account/context is available. No test payment was run, and no live endpoint was disabled.
- Do not consolidate or declare the three processors equivalent until the external Edge Function source, endpoint-specific secrets, delivery/retry history, idempotency and test-mode end-to-end payment flows are verified.

## Legal and commercial readiness

- The public legal page currently displays the supplied provider identity/contact information, while also stating that postal details, fiscal status and full contracting conditions require verification. Confirm that the published identity data is correct and intentionally public before promotion.
- The page describes provider categories including Google Analytics and Meta Pixel; code contains hardcoded vendor IDs and injects optional scripts after the consent category is selected. The actual cookie rejection/acceptance behavior, vendor configuration, data-transfer terms and retention need a browser-level legal/technical test before certification.
- The legal page explicitly says full general contracting conditions remain pending. Pricing shown in the plans page is not, by itself, sufficient: tax display, VAT handling, renewal, cancellation, withdrawal, early performance consent and billing terms must be finalized.
- Technical work cannot complete Spanish tax/social-security registration or confirm the legal status of the activity. These actions require the titular and, where appropriate, a qualified Spanish adviser. International selling needs a scoped review of VAT, consumer law, privacy transfers and contract terms per market; no global legal compliance is certified.

## SEO and HubSpot readiness

- Draft SEO PR #62 adds canonical metadata, public-only sitemap, crawler exclusions for API/private routes, noindex layouts for login/register/account, and an eight-week content plan.
- No Google Search Console verification token has been invented or added. The SEO PR remains draft pending review.
- HubSpot is connected, but the current connector reports write/marketing permissions require reauthorization. No campaigns, contacts or tracking pixels were created through HubSpot.
- Google Business Profile and Bing Webmaster Tools remain future options, not connected or configured. Metricool is connected for later social publishing.
- Do not claim guaranteed top search placement; measure search visibility and qualified leads after the relevant services are configured.

## Release gate

The dependency hotfix and Supabase grant hardening are deployed. The service is **not fully certified or ready for unrestricted global promotion** while provider-side credential rotations, Stripe test-mode and external Edge Function verification, final cron overlap retirement, legal/tax confirmation and cookie-consent testing remain outstanding. Do not disable Stripe endpoints, bypass branch protection, or publish a Search Console token that the owner has not supplied.
