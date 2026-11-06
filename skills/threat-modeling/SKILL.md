---
name: threat-modeling
description: Systematic STRIDE threat modeling, trust boundary identification, attack surface mapping, and mitigation verification for architecture, API, and cloud infrastructure changes.
---

# Threat Modeling Skill (`threat-modeling`)

Use this skill when designing new system architectures, exposing new public endpoints, modifying authentication/authorization boundaries, or conducting pre-production security assessments.

---

## 1. Trust Boundaries & Surface Mapping

Before evaluating threats, map every trust boundary transition:
1. **External Client to Edge**: Browser/mobile app to CDN/reverse proxy (TLS termination, DDoS filtering, CORS policies).
2. **Edge to Application Gateway**: Reverse proxy to application service (header sanitization, `X-Forwarded-*` trust, rate limiting).
3. **Application to Internal Services**: Microservices, queue brokers, caching nodes (mutual TLS, network segmentation).
4. **Application to Data Tier**: Service to relational/vector databases (parameterized queries, least-privilege connection pooling).
5. **Application to Third-Party APIs**: Outbound webhooks and partner APIs (egress filtering, credential isolation, SSRF prevention).

---

## 2. The STRIDE Threat Matrix

Evaluate every trust boundary against the six STRIDE threat categories:

| Threat Category | Core Question | Primary Attack Vector | Mandatory Defense & Verification |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Can an attacker pretend to be someone else? | Forged tokens, unverified headers, weak session cookies | Cryptographically signed tokens (RS256/Ed25519), `__Host-` prefixed cookies with `Secure; HttpOnly; SameSite=Lax`. |
| **Tampering** | Can an attacker modify data in transit or at rest? | Parameter tampering, payload manipulation, replay attacks | Strict JSON schema validation, input sanitization, HMAC signatures for webhooks, immutable audit logs. |
| **Repudiation** | Can a user deny performing an action? | Missing audit logs, unauthenticated mutations | Append-only structured audit logs capturing actor ID, timestamp, IP, and immutable mutation diffs. |
| **Information Disclosure** | Can unauthorized parties access private data? | Detailed stack traces in responses, unredacted logs, PII leakage, IDOR | Generic error responses in production, zero secrets in client bundles, strict tenant isolation (`tenant_id` WHERE clauses). |
| **Denial of Service** | Can an attacker exhaust system resources? | Unbounded payload sizes, missing query pagination, regex DoS (ReDoS) | Hard request body size limits, mandatory pagination (`limit`/`offset` or cursor), algorithmic timeouts on regex matching. |
| **Elevation of Privilege** | Can an unprivileged user execute admin actions? | Insecure Direct Object References (IDOR), broken RBAC/ABAC | Centralized authorization guards on every endpoint, least-privilege database user permissions. |

---

## 3. Threat Mitigation Ledger Template

For Tier 2 and Tier 3 architectural tasks, record verified mitigations in the task plan or security report:

```markdown
### STRIDE Threat Ledger
| ID | Boundary | STRIDE Category | Threat Description | Verified Mitigation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T-01 | Client -> Edge | Spoofing | Client forges X-User-Id header | Edge strips all upstream identity headers before auth | Mitigated |
| T-02 | Edge -> API | Denial of Service | Unbounded JSON upload exhausts RAM | Body parser capped at 1MB with early 413 termination | Mitigated |
| T-03 | API -> DB | Elevation of Privilege | Tenant B IDOR on Tenant A invoices | RLS policy and repository WHERE tenant_id = auth.tenant | Mitigated |
```

---

## 4. Unmistakable Guardrails
- **No Unmitigated Blockers**: No architectural feature crossing a trust boundary may be approved with open high-severity STRIDE threats.
- **Fail Closed**: In any authorization failure, token validation error, or exception branch, system state must default to access denied.
