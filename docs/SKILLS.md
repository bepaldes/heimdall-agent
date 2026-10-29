# Heimdall Canonical Skills & Suites Directory

This directory serves as the comprehensive reference manual for Heimdall's **15 Primary Toolkits & Suites (51 modular capabilities)**.

> **Architecture & Execution**: Each skill module is an isolated directory containing a YAML-frontmattered `SKILL.md`. AI agent harnesses (Google Antigravity, Claude Code, OpenAI Codex CLI) parse frontmatter on startup and dynamically activate instructions via progressive disclosure.

## Upstream Provenance & Update Governance Directive

> *"Update the selected skill or plugin through its supported mechanism. Review changed instructions/references and repeat a bounded review after material updates. Record source revision, reviewed range, actual tests and remaining validation in the private report."*

To inspect provenance or verify updates via the CLI:
```powershell
heimdall update-skill <name>
# or inspect all skills
heimdall update-skill all
```

<a id="toc"></a>
## Primary Suites & Toolkits Index

### Core Multi-Skill Suites
- [📦 Superpowers Software Engineering Suite (15 modules)](#superpowers)
- [📦 Taste Design & Aesthetic Studio (12 modules)](#taste-studio)
- [📦 Anti-Slop Quality & Token Efficiency Suite (6 modules)](#antislop)
- [📦 Tri-Directional Cross-Model Bridges (3 modules)](#cross-model-bridges)
- [📦 Trail of Bits High-Assurance AppSec Suite (3 modules)](#trailofbits-appsec)

### Standalone Power Toolkits
- [⚡ Ponytail Code Restraint](#ponytail)
- [⚡ Karpathy Simplicity Guidelines](#karpathy-guidelines)
- [⚡ Strix Differential Security Probing](#strix-security)
- [⚡ Security Audit Sweep Sentinel](#security-audit-sweep)
- [⚡ OWASP Top 10 Web Defense](#owasp-security)
- [⚡ Cloudflare Edge & WAF Security](#cloudflare-security-audit)
- [⚡ Snyk Dependency & Vulnerability Scan](#snyk-agent-scan)
- [⚡ Supabase Postgres Best Practices](#postgres-best-practices)
- [⚡ Progressive Disclosure & Skill Architecture](#progressive-disclosure)
- [⚡ Project & Workspace Hygiene Sentinel](#project-hygiene)
- [⚡ Structured Analysis & Output Formatting](#output-skill)
- [⚡ Caveman Chat Token Brevity Protocol](#caveman)

---

## Core Multi-Skill Suites

<a id="superpowers"></a>
### 📦 Superpowers Software Engineering Suite (15 modules)

- **Upstream Source**: [https://github.com/obra/superpowers](https://github.com/obra/superpowers)
- **Suite Type**: Multi-Skill Suite

#### Included Modules:

* **`brainstorming`**: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation." ([Contract File](../skills/brainstorming/SKILL.md))
* **`writing-plans`**: Use when you have a spec or requirements for a multi-step task, before touching code ([Contract File](../skills/writing-plans/SKILL.md))
* **`executing-plans`**: Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is available ([Contract File](../skills/executing-plans/SKILL.md))
* **`subagent-driven-development`**: Use when executing implementation plans with independent tasks in the current session ([Contract File](../skills/subagent-driven-development/SKILL.md))
* **`dispatching-parallel-agents`**: Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies ([Contract File](../skills/dispatching-parallel-agents/SKILL.md))
* **`test-driven-development`**: Use when implementing any feature or bugfix, before writing implementation code ([Contract File](../skills/test-driven-development/SKILL.md))
* **`systematic-debugging`**: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes ([Contract File](../skills/systematic-debugging/SKILL.md))
* **`verification-before-completion`**: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always ([Contract File](../skills/verification-before-completion/SKILL.md))
* **`finishing-a-development-branch`**: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work ([Contract File](../skills/finishing-a-development-branch/SKILL.md))
* **`using-git-worktrees`**: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback ([Contract File](../skills/using-git-worktrees/SKILL.md))
* **`requesting-code-review`**: Use when completing tasks, implementing major features, or before merging to verify work meets requirements ([Contract File](../skills/requesting-code-review/SKILL.md))
* **`receiving-code-review`**: Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation ([Contract File](../skills/receiving-code-review/SKILL.md))
* **`using-superpowers`**: Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions ([Contract File](../skills/using-superpowers/SKILL.md))
* **`diagnosing-superpowers`**: Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness. ([Contract File](../skills/diagnosing-superpowers/SKILL.md))
* **`writing-skills`**: Use when creating new skills, editing existing skills, or verifying skills work before deployment ([Contract File](../skills/writing-skills/SKILL.md))

[↑ Back to top](#toc)

---

<a id="taste-studio"></a>
### 📦 Taste Design & Aesthetic Studio (12 modules)

- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Suite Type**: Multi-Skill Suite

#### Included Modules:

* **`taste-skill`**: Frontend craft, anti-slop, and high-taste design skill for UI adjustments, interactive interfaces, new features, components, redesigns, landing pages, and web apps. The agent infers the right design direction, eliminates generic AI defaults, enforces design tokens and design systems, and ships polished, intentional interfaces. ([Contract File](../skills/taste-skill/SKILL.md))
* **`taste-skill-v1`**: The original v1 taste-skill, preserved for projects depending on its exact behavior. The current default is `design-taste-frontend` (v2 experimental), which is a substantial rewrite. Use this v1 install name only if you need exact backward compatibility. ([Contract File](../skills/taste-skill-v1/SKILL.md))
* **`gpt-tasteskill`**: Elite UX/UI & Advanced GSAP Motion Engineer. Enforces Python-driven true randomization for layout variance, strict AIDA page structure, wide editorial typography (bans 6-line wraps), gapless bento grids, strict GSAP ScrollTriggers (pinning, stacking, scrubbing), inline micro-images, and massive section spacing. ([Contract File](../skills/gpt-tasteskill/SKILL.md))
* **`brandkit`**: Premium brand-kit image generation skill for creating high-end brand-guidelines boards, logo systems, identity decks, and visual-world presentations. Trained for minimalist, cinematic, editorial, dark-tech, luxury, cultural, security, gaming, developer-tool, and consumer-app brand systems. Optimized for intentional logo concepting, refined composition, sparse typography, strong symbolic meaning, premium mockups, art-directed imagery, and flexible grid layouts. ([Contract File](../skills/brandkit/SKILL.md))
* **`minimalist-skill`**: Clean editorial-style interfaces. Warm monochrome palette, typographic contrast, flat bento grids, muted pastels. No gradients, no heavy shadows. ([Contract File](../skills/minimalist-skill/SKILL.md))
* **`brutalist-skill`**: Raw mechanical interfaces fusing Swiss typographic print with military terminal aesthetics. Rigid grids, extreme type scale contrast, utilitarian color, analog degradation effects. For data-heavy dashboards, portfolios, or editorial sites that need to feel like declassified blueprints. ([Contract File](../skills/brutalist-skill/SKILL.md))
* **`soft-skill`**: Teaches the AI to design like a high-end agency. Defines the exact fonts, spacing, shadows, card structures, and animations that make a website feel expensive. Blocks all the common defaults that make AI designs look cheap or generic. ([Contract File](../skills/soft-skill/SKILL.md))
* **`redesign-skill`**: Upgrades existing websites and apps to premium quality. Audits current design, identifies generic AI patterns, and applies high-end design standards without breaking functionality. Works with any CSS framework or vanilla CSS. ([Contract File](../skills/redesign-skill/SKILL.md))
* **`image-to-code-skill`**: Elite website image-to-code skill for Codex. For visually important web tasks, it must first generate the design image(s) itself, deeply analyze them, then implement the website to match them as closely as possible. In Codex, it must prefer large, readable, section-specific images instead of tiny compressed boards, generate fresh standalone images for sections or detail views instead of cropping old ones, avoid lazy under-generation, avoid cards-inside-cards-inside-cards UI, and keep the hero clean, spacious, readable, and visible on a small laptop. ([Contract File](../skills/image-to-code-skill/SKILL.md))
* **`stitch-skill`**: Semantic Design System Skill for Google Stitch. Generates agent-friendly DESIGN.md files that enforce premium, anti-generic UI standards — strict typography, calibrated color, asymmetric layouts, perpetual micro-motion, and hardware-accelerated performance. ([Contract File](../skills/stitch-skill/SKILL.md))
* **`imagegen-frontend-web`**: Elite frontend image-direction skill for generating premium, conversion-aware website design references. CRITICAL OUTPUT RULE — generate ONE separate horizontal image FOR EVERY section. A landing page with 8 sections produces 8 images. Never compress multiple sections into one image. Enforces composition variety (not always left-text / right-image), background-image freedom, varied CTAs, varied hero scales (giant / mid / mini minimalist), narrative concept spine, second-read moments, and a single consistent palette across all images. Optimized for landing pages, marketing sites, and product comps that developers or coding models can accurately recreate. ([Contract File](../skills/imagegen-frontend-web/SKILL.md))
* **`imagegen-frontend-mobile`**: Elite mobile app image-generation skill for creating premium, app-native screen concepts and flows. Designed for iOS, Android, and cross-platform mobile products. Prioritizes clean hierarchy, comfortably readable text, strong multi-screen consistency, controlled color palettes, non-generic creative direction, textured surfaces, image-led composition, tasteful custom iconography, and clean phone mockup framing. By default, screens should be shown inside a subtle premium iPhone or similar phone mockup with a visible frame, while the main focus stays on the app content itself. This skill generates images only. It does not write code. ([Contract File](../skills/imagegen-frontend-mobile/SKILL.md))

[↑ Back to top](#toc)

---

<a id="antislop"></a>
### 📦 Anti-Slop Quality & Token Efficiency Suite (6 modules)

- **Upstream Source**: [https://github.com/obra/antislop](https://github.com/obra/antislop)
- **Suite Type**: Multi-Skill Suite

#### Included Modules:

* **`antislop`**: "Anti Slop: Rules for AI Coding Agents. The core filter. Load always to stop generic AI slop." ([Contract File](../skills/antislop/SKILL.md))
* **`antislop-code`**: "Code comment hygiene for AI coding agents: remove generic AI-slop comments, keep the valuable ones, never touch the code." ([Contract File](../skills/antislop-code/SKILL.md))
* **`antislop-copywriting`**: "Copy and text skill for antislop. Use when writing or editing prose: headlines, tone, CTAs, and anti-AI-writing patterns. Load with the core." ([Contract File](../skills/antislop-copywriting/SKILL.md))
* **`antislop-ui`**: "UI and visual skill for antislop. Use when building or editing any interface: color, layout, components, motion. Load with the core." ([Contract File](../skills/antislop-ui/SKILL.md))
* **`antislop-human`**: "Human and accessibility skill for antislop. Contrast, keyboard, focus, and states for real people. Includes the contrast checker." ([Contract File](../skills/antislop-human/SKILL.md))
* **`antislop-layoutmobile`**: "Mobile layout skill for antislop. Use for layouts that reflow across screen sizes, phone to desktop: grids, overflow, tap targets. Load with the core." ([Contract File](../skills/antislop-layoutmobile/SKILL.md))

[↑ Back to top](#toc)

---

<a id="cross-model-bridges"></a>
### 📦 Tri-Directional Cross-Model Bridges (3 modules)

- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Suite Type**: Multi-Skill Suite

#### Included Modules:

* **`claude-collaborator`**: Coordinate with Claude Code CLI (claude.exe) to cross-validate changes, request second-opinion reviews on git diffs, or validate test runs. ([Contract File](../skills/claude-collaborator/SKILL.md))
* **`gemini-collaborator`**: Coordinate with Google Antigravity / Gemini CLI (agy.exe) to cross-validate changes, request second opinions on architecture/diffs, or execute adversarial code reviews. ([Contract File](../skills/gemini-collaborator/SKILL.md))
* **`codex-collaborator`**: Coordinate with OpenAI Codex CLI (codex.exe) to cross-validate changes, request second-opinion reviews on git diffs, or validate test runs. ([Contract File](../skills/codex-collaborator/SKILL.md))

[↑ Back to top](#toc)

---

<a id="trailofbits-appsec"></a>
### 📦 Trail of Bits High-Assurance AppSec Suite (3 modules)

- **Upstream Source**: [https://github.com/trailofbits/skills](https://github.com/trailofbits/skills)
- **Suite Type**: Multi-Skill Suite

#### Included Modules:

* **`trailofbits-audit-context`**: Understand a codebase before looking for bugs in it - what each function assumes, what it guarantees, and what it depends on elsewhere. Use when starting an audit, threat model, or architecture review on unfamiliar code, and before any vulnerability-hunting pass. ([Contract File](../skills/trailofbits-audit-context/SKILL.md))
* **`trailofbits-insecure-defaults`**: Audits codebases for insecure defaults, fail-open patterns, fallback credentials, permissive access control, debug endpoints, and weak cryptography using Trail of Bits vulnerability patterns. Use when reviewing configuration, authentication, encryption, authorization bypasses, or security controls. ([Contract File](../skills/trailofbits-insecure-defaults/SKILL.md))
* **`trailofbits-triage-brocards`**: Systematically evaluates incoming vulnerability reports against 7 principled brocards to accept, dismiss, or request clarification before committing engineering resources. ([Contract File](../skills/trailofbits-triage-brocards/SKILL.md))

[↑ Back to top](#toc)

---

## Standalone Power Toolkits

<a id="ponytail"></a>
### ⚡ Ponytail Code Restraint

- **Module Name**: `ponytail`
- **Description**: Forces AI coding agents to think like a pragmatic, lazy senior developer. Enforces the Decision Ladder: YAGNI checks, codebase reuse, standard library first, native platform features, and zero premature abstractions while strictly preserving security and error handling.
- **Upstream Source**: [https://github.com/DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)
- **Contract File**: [`skills/ponytail/SKILL.md`](../skills/ponytail/SKILL.md)

[↑ Back to top](#toc)

---

<a id="karpathy-guidelines"></a>
### ⚡ Karpathy Simplicity Guidelines

- **Module Name**: `karpathy-guidelines`
- **Description**: Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria.
- **Upstream Source**: [https://github.com/karpathy/guidelines](https://github.com/karpathy/guidelines)
- **Contract File**: [`skills/karpathy-guidelines/SKILL.md`](../skills/karpathy-guidelines/SKILL.md)

[↑ Back to top](#toc)

---

<a id="strix-security"></a>
### ⚡ Strix Differential Security Probing

- **Module Name**: `strix-security`
- **Description**: Autonomous AI penetration testing and dynamic HTTP differential probing methodology (based on usestrix/strix). Never trust code comments alone; verify every mounted route, static asset prefix, reverse-proxy rule, and Host-header boundary with concrete Proof-of-Concept (PoC) HTTP probes across Anonymous, Unprivileged, Cross-Tenant/Venue, and Authorized principals.
- **Upstream Source**: [https://github.com/strix-security/strix](https://github.com/strix-security/strix)
- **Contract File**: [`skills/strix-security/SKILL.md`](../skills/strix-security/SKILL.md)

[↑ Back to top](#toc)

---

<a id="security-audit-sweep"></a>
### ⚡ Security Audit Sweep Sentinel

- **Module Name**: `security-audit-sweep`
- **Description**: Generic security audit sweep for web applications, APIs, and microservices: performs dynamic differential HTTP probing, validates IAM role entitlements, scans dependency vulnerabilities, and checks for secret leakage.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/security-audit-sweep/SKILL.md`](../skills/security-audit-sweep/SKILL.md)

[↑ Back to top](#toc)

---

<a id="owasp-security"></a>
### ⚡ OWASP Top 10 Web Defense

- **Module Name**: `owasp-security`
- **Description**: Reviews code for security vulnerabilities and guides secure implementation using OWASP Top 10:2025, ASVS 5.0, the OWASP Top 10 for LLM Applications (2026), and the OWASP Top 10 for Agentic Applications (2026). Use when reviewing code or a diff for security issues, implementing authentication, authorization, sessions, or cryptography, handling untrusted input, files, or URLs, hardening config, dependencies, or CI, or building LLM and AI agent features.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/owasp-security/SKILL.md`](../skills/owasp-security/SKILL.md)

[↑ Back to top](#toc)

---

<a id="cloudflare-security-audit"></a>
### ⚡ Cloudflare Edge & WAF Security

- **Module Name**: `cloudflare-security-audit`
- **Description**: Security guidance and vulnerability review for codebases, APIs, services, CLI tools, libraries, and daemons. Use for security questions, focused reviews, vulnerability research, security audits, or pen tests. Run the complete workflow only for explicit codebase audit or pen-test requests, full/comprehensive/end-to-end reviews, or requested report artifacts.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/cloudflare-security-audit/SKILL.md`](../skills/cloudflare-security-audit/SKILL.md)

[↑ Back to top](#toc)

---

<a id="snyk-agent-scan"></a>
### ⚡ Snyk Dependency & Vulnerability Scan

- **Module Name**: `snyk-agent-scan`
- **Description**: Scans AI agent skills, MCP configurations, prompts, and tooling environments for prompt injections, secret leakage, tool poisoning, and security vulnerabilities using Snyk Agent Scan CLI. Use when reviewing installed skills, testing agent security, auditing MCP servers, or auditing agent supply chain risks.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/snyk-agent-scan/SKILL.md`](../skills/snyk-agent-scan/SKILL.md)

[↑ Back to top](#toc)

---

<a id="postgres-best-practices"></a>
### ⚡ Supabase Postgres Best Practices

- **Module Name**: `postgres-best-practices`
- **Description**: "Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including choosing column types), schema design, migrations and declarative schema files, RLS policies and the tests that verify them, indexes, triggers, database functions, queues and scheduled jobs (pg_cron, pgmq), vector/semantic search (pgvector), and restoring dumps (pg_restore) or importing data. Also load it when diagnosing slow queries, high CPU, timeouts, EXPLAIN plans, connection exhaustion, locking, bloat, or rows visible to the wrong user or tenant. This is not just a performance guide — schema, migration, security, and SQL authoring tasks need these rules too, even for a one-column change or a single query."
- **Upstream Source**: [https://github.com/supabase/postgres-best-practices](https://github.com/supabase/postgres-best-practices)
- **Contract File**: [`skills/postgres-best-practices/SKILL.md`](../skills/postgres-best-practices/SKILL.md)

[↑ Back to top](#toc)

---

<a id="progressive-disclosure"></a>
### ⚡ Progressive Disclosure & Skill Architecture

- **Module Name**: `progressive-disclosure`
- **Description**: Structuring modular agent skills and toolsets with progressive disclosure to eliminate prompt bloat and avoid multi-agent sprawl.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/progressive-disclosure/SKILL.md`](../skills/progressive-disclosure/SKILL.md)

[↑ Back to top](#toc)

---

<a id="project-hygiene"></a>
### ⚡ Project & Workspace Hygiene Sentinel

- **Module Name**: `project-hygiene`
- **Description**: Audit and enforce codebase hygiene across any project: eliminate dead code, purge unused dependencies and exports, enforce architectural module boundaries, clear stale build caches, and verify type safety.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/project-hygiene/SKILL.md`](../skills/project-hygiene/SKILL.md)

[↑ Back to top](#toc)

---

<a id="output-skill"></a>
### ⚡ Structured Analysis & Output Formatting

- **Module Name**: `output-skill`
- **Description**: Overrides default LLM truncation behavior. Enforces complete code generation, bans placeholder patterns, and handles token-limit splits cleanly. Apply to any task requiring exhaustive, unabridged output.
- **Upstream Source**: [https://github.com/bepaldes/heimdall-agent](https://github.com/bepaldes/heimdall-agent)
- **Contract File**: [`skills/output-skill/SKILL.md`](../skills/output-skill/SKILL.md)

[↑ Back to top](#toc)

---

<a id="caveman"></a>
### ⚡ Caveman Chat Token Brevity Protocol

- **Module Name**: `caveman`
- **Description**: Slashes chat token consumption by dropping conversational filler, pleasantries, and polite ceremony.
- **Upstream Source**: [https://github.com/JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)
- **Contract File**: [`skills/caveman/SKILL.md`](../skills/caveman/SKILL.md)

[↑ Back to top](#toc)

---

