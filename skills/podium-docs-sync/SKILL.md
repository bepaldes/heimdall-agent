---
name: podium-docs-sync
description: Audit and synchronize all platform documentation, container tracking (docs/11.CONTAINERS.md), API reference (docs/07.API.md), root README, root hygiene/cleanup, and executive Office documents (PODIUM_Requirements_Overview.docx & PODIUM_Investment_Overview_Updated.pptx).
---

# Podium Documentation & Office Synchronization Skill (`podium-docs-sync`)

This skill enables Antigravity (Gemini) to perform end-to-end documentation audits, container tracking verification, API reference synchronization, workspace hygiene cleanup, and automated updates to executive Office documents (`.docx` and `.pptx`).

---

## When to Activate

- When the user asks to:
  - "Sync the docs", "update documentation", or "ensure docs are up to date".
  - "Track existing containers" or "update container docs".
  - "Document APIs", "show what APIs are exposed", or "how to use the API".
  - "Clean up the root folder" or "remove obsolete scratch/test files".
  - "Update the Word doc" or "update the PowerPoint presentation".
- After adding or modifying services in `infra/compose/docker-compose.yml`.
- After creating, updating, or deleting routes in `services/apigw`, `modules/`, or `apps/api`.
- Before milestone completion, customer delivery, or release tagging.

---

## The 6-Phase Execution Workflow

### Phase 1: Container Audit & Tracking (`docs/11.CONTAINERS.md`)
1. Read `infra/compose/docker-compose.yml` to inspect all active services, image tags, network modes, volume mounts, port mappings, and healthchecks.
2. Compare against `docs/11.CONTAINERS.md`.
3. Verify that:
   - All 13 compose services (`postgres`, `pgbackrest`, `redis`, `migrate`, `zitadel`, `zitadel-login`, `api`, `layer`, `pulse`, `worker`, `metabase`, `mailpit`, `caddy`) are documented with exact image tags and purpose.
   - Non-compose services (`services/apigw`, `services/mail`, `modules/monitor`) are accurately categorized in Section 5 ("Non-Compose & Standalone Services").
   - Network segmentation (`edge` vs `data`) and volume matrices are fully aligned.
   - The startup dependency Mermaid DAG matches `depends_on` conditions.

### Phase 2: API Surface & OpenAPI 3.1.0 Synchronization (`docs/07.API.md`)
1. Inspect router definitions in:
   - `services/apigw/src/routes/` (External API `/api/v1/*` & `POST /oauth2/token`)
   - `modules/core/src/` (`/api/core/*` — audit, entities, custom fields, config, admin, webhook)
   - `modules/layer/src/routes.ts` (`/api/layer/*` — drafts, versions, publish, locks, AI layout)
   - `modules/pulse/src/routes.ts` (`/api/pulse/*` — connectors, schedules, Smartsheet OAuth)
   - `modules/monitor/src/routes.ts` (`/api/monitor/*` — error groups, triage, bug reports, and MCP server)
   - `packages/auth-node/src/plugin.ts` (`/auth/*` — login, callback, me, logout, ws-ticket, ws)
2. Test and re-generate OpenAPI 3.1.0 document:
   ```bash
   pnpm --filter @podium/contracts test
   node packages/contracts/dist/openapi.js | Out-Null
   ```
3. Update `docs/07.API.md` ensuring:
   - Both API surfaces (External API vs Platform BFF/Module APIs) are clearly distinguished.
   - Authentication guides cover both OAuth2 Client Credentials (`POST /oauth2/token`) and `__Host-` session cookies.
   - Concurrency headers (`If-Match` / `ETag`) and cursor pagination (`?after=...&limit=...`) are documented.
   - All endpoints have complete, copy-pasteable `curl` examples.

### Phase 3: Workspace Hygiene & Root Cleanup
1. Inspect the repository root for obsolete temporary files from past provisioning and debugging runs:
   - Scratch logs: `.openapi-spec.txt`, `.provision-*.txt`
   - Temporary scripts: `.start-*.ps1`, `tmp-*.mjs`, `apps/api/tmp-*.mjs`, `e2e/check-auth.mjs`, `e2e/debug-*.mjs`
2. Remove obsolete scratch files:
   ```powershell
   Remove-Item -Force -ErrorAction SilentlyContinue .openapi-spec.txt, .provision-*.txt, .start-*.ps1, tmp-*.mjs
   ```
3. Check `.gitignore` to ensure `*.pat`, `.provision-*.txt`, `.openapi-spec.txt`, and `tmp-*.mjs` remain ignored.
4. **Preserve Active Bridge Tools:** Do **not** delete `tools/claude-bridge.ps1` or `tools/gemini-bridge.ps1`.

### Phase 4: Core Guidelines & Cross-Reference Sync
Ensure cross-references are synchronized across all canonical guides:
- `README.md`: Monorepo map, quickstart, and index linking to `docs/11.CONTAINERS.md`, `docs/07.API.md`, `docs/03.REQUIREMENTS.md`.
- `CLAUDE.md`: Documentation index and container/API cross-references.
- `GEMINI.md`: Documentation links and multi-model pairing commands.
- `docs/03.REQUIREMENTS.md`: Section 6 links to `docs/07.API.md`; Section "Container Inventory" links to `docs/11.CONTAINERS.md`.

### Phase 5: Executive Office Documents Synchronization
Run the bundled automation script to update the stakeholder Word document and PowerPoint presentation:
```powershell
python .agents/skills/podium-docs-sync/scripts/sync_office_docs.py
```
This script automatically:
- Updates `PODIUM_Requirements_Overview.docx`:
  - Changes module count to 5 (Core, Layer, Pulse, Monitor, and Crew).
  - Removes Crew from Future Modules (delivered).
  - Adds Crew to Table 0 (Modules) and inserts a detailed narrative section covering 1:1 legacy staff-app parity, zero-UUID interface, zero-status contracts, shift derivation engine, and coverage heatmap.
  - Updates Table 1 (Reach NFR) to include Crew mobile shift attendance and check-in.
  - Aligns Container Inventory (Table 2 & Table 3) with Crew Fastify plugin in `api` container and `crew` isolated Postgres schema.
  - Updates Table 5 (Technology Stack) with Crew Workforce engine, Crew UI parity, External API Gateway (`services/apigw`), MCP AI Tooling, and Two Themes.
  - Links to `docs/11.CONTAINERS.md` and `docs/07.API.md`.
- Updates `PODIUM_Investment_Overview_Updated.pptx`:
  - Updates Slide 2 (Executive Summary) modular design text to include Crew (Core, Layer, Pulse, Monitor, Crew).
  - Updates Slide 5 (Application Suite) to mark Crew as Delivered workforce planning & rostering module.
  - Updates Slide 6 (Command Deck) Modular Application Launcher card to include Workforce Planning (Crew).
  - Updates Slide 8 (Delivery Scope) `api` container description to include Crew.
  - Updates Slide 11 footer callout in-place to highlight the External API Gateway (`/api/v1/*`) with OpenAPI 3.1.0 and native Model Context Protocol (MCP) server on `/api/monitor/mcp`.
  - Updates Slide 12 (Delivery Roadmap) Phase 4 Expansion text to mark Crew module delivered.
  - Enforces an automated programmatic zero-overlap layout invariant check across all slides prior to saving.

### Phase 6: Quality Gate Verification
Run automated tests to guarantee zero regressions:
```powershell
pnpm boundaries
pnpm --filter @podium/contracts test
pnpm --filter @podium/apigw test
pnpm test
```
Verify `git status --short` to ensure only intended documentation and source changes are tracked.
