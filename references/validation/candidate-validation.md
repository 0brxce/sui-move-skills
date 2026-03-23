# Candidate Validation

Use this reference when deciding whether a candidate becomes `Validated`, `Rejected`, or `Unknown`.

## Status Rules

- `Validated`: The code supports a realistic exploit path, a concrete invariant break, or a security-relevant weakness with direct code-backed downside under reachable conditions.
- `Rejected`: The candidate fails because reachability, obtainability, ownership rules, package boundaries, type constraints, or abort semantics block the path.
- `Unknown`: The candidate depends on a material assumption that the code does not resolve, such as undisclosed governance, off-chain coordination, or deployment-specific wiring.

Prefer `Rejected` or `Unknown` over forcing a weak `Validated` finding, but do not reject a candidate solely because its severity is below `High`.

## Evidence Threshold by Finding Class

- `High` or `Critical`: Require a concrete reachable exploit path, realistic attacker-controlled inputs, obtainable required objects or capabilities, and a clear broken invariant or unauthorized effect.
- `Medium`: Require a concrete reachable path and a code-backed downside such as stale or replayable authorization, permanent or repeatable denial of service, material lock extension, incorrect accounting, or invalid state progression. A full theft path is not required.
- `Low` or `Informational`: Require a concrete reachable path plus a security-relevant downside such as monitoring pollution, event authenticity gaps, trust-boundary weakening, registry growth, or a missing freshness check. Do not force these into `Rejected` solely because they are advisory-grade.
- Deployment- or operator-dependent trust issues may still be `Validated` at lower severity when the code itself exposes the weakened boundary, broad acceptance rule, or missing lifecycle restriction. Do not move these to `Unknown` merely because exploitation strength depends on how the system is deployed.

For signed workflows, do not require proof that every downstream monetization or repeat-use window has already been exercised on-chain. If the code shows that authorization can be reused across distinct objects, requests, amounts, or later-valid state windows that should have required fresh approval, treat that replay surface itself as sufficient evidence for `Validated`, usually at `Medium`.
Apply the same principle outside signed flows: when the code already shows a concrete broken boundary such as invariant drift across alternate paths, lifecycle authorization mismatch, immediate post-commit parameter changes, or unbounded state growth with real liveness cost, do not require the reviewer to prove the strongest possible downstream exploit before validating the issue.
For mutable-term workflows, do not require extra off-chain evidence about what an enclave, relayer, or frontend happens to read if the on-chain request object fails to snapshot the price, prompt, route, or other user-committed terms and later execution can still depend on mutable global state. That missing binding is itself sufficient code-backed evidence for a lower-severity finding.

## Validation Questions

Answer these for each candidate before reporting it:

1. What exact `entry` or externally reachable call sequence exposes the issue?
2. What object, capability, shared object access, or witness must the attacker supply?
3. How does the attacker realistically obtain each required input?
4. Do Sui ownership, linearity, type constraints, `friend`, `public(package)`, or package boundaries block the path?
5. Does the attack still work after applying abort semantics and PTB composition rules?
6. What invariant, authorization boundary, or custody property is broken if the transaction succeeds?
7. Is the outcome concrete enough to matter: theft, unauthorized privilege, stuck funds, irreversible state breakage, meaningful denial of service, weakened trust boundary, lost observability, or another security-relevant downside?
8. What direct code-backed evidence shows the exploit path, missing protection, or broken invariant?

For exploitability claims such as theft, unauthorized control, stuck funds, or meaningful denial of service, questions 1 through 6 must be answered concretely from the target code and realistic assumptions.
For lower-severity findings such as defense-in-depth, observability, or diagnostics issues, questions 1, 4, 6, 7, and 8 must still be answered concretely. Questions 2, 3, and 5 may be marked not applicable when the issue does not depend on attacker-supplied objects, capability obtainability, or PTB composition.
If the required questions for the finding class cannot be answered clearly, do not mark the issue `Validated`.

Do not downgrade or reject a lower-severity candidate solely because a stronger exploitability finding exists on the same feature path. Treat distinct downsides such as stale signatures, replayable signatures, event authenticity gaps, zero-value state refreshes, and trust-boundary weaknesses as separate candidates when the code supports them independently.
Do not require the candidate to prove every contingent follow-on condition when the broken boundary is already concrete. Missing object-instance binding, missing amount binding, reusable epoch-scoped nonces, and signatures that survive later re-funding or later-valid state transitions are independently meaningful even if the final cash-out depends on future state.
Do not force every candidate into an asset-loss frame. Fairness breaks, timelock bypass windows, inconsistent state maintenance across equivalent paths, lifecycle control drift, and growth-driven liveness degradation can all be `Validated` when the code-backed downside is clear and reachable.

## Validation Note Template

Keep a short internal note for each candidate using this structure:

```markdown
- Candidate: ...
- Status: Candidate | Validated | Rejected | Unknown
- Entrypoint: ...
- Caller Controls: ...
- Required Object/Capability: ...
- Blocking Conditions: ...
- Broken Invariant: ...
- Evidence: ...
```

When the evidence depends on a specific trace, include:

- the relevant function path, object flow, or capability chain
- the abort behavior or state transition that makes the issue real or disproves it
- any assumption that cannot be resolved from code alone

## False-Positive Challenge Questions

Use these challenge questions during validation. They are prompts to re-read the code, not standalone proof that the issue is safe.

- Is the code path actually externally reachable, or is it limited to `init`, tests, dead helpers, or internal maintenance flows?
- Are `friend` or `public(package)` functions being treated as attacker-reachable without a real bridge?
- Does a by-value object parameter already prove legitimate custody?
- Does the attack assume fabricated objects, borrows, object IDs, or simultaneous moves that Sui and Move linearity prevent?
- Is the required capability only issued in initialization, missing `store`, missing transfer paths, or otherwise unobtainable?
- Is the shared object globally reachable but still protected by a non-forgeable proof object, capability, or invariant-preserving wrapper?
- Does the concerning state survive a successful transaction, or is it only an intermediate state before abort rollback?
- Does the proposed PTB composition fail because the one-time resource is consumed, marked spent, or otherwise unavailable?
- If a signature, ticket, receipt, or nonce is reused, is it truly single-use at the object level, or can multiple objects or requests share the same authorization?
- Is the candidate being rejected only because the second-order effect depends on later re-funding, a later valid state window, or another ordinary future state change, even though the broken boundary is already concrete?
- Is there an upstream precondition that already proves authorization before the helper is called?
- Is the behavior simply an intended admin power or a trusted governance action that matches the documented trust model?
- Is the issue truly unreportable without deployment knowledge, or does the code itself expose a weakened trust boundary, broad acceptance rule, or unsafe lifecycle path?
- Is the candidate being filtered out only because the exact off-chain consumer behavior is unknown, even though the on-chain request, ticket, or workflow state plainly fails to bind the terms that downstream execution is supposed to honor?
- Is the candidate being filtered out only because a stronger theft or privilege-escalation finding exists nearby, even though it still has an independent downside such as replayable authorization, event authenticity loss, lock extension, fairness break, or growth-based liveness degradation?

## Escalation Rules

- If the path is reachable only through admin intent that matches the documented trust model, reject it.
- If the path depends on an upgrade, migration, or governance action that is not code-provable, move it to `Unknown` unless the code itself exposes the break.
- If the issue is only a pattern match from `references/checks/check-router.md` or a routed check file, reject it until code-specific evidence exists.
- If the candidate is a concrete low or informational weakness with direct source evidence, keep it as `Validated` rather than forcing it into `Unknown`.
