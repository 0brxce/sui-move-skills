# Workflow

## 1. Scope the package

Use `references/pre-audit/scoping.md` to build a compact inventory, identify trust boundaries, and decide whether any test, demo, mock, or migration helper code belongs in scope because it touches production authority or state.
If prior audit reports, issue trackers, or historical finding documents are available, pull them into scope immediately as regression inputs rather than deferring them until after fresh bug hunting.
If the prior artifact is a PDF or another non-plain-text format, extract the finding list first and keep a compact note with severity, title, and affected module family before reviewing the code.
At the end of scoping, read `references/checks/check-router.md` and select only the sections that apply to this package.

## 2. Build a privilege and asset map

Read `references/pre-audit/review-lens.md` before going deeper.
Record the user-asset objects, admin or mint authority objects, capability lifecycle, shared versus owned state, and the invariants that must hold for supply, custody, pricing, access, and lifecycle.
This privilege map is the base layer for the rest of the audit. If it is unclear, stop and resolve it before going deeper.
For every security-relevant invariant, list all reachable write paths that can change it. Do not stop after tracing the obvious deposit or withdraw function; include alternate funding paths, settlement helpers, maintenance flows, and lifecycle hooks that touch the same state.

## 2.5 Build a historical finding regression matrix

Before deep review, convert each prior finding into a compact regression checklist entry with:

- the original root cause or broken invariant
- the previously affected module or function family
- the current code locations that appear to address it
- the reachable paths that still need verification
- a status bucket: `Fixed`, `Still Valid`, `Changed Form`, or `Unknown`

Do this before spending most of the review budget on newly discovered issues. Historical regression should guide prioritization, especially for modules that previously held high-severity findings.
Do not treat this matrix as optional working scratch. It is a gating artifact for the rest of the review. If any prior finding lacks a current-code anchor or equivalent-path review target, stop and finish that mapping first.

## 3. Choose review paths from the checklist

Use `references/checks/check-router.md` to decide which categories need focused review and skip the ones that are clearly out of scope.
When a selected checklist item includes a code sketch, map the sketch to the target package's real objects, capabilities, and call graph before drawing any conclusion.
Do not allow one bug-rich subsystem to consume the whole review budget while peer critical modules remain only lightly sampled. Rebalance coverage before moving on.

## 4. Trace critical state transitions

For each privileged or asset-moving path, trace:

- preconditions
- object and capability inputs
- state mutations
- transfer destinations
- postconditions and invariant preservation
- whether an abort fully protects against partial progress

Audit transitions, not isolated lines. The key question is who can move an object or capability into a dangerous state.
When a module appears to be a signature, oracle, enclave, or adapter layer, still review it as a full lifecycle state machine: registration, update, replacement, destruction, and stale-object behavior often carry separate authorization bugs.
When a codebase appears to have patched an old issue, verify every equivalent path instead of stopping at the first new guard such as `pool_object_id()`, config ID checks, or share-type assertions.

## 5. Review attacker-controlled reachability

For each reachable path, ask:

- what can an untrusted caller supply?
- what assumptions does the code make about object provenance?
- what assumptions does the code make about capability possession?
- can helper functions be reached indirectly from attacker-callable paths?
- can multiple functions be combined into a stronger exploit path?
- does a sibling function performing the same operation differ in its arguments, guards, assertions, or events? Diff `collect_*`, `add_*`, `withdraw_*`, and `*_fix_*` pairs directly.
- for each call into an external or unreadable dependency, is every forwarded argument the value the callee expects, and does the caller satisfy the callee's conventional precondition for `burn`/`destroy`/`close`/`swap`?

Do not stop at single-function review. Sui issues often appear only when two or more safe-looking functions are composed, or when a wrapper passes a wrong argument to or violates a precondition of an external call.

## 6. Validate before reporting

Before promoting a candidate issue into a finding, confirm:

- the exact attacker entrypoint or callable composition is reachable from an untrusted actor
- the attacker-controlled inputs are concrete and type-valid, not hypothetical placeholders
- the attacker can reach the path under realistic assumptions
- the required object or capability is actually obtainable
- the invariant break survives transaction abort semantics
- the issue is not merely an intended admin power or documented trust assumption
- the impact is concrete: theft, unauthorized control, stuck funds, permanent breakage, or meaningful denial of service
- the finding is supported by direct code-backed evidence such as reachable call flow, concrete inputs, and invariant-breaking state transitions

Use `references/validation/candidate-validation.md` as the validation checklist and status model for each candidate.
When a candidate comes from a prior audit finding, validation must answer whether the original root cause is `Still Valid`, `Changed Form`, `Fixed`, or `Unknown` across every equivalent reachable path. Do not close the family after checking only the first nearby guard.

If a candidate claims theft, unauthorized control, or a meaningful invariant break, you must identify attacker-controlled inputs, reachable calls, and the broken invariant before reporting it. For lower-severity findings such as defense-in-depth, observability, or maintainability weaknesses, require a concrete reachable code path and a clear security-relevant downside even if there is no full exploit path. Use `references/checks/check-router.md` to pressure-test whether you missed a stronger exploit path.

## 7. Run an advisory retention pass

After the exploitability-focused review, run a second pass specifically for lower-severity but still code-backed security issues.

During this pass, explicitly check whether the package has any of the following patterns even if a stronger asset-loss finding was already found nearby:

