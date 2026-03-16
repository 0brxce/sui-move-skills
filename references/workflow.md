# Workflow

## 1. Scope the package

Use `references/pre-audit/scoping.md` to build a compact inventory, identify trust boundaries, and decide whether any test, demo, mock, or migration helper code belongs in scope because it touches production authority or state.
At the end of scoping, read `references/checks/check-router.md` and select only the sections that apply to this package.

## 2. Build a privilege and asset map

Read `references/pre-audit/review-lens.md` before going deeper.
Record the user-asset objects, admin or mint authority objects, capability lifecycle, shared versus owned state, and the invariants that must hold for supply, custody, pricing, access, and lifecycle.
This privilege map is the base layer for the rest of the audit. If it is unclear, stop and resolve it before going deeper.

## 3. Choose review paths from the checklist

Use `references/checks/check-router.md` to decide which categories need focused review and skip the ones that are clearly out of scope.
When a selected checklist item includes a code sketch, map the sketch to the target package's real objects, capabilities, and call graph before drawing any conclusion.

## 4. Trace critical state transitions

For each privileged or asset-moving path, trace:

- preconditions
- object and capability inputs
- state mutations
- transfer destinations
- postconditions and invariant preservation
- whether an abort fully protects against partial progress

Audit transitions, not isolated lines. The key question is who can move an object or capability into a dangerous state.

## 5. Review attacker-controlled reachability

For each reachable path, ask:

- what can an untrusted caller supply?
- what assumptions does the code make about object provenance?
- what assumptions does the code make about capability possession?
- can helper functions be reached indirectly from attacker-callable paths?
- can multiple functions be combined into a stronger exploit path?

Do not stop at single-function review. Sui issues often appear only when two or more safe-looking functions are composed.

## 6. Validate before reporting

Before promoting a candidate issue into a finding, confirm:

- the exact attacker entrypoint or callable composition is reachable from an untrusted actor
- the attacker-controlled inputs are concrete and type-valid, not hypothetical placeholders
- the attacker can reach the path under realistic assumptions
- the required object or capability is actually obtainable
- the invariant break survives transaction abort semantics
- the issue is not merely an intended admin power or documented trust assumption
- the impact is concrete: theft, unauthorized control, stuck funds, permanent breakage, or meaningful denial of service
- when feasible, a minimal PoC reproduces the success path, expected abort, or invariant break that the finding depends on

Use `references/validation/candidate-validation.md` as the validation checklist and status model for each candidate.

Prefer adding or adapting a minimal PoC during this step instead of relying only on static reasoning. Default to narrow TypeScript PoCs first, then fall back only when the path cannot be modeled faithfully through a script-driven call flow. The goal is to produce a clear PoC artifact; executing it is optional and not required by this skill. Good validation PoCs usually do one of these:

- show the attacker-controlled path succeeds and produces the claimed unauthorized state change
- show an expected protection is missing because the call does not abort
- show the vulnerable path aborts with the claimed code only after the proposed fix
- lock in a boundary condition so the report is backed by a reproducible regression test

Use the lightest PoC that can settle the question:

- TypeScript PoC for local exploitability, missing checks, PTB composition, shared-object interaction, object IDs, expected failures, or regression coverage
- helper-module PoC only when a script-driven PoC cannot express the relevant state transition cleanly
- source-only validation when no realistic PoC can exercise the target condition faithfully

If no PoC is feasible or a PoC would provide false confidence, document why and continue with source-backed validation.

If you cannot identify attacker-controlled inputs, reachable calls, and a broken invariant, do not report the issue. Keep it as a rejected candidate or an assumption note at most. Use `references/checks/check-router.md` to pressure-test whether you missed a stronger exploit path.

## 7. Run a false-positive pass

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

## 8. Assemble the audit report

After the false-positive pass, produce the final audit report using only validated findings.

Unless the user specifies another path or format, create `reports/` under the skill root if it does not already exist and write the final report there as `{project-name}-exvul-sui-move-audit-report.md`.
Use the repository root's base directory name as `{project-name}`.

If you create a temporary draft file such as `.codex-report-draft.md` in the audit target while composing the final report, delete it before finishing. Do not leave transient draft artifacts behind once the final report has been written successfully.

Use `references/reporting/report-formatting.md` for the required report sections, finding structure, output rules, and separation between validated findings versus assumptions, unknowns, or rejected candidates.
Use `references/reporting/severity.md` for default risk and confidence assignment.

## Execution Constraints

- Complete the audit in one autonomous pass and stop only after the report has been written or a truly blocking missing input has been identified.
- Start with source inspection.
- Prefer a focused TypeScript PoC during step 6 when a script can materially strengthen or falsify a candidate finding.
- If a TypeScript PoC cannot model the relevant condition faithfully, use the smallest alternative PoC that can, and document the tradeoff.
- If no realistic PoC can be run, document the validation gap and continue with source-backed reasoning.
