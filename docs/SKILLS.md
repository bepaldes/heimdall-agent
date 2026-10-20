# Heimdall Canonical Skills Directory

This directory serves as the comprehensive human-readable reference for all **49 version-frozen canonical skills** bundled with Heimdall.

> **How AI Tools Read Skills**: Each skill is defined as an isolated directory containing `SKILL.md`. AI coding harnesses (Google Antigravity, Claude Code, OpenAI Codex CLI) dynamically parse the YAML frontmatter on launch and progressively load instructions when triggered.

## Upstream Provenance & Update Governance Directive

> *"Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report."*

To inspect provenance or prepare an update from the command line, run:
```powershell
heimdall update-skill <name>
# or inspect all skills
heimdall update-skill all
```

<a id="categories"></a>
## Categories

- [Anti-Slop & Token Efficiency (7 skills)](#anti-slop-token-efficiency)
- [Planning & Verification (10 skills)](#planning-verification)
- [Design & Aesthetics (12 skills)](#design-aesthetics)
- [Multi-Agent & Review (9 skills)](#multi-agent-review)
- [Security & Probing (8 skills)](#security-probing)
- [Architecture & Database (3 skills)](#architecture-database)

---

<a id="anti-slop-token-efficiency"></a>
## Anti-Slop & Token Efficiency (7 skills)

### `antislop`

- **Description**: "Anti Slop: Rules for AI Coding Agents. The core filter. Load always to stop generic AI slop."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop/SKILL.md`](../skills/antislop/SKILL.md)

### `antislop-code`

- **Description**: "Code comment hygiene for AI coding agents: remove generic AI-slop comments, keep the valuable ones, never touch the code."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop-code/SKILL.md`](../skills/antislop-code/SKILL.md)

### `antislop-copywriting`

- **Description**: "Copy and text skill for antislop. Use when writing or editing prose: headlines, tone, CTAs, and anti-AI-writing patterns. Load with the core."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop-copywriting/SKILL.md`](../skills/antislop-copywriting/SKILL.md)

### `antislop-human`

- **Description**: "Human and accessibility skill for antislop. Contrast, keyboard, focus, and states for real people. Includes the contrast checker."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop-human/SKILL.md`](../skills/antislop-human/SKILL.md)

### `antislop-layoutmobile`

- **Description**: "Mobile layout skill for antislop. Use for layouts that reflow across screen sizes, phone to desktop: grids, overflow, tap targets. Load with the core."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop-layoutmobile/SKILL.md`](../skills/antislop-layoutmobile/SKILL.md)

### `antislop-ui`

- **Description**: "UI and visual skill for antislop. Use when building or editing any interface: color, layout, components, motion. Load with the core."
- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/antislop-ui/SKILL.md`](../skills/antislop-ui/SKILL.md)

### `caveman`

- **Description**: Slashes chat token consumption by dropping conversational filler, pleasantries, and polite ceremony.
- **Upstream Source**: [https://github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/caveman/SKILL.md`](../skills/caveman/SKILL.md)

[↑ Back to top](#categories)

---

<a id="planning-verification"></a>
## Planning & Verification (10 skills)

### `brainstorming`

- **Description**: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/brainstorming/SKILL.md`](../skills/brainstorming/SKILL.md)

### `executing-plans`

- **Description**: Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is available
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/executing-plans/SKILL.md`](../skills/executing-plans/SKILL.md)

### `finishing-a-development-branch`

- **Description**: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/finishing-a-development-branch/SKILL.md`](../skills/finishing-a-development-branch/SKILL.md)

### `karpathy-guidelines`

- **Description**: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
- **Upstream Source**: [https://github.com/karpathy/guidelines](https://github.com/karpathy/guidelines)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/karpathy-guidelines/SKILL.md`](../skills/karpathy-guidelines/SKILL.md)

### `ponytail`

- **Description**: Forces AI coding agents to think like a pragmatic, lazy senior developer. Enforces the
- **Upstream Source**: [https://github.com/DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/ponytail/SKILL.md`](../skills/ponytail/SKILL.md)

### `systematic-debugging`

- **Description**: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/systematic-debugging/SKILL.md`](../skills/systematic-debugging/SKILL.md)

### `test-driven-development`

- **Description**: Use when implementing any feature or bugfix, before writing implementation code
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/test-driven-development/SKILL.md`](../skills/test-driven-development/SKILL.md)

### `using-git-worktrees`

- **Description**: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/using-git-worktrees/SKILL.md`](../skills/using-git-worktrees/SKILL.md)

### `verification-before-completion`

- **Description**: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/verification-before-completion/SKILL.md`](../skills/verification-before-completion/SKILL.md)

### `writing-plans`

- **Description**: Use when you have a spec or requirements for a multi-step task, before touching code
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/writing-plans/SKILL.md`](../skills/writing-plans/SKILL.md)

[↑ Back to top](#categories)

---

<a id="design-aesthetics"></a>
## Design & Aesthetics (12 skills)

### `brandkit`

- **Description**: Premium brand-kit image generation skill for creating high-end brand-guidelines boards, logo systems, identity decks, and visual-world presentations. Trained for minimalist, cinematic, editorial, dark-tech, luxury, cultural, security, gaming, developer-tool, and consumer-app brand systems. Optimized for intentional logo concepting, refined composition, sparse typography, strong symbolic meaning, premium mockups, art-directed imagery, and flexible grid layouts.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/brandkit/SKILL.md`](../skills/brandkit/SKILL.md)

### `brutalist-skill`

- **Description**: Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extreme type scale contrast, utilitarian color, analog degradation effects. For data-heavy dashboards, portfolios, or editorial sites that need to feel like declassified blueprints.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/brutalist-skill/SKILL.md`](../skills/brutalist-skill/SKILL.md)

### `gpt-tasteskill`

- **Description**: Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typography (bans 6-line wraps), gapless bento grids, strict GSAP ScrollTriggers (pinning, stacking, scrubbing), inline micro-images, and massive section spacing.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/gpt-tasteskill/SKILL.md`](../skills/gpt-tasteskill/SKILL.md)