- zero-value or no-op inputs that still refresh lock timestamps, cooldowns, checkpoints, or eligibility state
- signed payloads that include a timestamp but have no on-chain freshness or expiry enforcement
- signed payloads that are not bound to the exact ticket, object ID, amount, or single-use authorization instance and may be replayed across same-user, same-epoch, or later re-funded requests
- signed workflows where the verifier approves a generic action result but does not bind the exact economic effect, storage slot, or object instance that later consumes that approval
- request or ticket objects that fail to snapshot user-committed terms such as price, prompt, route, or execution policy before later off-chain or asynchronous execution
- alternate deposit, settlement, claim, cleanup, or maintenance paths that update a protected balance, timestamp, index, or status differently from the main path
- post-commit parameter, prompt, pricing, routing, or policy changes that take effect immediately against already-committed users
- lifecycle functions such as register, rotate, destroy, remove, or cleanup that use weaker authorization than the active-use path
- public generic capability or config constructors that become dangerous only when combined with another module's generic acceptance or verification surface
- event fields that are emitted as if authenticated, but are not covered by the signed payload or committed state transition
- trust-boundary assumptions that are code-reachable and security-relevant but rely on deployment or operator discipline
- registries, vectors, tables, or tracking lists that only grow and can degrade liveness, monitoring, or maintenance safety
- bootstrap issuance or registry-reset paths that seed share supply, debt supply, or aggregate value from caller-controlled input when the current totals are zero
- precision-sensitive math that divides before multiplying, rounding helpers that can overflow on intermediate addition, or piecewise or curve helpers that lack boundary and ordering validation
- privileged setters that can write economically dangerous or illogical parameters with no sanity bounds
- accumulator or index math whose fixed precision constant can truncate the per-interval increment to zero against a large base-unit denominator (compute the magnitude with an 18-decimal token before dismissing it)
- value-moving or state-changing functions missing an event when a sibling operation emits one, built as an explicit function-vs-event matrix
- wrappers that update local accounting or emit success on an external side effect without asserting the side effect occurred (e.g., no `new_liquidity > old_liquidity` check)
- caller- or admin-supplied price, anchor, or rate inputs used for accounting that are only range-checked, not bound to the canonical on-chain source available in the same call
- emergency, rescue, or recovery functions disabled by the same pause/version gate that the pause action trips

Retain these issues as validated lower-severity findings when the code shows a concrete downside. Do not drop them solely because they are not the strongest issue on the path.

## 8. Run a false-positive pass

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

Use `references/checks/check-router.md` and the false-positive challenge questions in `references/validation/candidate-validation.md` during this pass to generate counter-hypotheses from the opposite direction: "why might this be a false positive?"
Do not treat `references/checks/check-router.md` as evidence that an issue is safe or unsafe by itself. Resolve every challenge by re-reading the target code, call graph, object flow, capability flow, and applicable Sui semantics.
Re-check any "looks similar to the example" intuition against the actual privilege graph, object ownership rules, and PTB/abort behavior in the target code.

Only keep findings that survive this pass. Drop speculative or assumption-heavy candidates, but do not drop a well-supported medium, low, or informational issue solely because its impact is scoped. If a concern is useful but unproven, keep it outside the validated findings section as an assumption, unknown, or rejected candidate.

## 9. Run a coverage reconciliation pass

Before writing the report, reconcile the reviewed code against the routed checklist topics and ask:

- Did every prior audit finding get a regression status of `Fixed`, `Still Valid`, `Changed Form`, or `Unknown` with code-backed justification?
- Did early findings in one subsystem cause neighboring critical modules to receive shallower review than their asset movement or prior bug history warranted?
- Did I treat local new checks as proof of safety without tracing every equivalent path to the same invariant?
- Did a stronger exploitability finding cause a nearby advisory-grade issue to be omitted?
- Did every user-reachable signature flow get checked for domain binding, freshness, object-level uniqueness, amount binding, and event authenticity?
- Did any signed or approved workflow authorize a generic outcome without binding the exact object instance, storage location, or economic effect that later consumes it?
- Did every asynchronous or off-chain-assisted workflow snapshot the user-committed terms that later execution is expected to honor?
- Did every lock, cooldown, or withdrawal-delay path get checked for zero-value refreshes and alternate funding routes?
- Did every security-relevant field such as balance, index, status, or timestamp get checked across all alternate write paths for invariant consistency?
- Did every lifecycle function get compared against the active-use path for equivalent authorization, lineage, and version checks?
- Did any public generic capability factory become exploitable only when combined with another module's generic verifier or acceptance rule?
- Did every already-committed user flow get checked for immediate parameter or policy changes that can alter terms without delay?
- Did every registry or tracking structure get checked for duplicate entries, stale entries, and unbounded growth?
- Did every oracle or feed-selection loop get checked for uniqueness, ordering, and validation-before-selection behavior?
- Did bootstrap issuance, debt dilution, curve validation, or arithmetic-helper edge cases get reviewed for advisory-grade but code-backed weaknesses?

If any of these questions reveal a concrete, code-backed issue, add it before finalizing.
If any prior audit finding still lacks a regression status, the review is not ready to finalize.

## 10. Assemble the audit report

After the false-positive pass, produce the final audit report using validated findings across all supported severities, including code-backed medium, low, and informational issues.

Unless the user specifies another path or format, write the final report to the current Codex workspace root as `{project-name}-exvul-sui-move-audit-report.md`.
Use the repository root's base directory name as `{project-name}`.

If you create a temporary draft file such as `.codex-report-draft.md` in the audit target while composing the final report, delete it before finishing. Do not leave transient draft artifacts behind once the final report has been written successfully.

Use `references/reporting/report-formatting.md` for the required report sections, finding structure, output rules, and separation between validated findings versus assumptions, unknowns, or rejected candidates.
Use `references/reporting/severity.md` for default risk assignment.

## Execution Constraints

- Complete the audit in one autonomous pass and stop only after the report has been written or a truly blocking missing input has been identified.
- Start with source inspection.
- If dynamic verification is unavailable or misleading, document the validation gap and continue with explicit source-backed reasoning.
