---
name: security-audit-sweep
description: Generic security audit sweep for web applications, APIs, and microservices: performs dynamic differential HTTP probing, validates IAM role entitlements, scans dependency vulnerabilities, and checks for secret leakage.
---

# Security Audit Sweep Skill (`security-audit-sweep`)

Use this skill when auditing security posture, validating authentication gates, preparing for penetration tests, or verifying production release readiness.

## The 4-Phase Security Sweep

### Phase 1: Differential HTTP Surface Probing
Use the methodology from `strix-security` to verify every mounted route across multiple identity contexts:
1. **Anonymous / Unauthenticated**:
   - Probe `/`, `/api/*`, `/settings`, `/dashboard`, `/admin`.
   - Verify protected routes respond with `302/303 Redirect` to IdP or `401 Unauthorized`.
   - Confirm zero PII, stack traces, or session keys leak in responses.
2. **Unprivileged / Cross-Tenant Principal**:
   - Verify coarse gate roles (`user`, `member`, `editor`, `admin`) are strictly enforced.
   - Test for horizontal privilege escalation (accessing Tenant B using Tenant A credentials).
3. **Authorized Principal**:
   - Confirm successful access with valid `__Host-` session cookie or Bearer token.
   - Verify CSRF protection on mutation routes (`POST`, `PUT`, `DELETE`).

### Phase 2: IAM & Database Entitlement Checks
- Verify database isolation:
  - Assert that application connections use least-privileged roles (`app_reader`, `app_writer`, `app_migrator`, etc.) and never the database superuser.
  - Verify every mutation passes through audited repositories with transactional audit records.
- Verify service accounts:
  - Service principals must never hold administrative roles without explicit, time-bounded scoping.

### Phase 3: Dependency Vulnerability Audit
- Scan project dependencies against CVE databases:
  ```bash
  pnpm audit --audit-level=high
  ```
- Review any flagged transitive vulnerabilities and apply patches or overrides.

### Phase 4: Secret Leakage & Cryptographic Checks
- Inspect repository for committed secrets:
  - Check `.env`, `.env.local`, `.git`, commit logs for private keys, JWT signing secrets, or cloud API keys.
- Cryptographic verification:
  - Tokens and passwords hashed using modern algorithms (Argon2id, bcrypt).
  - Sensitive at-rest data (e.g. third-party OAuth refresh tokens) encrypted with AES-256-GCM.