### `image-to-code-skill`

- **Description**: Elite website image-to-code skill for Codex. For visually important web tasks, it must first generate the design image(s) itself, deeply analyze them, then implement the website to match them as closely as possible. In Codex, it must prefer large, readable, section-specific images instead of tiny compressed boards, generate fresh standalone images for sections or detail views instead of cropping old ones, avoid lazy under-generation, avoid cards-inside-cards-inside-cards UI, and keep the hero clean, spacious, readable, and visible on a small laptop.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/image-to-code-skill/SKILL.md`](../skills/image-to-code-skill/SKILL.md)

### `imagegen-frontend-mobile`

- **Description**: Elite mobile app image-generation skill for creating premium, app-native screen concepts and flows. Designed for iOS, Android, and cross-platform mobile products. Prioritizes clean hierarchy, comfortably readable text, strong multi-screen consistency, controlled color palettes, non-generic creative direction, textured surfaces, image-led composition, tasteful custom iconography, and clean phone mockup framing. By default, screens should be shown inside a subtle premium iPhone or similar phone mockup with a visible frame, while the main focus stays on the app content itself. This skill generates images only. It does not write code.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/imagegen-frontend-mobile/SKILL.md`](../skills/imagegen-frontend-mobile/SKILL.md)

### `imagegen-frontend-web`

- **Description**: Elite frontend image-direction skill for generating premium, conversion-aware website design references. CRITICAL OUTPUT RULE — generate ONE separate horizontal image FOR EVERY section. A landing page with 8 sections produces 8 images. Never compress multiple sections into one image. Enforces composition variety (not always left-text / right-image), background-image freedom, varied CTAs, varied hero scales (giant / mid / mini minimalist), narrative concept spine, second-read moments, and a single consistent palette across all images. Optimized for landing pages, marketing sites, and product comps that developers or coding models can accurately recreate.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/imagegen-frontend-web/SKILL.md`](../skills/imagegen-frontend-web/SKILL.md)

### `minimalist-skill`

- **Description**: Clean editorial-style interfaces. Warm monochrome palette, typographic contrast, flat bento grids, muted pastels. No gradients, no heavy shadows.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/minimalist-skill/SKILL.md`](../skills/minimalist-skill/SKILL.md)

