# Supabase Preview — Auth, JWT, role isolation and recovery readiness
Date: 2026-10-30

## Scope and safety

- Supabase Preview project: `hdpikaqxeadqmckmmjfh`
- Account connection: the existing authenticated Supabase connector link that successfully listed this project and queried its database.
- Project state: `ACTIVE_HEALTHY`; region `eu-central-1`; PostgreSQL 17.11.
- This pass made no persistent database, Auth, project configuration, backup, credential, Stripe, or Production changes.
- SQL isolation probes ran in explicit transactions and ended with `ROLLBACK`.
- No Auth user, password hash, token, MFA secret, signing key, refresh token, or provider secret was selected or exposed.

## Connector recovery

- Supabase connector access is restored for read operations on the exact Preview project.
- `list_projects` returned the expected project.
- `get_project` returned `ACTIVE_HEALTHY`.
- The alternate Supabase connector identity previously observed still has permission failures; it was not used or repeatedly retried.
- This confirms administrative database access through one connector identity, not a complete end-user Auth configuration validation.

## Auth database inventory (aggregate metadata only)

Observed counts:
- `auth.instances`: 0 rows.
- `auth.users`: 0 rows.
- `auth.identities`: 0 rows.
- `auth.sessions`: 0 rows.
- `auth.refresh_tokens`: 0 rows.
- `auth.mfa_factors`: 0 rows.
- `auth.audit_log_entries`: 0 rows.

No user accounts or live sessions exist in this Preview database at the time of inspection. Consequently, no real account/provider sign-in or enrolled MFA factor can be tested in this environment.

The hosted Auth service configuration (enabled providers, password policy, MFA enrollment/verification toggles, CAPTCHA, email confirmation, rate limits, session timeouts, JWT signing configuration and expiry) is not exposed by the database connector tools used in this session. The `auth.instances` table is empty, so it does not provide a configuration snapshot. Do not infer provider enablement or policy values from an empty identities table.

## Role and JWT claim checks

Database role metadata:
- `anon`: not superuser, no BYPASSRLS, cannot login.
- `authenticated`: not superuser, no BYPASSRLS, cannot login.
- `authenticator`: not superuser, no BYPASSRLS, login role, no role inheritance.
- `service_role`: not superuser, BYPASSRLS as designed for trusted server-side operations, cannot login directly.

The `anon` and `authenticated` roles have schema USAGE on `auth`, but no SELECT on `auth.users`. Application-table grants and RLS policies were inspected in the preceding security audit.

Two synthetic JWT-claim probes were run in separate transactions under `SET LOCAL ROLE authenticated`, with different synthetic UUIDs:
- A: `11111111-1111-4111-8111-111111111111`
- B: `22222222-2222-4222-8222-222222222222`

For both probes:
- PostgreSQL role resolved to `authenticated`.
- `auth.uid()` resolved to the synthetic subject.
- `auth.jwt()->>'role'` resolved to `authenticated`.
- Counts visible under the policies were zero for profiles, quotes, payments and support tickets.
- Each transaction ended with `ROLLBACK`.

**Limit of this test:** all four application tables were empty and there are no Auth users. This confirms role switching and JWT-claim context plumbing, but it does not prove positive owner-vs-other-user isolation against actual synthetic rows, nor does it validate cryptographic JWT signature verification. A proper end-to-end isolation test requires users created through the supported Supabase Auth Admin API in a dedicated Preview test setup, followed by inserts through normal application pathways and negative cross-user assertions.

## Auth configuration — unresolved external control plane

The following values were not available through the connected database tools and remain unverified:
- Enabled sign-in providers and OAuth callback allowlists/secrets.
- Email confirmation, SMTP configuration and redirect allowlists.
- Password minimum length, required character classes, leaked-password protection and password-change reauthentication.
- MFA TOTP/phone enrollment and verification settings; whether MFA is required for privileged users.
- CAPTCHA and Auth rate limits.
- JWT signing algorithm/key inventory, key rotation state, access-token expiry and issuer/audience configuration.
- Session time-box, inactivity timeout, single-session controls and refresh-token reuse interval.

No configuration was changed. Do not set guessed values via SQL or edit internal `auth` tables. Hosted Auth configuration must be read and managed through the official Supabase Management API or Dashboard, using a separately authorized Management API connection. Never place a personal access token or provider secret in this repository or chat.

## Backup, PITR and disaster recovery

The project metadata endpoint returned project state, region and database version, but no backup/PITR configuration. The available connector has no backup-list, restore-point, PITR-status or restore-drill operation.

Therefore the following remain **unverified**:
- Whether scheduled physical backups are enabled and their retention.
- Whether PITR is enabled, the recovery window and latest recoverable timestamp.
- Backup encryption, regional storage/residency and provider retention.
- Last successful backup and restore validation.
- RPO/RTO achieved by an actual restore drill.

Do not claim that a backup exists or that PITR is enabled based only on generic Supabase platform documentation. Obtain evidence from the project's Database → Backups dashboard or the corresponding official Management API configuration/status. A recovery drill should restore to a separate Preview/temporary project in the same EU region, validate schema, Auth, policies and application reads, record elapsed time, and only then approve the recovery runbook. Never overwrite this project as a test.

## Corrections made

None. The observed role properties are consistent with least privilege. The missing Auth/backup evidence is an observability/authorization gap in the current connector surface, not proof that the underlying service settings are insecure. Changing Auth or recovery settings without knowing current values and operational consequences could lock out users or cause session invalidation.

## Blockers and next actions

1. Establish a read-only Supabase Management API connection for the exact project, or have the owner open the Auth and Database Backups settings pages and provide redacted configuration exports/screenshots. Do not share secrets or personal access tokens in chat.
2. Read and document actual Auth provider, password, MFA, CAPTCHA, rate-limit, JWT and session settings.
3. Configure only evidence-backed changes, with before/after snapshots and rollback plan.
4. Create synthetic users using the supported Auth Admin API in Preview; exercise sign-up, confirmation, login, refresh, logout, MFA, password reset and cross-user RLS tests; delete test users after evidence capture.
5. Verify scheduled backup status, retention, PITR window and latest restore point; run a restore-to-new-project drill without modifying the source.
6. Run Supabase security advisors and application tests after any correction.
7. Keep Stripe TEST end-to-end work paused until Auth configuration and recovery evidence are complete. Stripe Live, Checkout and Production remain untouched.

## Phase decision

- Connector read access: **recovered through one authorized connection**.
- Project health: **verified ACTIVE_HEALTHY**.
- Database role posture and JWT claim plumbing: **partially verified**.
- Actual hosted Auth policy and provider configuration: **blocked — Management API/Dashboard evidence required**.
- Positive synthetic-user RLS isolation: **blocked — supported Auth Admin API required**.
- Backup/PITR and restore drill: **blocked — backup control-plane access required**.
- Overall: **Supabase recovery/access phase remains open; do not resume Stripe integration yet**.
