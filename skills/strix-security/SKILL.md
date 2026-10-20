---
name: strix-security
description: Autonomous AI penetration testing and dynamic HTTP differential probing methodology (based on usestrix/strix). Never trust code comments alone; verify every mounted route, static asset prefix, reverse-proxy rule, and Host-header boundary with concrete Proof-of-Concept (PoC) HTTP probes across Anonymous, Unprivileged, Cross-Tenant/Venue, and Authorized principals.
---

# Strix Security — Dynamic Penetration Testing & Differential HTTP Probing

Based on the open-source [usestrix/strix](https://github.com/usestrix/strix) autonomous penetration testing framework. This skill closes the gap between **static code reading** and **runtime exploitability** by requiring dynamic, differential HTTP verification of every surface.

## Core Doctrine: "Comments Are Claims, Not Controls"

Static security audits fail when an auditor reads a code comment (e.g., *"Caddy blocks `/internal/*`"* or *"Caddy gates `/data/*` via `forward_auth`"*) and marks the control as `PASS` without sending a single request.

Under `strix-security`:
1. **Zero Trust in Comments**: A comment describing a proxy rule, auth hook, or upstream gate is treated as an *unverified hypothesis* until proven by both configuration inspection and a live or injected HTTP probe.
2. **Every Static Mount Is an Attack Surface**: Every `@fastify/static` registration, `sendFile` handler, `public/` directory, and reverse-proxy `file_server` block must be enumerated and probed directly.
3. **Differential Principal Matrix**: Every protected endpoint and static data path must be probed across 4 principals:
   - **P0 (Anonymous)**: No session cookie, no token $\rightarrow$ Must return `401` (or `404` for internal routes).
   - **P1 (Unprivileged / Zero-Grant User)**: Valid session cookie, `grants: []`, `allowedModules: []` $\rightarrow$ Must return `403`.
   - **P2 (Cross-Scope / Wrong-Venue User)**: Valid session cookie with a grant on Venue A (`MCC`), requesting Venue B (`ALA`) tiles, metadata, or API routes $\rightarrow$ Must return `403`.
   - **P3 (Authorized User)**: Valid session cookie with a grant on Venue B (`ALA`) $\rightarrow$ Returns `200` with `Cache-Control: private, no-cache, no-store, must-revalidate`.

---

## 5 Mandatory Strix Hunting Vectors

### Vector 1: Static Asset & Extension-Bypass Probing
- **Target**: Global `preHandler`/`onRequest` hooks (`packages/auth-node/src/plugin.ts`) and `@fastify/static` mounts (`apps/api/src/static.ts`).
- **Attack**: Append static file extensions (`.png`, `.json`, `.svg`, `.js`, `.css`, `.map`) or hit static-mounted data trees (`/layer/data/<VENUE>/venue.json`, `/layer/data/<VENUE>/tiles/.../*.png`, `/data/<VENUE>/*`, `/staging/*`, `/layer/staging/*`) without a session cookie.
- **Invariant**: No regex or extension allowlist may classify non-bundle paths as public. Only content-hashed bundle directories (`/assets/`, `/layer/assets/`, `/pulse/assets/`) and explicitly named public PWA files (`favicon.ico`, `manifest.json`, `service-worker.js`) may bypass session authentication.

### Vector 2: Reverse-Proxy & `Host`-Header Differential Probing
- **Target**: `/internal/*`, `/api/*/internal/*`, `forward_auth` gates, and `Caddyfile` site blocks.
- **Attack**: Probe internal endpoints using:
  1. Primary public domain (`Host: podium.test`)
  2. Alternate tunnel/edge hostnames (`Host: podium.tail42997.ts.net`)
  3. Arbitrary spoofed `Host` headers (`Host: evil.example.com`, `Host: 127.0.0.1:443`)
- **Invariant**:
  - `Caddyfile` must explicitly reject `/internal/*` and `/api/*/internal/*` at the edge (`respond @internal 404`).
  - Internal origin checks (`isInternallyOriginated`) must enforce a **strict internal container host allowlist** (`api:3000`, `layer:3000`, `pulse:3000`, `localhost:3000`), never just a `PUBLIC_DOMAIN` blocklist that fails open when accessed through Tailscale or an alternate DNS name.

### Vector 3: Horizontal BOLA / Cross-Venue & Cross-Team Traversal
- **Target**: All venue-scoped and team-scoped routes (`/api/layer/venues/:venue/*`, `/layer/data/:venue/*`, `/data/:venue/*`, `/api/crew/*`).
- **Attack**: Authenticate as a principal granted access to `MCC` and request `ALA` resources (both JSON API routes and static tile/manifest files).
- **Invariant**: Every handler and static `preHandler` serving venue-specific data must verify `canSeeVenue(request, venueCode)` (or equivalent scope predicate) before reading from disk or database.

### Vector 4: Path Traversal & Sibling-Prefix Escape
- **Target**: File-streaming and upload handlers (`modules/layer/src/pipeline.ts`, `/staging/*`, `/layer/staging/*`).
- **Attack**: Supply `..`, URL-encoded `%2e%2e%2f`, or sibling-directory prefixes (e.g., `/srv/layer-staging-other` when base is `/srv/layer-staging`).
- **Invariant**: Path containment checks must always verify `targetPath.startsWith(normalizedBase + path.sep)` (with the trailing path separator), never a bare string prefix check.

### Vector 5: Cache Poisoning & Post-Logout Artifact Persistence
- **Target**: `Cache-Control` headers on `/api/*`, `/auth/*`, `/data/*`, `/layer/data/*`, `/staging/*`, and `/layer/staging/*`.
- **Attack**: Inspect response headers on authenticated tile `.png` and `venue.json` responses for `public` or positive `max-age` values that allow shared proxies or browser disk caches to serve confidential drawings after logout.
- **Invariant**: Every authenticated API, tile, manifest, and staging response must emit `Cache-Control: no-store` or `private, no-cache, no-store, must-revalidate`.

---

## Automated Execution in Podium

Whenever executing a security audit or modifying auth/static/proxy code in Podium, run the automated Strix probe suite:
```powershell
pnpm audit:security-probes
```
If any probe fails, treat it as a **Critical blocker** and remediate before completing the task.