### `redesign-skill`

- **Description**: Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/redesign-skill/SKILL.md`](../skills/redesign-skill/SKILL.md)

### `soft-skill`

- **Description**: Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive. Blocks all the common defaults that make AI designs look cheap or generic.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/soft-skill/SKILL.md`](../skills/soft-skill/SKILL.md)

### `stitch-skill`

- **Description**: Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, calibrated color, asymmetric layouts, perpetual micro-motion, and hardware-accelerated performance.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/stitch-skill/SKILL.md`](../skills/stitch-skill/SKILL.md)

### `taste-skill`

- **Description**: Frontend craft, anti-slop, and high-taste design skill for UI adjustments, interactive interfaces, new features, components, redesigns, landing pages, and web apps. The agent infers the right design direction, eliminates generic AI defaults, enforces design tokens and design systems, and ships polished, intentional interfaces.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/taste-skill/SKILL.md`](../skills/taste-skill/SKILL.md)

### `taste-skill-v1`

- **Description**: The original v1 taste-skill, preserved for projects depending on its exact behavior. The current default is `design-taste-frontend` (v2 experimental), which is a substantial rewrite. Use this v1 install name only if you need exact backward compatibility.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/taste-skill-v1/SKILL.md`](../skills/taste-skill-v1/SKILL.md)

[↑ Back to top](#categories)

---

<a id="multi-agent-review"></a>
## Multi-Agent & Review (9 skills)

### `claude-collaborator`

- **Description**: Coordinate with Claude Code CLI (claude.exe) to cross-validate changes, request second-opinion reviews on git diffs, or validate test runs.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/claude-collaborator/SKILL.md`](../skills/claude-collaborator/SKILL.md)

### `diagnosing-superpowers`

- **Description**: Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness.
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/diagnosing-superpowers/SKILL.md`](../skills/diagnosing-superpowers/SKILL.md)

### `dispatching-parallel-agents`

- **Description**: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/dispatching-parallel-agents/SKILL.md`](../skills/dispatching-parallel-agents/SKILL.md)

### `gemini-collaborator`

- **Description**: Coordinate with Google Antigravity / Gemini CLI (agy.exe) to cross-validate changes, request second opinions on architecture/diffs, or execute adversarial code reviews.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/gemini-collaborator/SKILL.md`](../skills/gemini-collaborator/SKILL.md)

### `receiving-code-review`

- **Description**: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/receiving-code-review/SKILL.md`](../skills/receiving-code-review/SKILL.md)

### `requesting-code-review`

- **Description**: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/requesting-code-review/SKILL.md`](../skills/requesting-code-review/SKILL.md)

### `subagent-driven-development`

- **Description**: Use when executing implementation plans with independent tasks in the current session
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/subagent-driven-development/SKILL.md`](../skills/subagent-driven-development/SKILL.md)

### `using-superpowers`

- **Description**: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/using-superpowers/SKILL.md`](../skills/using-superpowers/SKILL.md)

### `writing-skills`

- **Description**: Use when creating new skills, editing existing skills, or verifying skills work before deployment
- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/writing-skills/SKILL.md`](../skills/writing-skills/SKILL.md)

[↑ Back to top](#categories)

---

<a id="security-probing"></a>
## Security & Probing (8 skills)

### `cloudflare-security-audit`

- **Description**: Security guidance and vulnerability review for codebases, APIs, services, CLI tools, libraries, and daemons. Use for security questions, focused reviews, vulnerability research, security audits, or pen tests. Run the complete workflow only for explicit codebase audit or pen-test requests, full/comprehensive/end-to-end reviews, or requested report artifacts.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/cloudflare-security-audit/SKILL.md`](../skills/cloudflare-security-audit/SKILL.md)

### `owasp-security`

- **Description**: Reviews code for security vulnerabilities and guides secure implementation using OWASP Top 10:2025, ASVS 5.0, the OWASP Top 10 for LLM Applications (2026), and the OWASP Top 10 for Agentic Applications (2026). Use when reviewing code or a diff for security issues, implementing authentication, authorization, sessions, or cryptography, handling untrusted input, files, or URLs, hardening config, dependencies, or CI, or building LLM and AI agent features.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/owasp-security/SKILL.md`](../skills/owasp-security/SKILL.md)

