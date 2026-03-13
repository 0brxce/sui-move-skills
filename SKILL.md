---
name: sui-move-auditor
description: Use only for full Sui Move security audits that validate exploitability and produce a structured audit report. Do not use for general Sui Move questions, workflow discussions, skill-maintenance tasks, or ordinary code explanation unless the user explicitly invokes $sui-move-auditor or clearly asks for a full audit.
---

# Sui Move Skill

Use this skill for Sui-specific smart contract security reviews. This file defines the execution process for the agent. Detailed vulnerability categories, check items, and bug-specific prompts belong in `references/checks/check-router.md` and the routed check files under `references/checks/checklist/`.

Read supporting references only when they are needed:

- `references/pre-audit/scoping.md` during initial package inventory and trust-boundary mapping
- `references/pre-audit/review-lens.md` before deep review and during false-positive validation
- `references/validation/candidate-validation.md` when turning a candidate into a validated finding or rejecting it
- `references/validation/false-positive-filters.md` during the false-positive pass
- `references/reporting/report-formatting.md` before assembling the final report
- `references/reporting/severity.md` when assigning risk and confidence

Read `references/checks/check-router.md` twice:

- once after initial scoping, to decide which topic references to load
- once before finalizing findings, to confirm coverage and eliminate blind spots

Treat `references/checks/check-router.md` as the checklist router and loading guide. Treat this file as the workflow and reporting layer.

Some harder checklist items include tiny Sui Move examples. Use them to recognize the state transition or invariant being discussed, but never treat the example match alone as a finding.
Default toward omission over speculation: a missed weak lead is better than a reported false exploit path.

## Audit Objective

Your job is to determine whether an attacker can do any of the following:

- gain assets, minting power, or privileged control without authorization
- violate economic or state invariants
- lock, burn, freeze, or orphan user assets unexpectedly
- bypass intended workflow or role restrictions
- exploit initialization, migration, or upgrade paths

Prioritize real impact over surface-level observations. A good finding in Sui Move usually ties together object ownership, capabilities, and a broken state transition.

## Workflow

### 1. Scope the package

Use `references/pre-audit/scoping.md` to build a compact inventory, identify trust boundaries, and decide whether any test, demo, mock, or migration helper code belongs in scope because it touches production authority or state.
At the end of scoping, read `references/checks/check-router.md` and select only the sections that apply to this package.

### 2. Build a privilege and asset map

Read `references/pre-audit/review-lens.md` before going deeper.
Record the user-asset objects, admin or mint authority objects, capability lifecycle, shared versus owned state, and the invariants that must hold for supply, custody, pricing, access, and lifecycle.
This privilege map is the base layer for the rest of the audit. If it is unclear, stop and resolve it before going deeper.

### 3. Choose review paths from the checklist

Use `references/checks/check-router.md` to decide which categories need focused review and skip the ones that are clearly out of scope.
When a selected checklist item includes a code sketch, map the sketch to the target package's real objects, capabilities, and call graph before drawing any conclusion.

### 4. Trace critical state transitions

For each privileged or asset-moving path, trace:

- preconditions
- object and capability inputs
- state mutations
- transfer destinations
- postconditions and invariant preservation
- whether an abort fully protects against partial progress

Audit transitions, not isolated lines. The key question is who can move an object or capability into a dangerous state.

### 5. Review attacker-controlled reachability

For each reachable path, ask:

- what can an untrusted caller supply?
- what assumptions does the code make about object provenance?
- what assumptions does the code make about capability possession?
- can helper functions be reached indirectly from attacker-callable paths?
- can multiple functions be combined into a stronger exploit path?

Do not stop at single-function review. Sui issues often appear only when two or more safe-looking functions are composed.

### 6. Validate before reporting

Before promoting a candidate issue into a finding, confirm:

- the exact attacker entrypoint or callable composition is reachable from an untrusted actor
- the attacker-controlled inputs are concrete and type-valid, not hypothetical placeholders
- the attacker can reach the path under realistic assumptions
- the required object or capability is actually obtainable
- the invariant break survives transaction abort semantics
- the issue is not merely an intended admin power or documented trust assumption
- the impact is concrete: theft, unauthorized control, stuck funds, permanent breakage, or meaningful denial of service

Use `references/validation/candidate-validation.md` as the validation checklist and status model for each candidate.

If you cannot identify attacker-controlled inputs, reachable calls, and a broken invariant, do not report the issue. Keep it as a rejected candidate or an assumption note at most. Use `references/checks/check-router.md` to pressure-test whether you missed a stronger exploit path.

### 7. Run a false-positive pass

After the first review pass, treat every issue as a candidate finding, not a final finding.

For each candidate finding:

- re-read the exact functions, callees, and state transitions involved
- verify that the attacker-controlled inputs are real and not assumed
- verify that any required capability, object, or role is actually obtainable by the attacker
- verify that transaction abort behavior, type constraints, and object ownership rules do not invalidate the exploit
- verify that the issue is not already prevented by an upstream check, package boundary, or trusted workflow assumption
- verify that a by-value object parameter is not itself the proof of legitimate custody
- verify that `public(package)`, `friend`, `init`, or test-only code is not being treated as attacker-reachable without a real bridge
- verify that a supposed capability leak is not blocked by missing `store`, missing transfer paths, or singleton issuance rules

Use `references/checks/check-router.md` and `references/validation/false-positive-filters.md` during this pass to generate counter-hypotheses and challenge questions from the opposite direction: "why might this be a false positive?"
Do not treat `references/checks/check-router.md` as evidence that an issue is safe or unsafe by itself. Resolve every challenge by re-reading the target code, call graph, object flow, capability flow, and applicable Sui semantics.
Re-check any "looks similar to the example" intuition against the actual privilege graph, object ownership rules, and PTB/abort behavior in the target code.

Only keep findings that survive this pass. Drop speculative, weak, or assumption-heavy candidates. If a concern is useful but unproven, keep it outside the validated findings section as an assumption, unknown, or rejected candidate.

### 8. Assemble the audit report

After the false-positive pass, produce the final audit report using only validated findings.

Unless the user specifies another path or format, write the final report to `audit-report.md` in the project root.

Use `references/reporting/report-formatting.md` for the required report sections, finding structure, output rules, and separation between validated findings versus assumptions, unknowns, or rejected candidates.
Use `references/reporting/severity.md` for default risk and confidence assignment.

## Working Style

- Read code before theorizing.
- Prefer package-wide reasoning over isolated lint-style comments.
- Use `references/checks/check-router.md` for depth and coverage, not as a substitute for code-backed reasoning.
- Execute the full audit flow autonomously unless a critical input is missing or the target is ambiguous.
- Keep this skill primarily static-analysis driven. Do not suggest or request shell commands unless they are strictly necessary to complete the audit.
- Call out uncertainty explicitly when assumptions about off-chain components, package deployment, or governance are missing.

## Invocation

Explicit skill invocation inside Codex uses `$sui-move-auditor`.

The wrapper should start Codex in the target project and use this skill to generate `audit-report.md` by default.
