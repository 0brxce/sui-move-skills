# Report Formatting

Use this reference when assembling the final audit report.

## Report Structure

The final report should contain:

1. `# Audit Report`
2. `## Scope`
3. `## Review Summary`
4. `## Methodology`
5. `## Findings Summary`
6. Detailed validated findings, ordered by risk
7. `## Assumptions and Open Questions`
8. `## Rejected Candidates` if useful
9. `## Overall Risk`
10. `## Conclusion`

If no validated findings remain, say so explicitly and still include scope, methodology, assumptions, overall risk, and conclusion.

## Findings Summary Table

Use this exact table before the detailed findings:

```markdown
## Findings Summary

| ID | Title | Risk | Validated | Confidence |
|---|---|---|---|---|
| 1 | ... | Medium | Yes | High |
```

Only include validated findings in this table.

## Finding Format

Use this exact structure for each validated finding:

```markdown
### Finding N

- Title: ...
- Risk: Critical | High | Medium | Low | Informational
- Validated: Yes
- Confidence: High | Medium | Low
- Affected: module::function
- Preconditions: ...
- Description: ...
- Impact: ...
- Attack Path:
  1. ...
  2. ...
- Recommendation: ...
```

## Field Guidance

- `Validated` must be `Yes` for every finding in the validated findings section.
- `Confidence` should be `High`, `Medium`, or `Low` based on how directly the code proves exploitability. Prefer `Medium` over overstating certainty.
- `Preconditions` should briefly state what must already be true for the issue to matter, such as a privileged object being exposed, a migration occurring, or a specific workflow being active.

## Output Rules

- Do not include rejected or unknown candidates in the findings summary.
- Keep assumptions, unknowns, and rejected candidates in clearly separate sections.
- Prefer concise exploit statements over speculative narrative.
- If no validated findings remain, say so explicitly and still include scope, methodology, assumptions, overall risk, and conclusion.
- Default output path is `audit-report.md` in the project root unless the user asks for another path.
- Recommendations should be specific and engineering-oriented. Prefer concrete storage, validation, migration, or access-control changes over vague advice.
- The final report should read as a cleaned audit deliverable, not a raw investigation log.