### `security-audit-sweep`

- **Description**: Generic security audit sweep for web applications, APIs, and microservices: performs dynamic differential HTTP probing, validates IAM role entitlements, scans dependency vulnerabilities, and checks for secret leakage.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/security-audit-sweep/SKILL.md`](../skills/security-audit-sweep/SKILL.md)

### `snyk-agent-scan`

- **Description**: Scans AI agent skills, MCP configurations, prompts, and tooling environments for prompt injections, secret leakage, tool poisoning, and security vulnerabilities using Snyk Agent Scan CLI. Use when reviewing installed skills, testing agent security, auditing MCP servers, or auditing agent supply chain risks.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/snyk-agent-scan/SKILL.md`](../skills/snyk-agent-scan/SKILL.md)

### `strix-security`

- **Description**: Autonomous AI penetration testing and dynamic HTTP differential probing methodology (based on usestrix/strix). Never trust code comments alone; verify every mounted route, static asset prefix, reverse-proxy rule, and Host-header boundary with concrete Proof-of-Concept (PoC) HTTP probes across Anonymous, Unprivileged, Cross-Tenant/Venue, and Authorized principals.
- **Upstream Source**: [https://github.com/strix-security/strix](https://github.com/strix-security/strix)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/strix-security/SKILL.md`](../skills/strix-security/SKILL.md)

### `trailofbits-audit-context`

- **Description**: Understand a codebase before looking for bugs in it - what each function assumes, what it guarantees, and what it depends on elsewhere. Use when starting an audit, threat model, or architecture review on unfamiliar code, and before any vulnerability-hunting pass.
- **Upstream Source**: [https://github.com/trailofbits/skills](https://github.com/trailofbits/skills)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/trailofbits-audit-context/SKILL.md`](../skills/trailofbits-audit-context/SKILL.md)

### `trailofbits-insecure-defaults`

- **Description**: Audits codebases for insecure defaults, fail-open patterns, fallback credentials, permissive access control, debug endpoints, and weak cryptography using Trail of Bits vulnerability patterns. Use when reviewing configuration, authentication, encryption, authorization bypasses, or security controls.
- **Upstream Source**: [https://github.com/trailofbits/skills](https://github.com/trailofbits/skills)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/trailofbits-insecure-defaults/SKILL.md`](../skills/trailofbits-insecure-defaults/SKILL.md)

### `trailofbits-triage-brocards`

- **Description**: -
- **Upstream Source**: [https://github.com/trailofbits/skills](https://github.com/trailofbits/skills)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/trailofbits-triage-brocards/SKILL.md`](../skills/trailofbits-triage-brocards/SKILL.md)

[↑ Back to top](#categories)

---

<a id="architecture-database"></a>
## Architecture & Database (3 skills)

### `output-skill`

- **Description**: Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any task requiring exhaustive, unabridged output.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/output-skill/SKILL.md`](../skills/output-skill/SKILL.md)

### `postgres-best-practices`

- **Description**: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
- **Upstream Source**: [https://github.com/supabase/postgres-best-practices](https://github.com/supabase/postgres-best-practices)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/postgres-best-practices/SKILL.md`](../skills/postgres-best-practices/SKILL.md)

### `project-hygiene`

- **Description**: Audit and enforce codebase hygiene across any project: eliminate dead code, purge unused dependencies and exports, enforce architectural module boundaries, clear stale build caches, and verify type safety.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Frozen Revision**: `v1.0.0`
- **Contract File**: [`skills/project-hygiene/SKILL.md`](../skills/project-hygiene/SKILL.md)

[↑ Back to top](#categories)

---

