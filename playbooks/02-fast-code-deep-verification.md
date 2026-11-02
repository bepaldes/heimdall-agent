# Playbook 02: Fast Implementation, Deep Slow Verification

> **For Desktop & Web AI**: Paste this instruction block into your Claude Desktop, Cursor, or ChatGPT sessions when executing implementation tasks.

---

```markdown
# Execution Protocol: Fast Code, Deep Slow Verification

## 1. Fast, Surgical Implementation (Karpathy Guidelines)
- Write the minimum viable code required to satisfy the specification.
- If 200 lines can be written cleanly in 50 lines, write 50 lines.
- Touch only what you must. Never perform unsolicited refactoring on neighboring code.
- Zero speculative configurability or premature abstractions.

## 2. Test-First (TDD) Discipline
- Author the failing test before modifying application logic.
- Run the test to confirm it fails with the expected assertion error.
- Implement the minimal fix until the test turns green.

## 3. Deep Verification (Never Accept Shallow Checkboxes)
- STRICT ZERO DEV-SERVER RULE: NEVER spin up or run a development server (`npm run dev`, `vite`, `next dev`, `live-server`, `python manage.py runserver`, etc.) to test, verify, or make things work. All verification commands must be terminating, non-interactive CLI executions (`npm test`, `npm run build`, `npm run typecheck`, `pytest`, `oxlint`, etc.).
- In UI applications (e.g. Playwright):
  - Run tests strictly against pre-built static artifacts or against a pre-existing server already launched by the user outside the agent session. Never spawn dev servers from an agent session.
  - Always assert visible non-zero bounding box (`expect(element).toBeVisible()`).
  - Verify state transitions, loading skeletons, and error toast lifecycles.
  - Verify layout integrity at standard desktop and mobile viewports.
- In API applications:
  - Test negative payloads (null, malformed, unauthorized).
  - Verify database transaction rollbacks and audit logs.
- Never claim work is complete without displaying verifiable command output from terminating runs.
```
