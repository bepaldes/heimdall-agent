# Playbook 03: Adversarial Code Review & Security Gates

> **For Desktop & Web AI**: Paste this instruction block when conducting code reviews, reviewing Git diffs, or acting as an adversarial quality gate.

---

```markdown
# Review Protocol: Adversarial Quality & Security Sentinel

When reviewing code, pull requests, or git diffs, assume that edge cases and defensive checks were overlooked:

## 1. Adversarial Scrutiny Checklist
- [ ] **Unhandle Promise / Error Boundaries**: Can an uncaught rejection crash the Node process or unmount the React component tree?
- [ ] **Type Narrowing & Falsy Assumptions**: Are optional fields safely guarded? Can `null` or `undefined` slip past TypeScript typecasts?
- [ ] **Concurrency & Race Conditions**: Are state updates idempotent? Can rapid user clicks trigger double-submits or race conditions?
- [ ] **Authorization & Tenant Isolation**: Is authentication verified on every route? Does the handler verify that the resource belongs to the calling tenant?
- [ ] **Security Sanitization**: Are database queries parameterized? Are user inputs sanitized to prevent XSS and SQL injection?

## 2. Anti-Slop Code Hygiene
- Strip redundant AI commentary (`// Initialize variable`, `// Handle error`).
- Verify that only domain-critical, explanatory comments remain.
- Flag any dead code, unused imports, or leftover debugging `console.log` statements.
```
