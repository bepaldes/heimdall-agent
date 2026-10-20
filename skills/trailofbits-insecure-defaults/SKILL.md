---
name: trailofbits-insecure-defaults
description: Audits codebases for insecure defaults, fail-open patterns, fallback credentials, permissive access control, debug endpoints, and weak cryptography using Trail of Bits vulnerability patterns. Use when reviewing configuration, authentication, encryption, authorization bypasses, or security controls.
---

# Trail of Bits: Insecure Defaults Security Audit

Audit the codebase systematically against Trail of Bits's 6 core insecure-default vulnerability categories:

## Core Categories & References
1. **Debug Features (`references/debug-features.md`)**: Dev/debug endpoints, test routes, verbose error outputs, and mock authentication exposed or enabled by default in production.
2. **Default Credentials (`references/default-credentials.md`)**: Hardcoded or default administrative accounts, default passwords, default tokens, or pre-seeded database identities.
3. **Fail-Open Security (`references/fail-open-security.md`)**: Error handlers, exception catch blocks, or auth guards that default to granting access or skipping verification when errors or network timeouts occur.
4. **Fallback Secrets (`references/fallback-secrets.md`)**: Insecure default secret keys or tokens used when environment variables are unset (e.g., `process.env.JWT_SECRET || 'secret'`).
5. **Permissive Access (`references/permissive-access.md`)**: Overly broad wildcard permissions (e.g. `*`), missing authorization checks on newly created routes, or permissive CORS/CSRF/database role grants.
6. **Weak Cryptography (`references/weak-crypto.md`)**: Deprecated hashing algorithms (MD5, SHA1), weak PRNGs (`Math.random()` for tokens), static IVs, or insecure cipher modes.

## Audit Workflow
- Sweep for fallback expressions: `|| 'secret'`, `?? 'dev'`, `process.env.* || 'admin'`.
- Check auth middleware catch blocks: verify that unknown exceptions fail-closed (HTTP 500/401/403, never next()).
- Verify cryptographic primitives: ensure `crypto.randomBytes()`, Argon2id, and explicit algorithm whitelists are used.
