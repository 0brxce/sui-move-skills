# Candidate Validation

Use this reference when deciding whether a candidate becomes `Validated`, `Rejected`, or `Unknown`.

## Status Rules

- `Validated`: The code supports a realistic exploit path, a concrete invariant break, or a security-relevant weakness with direct code-backed downside under reachable conditions.
- `Rejected`: The candidate fails because reachability, obtainability, ownership rules, package boundaries, type constraints, or abort semantics block the path.
- `Unknown`: The candidate depends on a material assumption that the code does not resolve, such as undisclosed governance, off-chain coordination, or deployment-specific wiring.

Prefer `Rejected` or `Unknown` over forcing a weak `Validated` finding, but do not reject a candidate solely because its severity is below `High`.

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

## Escalation Rules

- If the path is reachable only through admin intent that matches the documented trust model, reject it.
- If the path depends on an upgrade, migration, or governance action that is not code-provable, move it to `Unknown` unless the code itself exposes the break.
- If the issue is only a pattern match from `references/checks/check-router.md` or a routed check file, reject it until code-specific evidence exists.
- If the candidate is a concrete low or informational weakness with direct source evidence, keep it as `Validated` rather than forcing it into `Unknown`.
