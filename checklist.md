# Sui Move Audit Checklist

Use this file as the checklist index. It tells you which topic references to load after scoping and before finalizing findings.

Format used by the topic references:

- **D (Detect):** what the vulnerable pattern looks like
- **FP (False Positive):** what makes it safe
- **Search:** grep or code pattern to locate candidates; these are starting anchors, not proof
- **Severity hint:** typical severity when confirmed

Global rules that apply to every checklist hit:

- Every checklist hit starts as a candidate only.
- A confirmed finding requires attacker reachability, obtainable required inputs, a concrete broken invariant or unauthorized effect, and no blocking Sui rule from ownership, visibility, typing, or abort semantics.
- Every `FP` condition is only a verification prompt, not proof of safety by itself.

Read these references only if they match the scoped package:

1. `references/checks/check-01.md`
   Use for sender-gating, capability leakage, re-issuance, or admin surface review.
2. `references/checks/check-02.md`
   Use for shared object mutation, lifecycle invariants, wrap or unwrap flows, and custody checks.
3. `references/checks/check-03.md`
   Use for mint, burn, withdraw, replay, accounting drift, and fee or reward math.
4. `references/checks/check-04.md`
   Use for dynamic fields, storage cleanup, and keying mistakes.
5. `references/checks/check-05.md`
   Use for external trust assumptions, `friend` boundaries, upgrades, and migrations.
6. `references/checks/check-06.md`
   Use for clock, epoch, oracle, and market-assumption checks.
7. `references/checks/check-07.md`
   Use for PTB composition, one-transaction state-machine bypasses, and emergency function overreach.
8. `references/checks/check-08.md`
   Use for event coverage and abort-code quality.
9. `references/false-positive-filters.md`
   Use during the false-positive pass to challenge each candidate from the opposite direction.

Selection guidance:

- Load only the references that match the package's real objects, capabilities, and workflows.
- Skip categories that are clearly out of scope, but note that choice in working notes.
- If a topic reference contains a tiny Move example, treat it as a recognition aid, not standalone proof.
- Before finalizing findings, re-open this file and confirm that each in-scope topic was either reviewed or explicitly skipped.
