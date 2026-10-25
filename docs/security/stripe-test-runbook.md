# Stripe webhook test harness (non-production)

## Scope and safety
- This receiver is a **test-mode delivery and persistence harness**, not the authoritative production payment processor.
- It rejects events with `livemode !== false`, requires `STRIPE_TEST_SECRET_KEY` to start with `sk_test_`, and uses the endpoint-specific `STRIPE_TEST_WEBHOOK_SECRET`.
- It stores event ID/type, Stripe object ID and a SHA-256 digest only; it never stores the raw payload.
- It is intentionally not deployed or wired to a live Stripe endpoint by this change.
- Apply the migration only to an isolated Supabase development branch. Do not run it against production without a separate reviewed change.

## Required test environment
Configure these secrets only in the isolated Supabase test function:
- `STRIPE_TEST_SECRET_KEY` — restricted Stripe test-mode secret key.
- `STRIPE_TEST_WEBHOOK_SECRET` — signing secret for this exact test endpoint.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — the isolated branch, never production.
Do not commit or paste secret values into issues, PRs, CI logs or chat.

## Acceptance tests
1. POST without `stripe-signature` returns 503 or 400 and writes no row.
2. Invalid signature returns 400 and writes no row.
3. Valid Stripe test event returns 200 and exactly one ledger row.
4. Replaying the same event ID returns 200 with `duplicate: true`; row count remains one.
5. Live-mode event is rejected and writes no row.
6. Force a database error: receiver returns 500 so Stripe retries; no payload or secret appears in logs.
7. Send two distinct test event IDs concurrently; both persist once.
8. Verify the ledger row after each delivery in the isolated branch.

## Production payment-state verification (separate gate)
This harness alone does not certify the Next.js production route's payment/subscription projection. Before changing live endpoints, test the actual Vercel Preview deployment against the isolated database with Stripe test credentials. Cover checkout success, async success, subscription update/cancellation, invoice paid/failed, refunds, duplicate delivery, retry after DB failure, concurrency and out-of-order delivery. After each event compare the event ledger and persisted payment/invoice/subscription state with Stripe's current test-mode objects.

## Rollback
- Keep the existing production endpoint(s) enabled throughout test work.
- Do not configure a live Stripe endpoint to this function.
- If tests fail, remove the test endpoint from Stripe test mode and delete the isolated Supabase branch after retaining non-sensitive test evidence.
- Production rollback is a separate reviewed deployment; never roll back by deleting event history.
