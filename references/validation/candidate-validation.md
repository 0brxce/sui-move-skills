# Candidate Validation

Use this reference when deciding whether a candidate becomes `Validated`, `Rejected`, or `Unknown`.

## Status Rules

- `Validated`: The code supports a realistic exploit path or invariant break under attacker-reachable conditions.
- `Rejected`: The candidate fails because reachability, obtainability, ownership rules, package boundaries, type constraints, or abort semantics block the path.
- `Unknown`: The candidate depends on a material assumption that the code does not resolve, such as undisclosed governance, off-chain coordination, or deployment-specific wiring.

Prefer `Rejected` or `Unknown` over forcing a weak `Validated` finding.

## Validation Questions

Answer these for each candidate before reporting it:

1. What exact `entry` or externally reachable call sequence does the attacker use?
2. What object, capability, shared object access, or witness must the attacker supply?
3. How does the attacker realistically obtain each required input?
4. Do Sui ownership, linearity, type constraints, `friend`, `public(package)`, or package boundaries block the path?
5. Does the attack still work after applying abort semantics and PTB composition rules?
6. What invariant, authorization boundary, or custody property is broken if the transaction succeeds?
7. Is the outcome concrete enough to matter: theft, unauthorized privilege, stuck funds, irreversible state breakage, or meaningful denial of service?
8. Can a minimal PoC reproduce the exploit path, the missing abort, or the broken invariant; if not, why not?

If any of questions 1 through 6 cannot be answered from the target code and realistic assumptions, do not mark the issue `Validated`.
If question 8 is feasible but skipped, explain the reason in the validation note.

## Validation Note Template

Keep a short internal note for each candidate using this structure:

```markdown
- Candidate: ...
- Status: Candidate | Validated | Rejected | Unknown
- Entrypoint: ...
- Attacker Controls: ...
- Required Object/Capability: ...
- Blocking Conditions: ...
- Broken Invariant: ...
- Evidence: ...
- PoC Type: TypeScript | Helper Module | Source Only | None
- PoC Path/Test Name: ...
- PoC Evidence: ...
```

When a PoC is feasible, include:

- whether it is a TypeScript PoC, helper module, or source-only conclusion
- the test name or script path
- whether it demonstrates exploit success, missing protection, expected abort, or post-fix regression coverage

## Escalation Rules

- If the path is reachable only through admin intent that matches the documented trust model, reject it.
- If the path depends on an upgrade, migration, or governance action that is not code-provable, move it to `Unknown` unless the code itself exposes the break.
- If the issue is only a pattern match from `references/checks/check-router.md` or a routed check file, reject it until code-specific evidence exists.
- If a minimal PoC can realistically settle the candidate and none is attempted, lower confidence and keep the reasoning explicit.
