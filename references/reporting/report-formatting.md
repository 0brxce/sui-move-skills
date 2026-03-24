# Report Formatting

Use this reference when assembling the final audit report.

## Report Structure

The final report should contain only these sections, in this order:

1. `# Audit Report`
2. `## Information`
3. `## Findings Summary`
4. `## Historical Regression Matrix` when prior audit artifacts or historical findings were available
5. Detailed validated findings, ordered by risk
6. `## Rejected or Unvalidated Issues`
7. `## Checklist Coverage`

Do not add extra sections unless the user explicitly asks for them.

## Information

Start the report with a compact table:

```markdown
## Information

| Field | Value |
|---|---|
| Review Time | 2026-03-13 |
| Project | <project-name> |
| Scope | `pkg-a`, `pkg-b`, `pkg-c` |
```

Rules:

- `Review Time` should use the current date.
- `Project` should use the repository or project name.
- `Scope` should be concise. Inline the in-scope paths or package groups in one cell. If scope is long, use `<br>` line breaks inside the cell.
- Do not include `Repository`, `Review Type`, or `Test Execution` unless the user explicitly asks for them.

## Findings Summary

Use one compact severity-count table:

```markdown
## Findings Summary

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 0 |
| Low | 0 |
| Informational | 0 |
| Unvalidated | 3 |
```

Rules:

- Count only validated findings in `Critical` through `Informational`.
- Put candidates that were reviewed but not validated into `Unvalidated`.
- If there are no validated findings, keep all validated severities at `0`.

## Historical Regression Matrix

When prior audit artifacts, issue trackers, or historical findings were available during the review, add a compact table immediately after `## Findings Summary`:

```markdown
## Historical Regression Matrix

| Prior Finding | Current Status | Current Location | Notes |
|---|---|---|---|
| `OS-EXAMPLE-00` Missing pool lineage check | Still Valid | `position_core::liquidate_col_x` | Same root cause remains on liquidation path |
| `OS-EXAMPLE-01` Precision loss in helper | Fixed | `position_model::x_by_liquidity_x64` | Formula now multiplies before dividing |
```

Rules:

- Include every prior finding exactly once when prior findings were in scope.
- `Current Status` must be one of `Fixed`, `Still Valid`, `Changed Form`, or `Unknown`.
- `Current Location` should point to the main current module or function family that supports the status.
- `Notes` should stay short and state why the status is justified.
- Do not omit the matrix merely because the final validated findings are all new.

## Checklist Coverage

Add a compact table showing which checklist topics were applied or skipped:

```markdown
## Checklist Coverage

| Checklist | Status | Notes |
|---|---|---|
| `check-01` | ✅ Applied | Access control and capability flow |
| `check-02` | ✅ Applied | Shared objects and custody paths |
| `check-06` | ❌ Skipped | No oracle, clock, or freshness logic |
```

Rules:

- Include all routed checklist topics that materially informed the review.
- Use `✅ Applied` or `❌ Skipped`.
- Keep notes short and tied to the target package.

## Validated Finding Format

Use this structure for each validated issue:

```markdown
### F-01 Unsafe Privilege Transfer During Vault Reconfiguration

| Field | Value |
|---|---|
| Risk | High |
| Affected | `vault::reconfigure` |
| Regression | New |
| Status | ✅ Validated |

**Description**  
Short description of the issue and why it is reachable.

```move
// Short excerpt showing the vulnerable logic.
```

**Impact**  
Short description of the concrete exploit result.

**Exploit Path**  
1. First attacker-controlled step.
2. Second execution step.
3. Resulting unauthorized effect or value extraction.

**Recommendation**  
Specific engineering fix.
```

Rules:

- Keep each validated issue concise.
- Do not include long attack narratives unless they are necessary to justify exploitability.
- `Affected` should point to the main module or function.
- Add `Regression` when prior audit reports, issue trackers, or historical findings exist. Use one of `New`, `Still Valid`, `Changed Form`, or `Not Applicable`.
- If a validated finding corresponds to a prior finding family, its `Regression` field must match the row used in `## Historical Regression Matrix`.
- `Status` must be `✅ Validated`.
- Add a short code excerpt immediately after `Description` when it materially helps the reader see the bug.
- Keep code excerpts brief and focused on the vulnerable check, state update, or transfer logic.
- Include `Exploit Path` for every validated issue.
- Format `Exploit Path` as a short numbered list, usually 3 to 5 steps.
- Keep each step concrete and execution-oriented.

If there are no validated findings, include this exact section body:

```markdown
No validated findings.
```

## Rejected or Unvalidated Issues

Use a short table for issues that were reviewed but not validated:

```markdown
## Rejected or Unvalidated Issues

| Candidate | Status | Short Reason |
|---|---|---|
| Unauthorized shared-object mutation | ❌ Rejected | Capability checks block attacker reachability |
| Strategy rounding edge case | ⚠️ Unvalidated | No concrete attacker profit path established |
```

Rules:

- Keep each entry to one short line.
- Use `❌ Rejected` when the code disproves the issue.
- Use `⚠️ Unvalidated` when the issue depends on unresolved assumptions or missing deployment context.
- Do not repeat full analysis here.

## Output Rules

- Prefer tables over prose.
- Keep the report compact and delivery-oriented.
- Only include validated issues in the detailed findings section.
- If no validated findings remain, still include `Information`, `Findings Summary`, `Rejected or Unvalidated Issues`, and `Checklist Coverage`.
- If prior findings were in scope, still include `Historical Regression Matrix` even when no validated findings remain.
- Include validated `Medium`, `Low`, and `Informational` findings by default when they are code-backed. Do not omit them solely because they are not directly exploitable.
- Default output directory is the current Codex workspace root unless the user asks for another path.
- Default report filename is `{project-name}-exvul-sui-move-audit-report.md`.
- Derive `{project-name}` from the repository root's base directory name.
- Do not leave temporary report artifacts such as `.codex-report-draft.md` in the audited repository after the final report is written.
